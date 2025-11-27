const tagModel = require("../models/tagModel");

exports.getPostsByTag = async (req, res) => {
  const { tagName } = req.params;
  try {
    const posts = await tagModel.findPostsByTagName(tagName);
    res.json(posts);
  } catch (err) {
    console.error("getPostsByTag error:", err);
    res.status(500).json({ error: "태그 게시글 조회 중 오류" });
  }
};

exports.getTrendingTags = async (req, res) => {
  try {
    const tags = await tagModel.findTrendingTags();
    res.json(tags);
  } catch (err) {
    console.error("getTrendingTags error:", err);
    res.status(500).json({ error: "트렌딩 태그 조회 중 오류" });
  }
};