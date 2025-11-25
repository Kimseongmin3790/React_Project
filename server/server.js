const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const gameRouter = require('./routes/game');

const app = express();

app.use(cors({
  origin: '*',   // 개발 중이면 이렇게, 나중엔 프론트 주소로 바꾸는 게 안전
  credentials: true
}));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// router 영역
app.use('/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/api/games', gameRouter);

// ✅ http 서버로 감싸기
const server = http.createServer(app);

// ✅ socket.io 서버 생성 (HTTP 서버에 붙임)
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true,
  },
});

// ✅ 소켓 이벤트
io.on('connection', (socket) => {
  console.log('클라이언트 연결됨:', socket.id);

  // 예시: 클라이언트가 'chat message' 이벤트 보내면 브로드캐스트
  socket.on('chat message', (msg) => {
    console.log('메시지:', msg);
    // 같은 방 전체에 보내고 싶으면 socket.to(roomId).emit(...)
    io.emit('chat message', msg); // 일단은 전체에게
  });

  socket.on('disconnect', () => {
    console.log('클라이언트 연결 해제:', socket.id);
  });
});

// ✅ 이제는 app.listen이 아니라 server.listen 사용
server.listen(3020, () => {
  console.log('server start! on 3020');
});
