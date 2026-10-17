/**
 * TMDb PT-BR Streaming Providers
 */
window.PROVIDERS = [
    {
        name: "SuperFlix",
        getMovieUrl: (tmdbId) => `https://superflixapi.top/filme/${tmdbId}`,
        getTvUrl: (tmdbId, season, episode) => `https://superflixapi.top/serie/${tmdbId}/${season}/${episode}`
    },
    {
        name: "Embedder",
        getMovieUrl: (tmdbId) => `https://embedder.net/e/movie?tmdb=${tmdbId}&lang=pt`,
        getTvUrl: (tmdbId, season, episode) => `https://embedder.net/e/seriestmdb?tmdb=${tmdbId}&s=${season}&e=${episode}&lang=pt`
    },
    {
        name: "2Embed",
        getMovieUrl: (tmdbId) => `https://2embed.cc/embed/movie/${tmdbId}`,
        getTvUrl: (tmdbId, season, episode) => `https://2embed.cc/embed/tv/${tmdbId}&s=${season}&e=${episode}`
    }
];
