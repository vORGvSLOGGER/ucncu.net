import { pk } from "./constants";
import { MARKET_ITEMS, PROPERTIES, TRADE_SYMBOLS } from "./seed";
import type {
  CryptoCode,
  FiatCode,
  GameState,
  TradePosition,
} from "./types";

export function fxUsdPerUnit(s: GameState, code: FiatCode): number {
  return s.prices[pk.fx(code)]?.price ?? 1;
}

/** 1 `from` = X `to` (mid rate, no spread) */
export function fxRate(s: GameState, from: FiatCode, to: FiatCode): number {
  return fxUsdPerUnit(s, from) / fxUsdPerUnit(s, to);
}

export function toUcn(s: GameState, amount: number, code: FiatCode): number {
  return amount * fxRate(s, code, "UCN");
}

export function cryptoUsd(s: GameState, code: CryptoCode): number {
  return s.prices[pk.cx(code)]?.price ?? 0;
}

/** crypto price expressed in UCN */
export function cryptoUcn(s: GameState, code: CryptoCode): number {
  return cryptoUsd(s, code) / fxUsdPerUnit(s, "UCN");
}

export function itemPrice(s: GameState, defId: string): number {
  return s.prices[pk.mk(defId)]?.price ?? 0;
}

export function propertyValue(s: GameState, defId: string): number {
  return s.prices[pk.re(defId)]?.price ?? 0;
}

export function symbolPrice(s: GameState, symbolId: string): number {
  return s.prices[pk.st(symbolId)]?.price ?? 0;
}

export function unrealizedPnl(s: GameState, p: TradePosition): number {
  const cur = symbolPrice(s, p.symbol);
  return p.side === "long" ? (cur - p.entry) * p.qty : (p.entry - cur) * p.qty;
}

export interface Breakdown {
  cash: number;
  fiat: number;
  crypto: number;
  inventory: number;
  properties: number;
  companies: number;
  trading: number;
  lends: number;
}

export function breakdown(s: GameState): Breakdown {
  const cash = s.balances.UCN;
  let fiat = 0;
  for (const code of ["USD", "SAR", "EUR", "AED"] as FiatCode[]) {
    fiat += toUcn(s, s.balances[code], code);
  }
  let crypto = 0;
  for (const code of Object.keys(s.cryptoHoldings) as CryptoCode[]) {
    crypto += s.cryptoHoldings[code].qty * cryptoUcn(s, code);
  }
  let inventory = 0;
  for (const it of s.inventory) inventory += it.qty * itemPrice(s, it.defId);
  let properties = 0;
  for (const p of s.properties) properties += propertyValue(s, p.defId);
  let companies = 0;
  for (const c of s.companies)
    companies += ((c.valuation + (c.treasury ?? 0)) * c.ownershipPct) / 100;
  let trading = 0;
  for (const p of s.positions) trading += p.entry * p.qty + unrealizedPnl(s, p);
  let lends = 0;
  for (const l of s.lends) if (l.status === "active") lends += l.amount;
  return { cash, fiat, crypto, inventory, properties, companies, trading, lends };
}

export function netWorth(s: GameState): number {
  const b = breakdown(s);
  return (
    b.cash + b.fiat + b.crypto + b.inventory + b.properties + b.companies + b.trading + b.lends
  );
}

/** remaining UCN owed across all active loans */
export function outstandingDebt(s: GameState): number {
  let debt = 0;
  for (const l of s.loans) {
    if (l.status !== "active") continue;
    debt += Math.max(0, l.totalDue - l.paidInstallments * l.installment);
  }
  return debt;
}

/** asset side only (loans are not netted out of netWorth) */
export function totalAssets(s: GameState): number {
  return netWorth(s);
}

/** can the player's whole estate not cover the debt? */
export function insolvent(s: GameState): boolean {
  const debt = outstandingDebt(s);
  return debt > 0 && totalAssets(s) < debt;
}

/** 0..100 from recent crypto momentum */
export function fearGreed(s: GameState): number {
  const btc = s.prices[pk.cx("BTC")]?.changePct ?? 0;
  const eth = s.prices[pk.cx("ETH")]?.changePct ?? 0;
  const v = 50 + ((btc + eth) / 2) * 4;
  return Math.round(Math.min(95, Math.max(5, v)));
}

export function marketItemDef(defId: string) {
  return MARKET_ITEMS.find((m) => m.id === defId);
}

export function propertyDef(defId: string) {
  return PROPERTIES.find((p) => p.id === defId);
}

export function tradeSymbolDef(id: string) {
  return TRADE_SYMBOLS.find((t) => t.id === id);
}
