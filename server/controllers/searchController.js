const searchModel = require("../models/searchModel");

exports.search = async (req, res) => {
  const { query = "", type = "all" } = req.query;
  const q = query.trim();
  if (!q) {
    return res.json({ users: [], posts: [], tags: [], games: [] });
  }

  try {
    const result = {
      users: [],
      posts: [],
      tags: [],
      games: [],
    };

    if (type === "all" || type === "user") {
      result.users = await searchModel.searchUsers(q);
    }
    if (type === "all" || type === "post") {
      result.posts = await searchModel.searchPosts(q);
    }
    if (type === "all" || type === "tag") {
      result.tags = await searchModel.searchTags(q);
    }
    if (type === "all" || type === "game") {
      result.games = await searchModel.searchGames(q);
    }

    res.json(result);
  } catch (err) {
    console.error("search error:", err);
    res.status(500).json({ error: "검색 중 오류가 발생했습니다." });
  }
};