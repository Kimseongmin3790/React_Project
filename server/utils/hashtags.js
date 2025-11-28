function extractHashtags(text) {
  if (!text) return [];

  // #로 시작하고 한글/영문/숫자/_ 로 이어지는 것들
  const regex = /#[0-9A-Za-z가-힣_]+/g;
  const matches = text.match(regex) || [];

  const set = new Set(
    matches
      .map((tag) => tag.slice(1))       // '#' 제거
      .map((name) => name.toLowerCase())
  );

  return Array.from(set); // ["lol", "overwatch", "리그오브레전드"]
}

module.exports = {
  extractHashtags,
};