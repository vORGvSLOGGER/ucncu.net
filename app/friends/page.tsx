"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { PageTitle } from "@/components/ui/PageTitle";
import { personaById } from "@/lib/ai/personas";
import { POST_MAX_LEN } from "@/lib/constants";
import { fmtCompact, fmtInt, timeAgo } from "@/lib/format";
import { BOTS, botById } from "@/lib/seed";
import { itemPrice, marketItemDef } from "@/lib/selectors";
import { useGame, useGameDispatch } from "@/lib/state/GameContext";

function ChatModal({ botId, onClose }: { botId: string; onClose: () => void }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const bot = botById(botId);
  const thread = game.chats[botId];
  const messages = thread?.messages ?? [];
  const typing = Boolean(thread?.pendingReplyAt);

  useEffect(() => {
    dispatch({ type: "MARK_CHAT_READ", botId });
  }, [dispatch, botId, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  const send = () => {
    if (!text.trim()) return;
    dispatch({ type: "SEND_CHAT", botId, text });
    setText("");
  };

  return (
    <Modal open onClose={onClose} title={`💬 ${bot.name}`}>
      <div className="mb-3 max-h-72 min-h-40 space-y-2 overflow-y-auto rounded-xl border border-edge bg-card2 p-3">
        {messages.length === 0 && !typing && (
          <p className="py-8 text-center text-[11px] text-muted">ابدأ المحادثة — سيرد خلال ثوانٍ</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "player" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-[11px] leading-5 ${
                m.from === "player"
                  ? "rounded-br-sm border border-gold/40 bg-gold/10 text-ink"
                  : "rounded-bl-sm border border-edge bg-card text-ink"
              }`}
            >
              {m.text}
              <div className="mt-0.5 text-[8px] text-muted">{timeAgo(m.t)}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-bl-sm border border-edge bg-card px-3 py-2 text-[11px] text-muted animate-pulse-glow">
              يكتب…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          maxLength={POST_MAX_LEN}
          placeholder="اكتب رسالتك…"
          className="flex-1 rounded-xl border border-edge bg-card2 px-3 py-2.5 text-xs text-ink outline-none focus:border-teal/50"
        />
        <button onClick={send} disabled={!text.trim()} className="btn-gold px-4 py-2.5">
          <Icon name="send" size={15} />
        </button>
      </div>
    </Modal>
  );
}

function OfferModal({ botId, onClose }: { botId: string; onClose: () => void }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const bot = botById(botId);
  const sellable = game.inventory.filter((i) => i.qty > 0);
  const [defId, setDefId] = useState(sellable[0]?.defId ?? "");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const fair = defId ? itemPrice(game, defId) * Math.max(1, Number(qty) || 1) : 0;

  return (
    <Modal open onClose={onClose} title={`عرض بيع مباشر لـ ${bot.name}`}>
      {sellable.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted">
          مخزونك فارغ — اشترِ من السوق أو افز بمزاد أولًا
        </p>
      ) : (
        <>
          <label className="mb-1 block text-[10px] font-bold text-muted">العنصر</label>
          <select
            value={defId}
            onChange={(e) => setDefId(e.target.value)}
            className="mb-3 w-full rounded-xl border border-edge bg-card2 px-3 py-2.5 text-xs text-ink outline-none"
          >
            {sellable.map((i) => {
              const def = marketItemDef(i.defId);
              return (
                <option key={i.defId} value={i.defId}>
                  {def?.name ?? i.defId} — تملك ×{i.qty}
                  {i.auctionQty ? " (من المزاد)" : ""}
                </option>
              );
            })}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold text-muted">الكمية</label>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                className="w-full rounded-xl border border-edge bg-card2 px-3 py-2.5 text-xs text-ink outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold text-muted">سعرك (UCN)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                placeholder={fmtInt(fair)}
                className="w-full rounded-xl border border-edge bg-card2 px-3 py-2.5 text-xs text-ink outline-none"
              />
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted">
            القيمة السوقية العادلة ≈ <b className="text-teal">{fmtInt(fair)} UCN</b> — اطلب
            أكثر بقليل وسيساومك، وبالغ كثيرًا وسيرفض
          </p>
          <button
            disabled={!defId || !price || Number(price) < 1}
            onClick={() => {
              dispatch({
                type: "OFFER_SALE",
                botId,
                itemDefId: defId,
                qty: Math.max(1, Number(qty) || 1),
                price: Number(price),
              });
              onClose();
            }}
            className="btn-gold mt-4 w-full py-2.5 text-sm"
          >
            أرسل العرض 🤝
          </button>
        </>
      )}
    </Modal>
  );
}

function PartnerModal({ botId, onClose }: { botId: string; onClose: () => void }) {
  const game = useGame();
  const dispatch = useGameDispatch();
  const bot = botById(botId);

  return (
    <Modal open onClose={onClose} title={`دعوة ${bot.name} للشراكة`}>
      {game.companies.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted">
          لا تملك شركات بعد — أسس شركتك من قسم الشركات أولًا
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] leading-5 text-muted">
            اختر الشركة: سيضخ الشريك رأسمالًا (20-35% من التقييم) مقابل حصة، ويرتفع
            التقييم بقوة الشراكة.
          </p>
          {game.companies.map((co) => {
            const already =
              co.partners.some((p) => p.name === bot.name) ||
              game.partnerships.some(
                (p) => p.companyId === co.id && p.botId === botId && p.status === "pending"
              );
            return (
              <button
                key={co.id}
                disabled={already}
                onClick={() => {
                  dispatch({ type: "INVITE_PARTNER", botId, companyId: co.id });
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-edge bg-card2 p-3 text-start transition hover:border-gold/40 disabled:opacity-40"
              >
                <Icon name="briefcase" size={18} className="text-gold" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-ink">{co.name}</div>
                  <div className="text-[9px] text-muted">
                    التقييم {fmtCompact(co.valuation)} UCN · حصتك {co.ownershipPct.toFixed(0)}%
                  </div>
                </div>
                {already ? (
                  <span className="text-[9px] text-muted">شريك بالفعل / قيد الدراسة</span>
                ) : (
                  <Icon name="plus" size={14} className="text-teal" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export default function FriendsPage() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [offerTo, setOfferTo] = useState<string | null>(null);
  const [partnerWith, setPartnerWith] = useState<string | null>(null);

  const friends = game.friends;
  const candidates = BOTS.filter((b) => !friends.includes(b.id));
  const activeOffers = game.saleOffers.filter(
    (o) => o.status === "pending" || o.status === "countered"
  );
  const recentOffers = game.saleOffers
    .filter((o) => o.status === "accepted" || o.status === "rejected")
    .slice(0, 5);
  const partnerships = game.partnerships.slice(0, 8);

  return (
    <div>
      <PageTitle
        icon="users"
        title="الأصدقاء"
        sub="كوّن علاقاتك: شات، صفقات مباشرة، وشراكات في الشركات"
      />

      {/* my friends */}
      {friends.length > 0 && (
        <div className="mb-5">
          <SectionTitle icon="users" title={`أصدقائي (${friends.length})`} />
          <div className="grid gap-3 sm:grid-cols-2">
            {friends.map((id) => {
              const def = botById(id);
              const live = game.bots[id];
              const persona = personaById(id);
              const unread = game.chats[id]?.unread ?? 0;
              return (
                <Card key={id} className="card-hover p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar name={def.name} avatarId={def.avatarId} size={44} />
                      <span className="absolute -bottom-1 -right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full border border-teal bg-bg px-0.5 text-[8px] font-extrabold text-teal">
                        {live?.level ?? "?"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-ink">
                        {def.name}
                        {live?.bankrupt && <span className="text-[9px] text-down">💥 مفلس</span>}
                      </div>
                      <div className="truncate text-[9px] text-muted">{persona.bio}</div>
                      <div className="text-[9px] text-muted">
                        الثروة <b className="text-gold">{fmtCompact(live?.netWorth ?? 0)} UCN</b>
                      </div>
                    </div>
                    <button
                      onClick={() => dispatch({ type: "REMOVE_FRIEND", botId: id })}
                      className="text-muted/50 transition hover:text-down"
                      aria-label="إزالة صديق"
                    >
                      <Icon name="close" size={13} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setChatWith(id)}
                      className="btn-teal relative flex items-center justify-center gap-1 py-2 text-[10px]"
                    >
                      <Icon name="chat-bubble" size={12} />
                      شات
                      {unread > 0 && (
                        <span className="absolute -left-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-down px-0.5 text-[8px] font-extrabold text-bg">
                          {unread}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setOfferTo(id)}
                      className="btn-gold flex items-center justify-center gap-1 py-2 text-[10px]"
                    >
                      <Icon name="tag" size={12} />
                      عرض بيع
                    </button>
                    <button
                      onClick={() => setPartnerWith(id)}
                      className="btn-ghost flex items-center justify-center gap-1 py-2 text-[10px]"
                    >
                      <Icon name="handshake" size={12} />
                      شراكة
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* sale offers */}
      {(activeOffers.length > 0 || recentOffers.length > 0) && (
        <div className="mb-5">
          <SectionTitle icon="tag" title="عروض البيع المباشر" sub="العناصر محجوزة حتى يرد المشتري" />
          <div className="space-y-2">
            {[...activeOffers, ...recentOffers].map((o) => {
              const def = marketItemDef(o.itemDefId);
              const bot = botById(o.toBotId);
              return (
                <Card key={o.id} className="flex flex-wrap items-center gap-3 p-3">
                  <Avatar name={bot.name} avatarId={bot.avatarId} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-ink">
                      {def?.name ?? "عنصر"} ×{o.qty} ← {bot.name}
                    </div>
                    <div className="text-[9px] text-muted">
                      سعرك {fmtInt(o.price)} UCN · {timeAgo(o.t)}
                    </div>
                  </div>
                  {o.status === "pending" && (
                    <span className="rounded-full border border-teal/40 bg-teal/10 px-2.5 py-1 text-[9px] font-bold text-teal animate-pulse-glow">
                      يدرس العرض…
                    </span>
                  )}
                  {o.status === "accepted" && (
                    <span className="rounded-full border border-up/40 bg-up/10 px-2.5 py-1 text-[9px] font-bold text-up">
                      ✓ تم البيع
                    </span>
                  )}
                  {o.status === "rejected" && (
                    <span className="rounded-full border border-down/40 bg-down/10 px-2.5 py-1 text-[9px] font-bold text-down">
                      ✗ مرفوض
                    </span>
                  )}
                  {o.status === "countered" && o.counterPrice && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gold">يعرض {fmtInt(o.counterPrice)} UCN</span>
                      <button
                        onClick={() => dispatch({ type: "ACCEPT_COUNTER", offerId: o.id })}
                        className="btn-gold px-3 py-1.5 text-[10px]"
                      >
                        اقبل
                      </button>
                      <button
                        onClick={() => dispatch({ type: "CANCEL_OFFER", offerId: o.id })}
                        className="btn-ghost px-3 py-1.5 text-[10px]"
                      >
                        ألغِ
                      </button>
                    </div>
                  )}
                  {o.status === "pending" && (
                    <button
                      onClick={() => dispatch({ type: "CANCEL_OFFER", offerId: o.id })}
                      className="btn-ghost px-3 py-1.5 text-[10px]"
                    >
                      سحب العرض
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* partnerships */}
      {partnerships.length > 0 && (
        <div className="mb-5">
          <SectionTitle icon="handshake" title="الشراكات" />
          <div className="space-y-2">
            {partnerships.map((p) => {
              const bot = botById(p.botId);
              const co = game.companies.find((c) => c.id === p.companyId);
              return (
                <Card key={p.id} className="flex items-center gap-3 p-3">
                  <Avatar name={bot.name} avatarId={bot.avatarId} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-ink">
                      {bot.name} × {co?.name ?? "شركة سابقة"}
                    </div>
                    <div className="text-[9px] text-muted">
                      رأس المال {fmtInt(p.capital)} UCN
                      {p.status === "active" && ` · حصته ${p.botPct}%`}
                    </div>
                  </div>
                  {p.status === "pending" && (
                    <span className="rounded-full border border-teal/40 bg-teal/10 px-2.5 py-1 text-[9px] font-bold text-teal animate-pulse-glow">
                      يدرس الدعوة…
                    </span>
                  )}
                  {p.status === "active" && (
                    <span className="rounded-full border border-up/40 bg-up/10 px-2.5 py-1 text-[9px] font-bold text-up">
                      ✓ شراكة نشطة
                    </span>
                  )}
                  {p.status === "declined" && (
                    <span className="rounded-full border border-edge bg-card px-2.5 py-1 text-[9px] font-bold text-muted">
                      اعتذر
                    </span>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* add friends */}
      <div data-tour="friends-add">
        <SectionTitle
          icon="plus"
          title="تجار يمكنك مصادقتهم"
          sub="أضفهم لتراسلهم وتعقد معهم الصفقات والشراكات"
        />
        {candidates.length === 0 ? (
          <Card className="p-6 text-center text-xs text-muted">
            صادقت كل تجار السوق! أنت اجتماعي بحق 🌟
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((def) => {
              const live = game.bots[def.id];
              const persona = personaById(def.id);
              return (
                <Card key={def.id} className="card-hover p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={def.name} avatarId={def.avatarId} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-ink">{def.name}</div>
                      <div className="truncate text-[9px] text-muted">{persona.bio}</div>
                      <div className="text-[9px] text-muted">
                        م{live?.level ?? "?"} · <b className="text-gold">{fmtCompact(live?.netWorth ?? 0)}</b> UCN
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch({ type: "ADD_FRIEND", botId: def.id })}
                    className="btn-teal mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-[11px]"
                  >
                    <Icon name="plus" size={13} />
                    إضافة صديق
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {chatWith && <ChatModal botId={chatWith} onClose={() => setChatWith(null)} />}
      {offerTo && <OfferModal botId={offerTo} onClose={() => setOfferTo(null)} />}
      {partnerWith && <PartnerModal botId={partnerWith} onClose={() => setPartnerWith(null)} />}
    </div>
  );
}
