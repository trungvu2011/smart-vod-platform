const express = require("express");
const router = express.Router();
const {
  createPlaylist,
  getUserPlaylists,
  listPublicPlaylists,
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

// ── Public — MUST be before /:id to avoid conflict ────────────────────────────
router.get("/public", listPublicPlaylists);

// ── Single Playlist ───────────────────────────────────────────────────────────
router.get("/:id", getPlaylistById);
router.put("/:id", updatePlaylist);
router.delete("/:id", deletePlaylist);

// ── Playlist Items ────────────────────────────────────────────────────────────
router.post("/:id/videos", addVideo);
router.delete("/:id/videos/:videoId", removeVideo);

module.exports = router;
