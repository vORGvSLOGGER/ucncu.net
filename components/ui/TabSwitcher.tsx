"use client";

export function TabSwitcher<T extends string>({
  tabs,
  active,
  onChange,
  accent = "teal",
  size = "md",
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  accent?: "teal" | "gold" | "updown";
  size?: "sm" | "md";
}) {
  const activeClass = (id: T) => {
    if (id !== active) return "text-muted hover:text-ink";
    if (accent === "gold") return "bg-gold/15 text-gold border border-gold/40";
    if (accent === "updown")
      return id === tabs[0].id
        ? "bg-up/15 text-up border border-up/40"
        : "bg-down/15 text-down border border-down/40";
    return "bg-teal/15 text-teal border border-teal/40";
  };
  return (
    <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-edge bg-card2 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`whitespace-nowrap rounded-lg font-semibold transition ${
            size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
          } ${activeClass(t.id)}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
