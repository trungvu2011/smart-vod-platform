const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || '650fd919d420b77fa8bd79928e6233fb44f8ba8c184999b6f6bf824d6ac83bc0';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAuthToken() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found in DB");
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

let token = '';

async function fetchApi(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'API Error');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runTests() {
  console.log('====== STARTING MEETING API TESTS ======\n');
  try {
    token = await getAuthToken();
    console.log('Got token for user.');
  } catch (e) {
    console.error('Error getting token:', e.message);
    return;
  }
  let createdRoomName = null;

  try {
    // 1. Tạo phòng họp mới
    console.log('[TEST 1] Creating a new meeting room...');
    const createRes = await fetchApi('/meetings', {
      method: 'POST',
      body: JSON.stringify({
        displayName: 'Test Meeting Flow',
        maxParticipants: 10,
      }),
    });
    console.log('✅ Success:', createRes.message);
    createdRoomName = createRes.room.name;
    console.log('Room Name:', createdRoomName);
    console.log('LiveKit Token generated:', !!createRes.token);

    // 2. Tham gia phòng họp
    console.log('\n[TEST 2] Joining the meeting room...');
    const joinRes = await fetchApi(`/meetings/${createdRoomName}/join`, { method: 'POST' });
    console.log('✅ Success:', joinRes.message);
    console.log('LiveKit Token generated:', !!joinRes.token);
    console.log('Is Host?', joinRes.isHost);

    // 3. Lấy danh sách phòng
    console.log('\n[TEST 3] Fetching room list...');
    const listRes = await fetchApi('/meetings');
    console.log('✅ Success: Found', listRes.rooms.length, 'rooms');
    const room = listRes.rooms.find(r => r.name === createdRoomName);
    console.log('Created room exists in list:', !!room);

    // 4. Lấy chi tiết phòng
    console.log('\n[TEST 4] Fetching room details...');
    const detailRes = await fetchApi(`/meetings/${createdRoomName}`);
    console.log('✅ Success: Room details fetched');
    console.log('Participants Count:', detailRes.room._count.participants);

    // 5. Kết thúc phòng họp
    console.log('\n[TEST 5] Ending the room...');
    const endRes = await fetchApi(`/meetings/${createdRoomName}/end`, { method: 'POST' });
    console.log('✅ Success:', endRes.message);
    console.log('Final Status:', endRes.room.status);

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ TEST FAILED!');
    if (err.data) {
      console.error('Status:', err.status);
      console.error('Data:', err.data);
    } else {
      console.error(err.message);
    }
  }
}

runTests();
