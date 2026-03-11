const express = require("express");
const playlistController = require("../controllers/playlist.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware.authUser);

router.post("/", playlistController.createPlaylist);
router.get("/", playlistController.getMyPlaylists);
router.get("/:playlistId", playlistController.getPlaylistById);
router.post("/:playlistId/songs", playlistController.addSongToPlaylist);
router.delete("/:playlistId/songs/:songId", playlistController.removeSongFromPlaylist);

module.exports = router;
