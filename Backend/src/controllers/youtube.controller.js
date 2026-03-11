const ytdl = require("ytdl-core");
const youtubeService = require("../services/youtube.service");

async function getMoodPlaylist(req, res) {
    const { mood } = req.query;

    if (!mood) {
        return res.status(400).json({ message: "Mood query is required" });
    }

    const tracks = await youtubeService.searchMoodVideos(mood);

    return res.status(200).json({
        message: "YouTube mood playlist fetched successfully",
        tracks
    });
}

async function streamYoutubeAudio(req, res) {
    const { videoId } = req.params;

    if (!videoId || !ytdl.validateID(videoId)) {
        return res.status(400).json({ message: "Invalid YouTube video ID" });
    }

    const range = req.headers.range;
    const options = {
        quality: "highestaudio",
        filter: "audioonly",
    };

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : undefined;
        options.range = { start, end };
    }

    const stream = ytdl(videoId, options);

    stream.on("info", (_, format) => {
        const mimeType = (format && format.mimeType) || "audio/mpeg";
        res.setHeader("Content-Type", mimeType.split(";")[0]);
        res.setHeader("Accept-Ranges", "bytes");
        if (range) {
            res.status(206);
        }
    });

    stream.on("error", (err) => {
        console.error("YouTube audio stream error", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to stream audio" });
        } else {
            res.destroy();
        }
    });

    stream.pipe(res);
}

module.exports = { getMoodPlaylist, streamYoutubeAudio };