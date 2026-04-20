const prisma = require("../config/prisma");

// ─── Existing ────────────────────────────────────────────────────────────────

const createPlaylist = async (userId, name, isPrivate = false) => {
  return await prisma.playlist.create({
    data: { userId, name, isPrivate },
    include: { _count: { select: { items: true } } },
  });
};

const getUserPlaylists = async (userId) => {
  return await prisma.playlist.findMany({
    where: { userId },
    include: {
      _count: { select: { items: true } },
      items: { select: { videoId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── NEW: GET /api/playlists/public ──────────────────────────────────────────
/**
 * Lấy tất cả playlist công khai (isPrivate = false) của mọi user.
 * Dùng cho trang Course Library.
 */
const listPublicPlaylists = async ({ page = 1, limit = 24, q = null } = {}) => {
  const skip = (page - 1) * limit;
  const where = {
    isPrivate: false,
    ...(q && {
      name: { contains: q, mode: "insensitive" },
    }),
  };

  const [playlists, total] = await Promise.all([
    prisma.playlist.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    }),
    prisma.playlist.count({ where }),
  ]);

  return {
    playlists,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const addVideoToPlaylist = async (userId, playlistId, videoId) => {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });

  if (!playlist || playlist.userId !== userId) {
    const err = new Error("Playlist not found or you don't have permission!");
    err.statusCode = 403;
    throw err;
  }

  const existingItem = await prisma.playlistItem.findFirst({
    where: { playlistId, videoId },
  });

  if (existingItem) return existingItem;

  const maxOrderResult = await prisma.playlistItem.aggregate({
    where: { playlistId },
    _max: { order: true },
  });
  const nextOrder = (maxOrderResult._max.order || 0) + 1;

  return await prisma.playlistItem.create({
    data: { playlistId, videoId, order: nextOrder },
  });
};

const removeVideoFromPlaylist = async (userId, playlistId, videoId) => {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });

  if (!playlist || playlist.userId !== userId) {
    const err = new Error("Playlist not found or you don't have permission!");
    err.statusCode = 403;
    throw err;
  }

  await prisma.playlistItem.delete({
    where: {
      playlistId_videoId: { playlistId, videoId },
    },
  });
};

// ─── NEW: GET /api/playlists/:id ─────────────────────────────────────────────
/**
 * Lấy chi tiết một playlist kèm toàn bộ video items.
 * Chỉ trả về nếu playlist thuộc về user hiện tại.
 */
const getPlaylistById = async (userId, playlistId) => {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          video: {
            include: {
              creator: { select: { id: true, fullName: true, avatarUrl: true } },
              metadata: { select: { duration: true, hlsMasterUrl: true, subtitleUrl: true } },
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
      },
      _count: { select: { items: true } },
      user: { select: { id: true, fullName: true, avatarUrl: true, title: true } },
    },
  });

  if (!playlist) {
    const err = new Error("Playlist not found!");
    err.statusCode = 404;
    throw err;
  }

  if (playlist.userId !== userId) {
    const err = new Error("You don't have permission to view this playlist!");
    err.statusCode = 403;
    throw err;
  }

  return playlist;
};

// ─── NEW: PUT /api/playlists/:id ─────────────────────────────────────────────
/**
 * Đổi tên hoặc cập nhật trạng thái private của playlist.
 */
const updatePlaylist = async (userId, playlistId, data) => {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });

  if (!playlist || playlist.userId !== userId) {
    const err = new Error("Playlist not found or you don't have permission!");
    err.statusCode = 403;
    throw err;
  }

  const { name, isPrivate } = data;

  if (name !== undefined && name.trim().length === 0) {
    const err = new Error("Playlist name cannot be empty!");
    err.statusCode = 400;
    throw err;
  }

  return await prisma.playlist.update({
    where: { id: playlistId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(isPrivate !== undefined && { isPrivate }),
    },
    include: { _count: { select: { items: true } } },
  });
};

// ─── NEW: DELETE /api/playlists/:id ─────────────────────────────────────────
/**
 * Xoá một playlist và toàn bộ items trong đó (cascade).
 */
const deletePlaylist = async (userId, playlistId) => {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });

  if (!playlist || playlist.userId !== userId) {
    const err = new Error("Playlist not found or you don't have permission!");
    err.statusCode = 403;
    throw err;
  }

  await prisma.playlist.delete({ where: { id: playlistId } });
};

module.exports = {
  createPlaylist,
  getUserPlaylists,
  listPublicPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
};
