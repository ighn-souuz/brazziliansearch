/**
 * Plyr.js + Hls.js Native Player Integration (Dublado PT-BR via Proxy Extractor)
 */
window.PROXY_URL = "https://minha-proxy.meucu0108.workers.dev/?url=";

window.PlayerManager = {
    player: null,
    hls: null,
    video: null,
    loadingEl: null,
    errorEl: null,

    async playContent(videoElement, tmdbId, type = 'movie', season = 1, episode = 1, loadingEl, errorEl) {
        this.video = videoElement;
        this.loadingEl = loadingEl;
        this.errorEl = errorEl;

        if (this.loadingEl) this.loadingEl.style.display = 'flex';
        if (this.errorEl) this.errorEl.style.display = 'none';

        const activeKey = window.currentProvider || 'superflix';
        const providers = window.PROVIDERS || {};
        const p = providers[activeKey] || providers['superflix'] || {
            getMovie: (id) => `https://superflixapi.top/filme/${id}`,
            getTv: (id, s, e) => `https://superflixapi.top/serie/${id}/${s}/${e}`
        };

        const rawUrl = type === 'movie'
            ? p.getMovie(tmdbId)
            : p.getTv(tmdbId, season, episode);

        console.log(`Buscando stream via Proxy Extractor [${activeKey}]: ${rawUrl}`);

        try {
            // Call our Cloudflare Worker Proxy Extractor or fallback to direct embed/stream
            const proxyEndpoint = `https://minha-proxy.meucu0108.workers.dev/?extract=${encodeURIComponent(rawUrl)}`;
            
            let streamUrl = rawUrl;
            try {
                const res = await fetch(proxyEndpoint);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.url) {
                        streamUrl = data.url;
                    }
                }
            } catch (ex) {
                console.warn("Proxy extract fallback to direct URL:", ex);
            }

            this.loadSource(streamUrl);
        } catch (err) {
            console.error("Erro ao carregar mídia:", err);
            this.handleError("Erro ao carregar stream dublado.");
        }
    },

    loadSource(url) {
        if (this.loadingEl) this.loadingEl.style.display = 'none';
        
        const video = this.video;
        if (!video) return;

        video.style.display = 'block';
        const iframe = document.getElementById('player-frame');
        if (iframe) iframe.style.display = 'none';

        // Initialize HLS.js or Plyr
        if (url.includes('.m3u8')) {
            if (Hls.isSupported()) {
                if (this.hls) {
                    this.hls.destroy();
                }
                this.hls = new Hls();
                this.hls.loadSource(url);
                this.hls.attachMedia(video);
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(e => console.log("Autoplay blocked:", e));
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
                video.addEventListener('loadedmetadata', () => {
                    video.play();
                });
            }
        } else {
            // MP4 or direct video/iframe fallback
            if (url.includes('superflix') || url.includes('warezcdn') || url.includes('embedflix') || url.includes('2embed')) {
                // If it's an iframe embed provider page, use iframe
                if (iframe) {
                    iframe.src = url;
                    iframe.style.display = 'block';
                    video.style.display = 'none';
                    return;
                }
            }
            video.src = url;
            video.play().catch(e => console.log("Play error:", e));
        }

        // Initialize Plyr if not already initialized
        if (!this.player && window.Plyr) {
            this.player = new Plyr(video, {
                controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
                settings: ['quality', 'speed'],
                speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] }
            });
        }
    },

    handleError(msg) {
        if (this.loadingEl) this.loadingEl.style.display = 'none';
        if (this.errorEl) {
            this.errorEl.textContent = msg;
            this.errorEl.style.display = 'block';
        }
    }
};

window.chooseProvider = function(key) {
    window.currentProvider = key;
    const sel = document.getElementById('provider-select');
    if (sel) sel.value = key;
    if (window.LAST_PLAY) {
        window.playContent(window.LAST_PLAY.id, window.LAST_PLAY.type, window.LAST_PLAY.s, window.LAST_PLAY.e);
    }
};

window.playContent = async function(id, type, s, e) {
    if (typeof closeDonate === 'function') closeDonate();
    const pType = (type === 'tv' || type === 'serie') ? 'tv' : 'movie';
    window.LAST_PLAY = { id, type: pType, s, e };
    
    const player = document.getElementById('player');
    const video = document.getElementById('player-video');
    const loading = document.getElementById('player-loading');
    const errorEl = document.getElementById('player-error');

    if (!player) return;

    player.classList.add('open');
    document.body.classList.add('lock');

    const sel = document.getElementById('provider-select');
    if (sel && window.currentProvider) {
        sel.value = window.currentProvider;
    }

    await window.PlayerManager.playContent(video, id, pType, s, e, loading, errorEl);
};
