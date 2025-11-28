// server/scripts/syncGamesFromRawg.js
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, "../../.env"),
});
const axios = require("axios");
const mysql = require("mysql2/promise");

const RAWG_API_KEY = process.env.RAWG_API_KEY;
if (!RAWG_API_KEY) {
  console.error("❌ RAWG_API_KEY가 .env에 없습니다.");
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "reactsns",
};

const PAGE_SIZE = 20;   // RAWG max page_size 40
const MAX_PAGES = 2;   // 10페이지면 400개 게임

async function createPool() {
  return mysql.createPool(dbConfig);
}

async function fetchRawgGames(page) {
  const url = "https://api.rawg.io/api/games";

  const res = await axios.get(url, {
    params: {
      key: RAWG_API_KEY,
      search: "Overwatch",
      page,
      page_size: PAGE_SIZE,
      ordering: "-added", // 많이 추가된 순(인기 위주)
      search_precise: true,
      search_exact: true
    },
  });

  // RAWG 응답 구조: { results: [ ... ], next, previous ... }
  return res.data.results || [];
}

async function upsertGame(conn, rawGame) {
  const rawgId = rawGame.id;
  const name = rawGame.name;
  const slug = rawGame.slug;
  const thumbnailUrl = rawGame.background_image || null;

  if (!name || !slug) {
    return;
  }

  const sql = `
    INSERT INTO games (name, slug, thumbnail_url, external_source, external_game_id)
    VALUES (?, ?, ?, 'rawg', ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      thumbnail_url = VALUES(thumbnail_url),
      external_source = 'rawg',
      external_game_id = VALUES(external_game_id)
  `;

  await conn.execute(sql, [name, slug, thumbnailUrl, rawgId]);
}

async function main() {
  const pool = await createPool();

  try {
    console.log("🚀 RAWG → games 테이블 동기화 시작");

    for (let page = 1; page <= MAX_PAGES; page++) {
      console.log(`\n📄 Page ${page} 로딩 중...`);
      const list = await fetchRawgGames(page);

      if (!list.length) {
        console.log("더 이상 가져올 게임이 없습니다. 중단.");
        break;
      }

      for (const g of list) {
        try {
          await upsertGame(pool, g);
          console.log(`  ✅ ${g.name} (${g.slug}) 저장 완료`);
        } catch (err) {
          console.error(`  ❌ ${g.name} upsert 중 오류:`, err.message);
        }
      }

      // 너무 빠른 연속 호출 방지 (rate limit 여유 있게)
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\n✅ 동기화 완료!");
  } catch (err) {
    console.error("❌ 전체 동기화 중 오류:", err);
  } finally {
    await pool.end();
  }
}

main();
