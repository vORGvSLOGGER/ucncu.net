"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/PageTitle";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import {
  IHSAN_DONOR_MIN_LEVEL,
  IHSAN_RESCUER_MIN_LEVEL,
  POST_MAX_LEN,
} from "@/lib/constants";
import { useAuth } from "@/lib/auth/AuthContext";
import { cloudConfigured, postFeed } from "@/lib/cloud/client";
import { useCloudFeed } from "@/lib/cloud/hooks";
import { authorName } from "@/lib/engine/feed";
import { fmtCountdownLong, fmtInt, timeAgo } from "@/lib/format";
import { canDonate, canRescue } from "@/lib/perks";
import { BOTS, botById } from "@/lib/seed";
import { useGame, useGameDispatch, useGameMode } from "@/lib/state/GameContext";
import type { FeedKind, IhsanCase } from "@/lib/types";

const KIND_META: Record<FeedKind, { label: string; cls: string }> = {
  trade: { label: "صفقة", cls: "border-teal/40 bg-teal/10 text-teal" },
  commentary: { label: "تحليل", cls: "border-violet/40 bg-violet/10 text-violet" },
  milestone: { label: "إنجاز", cls: "border-gold/40 bg-gold/10 text-gold" },
  bankruptcy: { label: "إفلاس", cls: "border-down/40 bg-down/10 text-down" },
  ihsan: { label: "إحسان", cls: "border-up/40 bg-up/10 text-up" },
  user: { label: "منشور", cls: "border-edge bg-card text-muted" },
};

function avatarIdFor(game: ReturnType<typeof useGame>, authorId: string): number {
  if (authorId === "player") return game.player.avatarId;
  if (authorId === "system" || authorId === "admin") return 0;
  return botById(authorId).avatarId;
}

function Composer() {
  const dispatch = useGameDispatch();
  const [text, setText] = useState("");
  return (
    <Card className="mb-4 p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={POST_MAX_LEN}
        rows={2}
        placeholder="شارك المجتمع رأيك في السوق… 💭"
        className="w-full resize-none rounded-xl border border-edge bg-card2 px-3 py-2.5 text-xs text-ink outline-none focus:border-teal/50"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[9px] text-muted" dir="ltr">
          {text.length}/{POST_MAX_LEN}
        </span>
        <button
          disabled={!text.trim()}
          onClick={() => {
            dispatch({ type: "ADD_POST", text });
            setText("");
          }}
          className="btn-gold flex items-center gap-1.5 px-5 py-2 text-xs"
        >
          <Icon name="send" size={13} />
          انشر
        </button>
      </div>
    </Card>
  );
}

