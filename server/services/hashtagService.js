const db = require("../db");
const { extractHashtags } = require("../utils/hashtags");

async function syncPostHashtags(postId, caption) {
    const tagNames = extractHashtags(caption); // ["lol","리신"]

    if (!tagNames.length) {
        return;
    }

    // 1) tags 테이블에 없으면 INSERT (중복은 무시)
    const values = tagNames.map(() => "(?)").join(",");
    await db.query(
        `INSERT IGNORE INTO tags (name) VALUES ${values}`,
        tagNames
    );

    await db.query(
        `
        INSERT IGNORE INTO post_tags (post_id, tag_id)
        SELECT ?, t.id
        FROM tags t
        WHERE t.name IN (?)
        `,
        [postId, tagNames]
    );
}

module.exports = {
    syncPostHashtags,
};