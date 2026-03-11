const spotifyService = require("../services/spotify.service");

async function getMoodPlaylist(req, res) {
    const { mood } = req.query;

    if (!mood) {
        return res.status(400).json({ message: "Mood query is required" });
    }

    const { playlist, tracks } = await spotifyService.getMoodPlaylist(mood);

    return res.status(200).json({
        message: "Spotify mood playlist fetched successfully",
        playlist,
        tracks
    });
}

module.exports = { getMoodPlaylist };
