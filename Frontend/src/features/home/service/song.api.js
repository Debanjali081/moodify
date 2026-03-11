import axios from "axios";

const api = axios.create({
    baseURL: "https://moodify-2ta3.onrender.com",
    withCredentials: true
})

export async function getSong({ mood }) {
    const response = await api.get("/api/songs?mood=" + mood)
    return response.data
}

export async function getPlaylist({ mood, playlistId }) {
    const query = playlistId ? `playlistId=${playlistId}` : `mood=${mood}`;
    const response = await api.get(`/api/youtube/mood?${query}`);
    return response.data
}

export async function saveSong(songId) {
    const response = await api.post("/api/auth/favorites/songs", { songId })
    return response.data
}

export async function saveSpotifySong(track) {
    const response = await api.post("/api/auth/favorites/songs/spotify", track)
    return response.data
}

export async function saveYoutubeSong(track) {
    const response = await api.post("/api/auth/favorites/songs/youtube", track)
    return response.data
}

export async function removeSavedSong(songId) {
    const response = await api.delete(`/api/auth/favorites/songs/${songId}`)
    return response.data
}

export async function getSavedSongs(options = {}) {
    const response = await api.get("/api/auth/favorites/songs", options)
    return response.data
}

export async function getSavedPlaylists(options = {}) {
    const response = await api.get("/api/auth/favorites/playlists", options)
    return response.data
}

export async function savePlaylist(playlistId) {
    const response = await api.post("/api/auth/favorites/playlists", { playlistId })
    return response.data
}

export async function removeSavedPlaylist(playlistId) {
    const response = await api.delete(`/api/auth/favorites/playlists/${playlistId}`)
    return response.data
}
