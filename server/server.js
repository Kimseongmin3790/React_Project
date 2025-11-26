const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config({
  path: path.join(__dirname, "../.env"),
});

const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const gameRouter = require('./routes/game');
const chatRouter = require('./routes/chat');
const notificationRouter = require('./routes/notification');

const initChatSocket = require('./socket/chatSocket');
const { setIo } = require('./socket/socketManager');

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
app.use('/api/notifications', notificationRouter);

// http 서버로 감싸기
const server = http.createServer(app);

// socket.io 서버 생성 (HTTP 서버에 붙임)
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true,
  },
});

setIo(io);

initChatSocket(io);

// ✅ 이제는 app.listen이 아니라 server.listen 사용
server.listen(3020, () => {
  console.log('server start! on 3020');
});
