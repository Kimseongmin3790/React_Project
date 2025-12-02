import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../../context/AuthContext";
import { fetchUserByUsername } from "../../api/userApi";

function splitText(text) {
  if (!text) return [];

  const regex = /(@[^\s@#]+|#[^\s@#]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }

    const token = match[0];
    if (token.startsWith("@")) {
      parts.push({
        type: "mention",
        value: token.slice(1),
        raw: token,
      });
    } else if (token.startsWith("#")) {
      parts.push({
        type: "hashtag",
        value: token.slice(1),
        raw: token,
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  return parts;
}

export default function CommentRichText({ text }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const parts = splitText(text);

  const handleClickMention = async (word) => {
    const username = word.trim().replace(/^@/, "");
    if (!username) return;

    try {
      const target = await fetchUserByUsername(username);

      if (!target || !target.id) {
        alert("해당 사용자를 찾을 수 없습니다.");
        return;
      }

      if (user && target.id === user.id) {
        navigate("/me");
      } else {
        navigate(`/users/${target.id}`);
      }
    } catch (err) {
      console.error("멘션 클릭 → 프로필 이동 실패:", err);
      alert("사용자 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  const handleClickHashtag = (word) => {
    navigate(`/search?query=${encodeURIComponent(`#${word}`)}`);
  };

  return (
    <>
      {parts.map((p, idx) => {
        if (p.type === "text") {
          return <span key={idx}>{p.value}</span>;
        }
        if (p.type === "mention") {
          return (
            <span
              key={idx}
              style={{
                color: theme.palette.primary.main,
                fontWeight: 500,
                cursor: "pointer",
              }}
              onClick={() => handleClickMention(p.value)}
            >
              {p.raw}
            </span>
          );
        }
        if (p.type === "hashtag") {
          return (
            <span
              key={idx}
              style={{
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.info.light
                    : theme.palette.info.main,
                cursor: "pointer",
              }}
              onClick={() => handleClickHashtag(p.value)}
            >
              {p.raw}
            </span>
          );
        }
        return null;
      })}
    </>
  );
}
