const crypto = require("crypto");
const {
  AccessToken,
  EncodedFileOutput,
  EncodedFileType,
  EncodingOptionsPreset,
  EgressStatus,
  S3Upload,
} = require("livekit-server-sdk");
const prisma = require("../config/prisma");
const { roomService, egressClient, apiKey, apiSecret, livekitHost } = require("../config/livekit");
const videoQueue = require("../config/queue");

const TERMINAL_EGRESS_STATUSES = new Set([
  EgressStatus.EGRESS_COMPLETE,
  EgressStatus.EGRESS_FAILED,
  EgressStatus.EGRESS_ABORTED,
  EgressStatus.EGRESS_LIMIT_REACHED,
]);

const getRecordingFilePath = (egressInfo) => {
  const fileResult = egressInfo?.fileResults?.[0];
  const rawPath = fileResult?.filename || fileResult?.location || egressInfo?.file?.filename;
  if (!rawPath) return null;

  const bucketName = process.env.MINIO_BUCKET_NAME || "videos";
  return rawPath
    .replace(/\\/g, "/")
    .replace(/^s3:\/\//, "")
    .replace(new RegExp(`^${bucketName}/`), "")
    .replace(/^\/+/, "");
};

const isTerminalEgress = (egressInfo) => TERMINAL_EGRESS_STATUSES.has(egressInfo?.status);

const publishNotification = async (userId, notification) => {
  try {
    const redisClient = require("../config/redis");
    await redisClient.publish("notification_channel", JSON.stringify({
      userId,
      eventName: "new_notification",
      payload: notification,
    }));
  } catch (e) {
    console.warn("[WEBHOOK] SSE publish error:", e.message);
  }
};

const finalizeRecordingFromEgress = async (egressInfo, roomHint = null) => {
  if (!egressInfo?.egressId) {
    return { acknowledged: true, error: "missing egress id" };
  }

  let room = roomHint;
  if (!room) {
    room = await prisma.room.findFirst({
      where: { egressId: egressInfo.egressId },
      include: {
        host: { select: { id: true, fullName: true } },
      },
    });
  }

  if (!room) {
    console.warn(`[LIVEKIT EGRESS] Khong tim thay room voi egressId: ${egressInfo.egressId}`);
    return { acknowledged: true, egressId: egressInfo.egressId };
  }

  const s3FilePath = getRecordingFilePath(egressInfo);
  if (!s3FilePath) {
    if (isTerminalEgress(egressInfo)) {
      await prisma.room.update({
        where: { id: room.id },
        data: {
          egressId: null,
          status: "ENDED",
          endedAt: room.endedAt || new Date(),
        },
      });
    }

    console.warn(`[LIVEKIT EGRESS] Egress ${egressInfo.egressId} chua co file result.`);
    return { acknowledged: true, egressId: egressInfo.egressId, error: "no file path" };
  }

  const existingRecording = await prisma.meetingRecording.findFirst({
    where: { roomId: room.id },
    include: { video: { select: { id: true } } },
  });

  if (existingRecording) {
    return {
      acknowledged: true,
      egressId: egressInfo.egressId,
      videoId: existingRecording.videoId,
      alreadyCreated: true,
    };
  }

  console.log(`[LIVEKIT EGRESS] Recording file: ${s3FilePath}`);

  const video = await prisma.video.create({
    data: {
      creatorId: room.hostId,
      title: `Ban ghi cuoc hop: ${room.displayName}`,
      description: `Ban ghi tu dong tu cuoc hop "${room.displayName}" vao ${new Date().toLocaleString("vi-VN")}`,
      category: "Meeting Recording",
      visibility: "ORG",
      status: "PENDING",
    },
  });

  await prisma.meetingRecording.create({
    data: {
      roomId: room.id,
      videoId: video.id,
      s3RawPath: s3FilePath,
    },
  });

  await videoQueue.add(
    "process-hls",
    {
      videoId: video.id,
      originalFilename: s3FilePath,
      isMeetingRecording: true,
      shouldGenerateThumbnail: true,
    },
    { jobId: video.id },
  );

  console.log(`[LIVEKIT EGRESS] Da tao Video ${video.id} va day job BullMQ cho recording.`);

  await prisma.room.update({
    where: { id: room.id },
    data: {
      egressId: null,
      status: "ENDED",
      endedAt: room.endedAt || new Date(),
    },
  });

  try {
    await roomService.deleteRoom(room.name);
  } catch (e) {
    console.warn("[LIVEKIT EGRESS] Loi xoa phong LiveKit (co the da tu xoa):", e.message);
  }

  const notification = await prisma.notification.create({
    data: {
      userId: room.hostId,
      type: "meeting",
      title: "Ban ghi cuoc hop dang duoc xu ly",
      message: `Ban ghi cuoc hop "${room.displayName}" dang duoc chuyen doi sang dinh dang phat truc tuyen.`,
      actionUrl: `/watch/${video.id}`,
    },
  });

  await publishNotification(room.hostId, notification);

  return { acknowledged: true, egressId: egressInfo.egressId, videoId: video.id };
};

const scheduleEgressFinalization = (egressId, delayMs = 5000, attemptsLeft = 6) => {
  if (!egressId || attemptsLeft <= 0) return;

  setTimeout(async () => {
    try {
      const egresses = await egressClient.listEgress({ egressId });
      const egressInfo = egresses?.[0];

      if (!egressInfo) {
        console.warn(`[LIVEKIT EGRESS] Khong tim thay egress ${egressId} khi fallback.`);
        return;
      }

      const result = await finalizeRecordingFromEgress(egressInfo);
      if (!result.videoId && !isTerminalEgress(egressInfo)) {
        scheduleEgressFinalization(egressId, delayMs, attemptsLeft - 1);
      }
    } catch (error) {
      console.warn(`[LIVEKIT EGRESS] Fallback finalize loi cho ${egressId}:`, error.message);
      scheduleEgressFinalization(egressId, delayMs, attemptsLeft - 1);
    }
  }, delayMs);
};

const resolveEgressTemplateUrl = () => {
  const fallbackUrl = "http://host.docker.internal:5173/egress-template";
  const configuredUrl =
    process.env.LIVEKIT_EGRESS_TEMPLATE_URL ||
    `${(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "")}/egress-template`;

  try {
    const parsedUrl = new URL(configuredUrl);
    if (["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname)) {
      parsedUrl.hostname = "host.docker.internal";
    }
    return parsedUrl.toString();
  } catch (error) {
    console.warn("[LIVEKIT EGRESS] LIVEKIT_EGRESS_TEMPLATE_URL khong hop le:", configuredUrl);
    return fallbackUrl;
  }
};

// =========================================
// HELPER: Generate LiveKit Access Token
// =========================================
const buildParticipantIdentity = (userId) => `${userId}:${crypto.randomUUID().slice(0, 8)}`;

const generateToken = async (userId, userName, roomName, isHost = false) => {
  const participantIdentity = buildParticipantIdentity(userId);
  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: userName,
    metadata: JSON.stringify({ userId }),
  });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    roomAdmin: isHost,
  });
  return await at.toJwt();
};

