import { forwardRef } from 'react';
import Webcam from 'react-webcam';

const WebcamComponent = forwardRef(({
  filter,
  countdown,
  isCapturing,
  onStartSession,
  onReset,
  onDownload,
  photoCount,
  setPhotoCount,
  setFilter,
  photos,
  gifMode,
  setGifMode,
  videoUrl,
  isGeneratingVideo,
  onDownloadVideo,
  allStrips,
  frameStyle,
  setFrameStyle
}, ref) => {
  return (
    <div className="webcam-section">
      <div className={`webcam-wrapper filter-${filter}`}>
        <Webcam
          ref={ref}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user"
          }}
        />

        {/* Countdown Overlay */}
        {countdown && (
          <div className="countdown-overlay">
            <span className="countdown-number">{countdown}</span>
          </div>
        )}
      </div>

      {/* GIF Mode Toggle - Hidden */}
      {false && <div className="gif-mode-controls">
        <label className="gif-toggle">
          <input
            type="checkbox"
            checked={gifMode}
            onChange={(e) => setGifMode(e.target.checked)}
            disabled={isCapturing}
          />
          <span>🎬 Enable Video Mode (3 sessions, 15s video)</span>
        </label>
      </div>}

      {/* Filter Controls - Hidden */}
      {false && <div className="filter-controls">
        <button
          onClick={() => setFilter('none')}
          className={`btn-filter ${filter === 'none' ? 'active' : ''}`}
        >
          Normal
        </button>
        <button onClick={() => setFilter('vintage')}
          className={`btn-filter ${filter === 'vintage' ? 'active' : ''}`}
        >
          Vintage
        </button>
        <button
          onClick={() => setFilter('grayscale')}
          className={`btn-filter ${filter === 'grayscale' ? 'active' : ''}`}
        >
          Black & White
        </button>
        <button
          onClick={() => setFilter('handheld')}
          className={`btn-filter ${filter === 'handheld' ? 'active' : ''}`}
        >
          Handheld
        </button>
      </div>}

      {/* Photo Count Controls - Hidden, always use 3 photos */}
      {false && <div className="photo-count-controls">
        <button
          onClick={() => setPhotoCount(3)}
          className={`btn-filter ${photoCount === 3 ? 'active' : ''}`}
          disabled={isCapturing}
        >
          3 Photos
        </button>
        <button
          onClick={() => setPhotoCount(4)}
          className={`btn-filter ${photoCount === 4 ? 'active' : ''}`}
          disabled={isCapturing}
        >
          4 Photos
        </button>
        <button
          onClick={() => setPhotoCount(6)}
          className={`btn-filter ${photoCount === 6 ? 'active' : ''}`}
          disabled={isCapturing}
        >
          6 Photos
        </button>
      </div>}

      {/* Frame Style Selector */}
      <div className="frame-style-controls">
        <label>Choose Frame Style:</label>
        <button
          onClick={() => setFrameStyle('blue')}
          className={`btn-filter ${frameStyle === 'blue' ? 'active' : ''}`}
          disabled={isCapturing}
          style={{
            background: frameStyle === 'blue' ? 'linear-gradient(180deg, #1e3a8a 0%, #3b82f6 100%)' : '#f0f0f0',
            color: frameStyle === 'blue' ? '#ffffff' : '#000000'
          }}
        >
          Blue Frame
        </button>
        <button
          onClick={() => setFrameStyle('red')}
          className={`btn-filter ${frameStyle === 'red' ? 'active' : ''}`}
          disabled={isCapturing}
          style={{
            background: frameStyle === 'red' ? 'linear-gradient(180deg, #7f1d1d 0%, #dc2626 100%)' : '#f0f0f0',
            color: frameStyle === 'red' ? '#ffffff' : '#000000'
          }}
        >
          Red Frame
        </button>
        <button
          onClick={() => setFrameStyle('white')}
          className={`btn-filter ${frameStyle === 'white' ? 'active' : ''}`}
          disabled={isCapturing}
          style={{
            background: frameStyle === 'white' ? 'linear-gradient(180deg, #e5e7eb 0%, #ffffff 100%)' : '#f0f0f0',
            color: '#000000',
            border: frameStyle === 'white' ? '2px solid #9ca3af' : 'none'
          }}
        >
          White Frame
        </button>
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          onClick={onStartSession}
          disabled={isCapturing || isGeneratingVideo}
          className="btn btn-primary"
        >
          {gifMode
            ? `Start Video Session (3 × ${photoCount} Photos)`
            : `Start Photo Session (${photoCount} Photos)`
          }
        </button>

        {isGeneratingVideo && (
          <div className="generating-gif">
            <span>🎬 Generating Video...</span>
          </div>
        )}

        {((gifMode && allStrips.length > 0) || (!gifMode && photos.length === photoCount)) && (
          <>
            <button
              onClick={onReset}
              className="btn btn-secondary"
            >
              Reset
            </button>

            <button
              onClick={onDownload}
              className="btn btn-success"
            >
              {gifMode ? 'Download All Strips' : 'Download Strip'}
            </button>

            {gifMode && videoUrl && (
              <button
                onClick={onDownloadVideo}
                className="btn btn-success"
              >
                Download Video
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});

WebcamComponent.displayName = 'WebcamComponent';

export default WebcamComponent;