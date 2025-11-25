const gameModel = require("../models/gameModel");

exports.listGames = async (req, res) => {
  try {
    const games = await gameModel.getAllGames();
    // [{ id, name, slug }, ...]
    res.json({ games });
  } catch (err) {
    console.error("listGames error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};
