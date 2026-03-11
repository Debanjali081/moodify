const express = require("express");
const deezerController = require("../controllers/deezer.controller");

const router = express.Router();

router.get("/playlist", deezerController.getPlaylist);

module.exports = router;
