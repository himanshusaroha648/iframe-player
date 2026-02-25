// ============================================================
//  CUSTOM HLS PLAYER — player.js (React-integrated version)
//  VIDEO_SRC is read from the video element's data-src attribute
//  so this file can be reused for any video without hardcoding.
// ============================================================

// ---------- DOM refs ----------
const video = document.getElementById('videoEl');
const container = document.getElementById('playerContainer');
const clickOverlay = document.getElementById('clickOverlay');
const centerIcon = document.getElementById('centerIcon');
const controls = document.getElementById('controls');
const spinner = document.getElementById('spinner');

const playBtn = document.getElementById('playBtn');
const iconPlay = playBtn.querySelector('.icon-play');
const iconPause = playBtn.querySelector('.icon-pause');

const muteBtn = document.getElementById('muteBtn');
const iconVolHigh = muteBtn.querySelector('.icon-vol-high');
const iconVolMute = muteBtn.querySelector('.icon-vol-mute');

const volumeSlider = document.getElementById('volumeSlider');
const timeDisplay = document.getElementById('timeDisplay');

const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const progressBuffered = document.getElementById('progressBuffered');
const timeTooltip = document.getElementById('timeTooltip');
const progressWrap = document.querySelector('.progress-wrap');

const skipBackBtn = document.getElementById('skipBackBtn');
const skipFwdBtn = document.getElementById('skipFwdBtn');
const skipFbLeft = document.getElementById('skipFeedbackLeft');
const skipFbRight = document.getElementById('skipFeedbackRight');

const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const settingsClose = document.getElementById('settingsClose');
const tabQuality = document.getElementById('tabQuality');
const tabSpeed = document.getElementById('tabSpeed');
const tabCaption = document.getElementById('tabCaption');
const tabAudio = document.getElementById('tabAudio');
const panelQuality = document.getElementById('panelQuality');
const panelSpeed = document.getElementById('panelSpeed');
const panelCaption = document.getElementById('panelCaption');
const panelAudio = document.getElementById('panelAudio');

const fsBtn = document.getElementById('fsBtn');
const iconFsEnter = fsBtn.querySelector('.icon-fs-enter');
const iconFsExit = fsBtn.querySelector('.icon-fs-exit');

// ---------- Dynamic source (from React props via data attributes) ----------
const VIDEO_SRC = video.dataset.src || '';
const THUMB_SRC = video.dataset.thumb || '';
const VIDEO_TITLE = video.dataset.title || 'Lastanime';

// Update title in controls bar
const videoTitleEl = document.querySelector('.video-title');
if (videoTitleEl) videoTitleEl.textContent = VIDEO_TITLE;

// ---------- Resume key: use video ID from URL path (/v/VIDEO_ID) ----------
const _pathId = window.location.pathname.split('/').filter(Boolean).pop() || '';
const RESUME_KEY = 'player_resume_' + (_pathId || btoa(VIDEO_SRC).slice(0, 20));

// ---------- HLS setup ----------
let hlsInstance = null;
let isAutoMode = true;

// Show spinner immediately while HLS loads (important for navigation between videos)
spinner.classList.add('visible');
container.classList.remove('video-ready');  // reset from previous video if any

