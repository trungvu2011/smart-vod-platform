const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../config/prisma");

/**
 * ADMIN tạo tài khoản nhân sự mới.
 */
const createUser = async ({ fullName, email, role }) => {
  if (!fullName || !email) {
    const err = new Error("Vui lòng cung cấp fullName và email!");
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email này đã được sử dụng!");
    err.statusCode = 409;
    throw err;
  }

  const defaultPassword = crypto.randomBytes(6).toString("hex"); 
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  const newUser = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash: hashedPassword,
      role: role || "USER", 
    },
  });

  return {
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt,
    },
    defaultPassword,
  };
};

/**
 * Lấy danh sách tất cả nhân sự.
 */
const listUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      department: true,
      avatarUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
};

/**
 * Cập nhật trạng thái người dùng
 */
const updateUserStatus = async (id, status) => {
  if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
    const err = new Error("Status không hợp lệ!");
    err.statusCode = 400;
    throw err;
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, status: true, email: true, fullName: true }
  });
  return updated;
};

/**
 * Cập nhật role người dùng
 */
const updateUserRole = async (id, role) => {
  if (!['USER', 'ADMIN'].includes(role)) {
    const err = new Error("Role không hợp lệ!");
    err.statusCode = 400;
    throw err;
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, role: true, email: true, fullName: true }
  });
  return updated;
};

/**
 * Lấy danh sách video đang chờ duyệt
 */
const getModerationQueue = async () => {
  const videos = await prisma.video.findMany({
    where: { status: { in: ['PENDING', 'PROCESSING'] } },
    include: {
      creator: { select: { fullName: true, email: true, avatarUrl: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return videos;
};

/**
 * Duyệt video
 */
const approveVideo = async (videoId) => {
  const updated = await prisma.video.update({
    where: { id: videoId },
    data: { status: 'READY' }
  });
  return updated;
};

/**
 * Từ chối video
 */
const rejectVideo = async (videoId, reason) => {
  // We can't save "reason" yet easily without a db schema change, so we just set status.
  const updated = await prisma.video.update({
    where: { id: videoId },
    data: { status: 'BANNED' }
  });
  return updated;
};

/**
 * Mock data backend telemetry metrics
 */
const getDashboardMetrics = async () => {
  const usersCount = await prisma.user.count();
  const activeCount = await prisma.user.count({ where: { status: 'ACTIVE' } });
  const pendingVideosCount = await prisma.video.count({ where: { status: 'PENDING' } });

  return {
    storageUsedTB: 74.2,
    storageTotalTB: 100,
    totalUsers: usersCount,
    activeUsers: activeCount,
    pendingApprovals: pendingVideosCount,
  };
};

/**
 * Mock data for deep analytics
 */
const getAnalyticsMetrics = async () => {
  return {
    transcodingJobs: [
      { id: '#HLS-8821', source: 'Q4_Townhall_Final.mp4', status: 'PROCESSING', progress: 68, bitrate: '12.4 Mbps' },
      { id: '#HLS-8820', source: 'Onboarding_Mod1.mov', status: 'COMPLETE', progress: 100, bitrate: '8.2 Mbps' },
      { id: '#HLS-8819', source: 'CEO_Keynote_Master.mxf', status: 'RETYRING', progress: 0, bitrate: '24.0 Mbps' },
    ],
    whisperHealth: {
      accuracy: 99.4,
      latencyMs: 14,
      languagesSupported: 42,
    }
  };
};

module.exports = {
  createUser,
  listUsers,
  updateUserStatus,
  updateUserRole,
  getModerationQueue,
  approveVideo,
  rejectVideo,
  getDashboardMetrics,
  getAnalyticsMetrics,
};
