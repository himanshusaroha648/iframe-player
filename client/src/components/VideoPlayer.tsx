import React, { useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  thumbSrc?: string;
}

export default function VideoPlayer({ src, title = 'Lastanime', poster, thumbSrc }: VideoPlayerProps) {

  useEffect(() => {
    // 1. Inject player CSS once (stateless stylesheet)
    if (!document.getElementById('custom-player-css')) {
      const link = document.createElement('link');
      link.id = 'custom-player-css';
      link.rel = 'stylesheet';
      link.href = '/player.css';
      document.head.appendChild(link);
    }

    // 2. Set data attributes so player.js reads correct src/title per video
    const videoEl = document.getElementById('videoEl') as HTMLVideoElement | null;
    if (videoEl) {
      videoEl.dataset.src = src;
      videoEl.dataset.title = title;
      videoEl.dataset.thumb = thumbSrc || '';
    }

    // 3. Destroy old HLS instance (player.js exposes window.__hlsCleanup)
    if (typeof (window as any).__hlsCleanup === 'function') {
      (window as any).__hlsCleanup();
    }

    // 4. Always remove + re-add player.js so it re-executes fresh for each video
    //    (ensures new HLS init + correct RESUME_KEY per video URL)
    document.getElementById('custom-player-script')?.remove();

    const addScript = (scriptSrc: string, id: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.id = id;
        s.src = scriptSrc;
        s.async = false;
        s.onload = () => resolve();
        s.onerror = reject;
        document.body.appendChild(s);
      });

    const hlsReady = document.getElementById('hls-script')
      ? Promise.resolve()
      : addScript('https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js', 'hls-script');

    hlsReady
      .then(() => addScript('/player.js?' + Date.now(), 'custom-player-script'))
      .catch(err => console.error('Player load error:', err));

    // Cleanup on unmount / src change
    return () => {
      if (typeof (window as any).__hlsCleanup === 'function') {
        (window as any).__hlsCleanup();
      }
      document.getElementById('custom-player-script')?.remove();
    };
  }, [src]);   // re-run when video src changes (different video page)

  const videoTitle = title.startsWith('Lastanime') ? title : `Lastanime • ${title}`;

  return (
    <div className="page-wrapper">
      <div className="player-container" id="playerContainer">

        {/* Video Element — data-src is read by player.js */}
        <video
          id="videoEl"
          preload="auto"
          data-src={src}
          data-title={title}
          data-thumb={thumbSrc || ''}
          poster={poster}
        />

        {/* Click overlay */}
        <div className="click-overlay" id="clickOverlay" />

        {/* Center icon flash */}
        <div className="center-icon" id="centerIcon">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </div>

        {/* Skip feedback */}
        <div className="skip-feedback left" id="skipFeedbackLeft">-10s</div>
        <div className="skip-feedback right" id="skipFeedbackRight">+10s</div>

        {/* Mobile skip overlay (fullscreen only) */}
        <div className="mobile-controls" id="mobileControls">
          <button className="mobile-skip-btn" id="mobileSkipBack">
            <svg viewBox="0 0 52 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.9199 45H7.20508V26.5391L2.60645 28.3154V24.3975L11.4219 20.7949H11.9199V45ZM30.1013 35.0059C30.1013 38.3483 29.4926 40.9049 28.2751 42.6758C27.0687 44.4466 25.3422 45.332 23.0954 45.332C20.8708 45.332 19.1498 44.4743 17.9323 42.7588C16.726 41.0322 16.1006 38.5641 16.0564 35.3545V30.7891C16.0564 27.4577 16.6596 24.9121 17.8659 23.1523C19.0723 21.3815 20.8044 20.4961 23.0622 20.4961C25.32 20.4961 27.0521 21.3704 28.2585 23.1191C29.4649 24.8678 30.0792 27.3636 30.1013 30.6064V35.0059ZM25.3864 30.1084C25.3864 28.2048 25.1983 26.777 24.822 25.8252C24.4457 24.8734 23.8591 24.3975 23.0622 24.3975C21.5681 24.3975 20.7933 26.1406 20.738 29.627V35.6533C20.738 37.6012 20.9262 39.0511 21.3025 40.0029C21.6898 40.9548 22.2875 41.4307 23.0954 41.4307C23.8591 41.4307 24.4236 40.988 24.7888 40.1025C25.1651 39.2061 25.3643 37.8392 25.3864 36.002V30.1084Z" fill="white" />
              <path d="M11.9894 5.45398V0L2 7.79529L11.9894 15.5914V10.3033H47.0886V40.1506H33.2442V45H52V5.45398H11.9894Z" fill="white" />
            </svg>
          </button>
          <button className="mobile-skip-btn" id="mobileSkipFwd">
            <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M29.9199 45H25.2051V26.5391L20.6064 28.3154V24.3975L29.4219 20.7949H29.9199V45ZM48.1013 35.0059C48.1013 38.3483 47.4926 40.9049 46.2751 42.6758C45.0687 44.4466 43.3422 45.332 41.0954 45.332C38.8708 45.332 37.1498 44.4743 35.9323 42.7588C34.726 41.0322 34.1006 38.5641 34.0564 35.3545V30.7891C34.0564 27.4577 34.6596 24.9121 35.8659 23.1523C37.0723 21.3815 38.8044 20.4961 41.0622 20.4961C43.32 20.4961 45.0521 21.3704 46.2585 23.1191C47.4649 24.8678 48.0792 27.3636 48.1013 30.6064V35.0059ZM43.3864 30.1084C43.3864 28.2048 43.1983 26.777 42.822 25.8252C42.4457 24.8734 41.8591 24.3975 41.0622 24.3975C39.5681 24.3975 38.7933 26.1406 38.738 29.627V35.6533C38.738 37.6012 38.9262 39.0511 39.3025 40.0029C39.6898 40.9548 40.2875 41.4307 41.0954 41.4307C41.8591 41.4307 42.4236 40.988 42.7888 40.1025C43.1651 39.2061 43.3643 37.8392 43.3864 36.002V30.1084Z" fill="white" />
              <path d="M40.0106 5.45398V0L50 7.79529L40.0106 15.5914V10.3033H4.9114V40.1506H18.7558V45H2.01875e-06V5.45398H40.0106Z" fill="white" />
            </svg>
          </button>
        </div>

        {/* Loading spinner */}
        <div className="spinner" id="spinner">
          <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', shapeRendering: 'auto' }} width="60px" height="60px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="white">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s"
                    begin={`${-(11 - i) / 12}s`} repeatCount="indefinite" />
                </rect>
              </g>
            ))}
          </svg>
        </div>

        {/* Settings Panel */}
        <div className="settings-panel" id="settingsPanel">
          <div className="settings-header">
            <div className="settings-tabs">
              <button className="settings-tab active" id="tabQuality" title="Quality">
                <svg viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" /></svg>
              </button>
              <button className="settings-tab" id="tabSpeed" title="Speed">
                <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" /></svg>
              </button>
              <button className="settings-tab hidden" id="tabCaption" title="Captions">
                <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-9 8H9.5v-.5h-2v3h2V14H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V14H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z" /></svg>
              </button>
              <button className="settings-tab hidden" id="tabAudio" title="Audio Track">
                <svg viewBox="0 0 24 24"><path d="M12 3v9.28a4.39 4.39 0 0 0-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h3V3h-6z" /></svg>
              </button>
            </div>
            <button className="settings-close" id="settingsClose">
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
            </button>
          </div>
          <div className="settings-content" id="panelQuality">
            <button className="settings-item" data-quality="auto">Auto</button>
            <button className="settings-item" data-quality="360">360p</button>
            <button className="settings-item" data-quality="480">480p</button>
            <button className="settings-item" data-quality="720">720p</button>
            <button className="settings-item" data-quality="1080">1080p</button>
          </div>
          <div className="settings-content hidden" id="panelSpeed">
            <button className="settings-item" data-speed="0.5">0.5x</button>
            <button className="settings-item" data-speed="0.75">0.75x</button>
            <button className="settings-item active" data-speed="1">Normal (1x)</button>
            <button className="settings-item" data-speed="1.25">1.25x</button>
            <button className="settings-item" data-speed="1.5">1.5x</button>
            <button className="settings-item" data-speed="2">2x</button>
          </div>
          <div className="settings-content hidden" id="panelCaption" />
          <div className="settings-content hidden" id="panelAudio" />
        </div>

        {/* Controls bar */}
        <div className="controls" id="controls">
          <div className="progress-wrap">
            <div className="progress-bar" id="progressBar">
              <div className="progress-buffered" id="progressBuffered" />
              <div className="progress-fill" id="progressFill" />
              <div className="progress-thumb" id="progressThumb" />
            </div>
            <div className="thumb-preview" id="thumbPreview">
              <video className="thumb-video" id="thumbVideo" muted preload="auto" playsInline />
              <span className="thumb-time" id="thumbTime">0:00</span>
            </div>
            <span className="time-tooltip" id="timeTooltip">0:00</span>
          </div>

          <div className="controls-row">
            <div className="controls-left">
              {/* Play/Pause */}
              <button className="ctrl-btn" id="playBtn" title="Play / Pause">
                <svg className="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                <svg className="icon-pause hidden" viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z" /></svg>
              </button>

              {/* Desktop skip back */}
              <button className="ctrl-btn desktop-skip" id="skipBackBtn" title="Rewind 10s">
                <svg viewBox="0 0 52 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.9199 45H7.20508V26.5391L2.60645 28.3154V24.3975L11.4219 20.7949H11.9199V45ZM30.1013 35.0059C30.1013 38.3483 29.4926 40.9049 28.2751 42.6758C27.0687 44.4466 25.3422 45.332 23.0954 45.332C20.8708 45.332 19.1498 44.4743 17.9323 42.7588C16.726 41.0322 16.1006 38.5641 16.0564 35.3545V30.7891C16.0564 27.4577 16.6596 24.9121 17.8659 23.1523C19.0723 21.3815 20.8044 20.4961 23.0622 20.4961C25.32 20.4961 27.0521 21.3704 28.2585 23.1191C29.4649 24.8678 30.0792 27.3636 30.1013 30.6064V35.0059ZM25.3864 30.1084C25.3864 28.2048 25.1983 26.777 24.822 25.8252C24.4457 24.8734 23.8591 24.3975 23.0622 24.3975C21.5681 24.3975 20.7933 26.1406 20.738 29.627V35.6533C20.738 37.6012 20.9262 39.0511 21.3025 40.0029C21.6898 40.9548 22.2875 41.4307 23.0954 41.4307C23.8591 41.4307 24.4236 40.988 24.7888 40.1025C25.1651 39.2061 25.3643 37.8392 25.3864 36.002V30.1084Z" fill="white" />
                  <path d="M11.9894 5.45398V0L2 7.79529L11.9894 15.5914V10.3033H47.0886V40.1506H33.2442V45H52V5.45398H11.9894Z" fill="white" />
                </svg>
              </button>

              {/* Desktop skip fwd */}
              <button className="ctrl-btn desktop-skip" id="skipFwdBtn" title="Skip 10s">
                <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M29.9199 45H25.2051V26.5391L20.6064 28.3154V24.3975L29.4219 20.7949H29.9199V45ZM48.1013 35.0059C48.1013 38.3483 47.4926 40.9049 46.2751 42.6758C45.0687 44.4466 43.3422 45.332 41.0954 45.332C38.8708 45.332 37.1498 44.4743 35.9323 42.7588C34.726 41.0322 34.1006 38.5641 34.0564 35.3545V30.7891C34.0564 27.4577 34.6596 24.9121 35.8659 23.1523C37.0723 21.3815 38.8044 20.4961 41.0622 20.4961C43.32 20.4961 45.0521 21.3704 46.2585 23.1191C47.4649 24.8678 48.0792 27.3636 48.1013 30.6064V35.0059ZM43.3864 30.1084C43.3864 28.2048 43.1983 26.777 42.822 25.8252C42.4457 24.8734 41.8591 24.3975 41.0622 24.3975C39.5681 24.3975 38.7933 26.1406 38.738 29.627V35.6533C38.738 37.6012 38.9262 39.0511 39.3025 40.0029C39.6898 40.9548 40.2875 41.4307 41.0954 41.4307C41.8591 41.4307 42.4236 40.988 42.7888 40.1025C43.1651 39.2061 43.3643 37.8392 43.3864 36.002V30.1084Z" fill="white" />
                  <path d="M40.0106 5.45398V0L50 7.79529L40.0106 15.5914V10.3033H4.9114V40.1506H18.7558V45H2.01875e-06V5.45398H40.0106Z" fill="white" />
                </svg>
              </button>

              {/* Mobile bar skip back */}
              <button className="ctrl-btn mobile-bar-skip" id="mobileBarBack" title="Rewind 10s">
                <svg viewBox="0 0 52 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.9199 45H7.20508V26.5391L2.60645 28.3154V24.3975L11.4219 20.7949H11.9199V45ZM30.1013 35.0059C30.1013 38.3483 29.4926 40.9049 28.2751 42.6758C27.0687 44.4466 25.3422 45.332 23.0954 45.332C20.8708 45.332 19.1498 44.4743 17.9323 42.7588C16.726 41.0322 16.1006 38.5641 16.0564 35.3545V30.7891C16.0564 27.4577 16.6596 24.9121 17.8659 23.1523C19.0723 21.3815 20.8044 20.4961 23.0622 20.4961C25.32 20.4961 27.0521 21.3704 28.2585 23.1191C29.4649 24.8678 30.0792 27.3636 30.1013 30.6064V35.0059ZM25.3864 30.1084C25.3864 28.2048 25.1983 26.777 24.822 25.8252C24.4457 24.8734 23.8591 24.3975 23.0622 24.3975C21.5681 24.3975 20.7933 26.1406 20.738 29.627V35.6533C20.738 37.6012 20.9262 39.0511 21.3025 40.0029C21.6898 40.9548 22.2875 41.4307 23.0954 41.4307C23.8591 41.4307 24.4236 40.988 24.7888 40.1025C25.1651 39.2061 25.3643 37.8392 25.3864 36.002V30.1084Z" fill="white" />
                  <path d="M11.9894 5.45398V0L2 7.79529L11.9894 15.5914V10.3033H47.0886V40.1506H33.2442V45H52V5.45398H11.9894Z" fill="white" />
                </svg>
              </button>
              {/* Mobile bar skip fwd */}
              <button className="ctrl-btn mobile-bar-skip" id="mobileBarFwd" title="Skip 10s">
                <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M29.9199 45H25.2051V26.5391L20.6064 28.3154V24.3975L29.4219 20.7949H29.9199V45ZM48.1013 35.0059C48.1013 38.3483 47.4926 40.9049 46.2751 42.6758C45.0687 44.4466 43.3422 45.332 41.0954 45.332C38.8708 45.332 37.1498 44.4743 35.9323 42.7588C34.726 41.0322 34.1006 38.5641 34.0564 35.3545V30.7891C34.0564 27.4577 34.6596 24.9121 35.8659 23.1523C37.0723 21.3815 38.8044 20.4961 41.0622 20.4961C43.32 20.4961 45.0521 21.3704 46.2585 23.1191C47.4649 24.8678 48.0792 27.3636 48.1013 30.6064V35.0059ZM43.3864 30.1084C43.3864 28.2048 43.1983 26.777 42.822 25.8252C42.4457 24.8734 41.8591 24.3975 41.0622 24.3975C39.5681 24.3975 38.7933 26.1406 38.738 29.627V35.6533C38.738 37.6012 38.9262 39.0511 39.3025 40.0029C39.6898 40.9548 40.2875 41.4307 41.0954 41.4307C41.8591 41.4307 42.4236 40.988 42.7888 40.1025C43.1651 39.2061 43.3643 37.8392 43.3864 36.002V30.1084Z" fill="white" />
                  <path d="M40.0106 5.45398V0L50 7.79529L40.0106 15.5914V10.3033H4.9114V40.1506H18.7558V45H2.01875e-06V5.45398H40.0106Z" fill="white" />
                </svg>
              </button>

              {/* Volume */}
              <div className="volume-control">
                <button className="ctrl-btn" id="muteBtn" title="Mute / Unmute">
                  <svg className="icon-vol-high" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                    <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                  <svg className="icon-vol-mute hidden" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                </button>
                <div className="volume-popup">
                  <input type="range" id="volumeSlider" min="0" max="100" defaultValue={100} className="volume-slider" />
                </div>
              </div>

              {/* Time display */}
              <span className="time-display" id="timeDisplay">0:00 / 0:00</span>
              {/* Video title */}
              <span className="video-title">{videoTitle}</span>
            </div>

            <div className="controls-right">
              {/* Settings */}
              <button className="ctrl-btn" id="settingsBtn" title="Settings">
                <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a6.931 6.931 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" /></svg>
              </button>

              {/* PiP */}
              <button className="ctrl-btn" id="pipBtn" title="Picture in Picture">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                  <path d="M20 5.125V9.125H22V4.155C22 3.58616 21.5389 3.125 20.97 3.125H2.03C1.46116 3.125 1 3.58613 1 4.155V17.095C1 17.6639 1.46119 18.125 2.03 18.125H12V16.125H3V5.125H20ZM14 11.875C14 11.3227 14.4477 10.875 15 10.875H22C22.5523 10.875 23 11.3227 23 11.875V17.875C23 18.4273 22.5523 18.875 22 18.875H15C14.4477 18.875 14 18.4273 14 17.875V11.875ZM6 12.375L7.79289 10.5821L5.29288 8.0821L6.7071 6.66788L9.20711 9.16789L11 7.375V12.375H6Z" />
                </svg>
              </button>

              {/* Fullscreen */}
              <button className="ctrl-btn" id="fsBtn" title="Fullscreen">
                <svg className="icon-fs-enter" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="white">
                  <path d="M96.3,186.1c1.9,1.9,1.3,4-1.4,4.4l-50.6,8.4c-1.8,0.5-3.7-0.6-4.2-2.4c-0.2-0.6-0.2-1.2,0-1.7l8.4-50.6c0.4-2.7,2.4-3.4,4.4-1.4l14.5,14.5l28.2-28.2l14.3,14.3l-28.2,28.2L96.3,186.1z M195.8,39.1l-50.6,8.4c-2.7,0.4-3.4,2.4-1.4,4.4l14.5,14.5l-28.2,28.2l14.3,14.3l28.2-28.2l14.5,14.5c1.9,1.9,4,1.3,4.4-1.4l8.4-50.6c0.5-1.8-0.6-3.6-2.4-4.2C197,39,196.4,39,195.8,39.1L195.8,39.1z" />
                </svg>
                <svg className="icon-fs-exit hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="white">
                  <path d="M109.2,134.9l-8.4,50.1c-0.4,2.7-2.4,3.3-4.4,1.4L82,172l-27.9,27.9l-14.2-14.2l27.9-27.9l-14.4-14.4c-1.9-1.9-1.3-3.9,1.4-4.4l50.1-8.4c1.8-0.5,3.6,0.6,4.1,2.4C109.4,133.7,109.4,134.3,109.2,134.9L109.2,134.9z M172.1,82.1L200,54.2L185.8,40l-27.9,27.9l-14.4-14.4c-1.9-1.9-3.9-1.3-4.4,1.4l-8.4,50.1c-0.5,1.8,0.6,3.6,2.4,4.1c0.5,0.2,1.2,0.2,1.7,0l50.1-8.4c2.7-0.4,3.3-2.4,1.4-4.4L172.1,82.1z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* end controls */}

      </div>
      {/* end player-container */}
    </div>
  );
}
