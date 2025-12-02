const chatModel = require("../models/chatModel");

exports.getRoomMeta = async (req, res, next) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    if (!roomId) {
      return res.status(400).json({ message: "잘못된 roomId입니다." });
    }

    const myId = req.user.id;

    const meta = await chatModel.getRoomMetaById(roomId, myId);
    if (!meta) {
      return res
        .status(404)
        .json({ message: "채팅방을 찾을 수 없습니다." });
    }

    return res.json(meta);
  } catch (error) {
    console.error("getRoomMeta error:", error);
    next(error);
  }
};