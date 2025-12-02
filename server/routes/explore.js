const express = require("express");
const router = express.Router();
const exploreController = require("../controllers/exploreController");

router.get("/summary", exploreController.getExploreSummary);

module.exports = router;