function FeedTab() {
  const game = useGame();
  const dispatch = useGameDispatch();
  return (
    <div>
      <Composer />
      <div className="space-y-2.5" data-tour="feed-list">
        {game.feed.length === 0 && (
          <Card className="p-8 text-center text-xs text-muted">
            الساحة هادئة… كن أول من ينشر!
          </Card>
        )}
        {game.feed.map((post) => {
          const meta = KIND_META[post.kind];
          const name = authorName(game, post.authorId);
          return (
            <Card key={post.id} className="card-hover p-3.5">
              <div className="flex items-start gap-2.5">
                <Avatar name={name} avatarId={avatarIdFor(game, post.authorId)} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b
                      className={`text-xs ${
                        post.authorId === "player" || post.authorId === "admin"
                          ? "text-gold"
                          : "text-ink"
                      }`}
                    >
                      {name}
                    </b>
                    {post.authorId === "admin" && (
                      <span className="rounded-full border border-gold/60 bg-gold/15 px-2 py-0.5 text-[8px] font-extrabold text-gold">
                        رسمي 🏛️
                      </span>
                    )}
                    <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <span className="ms-auto text-[9px] text-muted">{timeAgo(post.t)}</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-6 text-ink">{post.text}</p>
                  <button
                    onClick={() => dispatch({ type: "LIKE_POST", postId: post.id })}
                    className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                      post.likedByPlayer
                        ? "border-down/50 bg-down/10 text-down"
                        : "border-edge bg-card2 text-muted hover:text-down"
                    }`}
                  >
                    <Icon
                      name="heart"
                      size={12}
                      fill={post.likedByPlayer ? "currentColor" : "none"}
                    />
                    {post.likes > 0 ? fmtInt(post.likes) : "إعجاب"}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CaseCountdown({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-xs font-extrabold tabular-nums text-down" dir="ltr">
      {fmtCountdownLong(deadline - now)}
    </span>
  );
}

function IhsanCaseCard({ c }: { c: IhsanCase }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [amount, setAmount] = useState("");
  const isPlayerCase = c.subjectId === "player";
  const name = isPlayerCase ? game.player.name : botById(c.subjectId).name;
  const avatarId = isPlayerCase ? game.player.avatarId : botById(c.subjectId).avatarId;
  const remaining = Math.max(0, c.debt - c.donated);
  const pct = Math.min(100, (c.donated / c.debt) * 100);
  const open = c.status === "open";
  const donorOk = canDonate(game.player.level);
  const rescuerOk = canRescue(game.player.level);

  return (
    <Card
      className={`p-4 ${open ? (isPlayerCase ? "border-gold/50 glow-gold" : "border-down/30") : "opacity-75"}`}
    >
      <div className="flex items-center gap-3">
        <Avatar name={name} avatarId={avatarId} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-xs text-ink">
              {name}
              {isPlayerCase && " (أنت)"}
            </b>
            {c.status === "open" && (
              <span className="rounded-full border border-down/40 bg-down/10 px-2 py-0.5 text-[8px] font-bold text-down">
                حالة مفتوحة
              </span>
            )}
            {c.status === "rescued" && (
              <span className="rounded-full border border-up/40 bg-up/10 px-2 py-0.5 text-[8px] font-bold text-up">
                ✓ أُنقذ{c.rescuedBy ? ` — فزعة ${c.rescuedBy}` : ""}
              </span>
            )}
            {c.status === "failed" && (
              <span className="rounded-full border border-edge bg-card px-2 py-0.5 text-[8px] font-bold text-muted">
                💔 لم تكتمل الفزعة
              </span>
            )}
            <span className="ms-auto text-[9px] text-muted">{timeAgo(c.startedAt)}</span>
          </div>
          <div className="mt-1 text-[10px] text-muted">
            الدين: <b className="text-down">{fmtInt(c.debt)} UCN</b> · جُمع:{" "}
            <b className="text-up">{fmtInt(c.donated)} UCN</b>
            {open && (
              <>
                {" "}
                · المتبقي: <b className="text-ink">{fmtInt(remaining)} UCN</b>
              </>
            )}
          </div>
        </div>
        {open && <CaseCountdown deadline={c.deadline} />}
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-edge">
        <div
          className="h-full rounded-full bg-gradient-to-l from-up to-teal transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {c.donations.length > 0 && (
        <div className="mt-2.5 space-y-1">
          {c.donations.slice(0, 3).map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] text-muted">
              <Icon name="heart" size={10} className="text-up" />
              <span className="font-bold text-ink">
                {d.donorId === "player" ? game.player.name : botById(d.donorId).name}
              </span>
              تبرع بـ <b className="text-up">{fmtInt(d.amount)} UCN</b>
              <span className="ms-auto">{timeAgo(d.t)}</span>
            </div>
          ))}
        </div>
      )}

      {open && !isPlayerCase && (
        <div className="mt-3 border-t border-edge/50 pt-3">
          {donorOk ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="مبلغ التبرع"
                inputMode="numeric"
                className="w-28 rounded-xl border border-edge bg-card2 px-3 py-2 text-xs text-ink outline-none focus:border-up/50"
              />
              <button
                disabled={!amount || Number(amount) <= 0}
                onClick={() => {
                  dispatch({ type: "DONATE_IHSAN", caseId: c.id, amount: Number(amount) });
                  setAmount("");
                }}
                className="btn-teal px-4 py-2 text-xs"
              >
                تبرع 🤲 (+25 XP)
              </button>
              {rescuerOk ? (
                <button
                  onClick={() => dispatch({ type: "RESCUE_IHSAN", caseId: c.id })}
                  className="btn-gold ms-auto px-4 py-2 text-xs"
                >
                  فزعة كاملة 🦅 {fmtInt(remaining)} UCN
                </button>
              ) : (
                <span className="ms-auto flex items-center gap-1 text-[9px] text-muted">
                  <Icon name="lock" size={10} className="text-gold" />
                  الفزعة الكاملة عند المستوى {IHSAN_RESCUER_MIN_LEVEL}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-muted">
              <Icon name="lock" size={11} className="text-gold" />
              التبرع يُفتح عند المستوى {IHSAN_DONOR_MIN_LEVEL} — مستواك الحالي{" "}
              {game.player.level}
            </div>
          )}
        </div>
      )}
      {open && isPlayerCase && (
        <p className="mt-3 rounded-xl border border-gold/30 bg-gold/8 p-2.5 text-[10px] leading-5 text-gold">
          هذه حالتك — المجتمع يراها الآن. بِع أصولًا أو سدّد مبكرًا من البنك، وكل تبرع
          يصلك يُضاف لرصيدك مباشرة.
        </p>
      )}
    </Card>
  );
}

function IhsanTab() {
  const game = useGame();
  const open = game.ihsanCases.filter((c) => c.status === "open");
  const closed = game.ihsanCases.filter((c) => c.status !== "open");
  const donors = BOTS.filter((b) => (game.bots[b.id]?.level ?? 0) >= IHSAN_DONOR_MIN_LEVEL).length;

  return (
    <div className="space-y-3">
      <Card glow="teal" className="p-4">
        <SectionTitle
          icon="health"
          title="منصة الإحسان"
          sub="تكافل مجتمع UCNCU: من أفلس فزعنا له — التبرع من مستوى 25، والفزعة الكاملة من مستوى 50"
        />
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-edge bg-card2 p-2.5">
            <div className="text-lg font-extrabold text-down">{open.length}</div>
            <div className="text-[9px] text-muted">حالات مفتوحة</div>
          </div>
          <div className="rounded-xl border border-edge bg-card2 p-2.5">
            <div className="text-lg font-extrabold text-up">
              {game.ihsanCases.filter((c) => c.status === "rescued").length}
            </div>
            <div className="text-[9px] text-muted">حالات أُنقذت</div>
          </div>
          <div className="rounded-xl border border-edge bg-card2 p-2.5">
            <div className="text-lg font-extrabold text-teal">{donors}</div>
            <div className="text-[9px] text-muted">محسنون مؤهلون</div>
          </div>
        </div>
      </Card>

      {open.length === 0 && (
        <Card className="p-8 text-center text-xs text-muted">
          لا حالات إفلاس مفتوحة حاليًا — السوق بخير 🌿
        </Card>
      )}
      {open.map((c) => (
        <IhsanCaseCard key={c.id} c={c} />
      ))}

      {closed.length > 0 && (
        <>
          <SectionTitle icon="refresh" title="سجل الحالات السابقة" />
          {closed.map((c) => (
            <IhsanCaseCard key={c.id} c={c} />
          ))}
        </>
      )}
    </div>
  );
}

function GlobalFeedTab() {
  const auth = useAuth();
  const { posts, refresh } = useCloudFeed();
  const [text, setText] = useState("");

  const send = async () => {
    const body = text.trim().slice(0, POST_MAX_LEN);
    if (!body || !auth.userId) return;
    await postFeed({
      authorId: auth.userId,
      authorName: (auth.email ?? "لاعب").split("@")[0],
      kind: "user",
      text: body,
      isAdmin: auth.isAdmin,
    });
    setText("");
    refresh();
  };

  return (
    <div>
      <Card className="mb-4 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={POST_MAX_LEN}
          rows={2}
          placeholder="شارك اللاعبين الحقيقيين رأيك… 🌐"
          className="w-full resize-none rounded-xl border border-edge bg-card2 px-3 py-2.5 text-xs text-ink outline-none focus:border-teal/50"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[9px] text-muted" dir="ltr">{text.length}/{POST_MAX_LEN}</span>
          <button onClick={send} disabled={!text.trim()} className="btn-teal flex items-center gap-1.5 px-5 py-2 text-xs">
            <Icon name="send" size={13} />
            انشر عالميًا
          </button>
        </div>
      </Card>
      <div className="space-y-2.5">
        {posts.length === 0 && (
          <Card className="p-8 text-center text-xs text-muted">
            لا منشورات عالمية بعد — كن أول من يكتب في طور الحقيقة 🌐
          </Card>
        )}
        {posts.map((p) => (
          <Card key={p.id} className="card-hover p-3.5">
            <div className="flex items-start gap-2.5">
              <Avatar name={p.author_name} avatarId={0} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <b className={`text-xs ${p.is_admin ? "text-gold" : "text-ink"}`}>{p.author_name}</b>
                  {p.is_admin && (
                    <span className="rounded-full border border-gold/60 bg-gold/15 px-2 py-0.5 text-[8px] font-extrabold text-gold">
                      رسمي 🏛️
                    </span>
                  )}
                  <span className="ms-auto text-[9px] text-muted">{timeAgo(new Date(p.created_at).getTime())}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-6 text-ink">{p.text}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { mode } = useGameMode();
  const [tab, setTab] = useState("feed");
  const isReal = mode === "real" && cloudConfigured();

  // deep-link: /explore?tab=ihsan (from the bankruptcy banner)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("tab=ihsan")) {
      setTab("ihsan");
    }
  }, []);

  const tabs = [
    { id: "feed", label: "المنشورات 🌍" },
    ...(isReal ? [{ id: "global", label: "العالمي 🌐" }] : []),
    { id: "ihsan", label: "إحسان 🤲" },
  ];

  return (
    <div>
      <PageTitle
        icon="globe"
        title="إكسبلور"
        sub="نبض المجتمع: صفقات التجار، تحليلاتهم، إنجازاتك، وفزعات الإحسان"
      />
      <div data-tour="ihsan-tab">
        <TabSwitcher tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <div className="mt-4">
        {tab === "feed" ? <FeedTab /> : tab === "global" ? <GlobalFeedTab /> : <IhsanTab />}
      </div>
    </div>
  );
}
