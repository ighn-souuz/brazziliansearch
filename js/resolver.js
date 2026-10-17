/**
 * Resolver for media streams with sequential provider fallback (Dublado PT-BR)
 */
window.MediaResolver = {
    async resolveStream(tmdbId, type = 'movie', season = 1, episode = 1) {
        const providers = window.PROVIDERS;
        if (!providers) throw new Error("Nenhum provedor configurado.");

        const keys = window.PROVIDER_KEYS || Object.keys(providers);
        const activeKey = window.currentProvider || keys[0];
        
        // Try current provider first, then fallback to others
        const orderedKeys = [activeKey, ...keys.filter(k => k !== activeKey)];

        for (const k of orderedKeys) {
            const p = providers[k];
            if (!p) continue;
            try {
                let rawUrl = type === 'movie' 
                    ? p.getMovie(tmdbId) 
                    : p.getTv(tmdbId, season, episode);

                console.log(`Testando provedor [${k}]: ${rawUrl}`);
                return rawUrl;
            } catch (err) {
                console.warn(`Provedor [${k}] falhou:`, err);
            }
        }
        
        // Ultimate fallback
        return `https://superflixapi.top/filme/${tmdbId}`;
    }
};

window.getDubbedStream = async function(id, type, s, e) {
    return await window.MediaResolver.resolveStream(id, type, s, e);
};
