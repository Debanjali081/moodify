const express = require("express");
const youtubeController = require("../controllers/youtube.controller");

const router = express.Router();

router.get("/mood", youtubeController.getMoodPlaylist);
router.get("/audio/:videoId", youtubeController.streamYoutubeAudio);

module.exports = router;
