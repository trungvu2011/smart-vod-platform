const express = require("express");
const router = express.Router();
const {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideo,
  removeVideo,
} = require("../controllers/playlist.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Tất cả route playlist đều cần đăng nhập
router.use(verifyToken);

// ── Collection ────────────────────────────────────────────────────────────────
router.get("/", getUserPlaylists);
router.post("/", createPlaylist);

// ── Single Playlist ───────────────────────────────────────────────────────────
router.get("/:id", getPlaylistById);
router.put("/:id", updatePlaylist);
router.delete("/:id", deletePlaylist);

// ── Playlist Items ────────────────────────────────────────────────────────────
router.post("/:id/videos", addVideo);
router.delete("/:id/videos/:videoId", removeVideo);

module.exports = router;
