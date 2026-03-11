const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

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