const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");

// GET /api/games
router.get("/", gameController.listGames);

module.exports = router;
