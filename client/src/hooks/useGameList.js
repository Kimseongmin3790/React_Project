import { useEffect, useState } from "react";
import { fetchGameList } from "../api/postApi";

export function useGameList() {
  const [gameList, setGameList] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gameError, setGameError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadGames() {
      try {
        setLoadingGames(true);
        setGameError("");
        const games = await fetchGameList();
        if (!cancelled) {
          setGameList(Array.isArray(games) ? games : []);
        }
      } catch (err) {
        console.error("게임 목록 불러오기 실패:", err);
        if (!cancelled) {
          setGameError("게임 목록을 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) setLoadingGames(false);
      }
    }

    loadGames();

    return () => {
      cancelled = true;
    };
  }, []);

  return { gameList, loadingGames, gameError };
}
