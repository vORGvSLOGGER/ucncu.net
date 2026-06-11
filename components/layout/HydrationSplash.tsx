import { Icon } from "../ui/Icon";

export function HydrationSplash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-16 w-16 animate-pulse-glow place-items-center rounded-2xl border border-gold/50 bg-gold/10 text-gold glow-gold">
          <Icon name="shield" size={34} />
        </span>
        <div className="text-xl font-extrabold tracking-wide text-gold-grad" dir="ltr">
          UCNCU.NET
        </div>
        <div className="text-xs text-muted">جارٍ تحميل عالمك الاستثماري…</div>
      </div>
    </div>
  );
}
