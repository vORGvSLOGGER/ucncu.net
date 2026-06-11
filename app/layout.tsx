import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { GameProvider } from "@/lib/state/GameContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "UCNCU.NET — لعبة الاقتصاد والاستثمار",
  description:
    "لعبة اقتصادية تعليمية تنافسية: تداول، استثمر، أسس الشركات، وادخل المزادات في عالم اقتصادي متكامل.",
};

export const viewport: Viewport = {
  themeColor: "#070b14",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthProvider>
          <GameProvider>
            <AppShell>{children}</AppShell>
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
