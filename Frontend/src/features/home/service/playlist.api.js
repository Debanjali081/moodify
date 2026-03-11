import axios from "axios";

const api = axios.create({
    baseURL: "https://moodify-2ta3.onrender.com",
    withCredentials: true
})

export async function createPlaylist({ name, mood, songIds }) {
    const response = await api.post("/api/playlists", {
        name,
        mood,
        songs: songIds
    })
    return response.data
}

export async function getMyPlaylists() {
    const response = await api.get("/api/playlists")
    return response.data
}

export async function addSongToPlaylist(playlistId, songId) {
    const response = await api.post(`/api/playlists/${playlistId}/songs`, { songId })
    return response.data
}

export async function removeSongFromPlaylist(playlistId, songId) {
    const response = await api.delete(`/api/playlists/${playlistId}/songs/${songId}`)
    return response.data
}
