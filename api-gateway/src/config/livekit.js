const { RoomServiceClient, EgressClient } = require("livekit-server-sdk");
require("dotenv").config();

// LiveKit Server connection config
const livekitHost = process.env.LIVEKIT_HOST || "http://localhost:7880";
const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";

// SDK Clients
const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
const egressClient = new EgressClient(livekitHost, apiKey, apiSecret);

console.log(`[LIVEKIT] SDK initialized → ${livekitHost}`);
// trigger restart

module.exports = { roomService, egressClient, apiKey, apiSecret, livekitHost };
