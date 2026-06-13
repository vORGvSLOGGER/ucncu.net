"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { PageTitle } from "@/components/ui/PageTitle";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Sparkline } from "@/components/ui/Sparkline";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { useAuth } from "@/lib/auth/AuthContext";
import { cloudConfigured } from "@/lib/cloud/client";
import { useCloudLeaderboard } from "@/lib/cloud/hooks";
import {
  CRYPTO_CODES,
  CRYPTO_META,
  FIAT_CODES,
  FIAT_META,
  rankForLevel,
  UPDATE_VERSION,
} from "@/lib/constants";
import { fmtXp, xpSummary } from "@/lib/engine/xp";
import { fmtClock, fmtCompact, fmtDec, fmtSigned } from "@/lib/format";
import { activeFrame, nextPerk, PERKS } from "@/lib/perks";
import { ACHIEVEMENTS, BOTS, seed } from "@/lib/seed";
import { breakdown, cryptoUcn, netWorth } from "@/lib/selectors";
import { clearState } from "@/lib/state/persistence";
import { useGame, useGameDispatch, useGameMode } from "@/lib/state/GameContext";
import type { TxType } from "@/lib/types";

const TX_FILTERS: { id: string; label: string; types: TxType[] }[] = [
  { id: "all", label: "الكل", types: [] },
  { id: "market", label: "السوق", types: ["buy", "sell"] },
  { id: "trade", label: "التداول", types: ["trade-open", "trade-close"] },
  { id: "fx", label: "العملات", types: ["fx", "crypto-buy", "crypto-sell"] },
  { id: "estate", label: "العقارات", types: ["property-buy", "property-sell", "rent"] },
  { id: "bank", label: "البنك", types: ["loan", "installment", "lend", "lend-return", "debt-payment"] },
  { id: "company", label: "الشركات", types: ["company", "shares-sale", "dividend", "upgrade", "partner-capital"] },
  { id: "auction", label: "المزاد", types: ["auction-bid", "auction-win", "auction-refund", "auction-sale"] },
  { id: "social", label: "اجتماعي", types: ["donation-in", "donation-out", "direct-sale", "daily-bonus", "reward"] },
];

function FeedbackCard() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const existing = game.feedback[UPDATE_VERSION];
  const [stars, setStars] = useState(existing?.stars ?? 0);
  const [text, setText] = useState(existing?.text ?? "");

  return (
    <Card glow="teal" className="p-4">
      <SectionTitle
        icon="star"
        title={`قيّم التحديث ${UPDATE_VERSION} ✨`}
        sub="التطوير هنا يقوده المجتمع — رأيك يحدد ما نبنيه بعد ذلك"
      />
      <div className="mb-3 flex items-center justify-center gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setStars(n)} aria-label={`${n} نجوم`}>
            <Icon
              name="star"
              size={28}
              className={n <= stars ? "text-gold" : "text-edge"}
              fill={n <= stars ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="ملاحظة اختيارية: ما الذي أعجبك؟ ما الذي نطوره بعد ذلك؟"
        className="w-full resize-none rounded-xl border border-edge bg-card2 px-3 py-2.5 text-xs text-ink outline-none focus:border-teal/50"
      />
      <button
        disabled={stars === 0}
        onClick={() => dispatch({ type: "SUBMIT_FEEDBACK", stars, text })}
        className="btn-teal mt-2 w-full py-2.5 text-sm"
      >
        {existing ? "تحديث التقييم" : "إرسال التقييم (+20 XP)"}
      </button>
      {existing && (
        <p className="mt-2 text-center text-[10px] text-up">
          ✓ شكرًا لتقييمك — يمكنك تعديله في أي وقت
        </p>
      )}
    </Card>
  );
}

