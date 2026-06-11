import { NOTIF_CAP, TX_CAP } from "../constants";
import { uid } from "../format";
import type {
  AppNotification,
  CryptoCode,
  FiatCode,
  GameState,
  ToastMsg,
  Transaction,
  TxType,
} from "../types";

export function addTx(
  s: GameState,
  type: TxType,
  label: string,
  amount: number,
  currency: FiatCode | CryptoCode = "UCN",
  t = Date.now()
): Transaction {
  const tx: Transaction = { id: uid("tx"), t, type, label, amount, currency };
  s.transactions.unshift(tx);
  if (s.transactions.length > TX_CAP) s.transactions.length = TX_CAP;
  return tx;
}

export function addNotif(
  s: GameState,
  title: string,
  body?: string,
  kind: AppNotification["kind"] = "info",
  t = Date.now()
): void {
  s.notifications.unshift({ id: uid("ntf"), t, title, body, kind });
  if (s.notifications.length > NOTIF_CAP) s.notifications.length = NOTIF_CAP;
}

export function addToast(
  s: GameState,
  text: string,
  kind: ToastMsg["kind"] = "info"
): void {
  s.toasts.push({ id: uid("toast"), text, kind });
  if (s.toasts.length > 4) s.toasts.shift();
}
