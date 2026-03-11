let cachedToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
    const now = Date.now();

    if (cachedToken && now < tokenExpiresAt - 60_000) {
        return cachedToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment")
    }

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ grant_type: "client_credentials" })
    });

    if (!tokenRes.ok) {
        const body = await tokenRes.text();
        throw new Error(`Spotify token request failed: ${tokenRes.status} ${body}`);
    }

    const data = await tokenRes.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in * 1000);
    return cachedToken;
}

function moodToSearchTerm(mood) {
    const normalized = (mood || "").toString().toLowerCase();

    // Basic mapping; you can expand this as needed
    if (normalized.includes("happy")) return "happy song";
    if (normalized.includes("sad")) return "sad song";
    if (normalized.includes("surprised")) return "surprise song";

    return `${normalized} song`;
}

async function searchTracksByMood(mood, limit = 20) {
    const token = await getSpotifyToken();
    const query = encodeURIComponent(moodToSearchTerm(mood));

    const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Spotify search tracks failed: ${res.status} ${body}`);
    }

    const data = await res.json();

    return (data.tracks?.items || [])
        .filter(Boolean)
        .map((track) => ({
            spotifyId: track.id,
            title: track.name,
            artist: track.artists.map((a) => a.name).join(", "),
            url: track.preview_url,
            posterUrl: track.album?.images?.[0]?.url || "",
            externalUrl: track.external_urls?.spotify || ""
        }));
}

async function getMoodPlaylist(mood) {
    const tracks = await searchTracksByMood(mood);

    // Attach mood so UI can render it consistently
    const tracksWithMood = tracks.map((t) => ({ ...t, mood }));

    return { playlist: null, tracks: tracksWithMood };
}

module.exports = { getMoodPlaylist };
