const playlistModel = require("../models/playlist.model");
const songModel = require("../models/song.model");

async function createPlaylist(req, res) {
    const { name, mood, songs = [] } = req.body;

    const playlist = await playlistModel.create({
        name,
        mood,
        songs,
        owner: req.user.id
    });

    res.status(201).json({
        message: "Playlist created successfully",
        playlist
    });
}

async function getMyPlaylists(req, res) {
    const playlists = await playlistModel
        .find({ owner: req.user.id })
        .populate("songs");

    res.status(200).json({
        message: "Playlists fetched successfully",
        playlists
    });
}

async function getPlaylistById(req, res) {
    const { playlistId } = req.params;

    const playlist = await playlistModel
        .findById(playlistId)
        .populate("songs");

    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    res.status(200).json({
        message: "Playlist fetched successfully",
        playlist
    });
}

async function addSongToPlaylist(req, res) {
    const { playlistId } = req.params;
    const { songId } = req.body;

    const playlist = await playlistModel.findById(playlistId);
    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    if (playlist.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
    }

    const song = await songModel.findById(songId);
    if (!song) {
        return res.status(404).json({ message: "Song not found" });
    }

    await playlistModel.findByIdAndUpdate(playlistId, {
        $addToSet: { songs: song._id }
    });

    res.status(200).json({ message: "Song added to playlist" });
}

async function removeSongFromPlaylist(req, res) {
    const { playlistId, songId } = req.params;

    const playlist = await playlistModel.findById(playlistId);
    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    if (playlist.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
    }

    await playlistModel.findByIdAndUpdate(playlistId, {
        $pull: { songs: songId }
    });

    res.status(200).json({ message: "Song removed from playlist" });
}

module.exports = {
    createPlaylist,
    getMyPlaylists,
    getPlaylistById,
    addSongToPlaylist,
    removeSongFromPlaylist
};
