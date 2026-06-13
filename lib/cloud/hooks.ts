"use client";

import { useEffect, useState } from "react";
import { CLOUD_PULL_TICKS, TICK_MS } from "../constants";
import { useGameMode } from "../state/GameContext";
import {
  cloudConfigured,
  fetchFeed,
  fetchLeaderboard,
  type CloudFeedPost,
  type LeaderboardRow,
} from "./client";

const PULL_MS = CLOUD_PULL_TICKS * TICK_MS;

/** live global leaderboard (real mode only); empty in demo / when unconfigured */
export function useCloudLeaderboard(limit = 50): LeaderboardRow[] {
  const { mode } = useGameMode();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const active = mode === "real" && cloudConfigured();

  useEffect(() => {
    if (!active) return;
    let alive = true;
    const pull = async () => {
      const data = await fetchLeaderboard(limit);
      if (alive) setRows(data);
    };
    pull();
    const t = setInterval(pull, PULL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [active, limit]);

  return rows;
}

/** live shared feed (real mode only) */
export function useCloudFeed(limit = 60): { posts: CloudFeedPost[]; refresh: () => void } {
  const { mode } = useGameMode();
  const [posts, setPosts] = useState<CloudFeedPost[]>([]);
  const active = mode === "real" && cloudConfigured();

  const refresh = () => {
    if (!active) return;
    fetchFeed(limit).then(setPosts);
  };

  useEffect(() => {
    if (!active) return;
    let alive = true;
    const pull = async () => {
      const data = await fetchFeed(limit);
      if (alive) setPosts(data);
    };
    pull();
    const t = setInterval(pull, PULL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [active, limit]);

  return { posts, refresh };
}
