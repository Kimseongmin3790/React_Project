const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

// GET /api/search?query=xxx&type=all|post|user|tag|game
router.get("/", searchController.search);

module.exports = router;