function GlobalLeaderboard() {
  const { mode } = useGameMode();
  const rows = useCloudLeaderboard(50);
  if (mode !== "real" || !cloudConfigured()) return null;

  return (
    <div className="mt-4">
      <SectionTitle icon="globe" title="المتصدرون العالميون 🌐" sub="لاعبون حقيقيون في طور الحقيقة" />
      <Card className="max-h-96 space-y-1.5 overflow-y-auto p-3">
        {rows.length === 0 && (
          <div className="p-6 text-center text-xs text-muted">جارٍ تحميل المتصدرين العالميين…</div>
        )}
        {rows.map((r, i) => (
          <div
            key={r.user_id}
            className="flex items-center gap-2.5 rounded-xl border border-edge bg-card2 px-2.5 py-2 text-xs"
          >
            <span className={`w-5 text-center font-extrabold ${i === 0 ? "text-gold" : i < 3 ? "text-teal" : "text-muted"}`}>
              {i + 1}
            </span>
            <Avatar name={r.name} avatarId={i} size={26} />
            <span className="min-w-0 flex-1 truncate font-bold text-ink">{r.name}</span>
            <span className="text-[9px] text-muted">م{r.level}</span>
            <b className="text-gold">{fmtCompact(r.net_worth)}</b>
          </div>
        ))}
      </Card>
    </div>
  );
}

