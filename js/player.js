/**
 * Hls.js Player Manager with Cloudflare Worker Proxy & Fallback
 */
window.PROXY_URL = "https://minha-proxy.meucu0108.workers.dev/?url=";

window.PlayerManager = {
    hls: null,
    video: null,
    loadingEl: null,
    errorEl: null,
    currentTmdbId: null,
    currentType: 'movie',
    currentSeason: 1,
    currentEpisode: 1,
    providerIndex: 0,

    async playContent(videoElement, tmdbId, type = 'movie', season = 1, episode = 1, loadingEl, errorEl) {
        this.video = videoElement;
        this.currentTmdbId = tmdbId;
        this.currentType = type;
        this.currentSeason = season;
        this.currentEpisode = episode;
        this.loadingEl = loadingEl;
        this.errorEl = errorEl;
        this.providerIndex = 0;

        if (this.loadingEl) this.loadingEl.style.display = 'block';
        if (this.errorEl) this.errorEl.style.display = 'none';

        await this.tryNextProvider();
    },

    async tryNextProvider() {
        if (!window.PROVIDERS || this.providerIndex >= window.PROVIDERS.length) {
            this.handleError("Todos os provedores falharam para este título.");
            return;
        }

        const provider = window.PROVIDERS[this.providerIndex];
        console.log(`Tentando provedor [${this.providerIndex + 1}/${window.PROVIDERS.length}]: ${provider.name}`);

        try {
            const rawUrl = this.currentType === 'movie'
                ? provider.getMovieUrl(this.currentTmdbId)
                : provider.getTvUrl(this.currentTmdbId, this.currentSeason, this.currentEpisode);

            const proxiedStreamUrl = window.PROXY_URL + encodeURIComponent(rawUrl);
            this.loadStream(proxiedStreamUrl);
        } catch (e) {
            console.warn(`Erro no provedor ${provider.name}, tentando próximo...`, e);
            this.providerIndex++;
            this.tryNextProvider();
        }
    },

    loadStream(streamUrl) {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }

        if (Hls.isSupported()) {
            this.hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                xhrSetup: (xhr, requestUrl) => {
                    if (!requestUrl.includes('workers.dev')) {
                        xhr.open('GET', window.PROXY_URL + encodeURIComponent(requestUrl), true);
                    }
                }
            });

            this.hls.loadSource(streamUrl);
            this.hls.attachMedia(this.video);

            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (this.loadingEl) this.loadingEl.style.display = 'none';
                this.video.play().catch(err => console.log("Autoplay bloqueado:", err));
            });

            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error("HLS Erro Fatal no provedor atual:", data);
                    this.hls.destroy();
                    this.hls = null;
                    this.providerIndex++;
                    this.tryNextProvider();
                }
            });
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            this.video.src = streamUrl;
            this.video.addEventListener('loadedmetadata', () => {
                if (this.loadingEl) this.loadingEl.style.display = 'none';
                this.video.play();
            });
            this.video.addEventListener('error', () => {
                this.providerIndex++;
                this.tryNextProvider();
            });
        } else {
            this.handleError("HLS não suportado neste navegador.");
        }
    },

    handleError(msg) {
        if (this.loadingEl) this.loadingEl.style.display = 'none';
        if (this.errorEl) {
            this.errorEl.textContent = msg;
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
