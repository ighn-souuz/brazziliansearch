/**
 * Plyr.js + Hls.js Native Player Integration with Fallback & Timeout (Dublado PT-BR)
 */
window.PROXY_URL = "https://minha-proxy.meucu0108.workers.dev/?url=";

window.PlayerManager = {
    player: null,
    hls: null,
    video: null,
    loadingEl: null,
    errorEl: null,
    timeoutTimer: null,
    currentRawUrl: null,

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

        this.currentRawUrl = rawUrl;
        console.log(`Carregando provedor [${activeKey}]: ${rawUrl}`);

        try {
            // Attempt proxy extraction
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

            this.loadSource(streamUrl, rawUrl);
        } catch (err) {
            console.error("Erro ao carregar mídia:", err);
            this.fallbackToIframe(rawUrl);
        }
    },

    loadSource(url, fallbackUrl) {
        const video = this.video;
        const iframe = document.getElementById('player-frame');
        if (!video) return;

        // Set timeout of 5 seconds for loading
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
        this.timeoutTimer = setTimeout(() => {
            console.warn("Stream loading timeout (5s), falling back to iframe embed.");
            this.fallbackToIframe(fallbackUrl);
        }, 5000);

        video.style.display = 'block';
        if (iframe) iframe.style.display = 'none';

        if (url.includes('.m3u8')) {
            const proxiedM3u8 = `https://minha-proxy.meucu0108.workers.dev/?url=${encodeURIComponent(url)}`;
            if (Hls.isSupported()) {
                if (this.hls) {
                    this.hls.destroy();
                }
                this.hls = new Hls({
                    xhrSetup: (xhr, reqUrl) => {
                        // Pass chunks through proxy if needed
                    }
                });
                this.hls.loadSource(proxiedM3u8);
                this.hls.attachMedia(video);
                
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
                    if (this.loadingEl) this.loadingEl.style.display = 'none';
                    video.play().catch(e => console.log("Autoplay blocked:", e));
                });

                this.hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        console.warn("HLS fatal error, falling back to iframe:", data);
                        this.fallbackToIframe(fallbackUrl);
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = proxiedM3u8;
                video.addEventListener('loadedmetadata', () => {
                    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
                    if (this.loadingEl) this.loadingEl.style.display = 'none';
                    video.play();
                });
            }
        } else {
            // Direct video or iframe provider page
            if (url.includes('superflix') || url.includes('warezcdn') || url.includes('embedflix') || url.includes('2embed')) {
                this.fallbackToIframe(url);
                return;
            }
            video.src = url;
            video.play().then(() => {
                if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
                if (this.loadingEl) this.loadingEl.style.display = 'none';
            }).catch(e => {
                console.log("Direct play failed, falling back to iframe:", e);
                this.fallbackToIframe(fallbackUrl);
            });
        }

        if (!this.player && window.Plyr) {
            this.player = new Plyr(video, {
                controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
                settings: ['quality', 'speed']
            });
        }
    },

    fallbackToIframe(url) {
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
        if (this.loadingEl) this.loadingEl.style.display = 'none';

        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }

        const video = this.video;
        const iframe = document.getElementById('player-frame');

        if (video) video.style.display = 'none';
        if (iframe) {
            iframe.src = url;
            iframe.style.display = 'block';
            console.log("Fallback acionado: exibindo player via iframe embed:", url);
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

// force sync 1792286181.3599114