if (typeof Hls !== 'undefined' && Hls.isSupported()) {
    const hls = new Hls({ startLevel: -1, autoStartLoad: true });
    hlsInstance = hls;
    hls.loadSource(VIDEO_SRC);
    hls.attachMedia(video);

    // Expose cleanup so VideoPlayer.tsx can call it before loading a new video
    window.__hlsCleanup = () => {
        video.pause();
        hls.destroy();
        // Reset player state so next video starts fresh with spinner visible
        container.classList.remove('video-ready');
        container.classList.remove('paused');
        spinner.classList.add('visible');
        window.__hlsCleanup = null;
    };

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const savedVol = parseInt(localStorage.getItem('player_volume') || '100', 10);
        video.volume = savedVol / 100;
        volumeSlider.value = savedVol;
        video.muted = false;
        updateVolumeUI();

        video.play().catch(() => {
            video.muted = true;
            volumeSlider.value = 0;
            updateVolumeUI();
            video.play().catch(err => {
                console.warn('Autoplay fully blocked:', err);
                spinner.classList.remove('visible');
                container.classList.add('paused');
            });
        });
    });
    hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) console.error('HLS fatal error', data.type, data.details);
    });
    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => { updateAutoLabel(data.level); });
    hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (e, data) => {
        const tracks = data.subtitleTracks || [];
        if (tracks.length === 0) return;
        tabCaption.classList.remove('hidden');
        buildCaptionPanel(tracks, hls);
    });
    hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (e, data) => {
        const tracks = data.audioTracks || [];
        if (tracks.length <= 1) return;
        tabAudio.classList.remove('hidden');
        buildAudioPanel(tracks, hls);
    });
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = VIDEO_SRC;
    // Safari native HLS — expose cleanup
    window.__hlsCleanup = () => {
        video.pause();
        video.src = '';
        window.__hlsCleanup = null;
    };
    video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => { container.classList.add('paused'); });
    });
}

// First interaction: unmute
function unmuteOnFirstInteraction() {
    if (video.muted) {
        const savedVol = parseInt(localStorage.getItem('player_volume') || '100', 10);
        video.muted = false;
        video.volume = savedVol / 100;
        volumeSlider.value = savedVol;
        updateVolumeUI();
    }
    document.removeEventListener('click', unmuteOnFirstInteraction);
    document.removeEventListener('keydown', unmuteOnFirstInteraction);
    document.removeEventListener('touchstart', unmuteOnFirstInteraction);
}
document.addEventListener('click', unmuteOnFirstInteraction);
document.addEventListener('keydown', unmuteOnFirstInteraction);
document.addEventListener('touchstart', unmuteOnFirstInteraction, { passive: true });

// ---------- Helpers ----------
function formatTime(sec) {
    if (isNaN(sec) || sec < 0) return '0:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function flashCenterIcon(path) {
    const svgPath = centerIcon.querySelector('path');
    svgPath.setAttribute('d', path);
    centerIcon.classList.add('show');
    setTimeout(() => centerIcon.classList.remove('show'), 600);
}

// Cumulative skip feedback state (per side)
const _skipState = {
    left: { total: 0, timer: null },
    right: { total: 0, timer: null },
};

function showSkipFeedback(side, seconds) {
    const el = side === 'left' ? skipFbLeft : skipFbRight;
    const state = _skipState[side];

    // Accumulate seconds
    state.total += seconds;

    // Update text: "-20s" or "+30s"
    el.textContent = (side === 'left' ? '-' : '+') + Math.abs(state.total) + 's';
    el.classList.add('show');

    // Reset timer — hide + clear total after 800ms of no taps
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
        el.classList.remove('show');
        state.total = 0;
    }, 800);
}

function updatePlayUI() {
    if (video.paused) {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
        container.classList.add('paused');
    } else {
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        container.classList.remove('paused');
    }
}

function updateProgress() {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    progressFill.style.width = pct + '%';
    progressThumb.style.left = pct + '%';
    timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    if (video.buffered.length > 0) {
        const bufEnd = video.buffered.end(video.buffered.length - 1);
        progressBuffered.style.width = (bufEnd / video.duration) * 100 + '%';
    }
}

function setVolume(val) {
    video.volume = val / 100;
    video.muted = (val === 0);
    volumeSlider.value = val;
    if (val > 0) localStorage.setItem('player_volume', val);
    updateVolumeUI();
}

