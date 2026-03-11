// Uses the built-in fetch available in Node 18+ (no extra dependency)
function moodToPlaylistId(mood) {
    const normalized = (mood || "").toString().toLowerCase();

    // You can change these IDs to other Deezer playlists you prefer
    if (normalized.includes("happy")) return "1479458365"; // user-provided playlist
    if (normalized.includes("sad")) return "9138210822"; // example sad playlist
    if (normalized.includes("surprised")) return "9357423122"; // example upbeat playlist

    // default to the happy playlist
    return "1479458365";
}

async function fetchPlaylistTracks(playlistId) {
    const res = await fetch(`https://api.deezer.com/playlist/${playlistId}`);
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Deezer playlist request failed: ${res.status} ${body}`);
    }

    const data = await res.json();
    const tracks = (data.tracks?.data || []).map((track) => ({
        deezerId: track.id,
        title: track.title,
        artist: track.artist?.name || "",
        url: track.preview || "",
        posterUrl: track.album?.cover_medium || track.album?.cover || "",
        externalUrl: track.link || ""
    }));

    return {
        playlist: {
            id: data.id,
            title: data.title,
            description: data.description,
            picture: data.picture_medium || data.picture
        },
        tracks
    };
}

async function getPlaylistById(playlistId) {
    return fetchPlaylistTracks(playlistId);
}

async function getMoodPlaylist(mood) {
    const playlistId = moodToPlaylistId(mood);
    return fetchPlaylistTracks(playlistId);
}

module.exports = { getMoodPlaylist, getPlaylistById };
