"use client";

export function AmountInput({
  value,
  onChange,
  max,
  placeholder = "0.00",
  suffix,
  showPctButtons = true,
}: {
  value: string;
  onChange: (v: string) => void;
  max?: number;
  placeholder?: string;
  suffix?: string;
  showPctButtons?: boolean;
}) {
  const num = parseFloat(value) || 0;
  const overMax = max !== undefined && num > max;
  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-card2 px-3 py-2.5 ${
          overMax ? "border-down/60" : "border-edge focus-within:border-teal/50"
        }`}
      >
        <input
          inputMode="decimal"
          dir="ltr"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^\d*\.?\d*$/.test(v)) onChange(v);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-left text-base font-bold text-ink outline-none placeholder:text-muted/50"
        />
        {suffix && <span className="shrink-0 text-xs font-bold text-muted">{suffix}</span>}
      </div>
      {showPctButtons && max !== undefined && (
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {[25, 50, 75, 100].map((p) => (
            <button
              key={p}
              onClick={() => onChange(String(Math.floor(max * (p / 100) * 100) / 100))}
              className="btn-ghost py-1 text-[11px]"
            >
              {p}%
            </button>
          ))}
        </div>
      )}
      {overMax && (
        <p className="mt-1 text-[11px] font-semibold text-down">المبلغ يتجاوز رصيدك المتاح</p>
      )}
    </div>
  );
}
