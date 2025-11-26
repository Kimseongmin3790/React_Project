// server/socket/chatSocket.js
const jwt = require("jsonwebtoken");
const chatModel = require("../models/chatModel"); // 경로 주의! (../models)
const notificationService = require("../services/notificationService");

// 서버 메모리에 유지할 유저별 소켓 목록
const onlineUsers = new Map();

function initChatSocket(io) {
  // 소켓 인증 미들웨어 (JWT)
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

  // 실시간 채팅 로직
  io.on("connection", (socket) => {
    const userId = socket.user.id;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    socket.join(`user:${userId}`);

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

        // 최근 메시지 가져오기
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

        // 방에 있는 사람들한테 메시지 전송
        io.to(roomKey).emit("chat:message", msg);

        // 보낸 사람 last_read 업데이트
        await chatModel.upsertLastRead(
          roomId,
          socket.user.id,
          new Date(msg.createdAt)
        );

        // 방 멤버 조회
        const members = await chatModel.getRoomMembers(roomId); // [{ userId }, ...]
        const receiverIds = [];
        for (const m of members) {
            if (m.userId !== socket.user.id) receiverIds.push(m.userId);
        }

        await notificationService.notifyChatMessage({
            sender: socket.user,
            roomId,
            content: msg.content,
            receiverIds,
        });

        // 다른 멤버에게 채팅 알림 전송
        for (const member of members) {
          const memberId = member.userId;
          if (memberId === socket.user.id) continue;

          const socketsOfUser = onlineUsers.get(memberId);
          if (!socketsOfUser) continue;

          for (const sid of socketsOfUser) {
            const memberSocket = io.sockets.sockets.get(sid);
            if (!memberSocket) continue;

            // 이미 그 방 보고 있으면 알림 안 보냄
            if (memberSocket.data.currentRoomId === roomId) continue;

            memberSocket.emit("chat:notification", {
              roomId: msg.roomId,
              roomType: msg.roomType, // 'GAME' or 'DM'
              gameId: msg.gameId,
              dmUserId: msg.senderId,
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

    socket.on("disconnect", () => {
      const set = onlineUsers.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          onlineUsers.delete(userId);
        }
      }
    });
  });
}

module.exports = initChatSocket;
