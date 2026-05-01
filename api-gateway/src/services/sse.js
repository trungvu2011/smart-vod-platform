/**
 * SSE Connection Manager
 * Quản lý các kết nối Server-Sent Events cho notification real-time.
 * 
 * Tích hợp Redis Pub/Sub để nhận notification từ các process khác (ví dụ: video-worker).
 */

const IORedis = require("ioredis");

class SSEManager {
  constructor() {
    // Map<userId, Set<Response>>
    this.clients = new Map();
    this.setupRedisSubscriber();
  }

  setupRedisSubscriber() {
    if (process.env.REDIS_HOST) {
      const subscriber = new IORedis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      });

      subscriber.subscribe("notification_channel", (err, count) => {
        if (err) {
          console.error("[SSE] Failed to subscribe to notification_channel:", err);
        } else {
          console.log(`[SSE] Subscribed successfully to notification_channel. Listening for cross-process notifications.`);
        }
      });

      subscriber.on("message", (channel, message) => {
        if (channel === "notification_channel") {
          try {
            const data = JSON.parse(message);
            const { userId, eventName, payload } = data;
            if (userId && eventName) {
              this.sendToUser(userId, eventName, payload);
            }
          } catch (err) {
            console.error("[SSE] Error parsing pub/sub message:", err);
          }
        }
      });
    }
  }

  // Thêm kết nối mới
  addClient(userId, res) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(res);
    console.log(`[SSE] User ${userId} connected. Total active connections for user: ${this.clients.get(userId).size}`);

    // Gửi sự kiện 'connected' để client biết stream đã mở
    this._send(res, "connected", { message: "SSE connected successfully" });
  }

  // Xoá kết nối
  removeClient(userId, res) {
    if (this.clients.has(userId)) {
      const userClients = this.clients.get(userId);
      userClients.delete(res);
      console.log(`[SSE] User ${userId} connection removed. Remaining: ${userClients.size}`);
      
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  // Gửi sự kiện cho 1 user cụ thể (tới tất cả các tab đang mở của user đó)
  sendToUser(userId, eventName, data) {
    const userClients = this.clients.get(userId);
    if (userClients && userClients.size > 0) {
      for (const res of userClients) {
        this._send(res, eventName, data);
      }
      console.log(`[SSE] Broadcasted event '${eventName}' to User ${userId} (across ${userClients.size} connections)`);
    } else {
      console.log(`[SSE] User ${userId} is offline. Event '${eventName}' not sent (but should be saved in DB).`);
    }
  }

  // Gửi sự kiện cho toàn bộ users (ví dụ: Townhall stream start)
  broadcast(eventName, data) {
    let totalSent = 0;
    for (const [userId, userClients] of this.clients.entries()) {
      for (const res of userClients) {
        this._send(res, eventName, data);
        totalSent++;
      }
    }
    console.log(`[SSE] Broadcasted event '${eventName}' to ALL users (${totalSent} connections)`);
  }

  // Private helper
  _send(res, eventName, data) {
    try {
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error("[SSE] Failed to write to response stream:", err);
    }
  }

  getActiveConnectionCount() {
    let total = 0;
    for (const [, conns] of this.clients.entries()) {
      total += conns.size;
    }
    return total;
  }
}

// Export dưới dạng singleton pattern
const sseManager = new SSEManager();
module.exports = sseManager;
