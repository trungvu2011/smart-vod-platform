const playlistService = require("../services/playlist.service");

const createPlaylist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, isPrivate } = req.body;
    const playlist = await playlistService.createPlaylist(userId, name, isPrivate);
    res.status(201).json({ message: "Playlist created successfully.", playlist });
  } catch (error) {
    next(error);
  }
};

const getUserPlaylists = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const playlists = await playlistService.getUserPlaylists(userId);
    res.status(200).json({ message: "Playlists retrieved successfully.", playlists });
  } catch (error) {
    next(error);
  }
};

const addVideo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: playlistId } = req.params;
    const { videoId } = req.body;
    const item = await playlistService.addVideoToPlaylist(userId, playlistId, videoId);
    res.status(200).json({ message: "Video added to playlist successfully.", item });
  } catch (error) {
    next(error);
  }
};

const removeVideo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: playlistId, videoId } = req.params;
    await playlistService.removeVideoFromPlaylist(userId, playlistId, videoId);
    res.status(200).json({ message: "Video removed from playlist successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPlaylist, getUserPlaylists, addVideo, removeVideo };
