/**
 * Hls.js Player Manager with Cloudflare Worker Proxy & Fallback (Dublado PT-BR)
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
    providerKey: 'superflix',

    async playContent(videoElement, tmdbId, type = 'movie', season = 1, episode = 1, loadingEl, errorEl) {
        this.video = videoElement;
        this.currentTmdbId = tmdbId;
        this.currentType = type;
        this.currentSeason = season;
        this.currentEpisode = episode;
        this.loadingEl = loadingEl;
        this.errorEl = errorEl;

        if (this.loadingEl) this.loadingEl.style.display = 'block';
        if (this.errorEl) this.errorEl.style.display = 'none';

        await this.loadSelectedProvider();
    },

    async loadSelectedProvider() {
        const providers = window.PROVIDERS;
        if (!providers) {
            this.handleError("Nenhum provedor configurado.");
            return;
        }

        const keys = window.PROVIDER_KEYS || Object.keys(providers);
        const activeKey = window.currentProvider || keys[0] || 'superflix';
        this.providerKey = activeKey;

        const p = providers[activeKey];
        if (!p) {
            this.handleError("Provedor selecionado não encontrado.");
            return;
        }

        const rawUrl = this.currentType === 'movie'
            ? p.getMovie(this.currentTmdbId)
            : p.getTv(this.currentTmdbId, this.currentSeason, this.currentEpisode);

        console.log(`Carregando provedor [${activeKey}]: ${rawUrl}`);
        
        // For embed / iframe providers or HLS
        // If it's an iframe player or direct video element
        this.loadStream(rawUrl);
    },

    loadStream(url) {
        if (this.loadingEl) this.loadingEl.style.display = 'none';
        
        // Check if we have an iframe player or video element
        const iframe = document.getElementById('player-frame');
        const video = this.video;

        if (iframe) {
            iframe.src = url;
            iframe.style.display = 'block';
        }
        if (video) {
            video.style.display = 'none';
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

    await window.PlayerManager.playContent(video, id, pType, s, e, loading, errorEl);
};
