const playlistService = require("../services/playlist.service");

// ─── Existing ────────────────────────────────────────────────────────────────

// [POST] /api/playlists
const createPlaylist = async (req, res, next) => {
  try {
    const { name, isPrivate } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Playlist name is required!" });
    }
    const playlist = await playlistService.createPlaylist(req.user.id, name, isPrivate);
    res.status(201).json({ message: "Playlist created successfully.", playlist });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/playlists
const getUserPlaylists = async (req, res, next) => {
  try {
    const playlists = await playlistService.getUserPlaylists(req.user.id);
    res.status(200).json({ message: "Playlists retrieved successfully.", playlists });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/playlists/:id/videos
const addVideo = async (req, res, next) => {
  try {
    const { videoId } = req.body;
    if (!videoId) {
      return res.status(400).json({ message: "videoId is required!" });
    }
    const item = await playlistService.addVideoToPlaylist(
      req.user.id,
      req.params.id,
      videoId
    );
    res.status(200).json({ message: "Video added to playlist successfully.", item });
  } catch (error) {
    next(error);
  }
};

// [DELETE] /api/playlists/:id/videos/:videoId
const removeVideo = async (req, res, next) => {
  try {
    await playlistService.removeVideoFromPlaylist(
      req.user.id,
      req.params.id,
      req.params.videoId
    );
    res.status(200).json({ message: "Video removed from playlist successfully." });
  } catch (error) {
    next(error);
  }
};

// ─── NEW ─────────────────────────────────────────────────────────────────────

// [GET] /api/playlists/:id — Chi tiết playlist kèm toàn bộ video items
const getPlaylistById = async (req, res, next) => {
  try {
    const playlist = await playlistService.getPlaylistById(req.user.id, req.params.id);
    res.status(200).json({ message: "Playlist retrieved successfully.", playlist });
  } catch (error) {
    next(error);
  }
};

// [PUT] /api/playlists/:id — Cập nhật tên / isPrivate
const updatePlaylist = async (req, res, next) => {
  try {
    const playlist = await playlistService.updatePlaylist(
      req.user.id,
      req.params.id,
      req.body
    );
    res.status(200).json({ message: "Playlist updated successfully.", playlist });
  } catch (error) {
    next(error);
  }
};

// [DELETE] /api/playlists/:id — Xoá playlist
const deletePlaylist = async (req, res, next) => {
  try {
    await playlistService.deletePlaylist(req.user.id, req.params.id);
    res.status(200).json({ message: "Playlist deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideo,
  removeVideo,
};