function updateVolumeUI() {
    if (video.muted || video.volume === 0) {
        iconVolHigh.classList.add('hidden');
        iconVolMute.classList.remove('hidden');
    } else {
        iconVolHigh.classList.remove('hidden');
        iconVolMute.classList.add('hidden');
    }
    const pct = video.muted ? 0 : video.volume * 100;
    volumeSlider.style.background =
        `linear-gradient(90deg, rgba(255,255,255,0.9) ${pct}%, rgba(255,255,255,0.22) ${pct}%)`;
}

// ---------- Events ----------
playBtn.addEventListener('click', () => togglePlay());

clickOverlay.addEventListener('click', () => {
    if (_wasHolding) { _wasHolding = false; return; }
    togglePlay();
});

const PATH_PLAY = 'M8 5v14l11-7z';
const PATH_PAUSE = 'M6 19h4V5H6zm8-14v14h4V5z';

function togglePlay() {
    if (video.paused) {
        video.play().catch(err => console.warn('Play failed:', err));
        flashCenterIcon(PATH_PLAY);
    } else {
        video.pause();
        flashCenterIcon(PATH_PAUSE);
    }
}

// ========== HOLD TO 2X ==========
let _holdTimer = null;
let _isHolding = false;
let _wasHolding = false;
let _normalSpeed = 1;

const speedBadge = document.createElement('div');
speedBadge.id = 'speedBadge';
speedBadge.textContent = '2×';
container.appendChild(speedBadge);

function startHold() {
    clearTimeout(_holdTimer);
    _holdTimer = setTimeout(() => {
        _isHolding = true;
        _normalSpeed = video.playbackRate;
        video.playbackRate = 2;
        speedBadge.classList.add('visible');
        hideControlsNow();
    }, 300);
}

function endHold() {
    clearTimeout(_holdTimer);
    if (_isHolding) {
        _isHolding = false;
        _wasHolding = true;
        video.playbackRate = _normalSpeed;
        speedBadge.classList.remove('visible');
    }
}

clickOverlay.addEventListener('pointerdown', startHold);
clickOverlay.addEventListener('pointerup', endHold);
clickOverlay.addEventListener('contextmenu', (e) => e.preventDefault());

container.addEventListener('touchstart', (e) => {
    if (e.target === clickOverlay || e.target === container) startHold();
}, { passive: true });
container.addEventListener('touchend', endHold);
container.addEventListener('touchcancel', endHold);

video.addEventListener('play', updatePlayUI);
video.addEventListener('pause', updatePlayUI);
video.addEventListener('timeupdate', updateProgress);

// ========== AUTO-HIDE CONTROLS ==========
let _idleTimer = null;
const IDLE_DELAY = 3000;

function showControls() {
    controls.classList.remove('controls-hidden');
    container.classList.remove('cursor-hidden');
    if (!video.paused) resetIdleTimer();
}

function hideControlsNow() {
    if (document.querySelector('.settings-panel.open')) return;
    controls.classList.add('controls-hidden');
    container.classList.add('cursor-hidden');
}

function resetIdleTimer() {
    clearTimeout(_idleTimer);
    _idleTimer = setTimeout(hideControlsNow, IDLE_DELAY);
}

container.addEventListener('mousemove', showControls);
container.addEventListener('touchstart', showControls, { passive: true });

video.addEventListener('play', () => { showControls(); resetIdleTimer(); });
video.addEventListener('pause', () => { clearTimeout(_idleTimer); showControls(); });

// ---- Resume ----
let _lastSave = 0;
video.addEventListener('timeupdate', () => {
    const now = Date.now();
    if (now - _lastSave > 5000 && video.currentTime > 5) {
        _lastSave = now;
        localStorage.setItem(RESUME_KEY, video.currentTime.toFixed(2));
    }
});
video.addEventListener('ended', () => { localStorage.removeItem(RESUME_KEY); });
video.addEventListener('loadedmetadata', () => {
    const saved = parseFloat(localStorage.getItem(RESUME_KEY) || '0');
    if (saved > 10 && saved < (video.duration - 10)) {
        video.currentTime = Math.max(0, saved - 1);
    }
});