// =========================================
// Tạo phòng họp mới
// =========================================
const createRoom = async (userId, displayName, maxParticipants = 50) => {
  if (!displayName) {
    const err = new Error("Vui lòng nhập tên phòng họp!");
    err.statusCode = 400;
    throw err;
  }

  // Lấy thông tin user để hiển thị tên
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true },
  });

  // Tạo room name slug duy nhất
  const roomName = `meeting-${crypto.randomUUID().slice(0, 8)}`;

  // 1. Tạo phòng trên LiveKit Server
  try {
    await roomService.createRoom({
      name: roomName,
      maxParticipants: maxParticipants,
      emptyTimeout: 600, // Tự động đóng phòng sau 10 phút nếu trống
    });
  } catch (lkErr) {
    console.error("[LIVEKIT] Lỗi tạo phòng trên LiveKit:", lkErr.message);
    const err = new Error("Không thể tạo phòng họp. LiveKit Server có thể chưa khởi động.");
    err.statusCode = 503;
    throw err;
  }

  // 2. Lưu phòng vào Database
  const room = await prisma.room.create({
    data: {
      name: roomName,
      displayName: displayName,
      hostId: userId,
      maxParticipants: maxParticipants,
      status: "WAITING",
    },
    include: {
      host: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
  });

  // 3. Tạo Participant record cho host
  await prisma.participant.create({
    data: {
      roomId: room.id,
      userId: userId,
    },
  });

  // 4. Generate token cho host
  const token = await generateToken(userId, user.fullName, roomName, true);

  return {
    room,
    token,
    serverUrl: livekitHost.replace("http://", "ws://").replace("https://", "wss://"),
  };
};