function PerksLadder() {
  const game = useGame();
  const [showAll, setShowAll] = useState(false);
  const upcoming = nextPerk(game.player.level);
  const list = showAll
    ? PERKS
    : PERKS.filter(
        (p) =>
          p.milestone ||
          Math.abs(p.level - game.player.level) <= 3 ||
          p.level === upcoming?.level
      );

  return (
    <div className="mt-4" data-tour="perks-ladder">
      <SectionTitle
        icon="bolt"
        title="سلم الميزات"
        sub="كل مستوى يفتح ميزة — هذه خريطة طريقك إلى القمة"
      />
      <Card className="max-h-105 space-y-1 overflow-y-auto p-2">
        {list.map((p) => {
          const unlocked = game.player.level >= p.level;
          const isNext = p.level === upcoming?.level;
          return (
            <div
              key={p.level}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                isNext
                  ? "border-gold/60 bg-gold/10 glow-gold"
                  : unlocked
                    ? "border-up/25 bg-up/5"
                    : "border-edge bg-card2 opacity-70"
              } ${p.milestone ? "py-3" : ""}`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[10px] font-extrabold ${
                  unlocked ? "border-up/50 bg-up/10 text-up" : "border-edge bg-card text-muted"
                }`}
              >
                {p.level}
              </span>
              <Icon
                name={unlocked ? p.icon : "lock"}
                size={p.milestone ? 20 : 16}
                className={unlocked ? "text-gold" : "text-muted"}
              />
              <div className="min-w-0 flex-1">
                <div className={`text-[11px] font-bold ${p.milestone ? "text-gold" : "text-ink"}`}>
                  {p.name}
                  {isNext && <span className="ms-2 text-[9px] text-gold">← القادمة</span>}
                </div>
                <div className="truncate text-[9px] text-muted">{p.desc}</div>
              </div>
              {unlocked && <Icon name="check" size={14} className="shrink-0 text-up" />}
            </div>
          );
        })}
        <button
          onClick={() => setShowAll((v) => !v)}
          className="btn-ghost w-full py-2 text-[11px]"
        >
          {showAll ? "عرض المعالم القريبة فقط" : "عرض كل المستويات (100)"}
        </button>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const { mode, switchMode } = useGameMode();
  const { status: authStatus, email, signOut, isAdmin } = useAuth();
  const [nameModal, setNameModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [nameInput, setNameInput] = useState(game.player.name);
  const [txFilter, setTxFilter] = useState("all");

  const xp = xpSummary(game);
  const b = breakdown(game);
  const worth = netWorth(game);
  const frame = activeFrame(game.player.level);

  const board = [
    ...BOTS.map((bot) => {
      const live = game.bots[bot.id];
      return {
        name: bot.name,
        avatarId: bot.avatarId,
        worth: live?.netWorth ?? bot.netWorth,
        level: live?.level,
        history: live?.history,
        bankrupt: live?.bankrupt ?? false,
        me: false,
      };
    }),
    {
      name: game.player.name,
      avatarId: game.player.avatarId,
      worth,
      level: game.player.level,
      history: game.netWorthHistory.slice(-24),
      bankrupt: false,
      me: true,
    },
  ].sort((a, z) => z.worth - a.worth);

  const filterDef = TX_FILTERS.find((f) => f.id === txFilter)!;
  const txs = game.transactions
    .filter((t) => filterDef.types.length === 0 || filterDef.types.includes(t.type))
    .slice(0, 25);

  return (
    <div>
      <PageTitle icon="user" title="البروفايل" sub="هويتك الاستثمارية: محفظتك، إنجازاتك، وترتيبك" />

      {/* identity card */}
      <Card glow="gold" className="p-5">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-4">
            <Avatar
              name={game.player.name}
              avatarId={game.player.avatarId}
              size={72}
              ring
              ringColor={frame}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-ink">{game.player.name}</h2>
                <button
                  onClick={() => {
                    setNameInput(game.player.name);
                    setNameModal(true);
                  }}
                  className="text-muted transition hover:text-gold"
                  aria-label="تعديل الاسم"
                >
                  <Icon name="settings" size={15} />
                </button>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-gold">
                <Icon name="crown" size={13} />
                {rankForLevel(game.player.level)}
              </div>
              <div className="mt-1 text-[10px] text-muted">
                انضم {fmtClock(game.player.joinedAt)} — تقييم ائتماني{" "}
                <b className="text-ink">{game.player.creditScore}</b>
              </div>
            </div>
          </div>

          <div className="ms-auto flex items-center gap-5">
            <div className="text-center">
              <ProgressRing pct={xp.pct} size={72} color="var(--color-gold)">
                <div>
                  <div className="text-[9px] text-muted">المستوى</div>
                  <div className="text-base font-extrabold text-gold">{game.player.level}</div>
                </div>
              </ProgressRing>
              <div className="mt-1 text-[9px] text-muted" dir="ltr">
                {fmtXp(game)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted">صافي الثروة</div>
              <div className="text-2xl font-extrabold text-gold-grad">{fmtCompact(worth)}</div>
              <div className="text-[10px] text-muted">UCN</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* wallet */}
        <Card className="p-4 lg:col-span-2">
          <SectionTitle icon="wallet" title="محفظتي" sub="كل أرصدتك وأصولك في مكان واحد" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FIAT_CODES.map((c) => (
              <div key={c} className="rounded-xl border border-edge bg-card2 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-muted">
                  <span>{FIAT_META[c].flag}</span>
                  {FIAT_META[c].name}
                </div>
                <div className="mt-1 text-sm font-extrabold text-ink">
                  {fmtDec(game.balances[c])} <span className="text-[9px] text-muted">{c}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CRYPTO_CODES.map((c) => {
              const h = game.cryptoHoldings[c];
              return (
                <div key={c} className="rounded-xl border border-edge bg-card2 p-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted">
                    <span
                      className="grid h-4 w-4 place-items-center rounded-full text-[8px] font-extrabold text-bg"
                      style={{ background: CRYPTO_META[c].color }}
                    >
                      {c.slice(0, 1)}
                    </span>
                    {c}
                  </div>
                  <div className="mt-1 text-xs font-extrabold text-ink" dir="ltr">
                    {h.qty.toFixed(c === "BTC" || c === "ETH" ? 4 : 2)}
                  </div>
                  <div className="text-[9px] text-muted">≈ {fmtCompact(h.qty * cryptoUcn(game, c))} UCN</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
            {[
              { label: "أصول السوق", value: b.inventory, icon: "cart" },
              { label: "العقارات", value: b.properties, icon: "building" },
              { label: "حصص الشركات", value: b.companies, icon: "briefcase" },
              { label: "صفقات مفتوحة", value: b.trading, icon: "chart" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2 rounded-xl border border-edge bg-card2 p-2.5">
                <Icon name={row.icon} size={15} className="text-teal" />
                <div>
                  <div className="text-[10px] text-muted">{row.label}</div>
                  <b className="text-ink">{fmtCompact(row.value)} UCN</b>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* leaderboard — live bot wealth */}
        <Card className="p-4">
          <SectionTitle icon="trophy" title="لوحة المتصدرين" sub="ثروات حية تتحرك مع تداولاتهم" />
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {board.map((p, i) => (
              <div
                key={p.name}
                className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-xs ${
                  p.me ? "border-gold/50 bg-gold/10" : "border-edge bg-card2"
                }`}
              >
                <span
                  className={`w-5 text-center font-extrabold ${
                    i === 0 ? "text-gold" : i < 3 ? "text-teal" : "text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="relative">
                  <Avatar name={p.name} avatarId={p.avatarId} size={26} />
                  {p.level !== undefined && (
                    <span className="absolute -bottom-1 -right-1 grid h-3.5 min-w-3.5 place-items-center rounded-full border border-edge bg-bg px-0.5 text-[7px] font-extrabold text-teal">
                      {p.level}
                    </span>
                  )}
                </div>
                <span className={`min-w-0 flex-1 truncate font-bold ${p.me ? "text-gold" : "text-ink"}`}>
                  {p.name}
                  {p.me && " (أنت)"}
                  {p.bankrupt && <span className="ms-1 text-[9px] text-down">💥 مفلس</span>}
                </span>
                {p.history && p.history.length > 2 && (
                  <Sparkline
                    data={p.history}
                    width={48}
                    height={16}
                    color={
                      p.history[p.history.length - 1] >= p.history[0]
                        ? "var(--color-up)"
                        : "var(--color-down)"
                    }
                  />
                )}
                <b className="text-muted">{fmtCompact(p.worth)}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <GlobalLeaderboard />

      <PerksLadder />

      <div className="mt-4">
        <FeedbackCard />
      </div>

      {/* achievements */}
      <div className="mt-4">
        <SectionTitle
          icon="star"
          title="الإنجازات"
          sub={`${game.achievements.length} من ${ACHIEVEMENTS.length} إنجازًا`}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = game.achievements.some((x) => x.id === a.id);
            return (
              <Card
                key={a.id}
                className={`p-3 text-center ${unlocked ? "glow-gold border-gold/40" : "opacity-50"}`}
              >
                <span
                  className={`mx-auto grid h-10 w-10 place-items-center rounded-full border ${
                    unlocked ? "border-gold/50 bg-gold/10 text-gold" : "border-edge bg-card text-muted"
                  }`}
                >
                  <Icon name={unlocked ? a.icon : "lock"} size={18} />
                </span>
                <div className={`mt-2 text-[11px] font-bold ${unlocked ? "text-gold" : "text-ink"}`}>
                  {a.name}
                </div>
                <div className="mt-0.5 text-[9px] leading-3.5 text-muted">{a.desc}</div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* financial log */}
      <div className="mt-4">
        <SectionTitle icon="refresh" title="السجل المالي" sub="كل عملياتك مصنفة حسب النوع" />
        <TabSwitcher
          size="sm"
          tabs={TX_FILTERS.map((f) => ({ id: f.id, label: f.label }))}
          active={txFilter}
          onChange={setTxFilter}
        />
        <Card className="mt-3 divide-y divide-edge/50 p-1">
          {txs.length === 0 && (
            <div className="p-6 text-center text-xs text-muted">لا توجد عمليات في هذا التصنيف</div>
          )}
          {txs.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-3 py-2 text-xs">
              <div>
                <div className="font-bold text-ink">{tx.label}</div>
                <div className="text-[10px] text-muted">{fmtClock(tx.t)}</div>
              </div>
              <b className={tx.amount >= 0 ? "text-up" : "text-down"} dir="ltr">
                {fmtSigned(tx.amount, Math.abs(tx.amount) < 100 ? 2 : 0)} {tx.currency}
              </b>
            </div>
          ))}
        </Card>
      </div>

      {/* settings */}
      <div className="mt-4">
        <SectionTitle icon="settings" title="الإعدادات" />
        <Card className="divide-y divide-edge/50 p-1">
          <div className="flex items-center justify-between p-3.5">
            <div>
              <div className="text-xs font-bold text-ink">وضع الاستكشاف</div>
              <p className="mt-0.5 text-[10px] leading-4 text-muted">
                عند تفعيله تكون كل الأقسام متاحة للمعاينة حتى قبل بلوغ مستواها — عطّله لتجربة نظام
                فتح المزايا بالمستويات الحقيقي
              </p>
            </div>
            <button
              onClick={() => dispatch({ type: "TOGGLE_EXPLORE" })}
              className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
                game.settings.exploreMode ? "border-gold/60 bg-gold/30" : "border-edge bg-card2"
              }`}
              aria-label="وضع الاستكشاف"
            >
              <span
                className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${
                  game.settings.exploreMode ? "right-0.5 bg-gold" : "right-5.5 bg-muted"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-3.5">
            <div>
              <div className="text-xs font-bold text-ink">طور اللعب</div>
              <p className="mt-0.5 text-[10px] leading-4 text-muted">
                أنت الآن في {mode === "real" ? "طور الحقيقة" : "الطور التجريبي"} — لكل طور
                اقتصاد وتخزين منفصل تمامًا
              </p>
            </div>
            <button onClick={switchMode} className="btn-ghost px-4 py-1.5 text-xs">
              تغيير الطور
            </button>
          </div>
          <div className="flex items-center justify-between p-3.5">
            <div>
              <div className="text-xs font-bold text-ink">الجولة التعليمية</div>
              <p className="mt-0.5 text-[10px] leading-4 text-muted">
                أعد جولة الشرح التفاعلية في أي وقت (مكافآت XP لا تُصرف مرتين)
              </p>
            </div>
            <button
              onClick={() => dispatch({ type: "TUTORIAL_START" })}
              className="btn-ghost px-4 py-1.5 text-xs"
            >
              إعادة الجولة 🎓
            </button>
          </div>
          {authStatus === "authed" && (
            <div className="flex items-center justify-between p-3.5">
              <div>
                <div className="text-xs font-bold text-ink">الحساب</div>
                <p className="mt-0.5 text-[10px] text-muted" dir="ltr">
                  {email}
                </p>
              </div>
              <button onClick={() => signOut()} className="btn-ghost px-4 py-1.5 text-xs">
                تسجيل الخروج
              </button>
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center justify-between p-3.5">
              <div>
                <div className="text-xs font-bold text-gold">لوحة الإدارة العليا 🏛️</div>
                <p className="mt-0.5 text-[10px] text-muted">صلاحيات إدارية — إعلانات رسمية وتحكم</p>
              </div>
              <Link href="/admin" className="btn-gold px-4 py-1.5 text-xs">
                فتح اللوحة
              </Link>
            </div>
          )}
          <div className="flex items-center justify-between p-3.5">
            <div>
              <div className="text-xs font-bold text-down">إعادة تعيين اللعبة</div>
              <p className="mt-0.5 text-[10px] text-muted">
                حذف كل تقدم هذا الطور والبدء من جديد برصيد 10,000 UCN
              </p>
            </div>
            <button
              onClick={() => setResetModal(true)}
              className="rounded-xl border border-down/50 bg-down/10 px-4 py-1.5 text-xs font-bold text-down"
            >
              إعادة تعيين
            </button>
          </div>
        </Card>
      </div>

      {/* name modal */}
      <Modal open={nameModal} onClose={() => setNameModal(false)} title="تعديل اسم اللاعب">
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          maxLength={24}
          className="w-full rounded-xl border border-edge bg-card2 px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-teal/50"
        />
        <button
          disabled={nameInput.trim().length < 2}
          onClick={() => {
            dispatch({ type: "SET_NAME", name: nameInput });
            setNameModal(false);
          }}
          className="btn-gold mt-4 w-full py-2.5 text-sm"
        >
          حفظ الاسم
        </button>
      </Modal>

      {/* reset modal */}
      <Modal open={resetModal} onClose={() => setResetModal(false)} title="تأكيد إعادة التعيين ⚠️">
        <p className="text-xs leading-6 text-muted">
          سيتم حذف كل تقدمك نهائيًا: الأرصدة، الأصول، الشركات، العقارات، الإنجازات والمستوى. هل أنت
          متأكد؟
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => setResetModal(false)} className="btn-ghost py-2.5 text-sm">
            تراجع
          </button>
          <button
            onClick={() => {
              clearState(mode ?? "demo");
              dispatch({ type: "RESET", state: seed(mode ?? "demo") });
              setResetModal(false);
            }}
            className="rounded-xl border border-down/50 bg-down/15 py-2.5 text-sm font-bold text-down"
          >
            نعم، احذف كل شيء
          </button>
        </div>
      </Modal>
    </div>
  );
}
