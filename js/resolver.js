/**
 * Resolver for media streams with sequential provider fallback
 */
window.MediaResolver = {
    async resolveStream(tmdbId, type = 'movie', season = 1, episode = 1) {
        if (!window.PROVIDERS || window.PROVIDERS.length === 0) {
            throw new Error("Nenhum provedor configurado.");
        }

        for (const provider of window.PROVIDERS) {
            try {
                let rawUrl = type === 'movie' 
                    ? provider.getMovieUrl(tmdbId) 
                    : provider.getTvUrl(tmdbId, season, episode);

                console.log(`Testando provedor ${provider.name}: ${rawUrl}`);
                
                // Wrap through Cloudflare Worker proxy to test accessibility & CORS
                const proxiedUrl = window.PROXY_URL + encodeURIComponent(rawUrl);
                const response = await fetch(proxiedUrl, { method: 'GET' });

                if (response.ok) {
                    console.log(`Provedor ${provider.name} respondeu com sucesso!`);
                    return rawUrl;
                }
            } catch (err) {
                console.warn(`Provedor ${provider.name} falhou:`, err);
            }
        }
        throw new Error("Nenhum provedor disponível para este título.");
    }
};
