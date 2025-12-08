import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import WebcamComponent from './components/Webcam';
import PhotoStrip from './components/PhotoStrip';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const stripRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [filter, setFilter] = useState('none');
  const [photoCount, setPhotoCount] = useState(3);
  const [livePreview, setLivePreview] = useState(null);
  const [gifMode, setGifMode] = useState(false);
  const [allStrips, setAllStrips] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [frameStyle, setFrameStyle] = useState('blue'); // 'blue' or 'red'

  // Apply filter to image
  const applyFilter = useCallback((imageSrc, filterType) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Mirror/flip horizontal
          ctx.translate(size, 0);
          ctx.scale(-1, 1);

          // Crop ke center square
          const startX = (img.width - size) / 2;
          const startY = (img.height - size) / 2;
          ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);

          // Reset transform untuk filter
          ctx.setTransform(1, 0, 0, 1, 0, 0);

          // Apply filter
          if (filterType === 'grayscale') {
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              data[i] = avg;
              data[i + 1] = avg;
              data[i + 2] = avg;
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (filterType === 'vintage') {
            // Low res vintage effect
            const tempCanvas = document.createElement('canvas');
            const tempSize = Math.floor(size / 3); // Low resolution
            tempCanvas.width = tempSize;
            tempCanvas.height = tempSize;
            const tempCtx = tempCanvas.getContext('2d');

            if (tempCtx) {
              // Draw small
              tempCtx.drawImage(canvas, 0, 0, tempSize, tempSize);

              // Apply sepia
              const imageData = tempCtx.getImageData(0, 0, tempSize, tempSize);
              const data = imageData.data;
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
              }
              tempCtx.putImageData(imageData, 0, 0);

              // Draw back large (pixelated effect)
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(tempCanvas, 0, 0, size, size);
            }
          } else if (filterType === 'handheld') {
            // Handheld blur effect - simulating camera shake
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            const newData = new Uint8ClampedArray(data);

            // Simple box blur algorithm
            const radius = 2; // Blur intensity

            for (let y = 0; y < size; y++) {
              for (let x = 0; x < size; x++) {
                let r = 0, g = 0, b = 0, count = 0;

                // Average pixels in the blur radius
                for (let dy = -radius; dy <= radius; dy++) {
                  for (let dx = -radius; dx <= radius; dx++) {
                    const newX = x + dx;
                    const newY = y + dy;

                    if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
                      const idx = (newY * size + newX) * 4;
                      r += data[idx];
                      g += data[idx + 1];
                      b += data[idx + 2];
                      count++;
                    }
                  }
                }

                const idx = (y * size + x) * 4;
                newData[idx] = r / count;
                newData[idx + 1] = g / count;
                newData[idx + 2] = b / count;
              }
            }

            const blurredImageData = new ImageData(newData, size, size);
            ctx.putImageData(blurredImageData, 0, 0);
          }

          resolve(canvas.toDataURL('image/jpeg'));
        }
      };
      img.src = imageSrc;
    });
  }, []);

  // Update live preview from webcam
  useEffect(() => {
    const interval = setInterval(async () => {
      if (webcamRef.current && photos.length < photoCount) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          // Process live preview with same filter and flip as cCaptured photos
          const processedPreview = await applyFilter(imageSrc, filter);
          setLivePreview(processedPreview);
        }
      }
    }, 100); // Update every 100ms for smooth preview

    return () => clearInterval(interval);
  }, [photos.length, photoCount, filter, applyFilter]);

  // Ambil 1 foto
  const capturePhoto = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const processedImage = await applyFilter(imageSrc, filter);
      setPhotos(prev => [...prev, processedImage]);
    }
  }, [filter, applyFilter]);

  // Generate GIF dari 3 strips (bukan per foto, tapi per strip)
  const generateVideo = useCallback(async (strips) => {
    setIsGeneratingVideo(true);
    
    try {
      // Buat canvas untuk setiap strip dengan ukuran lebih besar untuk kualitas GIF
      const stripImages = await Promise.all(strips.map(async (stripPhotos) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return null;
        
        // Instagram Story HD: 1080x1920 (9:16)
        const canvasWidth = 1080;
        const canvasHeight = 1920;
        
        // Padding untuk border gradient (sama seperti CSS padding: 20px tapi scaled untuk HD)
        const padding = 100; // 20px * 5 (scale factor untuk HD)
        const footerHeight = 300; // Footer height scaled untuk HD (reduced karena hanya tanggal dan jam)
        
        // Tentukan layout berdasarkan jumlah foto
        const isVertical = stripPhotos.length === 3; // 3 foto = 1 kolom vertikal
        const cols = isVertical ? 1 : 2;
        const rows = isVertical ? 3 : (stripPhotos.length === 4 ? 2 : 3);
        
        // Hitung ukuran foto
        const availableWidth = canvasWidth - (padding * 2);
        const availableHeight = canvasHeight - (padding * 2) - footerHeight;
        
        const gap = 60; // Gap scaled untuk HD (12px * 5)
        const photoSize = Math.floor(Math.min(
          (availableWidth - (gap * (cols - 1))) / cols,
          (availableHeight - (gap * (rows - 1))) / rows
        ));
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Draw smooth gradient background for entire strip (sama seperti di CSS)
        if (frameStyle === 'blue') {
          // Blue frame with smooth gradient dari atas ke bawah
          const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
          gradient.addColorStop(0, '#1e3a8a');    // 0%
          gradient.addColorStop(0.20, '#2563eb'); // 20%
          gradient.addColorStop(0.40, '#3b82f6'); // 40%
          gradient.addColorStop(0.60, '#60a5fa'); // 60%
          gradient.addColorStop(0.80, '#3b82f6'); // 80%
          gradient.addColorStop(1, '#2563eb');    // 100%
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        } else {
          // Red frame with smooth gradient dari atas ke bawah
          const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
          gradient.addColorStop(0, '#7f1d1d');    // 0%
          gradient.addColorStop(0.20, '#991b1b'); // 20%
          gradient.addColorStop(0.40, '#dc2626'); // 40%
          gradient.addColorStop(0.60, '#ef4444'); // 60%
          gradient.addColorStop(0.80, '#dc2626'); // 80%
          gradient.addColorStop(1, '#991b1b');    // 100%
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
        
        // Load dan draw semua foto
        const loadImage = (src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });
        };
        
        const images = await Promise.all(stripPhotos.map(src => loadImage(src)));
        
        // Hitung total width yang digunakan foto dan center secara horizontal
        const totalContentWidth = (photoSize * cols) + (gap * (cols - 1));
        const offsetX = (canvasWidth - totalContentWidth) / 2;
        
        // Posisi Y start untuk foto (setelah padding atas)
        const photoStartY = padding;
        
        // Draw foto dalam grid (1 kolom untuk 3 foto, 2 kolom untuk 4/6 foto)
        images.forEach((img, index) => {
          const col = isVertical ? 0 : (index % 2);
          const row = isVertical ? index : Math.floor(index / 2);
          
          const x = offsetX + (col * (photoSize + gap));
          const y = photoStartY + (row * (photoSize + gap));
          
          // Background abu untuk slot foto (tidak perlu karena sudah ada gradient)
          // Langsung draw foto dengan border radius
          ctx.save();
          
          // Create rounded rectangle clip path
          const radius = 60; // Border radius scaled (12px * 5)
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + photoSize - radius, y);
          ctx.quadraticCurveTo(x + photoSize, y, x + photoSize, y + radius);
          ctx.lineTo(x + photoSize, y + photoSize - radius);
          ctx.quadraticCurveTo(x + photoSize, y + photoSize, x + photoSize - radius, y + photoSize);
          ctx.lineTo(x + radius, y + photoSize);
          ctx.quadraticCurveTo(x, y + photoSize, x, y + photoSize - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.clip();
          
          // Draw foto
          ctx.drawImage(img, x, y, photoSize, photoSize);
          ctx.restore();
        });
        
        // Footer - hanya tanggal dan jam di center
        const footerY = canvasHeight - padding - 80;
        
        // Format tanggal dan jam
        const dateTimeStr = new Date().toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        
        // Draw datetime centered
        ctx.fillStyle = '#ffffff';
        ctx.font = '45px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(dateTimeStr, canvasWidth / 2, footerY);
        
        return canvas.toDataURL('image/png', 1.0); // PNG dengan kualitas maksimal
      }));
      
      // Filter null values
      const validStripImages = stripImages.filter(img => img !== null);
      
      // Instagram Story HD: 1080x1920 (9:16) untuk video
      const videoWidth = 1080;
      const videoHeight = 1920;
      
      // Preload semua images terlebih dahulu
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };
      
      const loadedImages = await Promise.all(validStripImages.map(src => loadImage(src)));
      
      // Buat video MP4 15 detik dari 3 strip images
      const canvas = document.createElement('canvas');
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setIsGeneratingVideo(false);
        return;
      }
      
      // Cek codec yang didukung browser
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }
      
      // Setup MediaRecorder untuk merekam canvas
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setIsGeneratingVideo(false);
      };
      
      // Mulai recording
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Animasi: loop 3 strips selama 15 detik (5 detik per strip)
      const duration = 15000; // 15 detik
      const fps = 30;
      const frameDuration = 1000 / fps;
      const stripDuration = duration / loadedImages.length; // 5 detik per strip
      const totalFrames = Math.floor(duration / frameDuration);
      
      let currentFrame = 0;
      const startTime = performance.now();
      
      const animate = (timestamp) => {
        if (currentFrame >= totalFrames) {
          mediaRecorder.stop();
          return;
        }
        
        // Hitung waktu elapsed
        const elapsed = timestamp - startTime;
        const stripIndex = Math.floor(elapsed / stripDuration) % loadedImages.length;
        
        // Draw image
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        ctx.drawImage(loadedImages[stripIndex], 0, 0, videoWidth, videoHeight);
        
        currentFrame++;
        requestAnimationFrame(animate);
      };
      
      // Start animation
      requestAnimationFrame(animate);
      
    } catch (error) {
      console.error('Error in video generation:', error);
      setIsGeneratingVideo(false);
    }
  }, [frameStyle]);

  // Sesi foto untuk mode Video (3 sesi beruntun)
  const startGifSession = useCallback(async () => {
    setAllStrips([]);
    setVideoUrl(null);
    setIsCapturing(true);
    const strips = [];

    // 3 sesi foto beruntun
    for (let session = 1; session <= 3; session++) {
      const sessionPhotos = [];
      
      // Countdown antar sesi (5 detik) - skip untuk sesi pertama
      if (session > 1) {
        for (let i = 5; i > 0; i--) {
          setCountdown(`Session ${session} in ${i}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Ambil foto dalam sesi ini
      for (let i = 0; i < photoCount; i++) {
        // Countdown 3 detik per foto
        for (let j = 3; j > 0; j--) {
          setCountdown(j);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setCountdown(null);
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          const processedImage = await applyFilter(imageSrc, filter);
          sessionPhotos.push(processedImage);
        }

        // Delay 1 detik sebelum foto berikutnya
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      strips.push(sessionPhotos);
      
      // Update preview dengan strip yang baru selesai
      setAllStrips([...strips]);
    }

    setPhotos(strips[0]); // Set photos ke strip pertama untuk kompatibilitas
    setCountdown(null);
    setIsCapturing(false);

    // Generate Video setelah semua sesi selesai
    await generateVideo(strips);
  }, [photoCount, filter, applyFilter, generateVideo]);

  // Ambil foto normal (single session)
  const startPhotoSession = useCallback(async () => {
    if (gifMode) {
      // Mode GIF: 3 sesi beruntun
      await startGifSession();
    } else {
      // Mode normal: 1 sesi
      setPhotos([]);
      setIsCapturing(true);

      for (let i = 0; i < photoCount; i++) {
        // Countdown 3 detik
        for (let j = 3; j > 0; j--) {
          setCountdown(j);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setCountdown(null);
        capturePhoto();

        // Delay 1 detik sebelum foto berikutnya
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setIsCapturing(false);
    }
  }, [gifMode, capturePhoto, photoCount, startGifSession]);

  // Download hasil sebagai gambar
  const downloadStrip = useCallback(async () => {
    if (gifMode && allStrips.length > 0) {
      // Download semua strips dalam mode GIF
      for (let i = 0; i < allStrips.length; i++) {
        await downloadSingleStrip(allStrips[i], i + 1);
        // Delay kecil antar download
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } else if (photos.length === photoCount) {
      // Download single strip dalam mode normal
      await downloadSingleStrip(photos, 1);
    }
  }, [gifMode, allStrips, photos, photoCount]);

  // Download single strip
  const downloadSingleStrip = useCallback(async (stripPhotos, stripNumber) => {
    if (stripPhotos.length === 0) return;
    
    try {
      // Instagram Story size (1080x1920)
      const storyWidth = 1080;
      const storyHeight = 1920;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      canvas.width = storyWidth;
      canvas.height = storyHeight;
      
      // Draw full story background gradient
      if (frameStyle === 'blue') {
        const gradient = ctx.createLinearGradient(0, 0, 0, storyHeight);
        gradient.addColorStop(0, '#1e3a8a');
        gradient.addColorStop(0.20, '#2563eb');
        gradient.addColorStop(0.40, '#3b82f6');
        gradient.addColorStop(0.60, '#60a5fa');
        gradient.addColorStop(0.80, '#3b82f6');
        gradient.addColorStop(1, '#2563eb');
        ctx.fillStyle = gradient;
      } else if (frameStyle === 'red') {
        const gradient = ctx.createLinearGradient(0, 0, 0, storyHeight);
        gradient.addColorStop(0, '#7f1d1d');
        gradient.addColorStop(0.20, '#991b1b');
        gradient.addColorStop(0.40, '#dc2626');
        gradient.addColorStop(0.60, '#ef4444');
        gradient.addColorStop(0.80, '#dc2626');
        gradient.addColorStop(1, '#991b1b');
        ctx.fillStyle = gradient;
      } else if (frameStyle === 'white') {
        const gradient = ctx.createLinearGradient(0, 0, 0, storyHeight);
        gradient.addColorStop(0, '#e5e7eb');
        gradient.addColorStop(0.20, '#e5e7eb');
        gradient.addColorStop(0.40, '#f3f4f6');
        gradient.addColorStop(0.60, '#f9fafb');
        gradient.addColorStop(0.80, '#ffffff');
        gradient.addColorStop(1, '#f3f4f6');
        ctx.fillStyle = gradient;
      }
      ctx.fillRect(0, 0, storyWidth, storyHeight);
      
      // Calculate dimensions to fit within story height
      const photoCount = stripPhotos.length;
      
      // Reserve space for padding and footer
      const topBottomPadding = 100; // Total padding for top and bottom of strip
      const footerHeight = 100; // Footer area
      const gapBetweenPhotos = 40; // Gap between photos
      
      // Available height for all photos and gaps
      const availableHeight = storyHeight - (topBottomPadding * 2) - footerHeight;
      const totalGapHeight = gapBetweenPhotos * (photoCount - 1);
      const availableForPhotos = availableHeight - totalGapHeight;
      
      // Calculate photo size (square) - whichever is smaller: width constraint or height constraint
      const maxPhotoSizeFromHeight = availableForPhotos / photoCount;
      const maxPhotoSizeFromWidth = storyWidth - (topBottomPadding * 2);
      const photoSize = Math.min(maxPhotoSizeFromHeight, maxPhotoSizeFromWidth);
      
      // Calculate actual strip dimensions
      const stripWidth = storyWidth;
      const stripContentHeight = (photoSize * photoCount) + (totalGapHeight);
      const stripHeight = stripContentHeight + footerHeight + (topBottomPadding * 2);
      
      // Center strip vertically
      const stripY = (storyHeight - stripHeight) / 2;
      const padding = (stripWidth - photoSize) / 2; // Center photos horizontally
      const photoRadius = 12 * (photoSize / 310); // Scale radius proportionally
      
      // Load images
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };
      
      const images = await Promise.all(stripPhotos.map(src => loadImage(src)));
      
      // Draw photos (centered)
      let currentY = stripY + topBottomPadding;
      
      images.forEach((img) => {
        const x = padding;
        const y = currentY;
        const size = photoSize;
        
        // Draw photo with rounded corners
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + photoRadius, y);
        ctx.lineTo(x + size - photoRadius, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + photoRadius);
        ctx.lineTo(x + size, y + size - photoRadius);
        ctx.quadraticCurveTo(x + size, y + size, x + size - photoRadius, y + size);
        ctx.lineTo(x + photoRadius, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - photoRadius);
        ctx.lineTo(x, y + photoRadius);
        ctx.quadraticCurveTo(x, y, x + photoRadius, y);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
        
        currentY += photoSize + gapBetweenPhotos;
      });
      
      // Draw footer text (centered at bottom of strip)
      const footerY = stripY + stripHeight - (footerHeight / 2);
      const dateTimeStr = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      
      ctx.fillStyle = frameStyle === 'white' ? '#1f2937' : '#ffffff';
      ctx.font = `500 ${Math.round(photoSize / 310 * 14)}px Arial`; // Scale font with photo size
      ctx.textAlign = 'center';
      ctx.fillText(dateTimeStr, storyWidth / 2, footerY);
      
      // Download
      const link = document.createElement('a');
      const filename = gifMode 
        ? `photostrip-session${stripNumber}-${Date.now()}.png`
        : `photostrip-${Date.now()}.png`;
      link.download = filename;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
    } catch (error) {
      console.error('Error downloading strip:', error);
    }
  }, [gifMode, frameStyle]);

  // Download Video
  const downloadVideo = useCallback(() => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.download = `photobooth-${Date.now()}.webm`;
      link.href = videoUrl;
      link.click();
    }
  }, [videoUrl]);

  // Reset session
  const resetSession = useCallback(() => {
    setPhotos([]);
    setAllStrips([]);
    setVideoUrl(null);
    setIsGeneratingVideo(false);
  }, []);

  return (
    <div className="app">
      <div className="container">
        {/* Main Content - Side by Side */}
        <div className="main-content">
          {/* Webcam Component */}
          <WebcamComponent
            ref={webcamRef}
            filter={filter}
            countdown={countdown}
            isCapturing={isCapturing}
            onStartSession={startPhotoSession}
            onReset={resetSession}
            onDownload={downloadStrip}
            photoCount={photoCount}
            setPhotoCount={setPhotoCount}
            setFilter={setFilter}
            photos={photos}
            gifMode={gifMode}
            setGifMode={setGifMode}
            videoUrl={videoUrl}
            isGeneratingVideo={isGeneratingVideo}
            onDownloadVideo={downloadVideo}
            allStrips={allStrips}
            frameStyle={frameStyle}
            setFrameStyle={setFrameStyle}
          />

          {/* Photo Strip Component */}
          <PhotoStrip
            ref={stripRef}
            photos={photos}
            photoCount={photoCount}
            livePreview={livePreview}
            gifMode={gifMode}
            allStrips={allStrips}
            videoUrl={videoUrl}
            frameStyle={frameStyle}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
