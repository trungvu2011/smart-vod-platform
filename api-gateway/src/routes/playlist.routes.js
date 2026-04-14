const express = require("express");
const router = express.Router();
const {
  createPlaylist,
  getUserPlaylists,
  addVideo,
  removeVideo
} = require("../controllers/playlist.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, createPlaylist);
router.get("/", verifyToken, getUserPlaylists);
router.post("/:id/videos", verifyToken, addVideo);
router.delete("/:id/videos/:videoId", verifyToken, removeVideo);

module.exports = router;
