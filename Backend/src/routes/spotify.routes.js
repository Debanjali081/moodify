const express = require("express");
const spotifyController = require("../controllers/spotify.controller");

const router = express.Router();

router.get("/mood", spotifyController.getMoodPlaylist);

module.exports = router;
