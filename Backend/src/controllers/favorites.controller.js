const userModel = require("../models/user.model");
const songModel = require("../models/song.model");
const playlistModel = require("../models/playlist.model");

async function getFavoriteSongs(req, res) {
    const user = await userModel
        .findById(req.user.id)
        .populate("savedSongs");

    res.status(200).json({
        message: "Favorite songs fetched successfully",
        songs: user.savedSongs || []
    });
}

async function addSongToFavorites(req, res) {
    const { songId } = req.body;

    const song = await songModel.findById(songId);
    if (!song) {
        return res.status(404).json({ message: "Song not found" });
    }

    await userModel.findByIdAndUpdate(req.user.id, {
        $addToSet: { savedSongs: song._id }
    });

    res.status(200).json({ message: "Song saved successfully" });
}

async function saveSpotifySong(req, res) {
    const { spotifyId, title, artist, url, posterUrl, mood } = req.body;

    if (!spotifyId || !title || !url) {
        return res.status(400).json({ message: "spotifyId, title, and url are required" });
    }

    let song = await songModel.findOne({ spotifyId });

    if (!song) {
        song = await songModel.create({
            spotifyId,
            title,
            artist,
            url,
            posterUrl,
            mood,
            provider: "spotify"
        });
    }

    await userModel.findByIdAndUpdate(req.user.id, {
        $addToSet: { savedSongs: song._id }
    });

    res.status(200).json({ message: "Song saved successfully", songId: song._id });
}

async function saveYoutubeSong(req, res) {
    const { youtubeId, title, artist, url, posterUrl, mood } = req.body;

    if (!youtubeId || !title || !url) {
        return res.status(400).json({ message: "youtubeId, title, and url are required" });
    }

    let song = await songModel.findOne({ youtubeId });

    if (!song) {
        song = await songModel.create({
            youtubeId,
            title,
            artist,
            url,
            posterUrl,
            mood,
            provider: "youtube"
        });
    }

    await userModel.findByIdAndUpdate(req.user.id, {
        $addToSet: { savedSongs: song._id }
    });

    res.status(200).json({ message: "Song saved successfully", songId: song._id });
}

async function removeSongFromFavorites(req, res) {
    const { songId } = req.params;

    await userModel.findByIdAndUpdate(req.user.id, {
        $pull: { savedSongs: songId }
    });

    res.status(200).json({ message: "Song removed from favorites" });
}

async function getFavoritePlaylists(req, res) {
    const user = await userModel
        .findById(req.user.id)
        .populate({
            path: "savedPlaylists",
            populate: { path: "songs" }
        });

    res.status(200).json({
        message: "Favorite playlists fetched successfully",
        playlists: user.savedPlaylists || []
    });
}

async function addPlaylistToFavorites(req, res) {
    const { playlistId } = req.body;

    const playlist = await playlistModel.findById(playlistId);
    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    await userModel.findByIdAndUpdate(req.user.id, {
        $addToSet: { savedPlaylists: playlist._id }
    });

    res.status(200).json({ message: "Playlist saved successfully" });
}

async function removePlaylistFromFavorites(req, res) {
    const { playlistId } = req.params;

    await userModel.findByIdAndUpdate(req.user.id, {
        $pull: { savedPlaylists: playlistId }
    });

    res.status(200).json({ message: "Playlist removed from favorites" });
}

module.exports = {
    getFavoriteSongs,
    addSongToFavorites,
    saveSpotifySong,
    saveYoutubeSong,
    removeSongFromFavorites,
    getFavoritePlaylists,
    addPlaylistToFavorites,
    removePlaylistFromFavorites,
};
