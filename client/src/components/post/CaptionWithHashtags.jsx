// src/components/post/CaptionWithHashtags.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

function parseCaption(text, onClickTag) {
  if (!text) return [];

  const regex = /#[0-9A-Za-z가-힣_]+/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "tag", value: match[0].slice(1) }); // '#' 제거
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.map((p, idx) =>
    p.type === "text" ? (
      <span key={idx}>{p.value}</span>
    ) : (
      <span
        key={idx}
        style={{
          color: "#1976d2",
          cursor: "pointer",
          fontWeight: 500,
        }}
        onClick={() => onClickTag(p.value)}
      >
        #{p.value}
      </span>
    )
  );
}

export default function CaptionWithHashtags({ text }) {
  const navigate = useNavigate();

  const handleClickTag = (tag) => {
    navigate(`/tags/${encodeURIComponent(tag)}`);
  };

  return <>{parseCaption(text, handleClickTag)}</>;
}
