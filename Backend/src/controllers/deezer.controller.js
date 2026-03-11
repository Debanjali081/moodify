const deezerService = require("../services/deezer.service");

async function getPlaylist(req, res) {
    const { mood, playlistId } = req.query;

    if (!mood && !playlistId) {
        return res.status(400).json({ message: "mood or playlistId query is required" });
    }

    let result;
    if (playlistId) {
        result = await deezerService.getPlaylistById(playlistId);
    } else {
        result = await deezerService.getMoodPlaylist(mood);
    }

    return res.status(200).json({
        message: "Deezer playlist fetched successfully",
        ...result
    });
}

module.exports = { getPlaylist };
