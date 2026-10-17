/**
 * TMDb PT-BR Streaming Providers (Dublado)
 */
window.PROVIDERS = {
    superflix: {
        label: "SuperFlix (Dublado PT-BR)",
        getMovie: (id) => `https://superflixapi.top/filme/${id}`,
        getTv: (id, s, e) => `https://superflixapi.top/serie/${id}/${s}/${e}`
    },
    warezcdn: {
        label: "WarezCDN (Dublado PT-BR)",
        getMovie: (id) => `https://embed.warezcdn.com/filme/${id}`,
        getTv: (id, s, e) => `https://embed.warezcdn.com/serie/${id}/${s}/${e}`
    },
    embedflix: {
        label: "EmbedFlix (Dublado PT-BR)",
        getMovie: (id) => `https://embedflix.net/filme/${id}`,
        getTv: (id, s, e) => `https://embedflix.net/serie/${id}/${s}/${e}`
    },
    twembed: {
        label: "2Embed (Dublado PT-BR)",
        getMovie: (id) => `https://www.2embed.cc/embed/${id}`,
        getTv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
    }
};

window.PROVIDER_KEYS = Object.keys(window.PROVIDERS);
window.currentProvider = window.currentProvider || 'superflix';
