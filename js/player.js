/**
 * Hls.js Player Manager with Cloudflare Worker Proxy & Fallback (Dublado PT-BR)
 */
window.PROXY_URL = "https://minha-proxy.meucu0108.workers.dev/?url=";

window.PlayerManager = {
    video: null,
    loadingEl: null,
    errorEl: null,
    currentTmdbId: null,
    currentType: 'movie',
    currentSeason: 1,
    currentEpisode: 1,

    async playContent(videoElement, tmdbId, type = 'movie', season = 1, episode = 1, loadingEl, errorEl) {
        console.log("PlayerManager.playContent called with:", videoElement, tmdbId, type, season, episode, loadingEl, errorEl);
        try {
            this.video = videoElement;
            this.currentTmdbId = tmdbId;
            this.currentType = type;
            this.currentSeason = season;
            this.currentEpisode = episode;
            this.loadingEl = loadingEl;
            this.errorEl = errorEl;

            if (this.loadingEl) this.loadingEl.style.display = 'block';
            if (this.errorEl) this.errorEl.style.display = 'none';

            const providers = window.PROVIDERS || {
                superflix: { getMovie: (id) => `https://superflixapi.top/filme/${id}`, getTv: (id, s, e) => `https://superflixapi.top/serie/${id}/${s}/${e}` },
                warezcdn: { getMovie: (id) => `https://embed.warezcdn.com/filme/${id}`, getTv: (id, s, e) => `https://embed.warezcdn.com/serie/${id}/${s}/${e}` },
                embedflix: { getMovie: (id) => `https://embedflix.net/filme/${id}`, getTv: (id, s, e) => `https://embedflix.net/serie/${id}/${s}/${e}` },
                twembed: { getMovie: (id) => `https://www.2embed.cc/embed/${id}`, getTv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` }
            };

            const activeKey = window.currentProvider || 'superflix';
            const p = providers[activeKey] || providers['superflix'];

            const rawUrl = this.currentType === 'movie'
                ? p.getMovie(this.currentTmdbId)
                : p.getTv(this.currentTmdbId, this.currentSeason, this.currentEpisode);

            console.log("Carregando stream dublado [${activeKey}]: ${rawUrl}", {activeKey, rawUrl});
            this.loadStream(rawUrl);
        } catch (e) {
            console.error("Error in PlayerManager.playContent:", e);
            this.handleError(e.message);
        }
    };

    loadStream(url) {
        console.log('PlayerManager.loadStream called with url:', url);
        if (this.loadingEl) this.loadingEl.style.display = 'none';
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

window.chooseProvider = function(key) {
    window.currentProvider = key;
    const sel = document.getElementById('provider-select');
    if (sel) sel.value = key;
    if (window.LAST_PLAY) {
        window.playContent(window.LAST_PLAY.id, window.LAST_PLAY.type, window.LAST_PLAY.s, window.LAST_PLAY.e);
    }
};

window.playContent = async function(id, type, s, e) {
    console.log("window.playContent called with", id, type, s, e);
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
