const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");

// 전체 게임 목록
router.get("/", gameController.listGames);

// 인기 TOP 10 게임 랭킹
router.get("/ranking", gameController.getGameRanking);

module.exports = router;
