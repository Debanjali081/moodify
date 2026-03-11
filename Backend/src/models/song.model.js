const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    artist: {
        type: String
    },
    url: {
        type: String,
        required: true
    },
    posterUrl: {
        type: String,
        default: "",
    },
    mood: {
        type: String,
        enum: {
            values: [ "sad", "happy", "surprised", "neutral", "angry", "fear", "disgusted" ],
            message: "Enum this is"
        }
    },
    provider: {
        type: String,
        enum: ["local", "spotify", "youtube"],
        default: "local"
    },
    spotifyId: {
        type: String,
        index: true
    },
    youtubeId: {
        type: String,
        index: true
    }
})

const songModel = mongoose.model("songs", songSchema)

module.exports = songModel
