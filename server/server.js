const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config({
  path: path.join(__dirname, "../.env"),
});
const jwt = require("jsonwebtoken");
const chatModel = require("./models/chatModel");

const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const gameRouter = require('./routes/game');
const chatRouter = require('./routes/chat');

const onlineUsers = new Map();

const app = express();

app.use(cors({
  origin: '*',   // 개발 중이면 이렇게, 나중엔 프론트 주소로 바꾸는 게 안전
  credentials: true
}));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// router 영역
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/api/games', gameRouter);
app.use('/api/chat', chatRouter);

// ✅ http 서버로 감싸기
const server = http.createServer(app);

// ✅ socket.io 서버 생성 (HTTP 서버에 붙임)
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true,
  },
});

// ✅ 소켓 인증 미들웨어 (JWT 사용)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("AUTH_REQUIRED"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);    
    socket.user = {
      id: payload.id,
      username: payload.username,
      nickname: payload.nickname,
    };
    next();
  } catch (err) {
    console.error("Socket auth error:", err.message);
    next(new Error("AUTH_FAILED"));
  }
});

// ✅ 실시간 채팅 로직
io.on("connection", (socket) => {
  // console.log("socket connected:", socket.user?.username);
  const userId = socket.user.id;

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  socket.data.currentRoomId = null;

  // 1) 게임 채팅방 참여
  socket.on("chat:joinGame", async (gameId, callback) => {
    try {
      if (!gameId) return;

      const room = await chatModel.getOrCreateGameRoom(gameId);
      const roomKey = `room:${room.id}`;

      // 이전 방 나가기
      if (socket.data.currentRoomId) {
        socket.leave(`room:${socket.data.currentRoomId}`);
      }

      socket.join(roomKey);
      socket.data.currentRoomId = room.id;

      // 최근 메시지 가져와서 돌려주기
      const messages = await chatModel.getRecentMessages(room.id, 50);

      if (typeof callback === "function") {
        await chatModel.addUserToRoom(room.id, socket.user.id);
        await chatModel.upsertLastRead(room.id, socket.user.id, new Date());
        callback({
          ok: true,
          roomId: room.id,
          type: "GAME",
          gameId,
          messages,
        });
      } else {
        socket.emit("chat:history", {
          roomId: room.id,
          type: "GAME",
          gameId,
          messages,
        });
      }
    } catch (err) {
      console.error("chat:joinGame error:", err);
      if (typeof callback === "function") {
        callback({ ok: false, error: "JOIN_GAME_FAILED" });
      }
    }
  });

  // 2) DM 방 참여
  socket.on("chat:joinDm", async (otherUserId, callback) => {
    try {
      const myId = socket.user.id;
      if (!otherUserId || otherUserId === myId) return;

      const room = await chatModel.getOrCreateDmRoom(myId, otherUserId);
      const roomKey = `room:${room.id}`;

      if (socket.data.currentRoomId) {
        socket.leave(`room:${socket.data.currentRoomId}`);
      }

      socket.join(roomKey);
      socket.data.currentRoomId = room.id;

      const messages = await chatModel.getRecentMessages(room.id, 50);

      if (typeof callback === "function") {
        await chatModel.upsertLastRead(room.id, socket.user.id, new Date());
        callback({
          ok: true,
          roomId: room.id,
          type: "DM",
          otherUserId,
          messages,
        });
      } else {
        socket.emit("chat:history", {
          roomId: room.id,
          type: "DM",
          otherUserId,
          messages,
        });
      }
    } catch (err) {
      console.error("chat:joinDm error:", err);
      if (typeof callback === "function") {
        callback({ ok: false, error: "JOIN_DM_FAILED" });
      }
    }
  });

  // 3) 메시지 보내기 (게임/DM 공통)
  socket.on("chat:message", async (payload) => {
    try {
      const { roomId, text } = payload || {};
      if (!roomId || !text || !text.trim()) return;

      const msg = await chatModel.insertMessage({
        roomId,
        senderId: socket.user.id,
        content: text.trim(),
      });

      const roomKey = `room:${roomId}`;

      io.to(roomKey).emit("chat:message", msg);

      // 3) 보낸 사람은 last_read_at = 이 메시지 시간
      await chatModel.upsertLastRead(roomId, socket.user.id, new Date(msg.createdAt));

      // 4) 방 멤버 조회
      const members = await chatModel.getRoomMembers(roomId); // [{ userId }, ...]

      // 5) 다른 멤버에게 알림 이벤트 전송
      for (const member of members) {
        const memberId = member.userId;
        if (memberId === socket.user.id) continue; // 자기 자신 제외

        const socketsOfUser = onlineUsers.get(memberId);
        if (!socketsOfUser) continue; // 현재 접속 중이 아니면 패스

        for (const sid of socketsOfUser) {
          const memberSocket = io.sockets.sockets.get(sid);
          if (!memberSocket) continue;

          // 이미 그 방을 보고 있는 소켓이면 알림 필요 없음 (chat:message로 이미 보고 있음)
          if (memberSocket.data.currentRoomId === roomId) continue;

          memberSocket.emit("chat:notification", {
            roomId: msg.roomId,
            roomType: msg.roomType,       // 'GAME' or 'DM'
            gameId: msg.gameId,           // GAME일 때만 의미 있음
            dmUserId: msg.senderId,       // DM일 땐 상대방 = 메시지 보낸 사람
            senderId: msg.senderId,
            senderName: msg.nickname || msg.username,
            content: msg.content,
            createdAt: msg.createdAt,
          });
        }
      }
    } catch (err) {
      console.error("chat:message error:", err);
    }
  });

  socket.on('disconnect', () => {
    // console.log('클라이언트 연결 해제:', socket.id);
    const set = onlineUsers.get(userId);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) {
        onlineUsers.delete(userId);
      }
    }
  });

});

// ✅ 이제는 app.listen이 아니라 server.listen 사용
server.listen(3020, () => {
  console.log('server start! on 3020');
});