// =========================================
// Tham gia phòng họp
// =========================================
const joinRoom = async (userId, roomName) => {
  // Tìm phòng theo name
  const room = await prisma.room.findUnique({
    where: { name: roomName },
  });

  if (!room) {
    const err = new Error("Phòng họp không tồn tại!");
    err.statusCode = 404;
    throw err;
  }

  if (room.status === "ENDED") {
    const err = new Error("Phòng họp đã kết thúc!");
    err.statusCode = 400;
    throw err;
  }

  // Lấy thông tin user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true },
  });

  // Upsert participant (để tránh duplicate nếu join lại)
  await prisma.participant.upsert({
    where: {
      roomId_userId: {
        roomId: room.id,
        userId: userId,
      },
    },
    update: {
      leftAt: null, // Reset leftAt nếu rejoin
    },
    create: {
      roomId: room.id,
      userId: userId,
    },
  });

  // Cập nhật room status sang ACTIVE nếu đang WAITING
  if (room.status === "WAITING") {
    await prisma.room.update({
      where: { id: room.id },
      data: {
        status: "ACTIVE",
        startedAt: new Date(),
      },
    });
  }

  // Generate token
  const isHost = room.hostId === userId;
  const token = await generateToken(userId, user.fullName, roomName, isHost);

  return {
    token,
    serverUrl: livekitHost.replace("http://", "ws://").replace("https://", "wss://"),
    room,
    isHost,
  };
};

// =========================================
// Bắt đầu ghi hình (Egress)
// =========================================
const startRecording = async (roomName, userId) => {
  const room = await prisma.room.findUnique({
    where: { name: roomName },
  });

  if (!room) {
    const err = new Error("Phòng họp không tồn tại!");
    err.statusCode = 404;
    throw err;
  }

  // Chỉ host mới được bắt đầu recording
  if (room.hostId !== userId) {
    const err = new Error("Chỉ host mới có quyền ghi hình!");
    err.statusCode = 403;
    throw err;
  }

  if (room.egressId) {
    const err = new Error("Đang ghi hình rồi!");
    err.statusCode = 400;
    throw err;
  }

  try {
    // Dùng EncodedFileOutput để ghi ra MP4 trên MinIO
    const output = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: `recordings/${roomName}/{time}.mp4`,
      output: {
        case: "s3",
        value: new S3Upload({
        accessKey: process.env.MINIO_ACCESS_KEY,
        secret: process.env.MINIO_SECRET_KEY,
        // Egress chạy trong Docker → phải dùng tên mạng Docker để truy cập MinIO
        endpoint: process.env.MINIO_EGRESS_ENDPOINT || "http://minio:9000",
        bucket: process.env.MINIO_BUCKET_NAME,
        forcePathStyle: true,
        }),
      },
    });

    // Layout "speaker": tự động ưu tiên màn hình share khi có,
    // và vẫn hiển thị participant khi không share.
    // Ghi lại toàn bộ giao diện phòng họp (bao gồm cả webcam + screen share).
    const egressTemplateUrl = resolveEgressTemplateUrl();
    const egressInfo = await egressClient.startRoomCompositeEgress(
      roomName,
      { file: output },
      {
        layout: "grid",
        customBaseUrl: egressTemplateUrl,
        encodingOptions: EncodingOptionsPreset.H264_1080P_30,
      },
    );

    // Lưu egressId vào DB để track
    await prisma.room.update({
      where: { id: room.id },
      data: { egressId: egressInfo.egressId },
    });

    return { egressId: egressInfo.egressId, status: "recording" };
  } catch (lkErr) {
    console.error("[LIVEKIT] Lỗi bắt đầu Egress:", lkErr.message);
    const err = new Error("Không thể bắt đầu ghi hình: " + lkErr.message);
    err.statusCode = 500;
    throw err;
  }
};

