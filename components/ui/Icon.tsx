import type { SVGProps } from "react";

export type IconName = keyof typeof PATHS;

const PATHS = {
  home: <path d="M3 11.5 12 4l9 7.5M5.5 9.8V20h13V9.8M9.8 20v-5.5h4.4V20" />,
  cart: <path d="M3 4h2l2.4 11h11.2L21 8H6.2M9 19.5a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Zm8 0a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z" />,
  gavel: <path d="m9 5 6 6M7 7l6 6m-4-8 6 6M3 21h10M5.5 13.5 11 8l3 3-5.5 5.5L5.5 13.5Zm9-1 6.5 6.5-2 2-6.5-6.5" />,
  chart: <path d="M4 4v16h16M8 15v-4m4 4V8m4 7v-6m4-3-4.5 4L13 8l-3.5 3.5" />,
  candle: <path d="M7 7v10M5 9h4v6H5V9Zm12-4v4m0 8v3m-2-11h4v8h-4V6Z" />,
  building: <path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h3a1 1 0 0 1 1 1v11M3 21h18M8 8h2m-2 4h2m-2 4h2m4-8h0" />,
  tower: <path d="M8 21V4l4-2 4 2v17M8 8h8M8 12h8M8 16h8M3 21h18M11 21v-3h2v3" />,
  villa: <path d="m3 11 9-7 9 7M6 9.5V20h12V9.5M10 20v-4h4v4M3 20h18" />,
  store: <path d="M4 9 5.5 4h13L20 9M4 9a2.2 2.2 0 1 0 4.4 0A2.2 2.2 0 1 0 12.8 9a2.2 2.2 0 1 0 4.4 0A2.2 2.2 0 1 0 20 9M5.5 11v9h13v-9M9.5 20v-5h5v5" />,
  office: <path d="M4 21V8l8-5 8 5v13M9 21v-4h6v4M9 10h2m4 0h-2M9 14h2m2 0h2M2 21h20" />,
  warehouse: <path d="M3 21V9l9-5 9 5v12M7 21v-8h10v8M7 17h10M7 13h10M2 21h20" />,
  beach: <path d="M3 20h18M5 20c1-7 4-12 9-14M8 8c2-2 6-3 9-1-4 0-7 2-9 4m0-3c-3 0-5 2-6 5 2-2 4-3 6-2m6 8 4 5" />,
  farm: <path d="M3 21h18M5 21v-7l5-4 5 4v7M8.5 21v-4h3v4M17 10V4m-2 2h4m-4 3h4" />,
  bank: <path d="M3 9.5 12 4l9 5.5M5 10v8m4.5-8v8M14.5 10v8M19 10v8M3 21h18M3 18h18" />,
  coins: <path d="M8 8a5 3 0 1 0 10 0A5 3 0 1 0 8 8Zm10 0v4c0 1.7-2.2 3-5 3s-5-1.3-5-3V8M6 11c-2.4.3-4 1.4-4 2.8 0 1.6 2.2 2.9 5 2.9h1m-6-2v3c0 1.6 2.2 3 5 3 1.2 0 2.3-.2 3.2-.6" />,
  coin: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 3v2m0 8v2m3-8.5c0-1-1.3-1.7-3-1.7s-3 .6-3 1.6c0 2.6 6 1.3 6 4 0 1-1.3 1.7-3 1.7s-3-.7-3-1.7" />,
  money: <path d="M3 7h18v10H3V7Zm9 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM6 7v0m12 10v0M6 17a2 2 0 0 0-2-2m16-4a2 2 0 0 0 2-2M4 9a2 2 0 0 0 2-2m12 10a2 2 0 0 1 2-2" />,
  wallet: <path d="M4 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm0 0a2 2 0 0 1 2-2h11m-1 11h4v-4h-4a2 2 0 0 0 0 4Z" />,
  briefcase: <path d="M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm5 0V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18m-9-1.5v3" />,
  bell: <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4.5 9a1.7 1.7 0 0 0 3 0" />,
  settings: <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm7.5 3a7.5 7.5 0 0 0-.1-1.2l2-1.5-2-3.5-2.3 1a7.6 7.6 0 0 0-2.1-1.3L14.5 3h-5l-.5 2.5c-.8.3-1.5.7-2.1 1.3l-2.3-1-2 3.5 2 1.5a7.6 7.6 0 0 0 0 2.4l-2 1.5 2 3.5 2.3-1c.6.6 1.3 1 2.1 1.3l.5 2.5h5l.5-2.5a7.6 7.6 0 0 0 2.1-1.3l2.3 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z" />,
  user: <path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-8 17c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />,
  users: <path d="M9 5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm-6.5 15c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5M16 5.5a3.5 3.5 0 0 1 0 6.5m2 8c2-1 3.5-2.6 3.5-4.6 0-1.6-1-3-2.5-3.9" />,
  star: <path d="m12 3 2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8L12 3Z" />,
  crown: <path d="m3 8 4.5 3.5L12 5l4.5 6.5L21 8l-1.5 10h-15L3 8Zm3.5 13h11" />,
  trophy: <path d="M7 4h10v5a5 5 0 0 1-10 0V4Zm0 1H4v2a3 3 0 0 0 3 3m10-5h3v2a3 3 0 0 1-3 3m-5 4v4m-3.5 3h7M9 20h6" />,
  shield: <path d="M12 3 5 6v5c0 5 3 8.4 7 10 4-1.6 7-5 7-10V6l-7-3Zm-2.8 9 2 2 3.8-4" />,
  lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5V11Zm7 4v3" />,
  fire: <path d="M12 3s5.5 4.2 5.5 9.5a5.5 5.5 0 0 1-11 0C6.5 9.5 8 7 9.5 5.5c0 2 .8 3.2 2 3.5C11 7 11.5 4.5 12 3Zm0 17a3 3 0 0 0 3-3c0-2-1.5-3.5-3-5-1.5 1.5-3 3-3 5a3 3 0 0 0 3 3Z" />,
  bolt: <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />,
  gem: <path d="M7 3h10l4 6-9 12L3 9l4-6Zm-4 6h18M9.5 9 12 21 14.5 9M7 3l2.5 6L12 3l2.5 6L17 3" />,
  leaf: <path d="M5 19C4 9 10 4 20 4c0 11-5 16-13 15.5M5 19c2-5 5-8 9-10" />,
  tree: <path d="m12 3 5 6h-2.5l3.5 5h-3l3 5H6l3-5H6l3.5-5H7l5-6Zm0 16v2.5" />,
  truck: <path d="M2 6h12v10H2V6Zm12 3h4l3 4v3h-3m-9.5 1.5a1.8 1.8 0 1 0 0 .1Zm9 0a1.8 1.8 0 1 0 0 .1ZM2 16h2.5m4 0H14" />,
  health: <path d="M12 21S4 15.5 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5c0 6-8 11.5-8 11.5ZM9 11h2l1-2 1.5 4 1-2H17" />,
  chip: <path d="M8 8h8v8H8V8Zm3-5v3m2-3v3M11 18v3m2-3v3M3 11h3m-3 2h3m12-2h3m-3 2h3M6 6h12v12H6V6Z" />,
  coffee: <path d="M5 9h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9Zm11 1h2.5a2 2 0 0 1 0 4.5H16M8 5c0-1 1-1 1-2m3 2c0-1 1-1 1-2" />,
  ribbon: <path d="M12 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-3 9.5L7 21l5-2.5L17 21l-2-7.5" />,
  watch: <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2.5V12l2 1.5M9 7l.6-4h4.8L15 7M9 17l.6 4h4.8l.6-4" />,
  cube: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12v9m0-9L4 7.5" />,
  frame: <path d="M4 4h16v16H4V4Zm3 3h10v10H7V7Zm3 6 2-2.5L17 17H7l3-4Z" />,
  scroll: <path d="M7 3h11a2 2 0 0 1 2 2v2h-4M7 3a2 2 0 0 0-2 2v14m2-16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2m0 0h10a2 2 0 0 0 2-2V7M9 9h6m-6 4h6" />,
  giftbox: <path d="M4 9h16v3H4V9Zm2 3v9h12v-9M12 9v12M12 9S9 9 8 7.5 9.5 4 12 6.5c2.5-2.5 5-.5 4 1S12 9 12 9Z" />,
  ticket: <path d="M4 7h16v3.5a1.5 1.5 0 0 0 0 3V17H4v-3.5a1.5 1.5 0 0 0 0-3V7Zm10 0v10" />,
  snow: <path d="M12 3v18M5 6.5l14 11m0-11-14 11M12 3l-2 2m2-2 2 2m-2 14-2-2m2 2 2-2M5 6.5 7.7 7m-2.7-.5.5 2.8M19 6.5 16.3 7m2.7-.5-.5 2.8m-13 8 .5-2.8m-.5 2.8 2.7.5m10.3-.5-.5-2.8m.5 2.8-2.7.5" />,
  tag: <path d="m12 3 9 9-7.5 7.5a1.5 1.5 0 0 1-2 0L3 11V3h9Zm-5 4a1 1 0 1 0 .1 0Z" />,
  swap: <path d="M7 10 3 6l4-4M3 6h13a4 4 0 0 1 4 4M17 14l4 4-4 4m4-4H8a4 4 0 0 1-4-4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m4 12.5 5 5L20 6.5" />,
  "arrow-up": <path d="M12 19V5m-6 6 6-6 6 6" />,
  "arrow-down": <path d="M12 5v14m6-6-6 6-6-6" />,
  eye: <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />,
  clock: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3.5 2" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  heart: <path d="M12 20.5S4.5 15.5 4.5 10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.5-7.5 10.5-7.5 10.5Z" />,
  send: <path d="m4 12 16-8-4.5 16-3.5-6.5L4 12Zm8 1.5L20 4" />,
  "chat-bubble": <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6Zm4 3h8M8 12h5" />,
  handshake: <path d="m3 8 4-2 5 2 5-2 4 2v7l-4 2-2.5-2.5M7 6v8m10-8v8M7 14l4 4 5-5m-9-1 3 3" />,
  globe: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c-2.5 2.5-3.8 5.6-3.8 9s1.3 6.5 3.8 9c2.5-2.5 3.8-5.6 3.8-9S14.5 5.5 12 3Z" />,
  refresh: <path d="M20 8A8 8 0 0 0 6 6.5L4 9m0-5v5h5m-5 7a8 8 0 0 0 14 1.5L20 15m0 5v-5h-5" />,
} as const;

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.6,
  ...rest
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
} & SVGProps<SVGSVGElement>) {
  const path = PATHS[name as IconName] ?? PATHS["coin"];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {path}
    </svg>
  );
}
