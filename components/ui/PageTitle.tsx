import { Icon } from "./Icon";

export function PageTitle({
  icon,
  title,
  sub,
}: {
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
        <p className="mt-0.5 text-xs text-muted">{sub}</p>
      </div>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-teal/40 bg-teal/10 text-teal glow-teal">
        <Icon name={icon} size={24} />
      </span>
    </div>
  );
}
