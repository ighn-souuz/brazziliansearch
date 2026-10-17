/**
 * Player integration for Hls.js with Cloudflare Worker Proxy & xhrSetup
 */

window.PROXY_URL = "https://brazilian-search-proxy.YOUR-SUBDOMAIN.workers.dev/?url=";

window.PlayerManager = {
    hls: null,
    video: null,
    loadingEl: null,
    errorEl: null,

    async playStream(videoElement, url, loadingEl, errorEl) {
        this.video = videoElement;
        this.loadingEl = loadingEl;
        this.errorEl = errorEl;

        if (this.loadingEl) this.loadingEl.style.display = 'block';
        if (this.errorEl) this.errorEl.style.display = 'none';

        // Route through Cloudflare Worker proxy
        const proxiedUrl = window.PROXY_URL + encodeURIComponent(url);

        try {
            if (this.hls) {
                this.hls.destroy();
                this.hls = null;
            }

            if (Hls.isSupported()) {
                this.hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    xhrSetup: function (xhr, requestUrl) {
                        if (!requestUrl.includes('workers.dev')) {
                            xhr.open('GET', window.PROXY_URL + encodeURIComponent(requestUrl), true);
                        }
                    }
                });

                this.hls.loadSource(proxiedUrl);
                this.hls.attachMedia(this.video);
                
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (this.loadingEl) this.loadingEl.style.display = 'none';
                    this.video.play().catch(e => console.log('Autoplay blocked', e));
                });

                this.hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        console.error('HLS Fatal Error:', data);
                        this.handleError('Erro no stream. Tentando próximo provedor...');
                    }
                });
            } 
            else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
                this.video.src = proxiedUrl;
                this.video.addEventListener('loadedmetadata', () => {
                    if (this.loadingEl) this.loadingEl.style.display = 'none';
                    this.video.play();
                });
            } else {
                throw new Error('HLS não é suportado neste navegador.');
            }
        } catch (error) {
            this.handleError(error.message);
        }
    },

    handleError(message) {
        console.error('Player Error:', message);
        if (this.loadingEl) this.loadingEl.style.display = 'none';
        if (this.errorEl) {
            this.errorEl.textContent = message;
            this.errorEl.style.display = 'block';
        }
    },

    stop() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        if (this.video) {
            this.video.pause();
            this.video.src = '';
        }
    }
};
