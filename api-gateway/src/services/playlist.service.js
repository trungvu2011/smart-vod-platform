const prisma = require("../config/prisma");

// Create playlist
const createPlaylist = async (userId, name, isPrivate = false) => {
  return await prisma.playlist.create({
    data: {
      userId,
      name,
      isPrivate
    }
  });
};

// Get user playlists with items
const getUserPlaylists = async (userId) => {
  return await prisma.playlist.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          video: true
        },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

// Add video to playlist
const addVideoToPlaylist = async (userId, playlistId, videoId) => {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  
  if (!playlist || playlist.userId !== userId) {
    const err = new Error("Playlist not found or you don't have permission!");
    err.statusCode = 403;
    throw err;
  }

  const existingItem = await prisma.playlistItem.findFirst({
    where: { playlistId, videoId }
  });

  if (existingItem) {
    return existingItem;
  }

  // Get max order
  const maxOrderResult = await prisma.playlistItem.aggregate({
    where: { playlistId },
    _max: { order: true }
  });
  const nextOrder = (maxOrderResult._max.order || 0) + 1;

  return await prisma.playlistItem.create({
    data: {
      playlistId,
      videoId,
      order: nextOrder
    }
  });
};

// Remove video from playlist
const removeVideoFromPlaylist = async (userId, playlistId, videoId) => {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  
  if (!playlist || playlist.userId !== userId) {
    const err = new Error("Playlist not found or you don't have permission!");
    err.statusCode = 403;
    throw err;
  }

  await prisma.playlistItem.delete({
    where: {
      playlistId_videoId: {
        playlistId,
        videoId
      }
    }
  });
};

module.exports = {
  createPlaylist,
  getUserPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist
};
