// server/services/notificationService.js
const notificationModel = require("../models/notificationModel");
const { getIo } = require("../socket/socketManager");

// 팔로우한 유저 새 글
async function notifyFollowersNewPost({ actor, postId, caption }) {
  const { followers } = await notificationModel.createForFollowers(
    actor.id,
    postId,
    caption
  );
  if (!followers.length) return;

  const io = getIo();

  followers.forEach((f) => {
    io.to(`user:${f.follower_id}`).emit("notify:new", {
      type: "FOLLOWED_USER_POST",
      postId,
      actorId: actor.id,
      actorName: actor.nickname || actor.username,
      message: caption ? caption.slice(0, 80) : "",
      createdAt: new Date().toISOString(),
    });
  });
}

// 채팅 메시지
async function notifyChatMessage({ sender, roomId, content, receiverIds }) {
  if (!receiverIds.length) return;

  await notificationModel.createForChatMessage(
    receiverIds,
    sender.id,
    roomId,
    content
  );

  const io = getIo();

  receiverIds.forEach((uid) => {
    io.to(`user:${uid}`).emit("notify:new", {
      type: "CHAT_MESSAGE",
      roomId,
      senderId: sender.id,
      senderName: sender.nickname || sender.username,
      message: content.slice(0, 80),
      createdAt: new Date().toISOString(),
    });
  });
}

module.exports = {
  notifyFollowersNewPost,
  notifyChatMessage,
};
