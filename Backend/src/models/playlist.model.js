const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Playlist name is required"]
    },
    mood: {
        type: String,
        enum: {
            values: ["sad", "happy", "surprised"],
            message: "Invalid mood"
        },
        required: [true, "Mood is required"]
    },
    songs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "songs"
        }
    ],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "Owner is required"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const playlistModel = mongoose.model("playlists", playlistSchema);

module.exports = playlistModel;
