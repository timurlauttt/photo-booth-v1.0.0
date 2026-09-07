import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

let recognizerInstance = null;
let initPromise = null;
let lastVideoTimestamp = -1;

export async function getGestureRecognizer() {
  if (recognizerInstance) return recognizerInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 1. Resolve WASM assets from local public/mediapipe-wasm folder
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks("/mediapipe-wasm");
      } catch {
        // Fallback to CDN if local directory fails
        vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
      }

      // 2. Initialize GestureRecognizer with CPU delegate (WASM SIMD)
      // CPU delegate avoids WebGL texture lazy initialization warnings on Linux/WebGL
      // and runs reliably across all browsers without GPU driver conflicts.
      try {
        recognizerInstance = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/gesture_recognizer.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
      } catch (cpuErr) {
        console.warn("CPU delegate failed, trying GPU fallback:", cpuErr);
        recognizerInstance = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/gesture_recognizer.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
      }

      return recognizerInstance;
    } catch (err) {
      console.warn("Failed to initialize MediaPipe GestureRecognizer:", err);
      initPromise = null;
      return null;
    }
  })();

  return initPromise;
}

/**
 * Geometric verification: Checks if all 5 fingers are fully outstretched and spread
 * @param {Array<{x: number, y: number, z: number}>} landmarks 
 * @returns {boolean}
 */
function areFiveFingersOpen(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const wrist = landmarks[0];
  const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

  // 4 fingers: Index (5..8), Middle (9..12), Ring (13..16), Pinky (17..20)
  const fingers = [
    { mcp: 5, pip: 6, dip: 7, tip: 8 },
    { mcp: 9, pip: 10, dip: 11, tip: 12 },
    { mcp: 13, pip: 14, dip: 15, tip: 16 },
    { mcp: 17, pip: 18, dip: 19, tip: 20 },
  ];

  let extendedCount = 0;
  for (const f of fingers) {
    const dTipMcp = dist(landmarks[f.tip], landmarks[f.mcp]);
    const dPipMcp = dist(landmarks[f.pip], landmarks[f.mcp]);
    const dTipWrist = dist(landmarks[f.tip], wrist);
    const dPipWrist = dist(landmarks[f.pip], wrist);
    const dDipWrist = dist(landmarks[f.dip], wrist);

    // An extended finger has its tip far beyond MCP knuckle and farther from wrist than PIP and DIP
    if (dTipMcp > dPipMcp * 1.4 && dTipWrist > dPipWrist * 1.15 && dTipWrist > dDipWrist) {
      extendedCount++;
    }
  }

  // Thumb verification: Tip (4) extended away from MCP (2) and index base (5)
  const dThumbTipMcp = dist(landmarks[4], landmarks[2]);
  const dThumbIpMcp = dist(landmarks[3], landmarks[2]);
  const dThumbTipIndex = dist(landmarks[4], landmarks[5]);
  const dThumbMcpIndex = dist(landmarks[2], landmarks[5]);
  const isThumbExtended =
    dThumbTipMcp > dThumbIpMcp * 1.15 &&
    dThumbTipIndex > dThumbMcpIndex * 1.1;

  // Finger span check: Index to Pinky tip spread relative to palm width
  const palmWidth = dist(landmarks[5], landmarks[17]);
  const fingerSpan = dist(landmarks[8], landmarks[20]);
  const isSpread = fingerSpan > palmWidth * 0.9;

  // All 4 fingers extended + thumb extended + fingers spread
  return extendedCount === 4 && isThumbExtended && isSpread;
}

/**
 * Checks a video element frame for open palm / 5 fingers gesture
 * @param {GestureRecognizer} recognizer
 * @param {HTMLVideoElement} video
 * @param {number} timestamp
 * @returns {{ isOpenPalm: boolean, gesture: string, score: number }}
 */
export function checkOpenPalm(recognizer, video, timestamp) {
  if (
    !recognizer ||
    !video ||
    video.readyState < 2 ||
    video.videoWidth === 0 ||
    video.paused
  ) {
    return { isOpenPalm: false, gesture: "None", score: 0 };
  }

  // Strictly monotonic timestamp required by MediaPipe
  let currentTimestamp = timestamp || performance.now();
  if (currentTimestamp <= lastVideoTimestamp) {
    currentTimestamp = lastVideoTimestamp + 1;
  }
  lastVideoTimestamp = currentTimestamp;

  try {
    const results = recognizer.recognizeForVideo(video, currentTimestamp);
    if (!results) {
      return { isOpenPalm: false, gesture: "None", score: 0 };
    }

    let isClassifierOpenPalm = false;
    let topGestureName = "None";
    let topScore = 0;

    if (results.gestures && results.gestures.length > 0 && results.gestures[0].length > 0) {
      const topGesture = results.gestures[0][0];
      topGestureName = topGesture.categoryName;
      topScore = topGesture.score;
      // Require confident Open_Palm classification from MediaPipe neural model
      if (topGestureName === "Open_Palm" && topScore >= 0.60) {
        isClassifierOpenPalm = true;
      }
    }

    // Geometric check: Verify all 5 fingers are fully extended and spread
    let isGeometryOpenPalm = false;
    if (results.landmarks && results.landmarks.length > 0) {
      isGeometryOpenPalm = areFiveFingersOpen(results.landmarks[0]);
    }

    // CRITICAL: BOTH classifier and geometric extension must agree
    // Prevents endless false positives from resting hands or other poses
    const isOpenPalm = isClassifierOpenPalm && isGeometryOpenPalm;

    return {
      isOpenPalm,
      gesture: isOpenPalm ? "Open_Palm" : topGestureName,
      score: topScore,
    };
  } catch (err) {
    console.debug("MediaPipe frame skipped:", err);
    return { isOpenPalm: false, gesture: "None", score: 0 };
  }
}
