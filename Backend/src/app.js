const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");


const app = express();
app.use(express.json());
app.use(cookieParser());

const defaultCorsOrigins = [
    "https://moodify-1-6mjm.onrender.com",
    "http://localhost:5173"
];
const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : defaultCorsOrigins;

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
}));

/**
 * Routes
 */
const authRoutes = require("./routes/auth.routes")
const songRoutes = require("./routes/song.routes")
const playlistRoutes = require("./routes/playlist.routes")
const spotifyRoutes = require("./routes/spotify.routes")
const deezerRoutes = require("./routes/deezer.routes")
const youtubeRoutes = require("./routes/youtube.routes")

app.use("/api/auth", authRoutes)
app.use("/api/songs", songRoutes)
app.use("/api/playlists", playlistRoutes)
app.use("/api/spotify", spotifyRoutes)
app.use("/api/deezer", deezerRoutes)
app.use("/api/youtube", youtubeRoutes)

module.exports = app
