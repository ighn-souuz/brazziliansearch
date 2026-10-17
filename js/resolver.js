/**
 * Módulo de Resolução e Fallback de Streams HLS (.m3u8) Dubladas (PT-BR)
 */
const providersList = (typeof window !== 'undefined' && window.providers) ? window.providers : (typeof require === 'function' ? require('./providers') : []);

async function getDubbedStream(tmdbId, type, season = 1, episode = 1) {
    console.log(`[Resolver] Buscando stream dublado para ${type} ID ${tmdbId} S${season}E${episode}...`);
    
    for (const provider of providersList) {
        console.log(`[Resolver] Tentando provedor: ${provider.label}`);
        try {
            let url = null;
            if (provider.resolve.length >= 5) {
                // Callback style compatibility
                url = await new Promise((resolve) => {
                    provider.resolve(tmdbId, type, season, episode, (resUrl) => resolve(resUrl));
                });
            } else {
                // Async promise style
                url = await provider.resolve(tmdbId, type, season, episode);
            }
            
            if (url) {
                console.log(`[Resolver] Sucesso com ${provider.label}: ${url}`);
                return url;
            }
        } catch (e) {
            console.warn(`[Resolver] Erro no provedor ${provider.label}:`, e);
        }
    }
    
    console.error('[Resolver] Todos os provedores falharam ao obter stream .m3u8 válido.');
    return null;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getDubbedStream };
}
if (typeof window !== 'undefined') {
    window.getDubbedStream = getDubbedStream;
}
