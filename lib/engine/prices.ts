import {
  CANDLE_CAP,
  SPARK_CAP,
  TICKS_PER_CANDLE,
} from "../constants";
import type { GameState, PriceEntry } from "../types";

function stepEntry(e: PriceEntry): void {
  const next = e.price * (1 + e.drift + e.vol * (Math.random() * 2 - 1));
  e.price = Math.min(e.base * 1.6, Math.max(e.base * 0.4, next));

  e.spark.push(e.price);
  if (e.spark.length > SPARK_CAP) e.spark.shift();

  const last = e.candles[e.candles.length - 1];
  if (e.candleTicks >= TICKS_PER_CANDLE || !last) {
    e.candles.push({ o: e.price, h: e.price, l: e.price, c: e.price });
    if (e.candles.length > CANDLE_CAP) e.candles.shift();
    e.candleTicks = 1;
  } else {
    last.h = Math.max(last.h, e.price);
    last.l = Math.min(last.l, e.price);
    last.c = e.price;
    e.candleTicks += 1;
  }

  e.changePct = (e.price / e.spark[0] - 1) * 100;
}

export function tickPrices(s: GameState, steps = 1): void {
  for (let i = 0; i < steps; i++) {
    for (const key of Object.keys(s.prices)) stepEntry(s.prices[key]);
  }
}