video.addEventListener('playing', () => {
    container.classList.add('video-ready');
}, { once: true });

// Skip buttons
skipBackBtn.addEventListener('click', () => {
    video.currentTime = Math.max(0, video.currentTime - 10);
    showSkipFeedback('left', 10);
});
skipFwdBtn.addEventListener('click', () => {
    video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
    showSkipFeedback('right', 10);
});

let lastVolume = 100;
muteBtn.addEventListener('click', () => {
    if (video.muted || video.volume === 0) {
        const restoreVol = lastVolume > 0 ? lastVolume : 100;
        video.muted = false;
        setVolume(restoreVol);
    } else {
        lastVolume = Math.round(video.volume * 100);
        video.muted = true;
        volumeSlider.value = 0;
        updateVolumeUI();
    }
});

volumeSlider.addEventListener('input', () => {
    const val = Number(volumeSlider.value);
    if (val > 0) lastVolume = val;
    setVolume(val);
});

// ========== THUMBNAIL PREVIEW ==========
const thumbPreview = document.getElementById('thumbPreview');
const thumbVideo = document.getElementById('thumbVideo');
const thumbTime = document.getElementById('thumbTime');

let thumbReady = false;
let lastThumbSeek = 0;
const THUMB_THROTTLE = 80;

if (THUMB_SRC) {
    thumbVideo.src = THUMB_SRC;
    thumbVideo.preload = 'auto';

    thumbVideo.addEventListener('canplay', () => { thumbReady = true; });
    thumbVideo.addEventListener('loadedmetadata', () => { thumbVideo.currentTime = 0.1; });

    // Agar video load fail ho (e.g. wrong URL) to bss readyState check kaam karega
    // thumbReady false rahega aur black box nahi dikhega
    thumbVideo.addEventListener('error', () => { thumbReady = false; });
}

progressWrap.addEventListener('click', (e) => seek(e));
progressWrap.addEventListener('mousemove', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const mainDur = video.duration;
    if (!mainDur || isNaN(mainDur) || mainDur <= 0) return;
    const t = pct * mainDur;

    timeTooltip.textContent = formatTime(t);
    timeTooltip.style.left = (pct * 100) + '%';
    thumbTime.textContent = formatTime(t);

    const clampedPct = Math.max(10, Math.min(90, pct * 100));
    thumbPreview.style.left = clampedPct + '%';

    if (THUMB_SRC && thumbReady && thumbVideo.readyState >= 2) {
        const now = Date.now();
        if (now - lastThumbSeek > THUMB_THROTTLE) {
            lastThumbSeek = now;
            const thumbDur = thumbVideo.duration || 1;
            const seekTo = Math.max(0, Math.min((t / mainDur) * thumbDur, thumbDur - 0.1));
            if (thumbVideo.fastSeek) thumbVideo.fastSeek(seekTo);
            else thumbVideo.currentTime = seekTo;
        }
    }
});

let isSeeking = false;
progressWrap.addEventListener('mousedown', (e) => { isSeeking = true; seek(e); });
document.addEventListener('mousemove', (e) => { if (!isSeeking) return; seek(e); });
document.addEventListener('mouseup', () => { isSeeking = false; });

progressWrap.addEventListener('touchstart', (e) => {
    e.preventDefault(); isSeeking = true; seek(e.touches[0]);
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isSeeking) return; e.preventDefault(); seek(e.touches[0]);
}, { passive: false });
document.addEventListener('touchend', () => { isSeeking = false; });

function seek(e) {
    const rect = progressBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pct * (video.duration || 0);
    progressFill.style.width = (pct * 100) + '%';
    progressThumb.style.left = (pct * 100) + '%';
    timeDisplay.textContent = `${formatTime(targetTime)} / ${formatTime(video.duration || 0)}`;
    spinner.classList.add('visible');
    video.currentTime = targetTime;
}

