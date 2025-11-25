const express = require('express')
const bcrypt = require('bcrypt')
const router = express.Router()
const db = require("../db")
const authMiddleware = require("../middleware/auth");

router.post('/join', async (req, res) => {
    let { userId, pwd, userName } = req.body
    try {
        const hashPwd = await bcrypt.hash(pwd, 10);
        
        let sql = "INSERT INTO TBL_USER (USERID, PWD, USERNAME, CDATETIME, UDATETIME) VALUES(?, ?, ?, NOW(), NOW())";
        let result = await db.query(sql, [userId, hashPwd, userName]);

        res.json({
            result : result,
            msg : "가입 성공"
        });
    } catch (error) {
        console.log(error);
    }
})

router.post('/login', async (req, res) => {
    let { userId, pwd } = req.body
    
    try {            
        let sql = "SELECT * FROM TBL_USER WHERE USERID = ?";
        let [list] = await db.query(sql, [userId]);
        let result = "fail";
        let msg = "";
        if (list.length > 0) {
            // 아이디 존재
            const match = await bcrypt.compare(pwd, list[0].pwd); // 첫번째 값을 해시화 해서 비교
            if (match) {
                msg = list[0].userId + "님 환영합니다";
                result = "success";
            } else {
                msg = "비밀번호가 틀렸습니다"
            }
        } else {
            // 아이디 없음
            msg = "해당 아이디가 존재하지 않습니다."
        }

        res.json({
            result, // result : result
            msg
        });
    } catch (error) {
        console.log("에러 발생!");
    }
})

// GET /api/users/search?q=검색어
router.get("/search", authMiddleware, async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.json({ users: [] });
  }

  try {
    const like = `%${q}%`;
    const [rows] = await db.query(
      `
      SELECT
        id,
        username,
        nickname,
        avatar_url AS avatarUrl
      FROM users
      WHERE username LIKE ? OR nickname LIKE ?
      ORDER BY nickname IS NULL, nickname, username
      LIMIT 20
      `,
      [like, like]
    );

    res.json({ users: rows });
  } catch (err) {
    console.error("GET /api/users/search error:", err);
    res.status(500).json({ message: "사용자 검색 중 오류가 발생했습니다." });
  }
});

module.exports = router;