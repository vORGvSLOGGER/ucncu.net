"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { PageTitle } from "@/components/ui/PageTitle";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { CRYPTO_CODES, CRYPTO_META, FIAT_CODES, FIAT_META, rankForLevel } from "@/lib/constants";
import { fmtXp, xpSummary } from "@/lib/engine/xp";
import { fmtClock, fmtCompact, fmtDec, fmtSigned } from "@/lib/format";
import { ACHIEVEMENTS, BOTS, seed } from "@/lib/seed";
import { breakdown, cryptoUcn, netWorth } from "@/lib/selectors";
import { clearState } from "@/lib/state/persistence";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";
import type { TxType } from "@/lib/types";

const TX_FILTERS: { id: string; label: string; types: TxType[] }[] = [
  { id: "all", label: "الكل", types: [] },
  { id: "market", label: "السوق", types: ["buy", "sell"] },
  { id: "trade", label: "التداول", types: ["trade-open", "trade-close"] },
  { id: "fx", label: "العملات", types: ["fx", "crypto-buy", "crypto-sell"] },
  { id: "estate", label: "العقارات", types: ["property-buy", "property-sell", "rent"] },
  { id: "bank", label: "البنك", types: ["loan", "installment", "lend", "lend-return"] },
  { id: "company", label: "الشركات", types: ["company", "shares-sale", "dividend"] },
  { id: "auction", label: "المزاد", types: ["auction-bid", "auction-win", "auction-refund"] },
];

export default function ProfilePage() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [nameModal, setNameModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [nameInput, setNameInput] = useState(game.player.name);
  const [txFilter, setTxFilter] = useState("all");

  const xp = xpSummary(game);
  const b = breakdown(game);
  const worth = netWorth(game);

  const board = [
    ...BOTS.map((bot) => ({ name: bot.name, avatarId: bot.avatarId, worth: bot.netWorth, me: false })),
    { name: game.player.name, avatarId: game.player.avatarId, worth, me: true },
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
            <Avatar name={game.player.name} avatarId={game.player.avatarId} size={72} ring />
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

        {/* leaderboard */}
        <Card className="p-4">
          <SectionTitle icon="trophy" title="لوحة المتصدرين" sub="حسب إجمالي الثروة" />
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
                <Avatar name={p.name} avatarId={p.avatarId} size={26} />
                <span className={`min-w-0 flex-1 truncate font-bold ${p.me ? "text-gold" : "text-ink"}`}>
                  {p.name}
                  {p.me && " (أنت)"}
                </span>
                <b className="text-muted">{fmtCompact(p.worth)}</b>
              </div>
            ))}
          </div>
        </Card>
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
              <div className="text-xs font-bold text-down">إعادة تعيين اللعبة</div>
              <p className="mt-0.5 text-[10px] text-muted">
                حذف كل التقدم والبدء من جديد برصيد 10,000 UCN
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
              clearState();
              dispatch({ type: "RESET", state: seed() });
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