video.addEventListener('waiting', () => spinner.classList.add('visible'));
video.addEventListener('playing', () => spinner.classList.remove('visible'));
video.addEventListener('canplay', () => spinner.classList.remove('visible'));

// ========== SETTINGS PANEL ==========
settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!container.classList.contains('video-ready')) return;
    const isOpen = settingsPanel.classList.toggle('open');
    container.classList.toggle('settings-open', isOpen);
});
settingsClose.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.classList.remove('open');
    container.classList.remove('settings-open');
});
document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
        settingsPanel.classList.remove('open');
        container.classList.remove('settings-open');
    }
});

const allTabs = [tabQuality, tabSpeed, tabCaption, tabAudio];
const allPanels = [panelQuality, panelSpeed, panelCaption, panelAudio];

function switchTab(activeTab, activePanel) {
    allTabs.forEach(t => t.classList.remove('active'));
    allPanels.forEach(p => p.classList.add('hidden'));
    activeTab.classList.add('active');
    activePanel.classList.remove('hidden');
}

tabQuality.addEventListener('click', () => switchTab(tabQuality, panelQuality));
tabSpeed.addEventListener('click', () => switchTab(tabSpeed, panelSpeed));
tabCaption.addEventListener('click', () => switchTab(tabCaption, panelCaption));
tabAudio.addEventListener('click', () => switchTab(tabAudio, panelAudio));

