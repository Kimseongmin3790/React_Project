const multer = require("multer");
const path = require("path");

// 저장 위치 & 파일 이름 설정
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads")); // server/uploads 폴더
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, base + "-" + unique + ext);
  },
});

// 이미지/영상만 허용
function fileFilter(req, file, cb) {
  const isImage = file.mimetype.startsWith("image/");
  const isVideo = file.mimetype.startsWith("video/");

  if (!isImage && !isVideo) {
    return cb(new Error("이미지/영상만 업로드 가능합니다."), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// ✅ 게시글용: 이미지 여러 장 + 영상 1개
const uploadPostMedia = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "videos", maxCount: 1 },
]);

module.exports = { uploadPostMedia };
