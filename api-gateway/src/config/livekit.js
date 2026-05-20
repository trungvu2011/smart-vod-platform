const { RoomServiceClient, EgressClient } = require("livekit-server-sdk");
require("dotenv").config();

// Internal endpoint for server-to-server SDK traffic.
const livekitHost =
  process.env.LIVEKIT_INTERNAL_HOST ||
  process.env.LIVEKIT_HOST ||
  "http://localhost:7880";

// Public endpoint returned to frontend clients.
const livekitPublicUrl =
  process.env.LIVEKIT_PUBLIC_URL || process.env.LIVEKIT_HOST || livekitHost;

const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";

const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
const egressClient = new EgressClient(livekitHost, apiKey, apiSecret);

console.log(`[LIVEKIT] SDK initialized -> ${livekitHost}`);

module.exports = {
  roomService,
  egressClient,
  apiKey,
  apiSecret,
  livekitHost,
  livekitPublicUrl,
};
