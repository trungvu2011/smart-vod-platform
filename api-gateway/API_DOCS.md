# Smart VOD API Documentation (Current State)

This document describes the APIs currently mounted and active in the `api-gateway` service.
Base URL (default): `http://localhost:5000`

## 1. Authentication Model

- Auth mechanism: JWT Bearer token.
- Header format for protected APIs:
  - `Authorization: Bearer <accessToken>`
- Token payload fields:
  - `id`
  - `email`
  - `role` (`USER` or `ADMIN`)
- Current auth routes only support:
  - Login
  - Change password
- There is no public register endpoint in current code.

## 2. Global Conventions

### 2.1 Content Types

- JSON APIs: `Content-Type: application/json`
- Upload API: `multipart/form-data`

### 2.2 Common Success Shape

Most APIs return:

```json
{
  "message": "...",
  "...": "data"
}
```

### 2.3 Common Error Codes

- `400` Bad request / validation error
- `401` Missing token or wrong credentials
- `403` Invalid token or insufficient role
- `404` Resource not found
- `409` Duplicate data (Prisma unique conflict)
- `500` Internal server error

### 2.4 Auth Middleware Behavior

- `verifyToken`
  - Missing token -> `401` with message: `Tu choi truy cap! Khong tim thay Token.`
  - Invalid/expired token -> `403` with message: `Token khong hop le hoac da het han!`
- `optionalAuth`
  - If token missing/invalid, request still continues with `req.user = null`.

## 3. Route Map (Mounted in Server)

- `/api/auth`
- `/api/admin`
- `/api/videos`
- `/api/users`

## 4. Detailed API Reference

## 4.1 Auth APIs

### POST /api/auth/login

Login with email/password.

Auth: Public

Request body:

```json
{
  "email": "admin@smartvod.local",
  "password": "Admin@123456"
}
```

Success response (`200`):

```json
{
  "message": "Dang nhap thanh cong!",
  "accessToken": "<jwt>",
  "user": {
    "id": "uuid",
    "fullName": "System Admin",
    "email": "admin@smartvod.local",
    "role": "ADMIN",
    "avatarUrl": null
  }
}
```

Common errors:

- `400`: Missing email/password
- `401`: Wrong email or password

### POST /api/auth/change-password

Change current user password.

Auth: Protected (`Bearer token`)

Request body:

```json
{
  "oldPassword": "Admin@123456",
  "newPassword": "NewStrongPass123"
}
```

Success response (`200`):

```json
{
  "message": "Doi mat khau thanh cong!"
}
```

Common errors:

- `400`: Missing old/new password or new password < 6 chars
- `401`: Old password mismatch
- `404`: User not found

## 4.2 Admin APIs

All admin APIs require:

- Valid JWT
- `role = ADMIN`

### POST /api/admin/users

Create a staff/user account by admin. System auto-generates a default password.

Auth: Protected + role `ADMIN`

Request body:

```json
{
  "fullName": "Creator Demo",
  "email": "creator.demo@smartvod.local",
  "role": "USER"
}
```

Notes:

- `role` is optional, defaults to `USER`.

Success response (`201`):

```json
{
  "message": "Tao tai khoan nhan su thanh cong!",
  "user": {
    "id": "uuid",
    "fullName": "Creator Demo",
    "email": "creator.demo@smartvod.local",
    "role": "USER",
    "createdAt": "2026-04-02T00:00:00.000Z"
  },
  "defaultPassword": "12-char-random-hex"
}
```

Common errors:

- `400`: Missing `fullName` or `email`
- `403`: Non-admin token
- `409`: Email already used

### GET /api/admin/users

List users (without password hash).

Auth: Protected + role `ADMIN`

Success response (`200`):

```json
{
  "message": "Lay danh sach nhan su thanh cong!",
  "users": [
    {
      "id": "uuid",
      "fullName": "System Admin",
      "email": "admin@smartvod.local",
      "role": "ADMIN",
      "avatarUrl": null,
      "createdAt": "2026-04-02T00:00:00.000Z"
    }
  ]
}
```

## 4.3 Video APIs

### GET /api/videos

List videos with pagination and optional status filter.

Auth: Public

Query params:

- `page` (optional, default `1`)
- `limit` (optional, default `12`)
- `status` (optional, e.g. `READY`, `PENDING`, `PROCESSING`)

Success response (`200`):

```json
{
  "message": "Lay danh sach video thanh cong!",
  "videos": [
    {
      "id": "uuid",
      "title": "Video 1",
      "description": "...",
      "status": "READY",
      "viewCount": 123,
      "createdAt": "2026-04-02T00:00:00.000Z",
      "creator": {
        "id": "uuid",
        "fullName": "Creator Demo",
        "avatarUrl": null
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "totalPages": 5
  }
}
```

### GET /api/videos/:id

Get video detail with metadata and counters. This endpoint also increments `viewCount` by 1.

Auth: Optional (works with or without token)

Success response (`200`):

```json
{
  "message": "Lay chi tiet video thanh cong!",
  "video": {
    "id": "uuid",
    "title": "Video 1",
    "description": "...",
    "status": "READY",
    "viewCount": 124,
    "creator": {
      "id": "uuid",
      "fullName": "Creator Demo",
      "avatarUrl": null
    },
    "metadata": {
      "metadata_id": "...",
      "video_id": "...",
      "hlsMasterUrl": "http://.../master.m3u8",
      "subtitleUrl": "http://.../sub.vtt",
      "aiSummary": "...",
      "duration": 180
    },
    "_count": {
      "likes": 10,
      "comments": 4
    }
  }
}
```

Common errors:

- `404`: Video not found

### POST /api/videos/upload

