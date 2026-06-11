export type FiatCode = "UCN" | "USD" | "SAR" | "EUR" | "AED";
export type CryptoCode = "BTC" | "ETH" | "UCNC" | "USDT";

export type GameMode = "demo" | "real";

export type MarketCategory = "goods" | "resources" | "rare" | "seasonal";
export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface PriceEntry {
  price: number;
  base: number;
  drift: number;
  vol: number;
  spark: number[];
  candles: Candle[];
  candleTicks: number;
  changePct: number;
}

export type PriceBook = Record<string, PriceEntry>;

/* ---------- catalog definitions (static, live in seed.ts) ---------- */

export interface MarketItemDef {
  id: string;
  name: string;
  category: MarketCategory;
  icon: string;
  basePrice: number;
  rarity: Rarity;
}

export interface PropertyDef {
  id: string;
  name: string;
  district: string;
  icon: string;
  basePrice: number;
  rentPerCycle: number;
}

export interface TradeSymbolDef {
  id: string;
  name: string;
  kind: "stock" | "index" | "commodity";
  basePrice: number;
}

export interface SectorDef {
  id: string;
  name: string;
  icon: string;
}

export interface BotDef {
  id: string;
  name: string;
  avatarId: number;
  netWorth: number;
}

export interface BorrowerOfferDef {
  botId: string;
  amount: number;
  ratePct: number;
  durationMs: number;
  risk: number; // 0..1 chance of default
  creditScore: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export interface GameEventDef {
  id: string;
  kind: "daily" | "weekly" | "monthly";
  title: string;
  desc: string;
  reward: string;
  icon: string;
}

export interface LoanProductDef {
  id: string;
  name: string;
  desc: string;
  maxAmount: number;
  ratePct: number;
  installments: number;
  minCredit: number;
}

/* ---------- owned / dynamic state ---------- */

export interface OwnedItem {
  defId: string;
  qty: number;
  avgCost: number;
  /** how many of `qty` came from auctions (eligible for re-listing) */
  auctionQty?: number;
}

export interface OwnedProperty {
  id: string;
  defId: string;
  paidPrice: number;
  boughtAt: number;
  rentCollected: number;
  nextRentAt: number;
}

export interface Partner {
  name: string;
  pct: number;
  isPlayer?: boolean;
  avatarId?: number;
  invested: number;
}

export interface CompanyEvent {
  t: number;
  text: string;
  kind: "founded" | "dividend" | "growth" | "drop" | "shares" | "upgrade" | "partner";
}

export interface Company {
  id: string;
  name: string;
  sectorId: string;
  foundedAt: number;
  valuation: number;
  history: number[];
  ownershipPct: number;
  partners: Partner[];
  dividendsPaid: number;
  events: CompanyEvent[];
  nextDividendAt: number;
  /** 1 ناشئة · 2 نامية · 3 رائدة — boosts dividend yield */
  level: number;
}

export interface TradePosition {
  id: string;
  symbol: string;
  side: "long" | "short";
  qty: number;
  entry: number;
  openedAt: number;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  side: "long" | "short";
  qty: number;
  entry: number;
  exit: number;
  pnl: number;
  closedAt: number;
}

export interface Loan {
  id: string;
  productName: string;
  principal: number;
  totalDue: number;
  installment: number;
  installments: number;
  paidInstallments: number;
  nextDueAt: number;
  status: "active" | "paid";
  missed: number;
  takenAt: number;
}

export interface PlayerLend {
  id: string;
  botId: string;
  amount: number;
  ratePct: number;
  dueAt: number;
  status: "active" | "repaid" | "defaulted";
}

/* ---------- AI traders (v2) ---------- */

export type BotStrategy =
  | "momentum"
  | "value"
  | "contrarian"
  | "whale"
  | "scalper"
  | "hodler";

export interface BotPosition {
  key: string; // price-book key (st:aramco, cx:BTC, mk:diamond)
  side: "long" | "short";
  alloc: number; // UCN allocated at entry
  entry: number;
  openedAt: number;
}

export interface BotState {
  netWorth: number;
  seedWorth: number;
  level: number;
  positions: BotPosition[];
  history: number[]; // capped, leaderboard sparkline
  lastActionAt: number;
  bankrupt: boolean; // subject of an open إحسان case
}

/* ---------- social: feed, friends, chat, offers, partnerships ---------- */

export type FeedKind =
  | "trade"
  | "commentary"
  | "milestone"
  | "bankruptcy"
  | "ihsan"
  | "user";

export interface FeedPost {
  id: string;
  t: number;
  authorId: string; // botId | "player" | "system"
  kind: FeedKind;
  text: string;
  likes: number;
  likedByPlayer: boolean;
}

export interface ChatMessage {
  id: string;
  from: "player" | "bot";
  text: string;
  t: number;
}

export interface ChatThread {
  messages: ChatMessage[]; // capped
  pendingReplyAt?: number;
  unread: number;
}

export type OfferStatus = "pending" | "accepted" | "rejected" | "countered";

export interface SaleOffer {
  id: string;
  toBotId: string;
  itemDefId: string;
  qty: number;
  price: number;
  status: OfferStatus;
  counterPrice?: number;
  decideAt: number;
  t: number;
  /** escrowed avg cost, restored if the offer falls through */
  avgCost: number;
}

export type PartnershipStatus = "pending" | "active" | "declined";

export interface Partnership {
  id: string;
  companyId: string;
  botId: string;
  botPct: number;
  capital: number;
  status: PartnershipStatus;
  decideAt: number;
  t: number;
}

/* ---------- bankruptcy + إحسان ---------- */

export interface IhsanDonation {
  donorId: string; // botId | "player"
  amount: number;
  t: number;
}

export type IhsanStatus = "open" | "rescued" | "failed";

export interface IhsanCase {
  id: string;
  subjectId: string; // botId | "player"
  startedAt: number;
  deadline: number;
  debt: number; // amount needed for full recovery
  donated: number;
  donations: IhsanDonation[];
  status: IhsanStatus;
  rescuedBy?: string;
}

export interface BankruptcyState {
  status: "none" | "grace" | "gameover";
  startedAt?: number;
  deadline?: number; // persisted — survives offline
  debtAtStart?: number;
  caseId?: string;
}

/* ---------- tutorial ---------- */

export interface TutorialState {
  status: "pending" | "active" | "done" | "skipped";
  step: number;
  rewarded: number; // highest step index already XP-rewarded
}

export interface Bid {
  bidder: string;
  amount: number;
  t: number;
  isPlayer?: boolean;
}

export interface AuctionBot {
  botId: string;
  maxBudget: number;
  aggressiveness: number; // 0..1
}

export type AuctionTier = "rare" | "legendary" | "mythic";

export interface Auction {
  id: string;
  itemDefId: string;
  endsAt: number;
  startBid: number;
  currentBid: number;
  leader: string;
  leaderIsPlayer: boolean;
  bids: Bid[];
  bots: AuctionBot[];
  sellerId: "system" | "player";
  tier: AuctionTier;
}

export interface AuctionResult {
  id: string;
  itemName: string;
  finalBid: number;
  won: boolean;
  t: number;
}

export type TxType =
  | "buy"
  | "sell"
  | "fx"
  | "crypto-buy"
  | "crypto-sell"
  | "trade-open"
  | "trade-close"
  | "rent"
  | "dividend"
  | "loan"
  | "installment"
  | "lend"
  | "lend-return"
  | "auction-bid"
  | "auction-win"
  | "auction-refund"
  | "company"
  | "shares-sale"
  | "property-buy"
  | "property-sell"
  | "reward"
  | "donation-in"
  | "donation-out"
  | "debt-payment"
  | "daily-bonus"
  | "direct-sale"
  | "partner-capital"
  | "auction-sale"
  | "upgrade";

export interface Transaction {
  id: string;
  t: number;
  type: TxType;
  label: string;
  amount: number; // signed, in `currency`
  currency: FiatCode | CryptoCode;
}

export interface AppNotification {
  id: string;
  t: number;
  title: string;
  body?: string;
  kind: "info" | "success" | "warning" | "gold";
  read?: boolean;
}

export interface ToastMsg {
  id: string;
  text: string;
  kind: "info" | "success" | "warning" | "gold";
}

export interface Player {
  name: string;
  avatarId: number;
  level: number;
  xp: number;
  creditScore: number;
  joinedAt: number;
}

export interface GameState {
  version: 2;
  mode: GameMode;
  player: Player;
  balances: Record<FiatCode, number>;
  cryptoHoldings: Record<CryptoCode, { qty: number; avgCost: number }>;
  inventory: OwnedItem[];
  properties: OwnedProperty[];
  companies: Company[];
  positions: TradePosition[];
  closedTrades: ClosedTrade[];
  loans: Loan[];
  lends: PlayerLend[];
  auctions: Auction[];
  auctionResults: AuctionResult[];
  prices: PriceBook;
  netWorthHistory: number[];
  transactions: Transaction[];
  achievements: { id: string; unlockedAt: number }[];
  notifications: AppNotification[];
  favoritePairs: string[];
  settings: { exploreMode: boolean; navOrder: string[] };
  toasts: ToastMsg[];
  lastTickAt: number;
  tickCount: number;
  /* --- v2: living world --- */
  bots: Record<string, BotState>;
  botsVersion: number;
  feed: FeedPost[];
  ihsanCases: IhsanCase[];
  bankruptcy: BankruptcyState;
  tutorial: TutorialState;
  friends: string[];
  chats: Record<string, ChatThread>;
  saleOffers: SaleOffer[];
  partnerships: Partnership[];
  feedback: Record<string, { stars: number; text: string; t: number }>;
  lastDailyKey: string; // Saudi calendar day of last daily grant
  dailyPostCount: number;
}

/* ---------- actions ---------- */

export type Action =
  | { type: "HYDRATE"; state: GameState; now: number }
  | { type: "TICK"; now: number }
  | { type: "RESET"; state: GameState }
  | { type: "BUY_ITEM"; defId: string; qty: number }
  | { type: "SELL_ITEM"; defId: string; qty: number }
  | { type: "PLACE_BID"; auctionId: string; amount: number }
  | { type: "OPEN_POSITION"; symbol: string; side: "long" | "short"; qty: number }
  | { type: "CLOSE_POSITION"; positionId: string }
  | { type: "CONVERT_FX"; from: FiatCode; to: FiatCode; amount: number }
  | { type: "BUY_CRYPTO"; code: CryptoCode; spendUcn: number }
  | { type: "SELL_CRYPTO"; code: CryptoCode; qty: number }
  | { type: "BUY_PROPERTY"; defId: string }
  | { type: "SELL_PROPERTY"; id: string }
  | { type: "TAKE_LOAN"; productId: string; amount: number }
  | { type: "LEND"; offerIdx: number }
  | {
      type: "FOUND_COMPANY";
      name: string;
      sectorId: string;
      capital: number;
      partnerBotId?: string;
      partnerPct?: number;
    }
  | { type: "SELL_SHARES"; companyId: string; pct: number }
  | { type: "SET_NAME"; name: string }
  | { type: "TOGGLE_FAVORITE"; pair: string }
  | { type: "MARK_NOTIFICATIONS_READ" }
  | { type: "TOGGLE_EXPLORE" }
  | { type: "DISMISS_TOAST"; id: string }
  /* --- v2 --- */
  | { type: "TUTORIAL_START" }
  | { type: "TUTORIAL_NEXT" }
  | { type: "TUTORIAL_PREV" }
  | { type: "TUTORIAL_SKIP" }
  | { type: "ADD_POST"; text: string }
  | { type: "LIKE_POST"; postId: string }
  | { type: "DONATE_IHSAN"; caseId: string; amount: number }
  | { type: "RESCUE_IHSAN"; caseId: string }
  | { type: "PAY_DEBT"; loanId: string }
  | { type: "SET_NAV_ORDER"; order: string[] }
  | { type: "ADD_FRIEND"; botId: string }
  | { type: "REMOVE_FRIEND"; botId: string }
  | { type: "SEND_CHAT"; botId: string; text: string }
  | { type: "MARK_CHAT_READ"; botId: string }
  | { type: "OFFER_SALE"; botId: string; itemDefId: string; qty: number; price: number }
  | { type: "ACCEPT_COUNTER"; offerId: string }
  | { type: "CANCEL_OFFER"; offerId: string }
  | { type: "INVITE_PARTNER"; botId: string; companyId: string }
  | { type: "RELIST_AUCTION"; itemDefId: string; startBid: number }
  | { type: "UPGRADE_COMPANY"; companyId: string }
  | { type: "SUBMIT_FEEDBACK"; stars: number; text: string };