// =========================================
// Kết thúc phòng họp
// =========================================
const endRoom = async (roomName, userId) => {
  const room = await prisma.room.findUnique({
    where: { name: roomName },
  });

  if (!room) {
    const err = new Error("Phòng họp không tồn tại!");
    err.statusCode = 404;
    throw err;
  }

  if (room.hostId !== userId) {
    const err = new Error("Chỉ host mới có quyền kết thúc phòng!");
    err.statusCode = 403;
    throw err;
  }

  // Stop egress nếu đang recording
  if (room.egressId) {
    scheduleEgressFinalization(room.egressId);
    try {
      await egressClient.stopEgress(room.egressId);
      console.log(`[LIVEKIT] Đã gửi lệnh stop egress: ${room.egressId}. Chờ webhook egress_ended...`);
    } catch (e) {
      console.warn("[LIVEKIT] Lỗi stop egress (có thể đã kết thúc):", e.message);
    }

    // Kick tất cả participants ra khỏi phòng, nhưng GIỮ room sống cho egress finalize.
    // Egress cần room tồn tại để upload file MP4 lên MinIO.
    // Room sẽ được cleanup sau trong webhook handler (egress_ended).
    try {
      const participants = await roomService.listParticipants(roomName);
      await Promise.all(
        participants.map((p) =>
          roomService.removeParticipant(roomName, p.identity).catch((e) =>
            console.warn(`[LIVEKIT] Lỗi kick participant ${p.identity}:`, e.message)
          )
        )
      );
      console.log(`[LIVEKIT] Đã kick ${participants.length} participants khỏi phòng ${roomName}`);
    } catch (e) {
      console.warn("[LIVEKIT] Lỗi khi kick participants:", e.message);
    }
  } else {
    // Không có egress → xóa room (tự động kick tất cả)
    try {
      await roomService.deleteRoom(roomName);
    } catch (e) {
      console.warn("[LIVEKIT] Lỗi xóa phòng LiveKit:", e.message);
    }
  }

  // Cập nhật DB
  const updatedRoom = await prisma.room.update({
    where: { id: room.id },
    data: {
      status: "ENDED",
      endedAt: new Date(),
    },
  });

  return updatedRoom;
};

// =========================================
// Xử lý LiveKit Webhook (egress_ended)
// =========================================
const handleEgressWebhook = async (webhookEvent) => {
  const { event, egressInfo } = webhookEvent;

  console.log(`[LIVEKIT WEBHOOK] Nhận event: ${event}`);

  if (event !== "egress_ended") {
    return { acknowledged: true, event };
  }

  if (!egressInfo) {
    console.warn("[LIVEKIT WEBHOOK] Không có egressInfo trong event.");
    return { acknowledged: true, event };
  }

  // Tìm room bằng egressId
  return await finalizeRecordingFromEgress(egressInfo);
};

// =========================================
// Danh sach phong hop
// =========================================

const listRooms = async (userId, status = null, page = 1, limit = 12) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  }

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        host: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        _count: {
          select: { participants: true, recordings: true },
        },
      },
    }),
    prisma.room.count({ where }),
  ]);

  return {
    rooms,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// =========================================
// Chi tiết phòng họp
// =========================================
const getRoomDetails = async (roomName) => {
  const room = await prisma.room.findUnique({
    where: { name: roomName },
    include: {
      host: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
      participants: {
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      recordings: {
        include: {
          video: {
            select: { id: true, title: true, status: true, createdAt: true },
          },
        },
      },
      _count: {
        select: { participants: true, recordings: true },
      },
    },
  });

  if (!room) {
    const err = new Error("Phòng họp không tồn tại!");
    err.statusCode = 404;
    throw err;
  }

  return room;
};

module.exports = {
  createRoom,
  joinRoom,
  startRecording,
  endRoom,
  handleEgressWebhook,
  listRooms,
  getRoomDetails,
};