Upload a video file to MinIO and create DB record (`PENDING`). Pushes processing job to BullMQ.

Auth: Protected

Content-Type: `multipart/form-data`

Form fields:

- `videoFile` (required, file, mimetype must start with `video/`)
- `title` (required)
- `description` (optional)

Upload constraints:

- Max file size: 500 MB

Success response (`201`):

```json
{
  "message": "Tai video len thanh cong! Dang cho xu ly.",
  "video": {
    "id": "uuid",
    "creatorId": "uuid",
    "title": "Demo upload",
    "description": "...",
    "status": "PENDING",
    "viewCount": 0,
    "createdAt": "2026-04-02T00:00:00.000Z"
  }
}
```

Common errors:

- `400`: Missing file or title
- `400`: Invalid file type
- `400`: Multer upload errors
- `500`: MinIO/BullMQ/internal errors

### PUT /api/videos/:id

Update video title/description.

Auth: Protected
Permission: creator of the video OR admin.

Request body (all optional):

```json
{
  "title": "New title",
  "description": "New description"
}
```

Success response (`200`):

```json
{
  "message": "Cap nhat video thanh cong!",
  "video": {
    "id": "uuid",
    "title": "New title",
    "description": "New description"
  }
}
```

Common errors:

- `403`: No permission
- `404`: Video not found

### DELETE /api/videos/:id

Delete video and related data. Tries MinIO cleanup first, then removes DB record.

Auth: Protected
Permission: creator of the video OR admin.

Success response (`200`):

```json
{
  "message": "Xoa video va du lieu lien quan thanh cong!"
}
```

Common errors:

- `403`: No permission
- `404`: Video not found

## 4.4 Comment and Like APIs (under /api/videos)

### GET /api/videos/:id/comments

Get hierarchical comments tree for a video.

Auth: Public

Success response (`200`):

```json
{
  "message": "Lay binh luan thanh cong!",
  "comments": [
    {
      "id": "comment-1",
      "content": "Top-level comment",
      "parentId": null,
      "user": {
        "id": "uuid",
        "fullName": "Viewer A",
        "avatarUrl": null
      },
      "replies": [
        {
          "id": "comment-2",
          "content": "Reply",
          "parentId": "comment-1",
          "replies": []
        }
      ]
    }
  ]
}
```

### POST /api/videos/:id/comments

Add a comment (supports nested replies).

Auth: Protected

Request body:

```json
{
  "content": "Great video!",
  "parentId": null
}
```

- `parentId` optional. If provided, it must exist.

Success response (`201`):

```json
{
  "message": "Them binh luan thanh cong!",
  "comment": {
    "id": "uuid",
    "videoId": "uuid",
    "userId": "uuid",
    "content": "Great video!",
    "parentId": null,
    "user": {
      "id": "uuid",
      "fullName": "Viewer A",
      "avatarUrl": null
    }
  }
}
```

Common errors:

- `400`: Empty content
- `404`: Video not found / parent comment not found

### POST /api/videos/:id/like

Toggle like/unlike for current user.

Auth: Protected

Success response (`200`) when liked:

```json
{
  "message": "Da thich video!",
  "liked": true
}
```

Success response (`200`) when unliked:

```json
{
  "message": "Da bo thich video!",
  "liked": false
}
```

Common errors:

- `404`: Video not found

## 4.5 User APIs

### GET /api/users/history

Get current user watch history (latest first).

Auth: Protected

Success response (`200`):

```json
{
  "message": "Lay lich su xem thanh cong!",
  "history": [
    {
      "id": "history-uuid",
      "userId": "user-uuid",
      "videoId": "video-uuid",
      "watchedAt": "2026-04-02T00:00:00.000Z",
      "lastSecond": 95,
      "video": {
        "id": "video-uuid",
        "title": "Demo",
        "thumbnailUrl": null,
        "status": "READY",
        "viewCount": 123,
        "createdAt": "2026-04-02T00:00:00.000Z",
        "creator": {
          "id": "creator-uuid",
          "fullName": "Creator Demo",
          "avatarUrl": null
        }
      }
    }
  ]
}
```

### POST /api/users/history

Create/update watch progress for current user (`upsert`).

Auth: Protected

Request body:

```json
{
  "videoId": "video-uuid",
  "lastSecond": 120
}
```

Success response (`200`):

```json
{
  "message": "Cap nhat lich su xem thanh cong!",
  "history": {
    "id": "history-uuid",
    "userId": "user-uuid",
    "videoId": "video-uuid",
    "lastSecond": 120,
    "watchedAt": "2026-04-02T00:00:00.000Z"
  }
}
```

Common errors:

- `400`: Missing `videoId`
- `404`: Video not found

## 5. RBAC Summary

- `ADMIN` can:
  - Access all `/api/admin/*`
  - Update/delete any video
- `USER` can:
  - Access non-admin protected APIs
  - Update/delete only their own videos

## 6. Notes for QA / Frontend Integration

- There is no refresh-token cookie flow in current auth implementation.
- Upload relies on MinIO and BullMQ; ensure MinIO and Redis are running.
- Upload returns quickly with `PENDING`; video processing to `READY` is asynchronous via worker.
- `GET /api/videos/:id` increments view count on every call.

## 7. Quick cURL Examples

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartvod.local","password":"Admin@123456"}'
```

### Create user by admin

```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"fullName":"Creator Demo","email":"creator.demo@smartvod.local","role":"USER"}'
```

### Upload video

```bash
curl -X POST http://localhost:5000/api/videos/upload \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -F "title=Demo upload" \
  -F "description=Demo file" \
  -F "videoFile=@./sample.mp4"
```