function buildCaptionPanel(tracks, hls) {
    panelCaption.innerHTML = '';
    const offBtn = document.createElement('button');
    offBtn.className = 'settings-item active';
    offBtn.textContent = 'Off';
    offBtn.addEventListener('click', () => {
        hls.subtitleTrack = -1;
        panelCaption.querySelectorAll('.settings-item').forEach(b => b.classList.remove('active'));
        offBtn.classList.add('active');
    });
    panelCaption.appendChild(offBtn);
    tracks.forEach((track, idx) => {
        const btn = document.createElement('button');
        btn.className = 'settings-item';
        btn.textContent = track.name || track.lang || `Track ${idx + 1}`;
        btn.addEventListener('click', () => {
            hls.subtitleTrack = idx;
            panelCaption.querySelectorAll('.settings-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        panelCaption.appendChild(btn);
    });
}

function buildAudioPanel(tracks, hls) {
    panelAudio.innerHTML = '';
    tracks.forEach((track, idx) => {
        const btn = document.createElement('button');
        btn.className = 'settings-item' + (idx === 0 ? ' active' : '');
        btn.textContent = track.name || track.lang || `Audio ${idx + 1}`;
        btn.addEventListener('click', () => {
            hls.audioTrack = idx;
            panelAudio.querySelectorAll('.settings-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        panelAudio.appendChild(btn);
    });
}

panelSpeed.querySelectorAll('.settings-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const s = parseFloat(btn.dataset.speed);
        video.playbackRate = s;
        panelSpeed.querySelectorAll('.settings-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

function updateAutoLabel(levelIdx) {
    const autoBtn = panelQuality.querySelector('[data-quality="auto"]');
    if (!autoBtn || !hlsInstance) return;
    if (isAutoMode) {
        const level = hlsInstance.levels && hlsInstance.levels[levelIdx];
        const h = level && level.height ? level.height : null;
        autoBtn.textContent = h ? `Auto ${h}p` : 'Auto';
    }
}

panelQuality.querySelectorAll('.settings-item').forEach(btn => {
    btn.addEventListener('click', () => {
        panelQuality.querySelectorAll('.settings-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (!hlsInstance) return;
        const q = btn.dataset.quality;
        if (q === 'auto') {
            isAutoMode = true;
            hlsInstance.currentLevel = -1;
            const curIdx = hlsInstance.nextAutoLevel >= 0 ? hlsInstance.nextAutoLevel : hlsInstance.nextLevel;
            updateAutoLabel(curIdx);
        } else {
            isAutoMode = false;
            const autoBtn = panelQuality.querySelector('[data-quality="auto"]');
            if (autoBtn) autoBtn.textContent = 'Auto';
            const targetH = parseInt(q);
            const idx = hlsInstance.levels.findIndex(l => l.height === targetH);
            hlsInstance.currentLevel = idx >= 0 ? idx : -1;
        }
    });
});

const autoBtn = panelQuality.querySelector('[data-quality="auto"]');
if (autoBtn) autoBtn.classList.add('active');

// ========== RIGHT CLICK DISABLE ==========
container.addEventListener('contextmenu', (e) => e.preventDefault());

// ========== PICTURE IN PICTURE ==========
const pipBtn = document.getElementById('pipBtn');
async function togglePiP() {
    if (!document.pictureInPictureEnabled) return;
    try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await video.requestPictureInPicture();
    } catch (err) { console.warn('PiP error:', err); }
}
pipBtn.addEventListener('click', togglePiP);
video.addEventListener('enterpictureinpicture', () => {
    pipBtn.classList.add('pip-active');
    pipBtn.title = 'Exit Picture in Picture';
});
video.addEventListener('leavepictureinpicture', () => {
    pipBtn.classList.remove('pip-active');
    pipBtn.title = 'Picture in Picture';
});

// ========== FULLSCREEN ==========
fsBtn.addEventListener('click', toggleFullscreen);
function toggleFullscreen() {
    if (!document.fullscreenElement) container.requestFullscreen().catch(err => console.warn(err));
    else document.exitFullscreen();
}
document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    iconFsEnter.classList.toggle('hidden', isFs);
    iconFsExit.classList.toggle('hidden', !isFs);
    if (isFs) {
        video.muted = false; video.volume = 1; volumeSlider.value = 100; updateVolumeUI();
        const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isMobile && screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => { });
        }
    } else {
        if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    }
});

// ========== MOBILE BUTTONS ==========
const mobileSkipBack = document.getElementById('mobileSkipBack');
const mobileSkipFwd = document.getElementById('mobileSkipFwd');
mobileSkipBack.addEventListener('click', () => {
    video.currentTime = Math.max(0, video.currentTime - 10); showSkipFeedback('left', 10);
});
mobileSkipFwd.addEventListener('click', () => {
    video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10); showSkipFeedback('right', 10);
});

const mobileBarBack = document.getElementById('mobileBarBack');
const mobileBarFwd = document.getElementById('mobileBarFwd');
mobileBarBack.addEventListener('click', () => {
    video.currentTime = Math.max(0, video.currentTime - 10); showSkipFeedback('left', 10);
});
mobileBarFwd.addEventListener('click', () => {
    video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10); showSkipFeedback('right', 10);
});

function applyMobileVolume() {
    if (window.innerWidth <= 600) {
        video.muted = false; video.volume = 1; volumeSlider.value = 100; updateVolumeUI();
    }
}
video.addEventListener('playing', applyMobileVolume, { once: true });
window.addEventListener('resize', applyMobileVolume);

// ========== KEYBOARD ==========
document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    switch (e.code) {
        case 'Space': case 'KeyK': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': e.preventDefault(); video.currentTime += 10; showSkipFeedback('right', 10); break;
        case 'ArrowLeft': e.preventDefault(); video.currentTime -= 10; showSkipFeedback('left', 10); break;
        case 'ArrowUp': e.preventDefault(); setVolume(Math.min(100, Math.round(video.volume * 100) + 10)); break;
        case 'ArrowDown': e.preventDefault(); setVolume(Math.max(0, Math.round(video.volume * 100) - 10)); break;
        case 'KeyM': muteBtn.click(); break;
        case 'KeyF': toggleFullscreen(); break;
    }
});

// Init
updateVolumeUI();
applyMobileVolume();
