export type FiatCode = "UCN" | "USD" | "SAR" | "EUR" | "AED";
export type CryptoCode = "BTC" | "ETH" | "UCNC" | "USDT";

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
  kind: "founded" | "dividend" | "growth" | "drop" | "shares";
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
  | "reward";

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
  version: 1;
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
  settings: { exploreMode: boolean };
  toasts: ToastMsg[];
  lastTickAt: number;
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
  | { type: "DISMISS_TOAST"; id: string };
