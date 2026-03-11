const { Router } = require("express");
const authController = require("../controllers/auth.controller")
const favoritesController = require("../controllers/favorites.controller")
const authMiddleware = require("../middlewares/auth.middleware")
const router = Router();

router.post('/register', authController.registerUser)

router.post('/login', authController.loginUser)

router.get("/get-me", authMiddleware.authUser, authController.getMe)

router.get("/logout", authController.logoutUser)

// Favorites (requires auth)
router.get("/favorites/songs", authMiddleware.authUser, favoritesController.getFavoriteSongs)
router.post("/favorites/songs", authMiddleware.authUser, favoritesController.addSongToFavorites)
router.post("/favorites/songs/spotify", authMiddleware.authUser, favoritesController.saveSpotifySong)
router.post("/favorites/songs/youtube", authMiddleware.authUser, favoritesController.saveYoutubeSong)
router.delete("/favorites/songs/:songId", authMiddleware.authUser, favoritesController.removeSongFromFavorites)

router.get("/favorites/playlists", authMiddleware.authUser, favoritesController.getFavoritePlaylists)
router.post("/favorites/playlists", authMiddleware.authUser, favoritesController.addPlaylistToFavorites)
router.delete("/favorites/playlists/:playlistId", authMiddleware.authUser, favoritesController.removePlaylistFromFavorites)

module.exports = router;