"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { cloudConfigured } from "@/lib/cloud/client";
import { useGameMode } from "@/lib/state/GameContext";
import { Icon } from "../ui/Icon";

export function ModeSelect() {
  const { chooseMode } = useGameMode();
  const auth = useAuth();
  const router = useRouter();
  const [whyLocked, setWhyLocked] = useState(false);

  const configured = cloudConfigured();
  const authed = auth.status === "authed";
  const banned = auth.status === "banned";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const artUrl = `${basePath}/images/ucncu-command-room.jpg`;

  const enterReal = () => {
    if (!configured) return;
    if (banned) return;
    if (authed) chooseMode("real");
    else router.push("/login?next=real");
  };

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="mb-5 overflow-hidden rounded-3xl border border-gold/30 bg-card2 shadow-2xl">
          <div
            className="relative min-h-72 bg-cover bg-center p-5 sm:p-7"
            style={{ backgroundImage: `url(${artUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-bg via-bg/78 to-bg/20" />
            <div className="relative flex min-h-60 max-w-xl flex-col justify-end">
              <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-gold/50 bg-gold/10 text-gold glow-gold">
                <Icon name="shield" size={28} />
              </span>
              <h1 className="text-3xl font-extrabold tracking-wide text-gold-grad sm:text-4xl" dir="ltr">
                UCNCU.NET
              </h1>
              <p className="mt-2 text-sm leading-7 text-muted">
                عالم استثماري تفاعلي: سوق حي، مزادات، تداول، عقارات، شركات، وأصدقاء داخل اقتصاد واحد.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold">
                {["اقتصاد حي", "ذكاء منافسين", "قرارات استراتيجية", "تقدم محفوظ"].map((label) => (
                  <span key={label} className="rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-teal">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 text-center">
          <p className="text-sm text-muted">اختر طور اللعب — لكل طور اقتصاده وتخزينه المنفصل تمامًا</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* demo mode */}
          <button
            onClick={() => chooseMode("demo")}
            className="card-base glow-gold group relative overflow-hidden p-6 text-start transition hover:scale-[1.02]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-gold/40 bg-gold/10 text-gold">
                <Icon name="bolt" size={24} />
              </span>
              <span className="rounded-full border border-up/40 bg-up/10 px-3 py-1 text-[10px] font-bold text-up">
                متاح الآن
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-ink">الطور التجريبي</h2>
            <p className="mt-2 text-xs leading-6 text-muted">
              اقتصاد كامل يعمل على جهازك: نافس 10 تجارًا يديرهم الذكاء الاصطناعي، تداول
              واستثمر وأسس الشركات وتعلم بلا خسائر حقيقية. كل ما تطوره هنا تجربة كاملة
              للعبة قبل الأون لاين.
            </p>
            <span className="btn-gold mt-4 inline-block px-5 py-2 text-sm">ابدأ التجربة ←</span>
          </button>

          {/* real mode */}
          <div
            className={`card-base relative overflow-hidden p-6 ${
              configured && !banned ? "glow-teal" : "opacity-80"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`grid h-12 w-12 place-items-center rounded-xl border ${
                  configured && !banned
                    ? "border-teal/50 bg-teal/10 text-teal"
                    : "border-edge bg-card text-muted"
                }`}
              >
                <Icon name="globe" size={24} />
              </span>
              {banned ? (
                <span className="rounded-full border border-down/50 bg-down/10 px-3 py-1 text-[10px] font-bold text-down">
                  محظور نهائيًا
                </span>
              ) : configured ? (
                <span className="rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-[10px] font-bold text-teal">
                  مفعّل
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-edge bg-card px-3 py-1 text-[10px] font-bold text-muted">
                  <Icon name="lock" size={11} />
                  قريبًا
                </span>
              )}
            </div>
            <h2 className={`text-lg font-extrabold ${configured && !banned ? "text-ink" : "text-muted"}`}>
              طور الحقيقة
            </h2>
            <p className="mt-2 text-xs leading-6 text-muted">
              اقتصاد حقيقي مشترك بين لاعبين حقيقيين، بتسجيل دخول عبر البريد. نفس اللعبة
              التي تعرفها في التجريبي — لكن منافسوك بشر، والمتصدرون والسوق مشتركون للجميع.
            </p>

            {banned ? (
              <div className="mt-4 rounded-xl border border-down/40 bg-down/10 p-3 text-[11px] leading-5 text-down">
                هذا البريد محظور من الطور الحقيقي بعد إفلاس نهائي. يمكنك متابعة اللعب في
                الطور التجريبي.
              </div>
            ) : configured ? (
              <button onClick={enterReal} className="btn-teal mt-4 px-5 py-2 text-sm">
                {authed ? "ادخل الطور الحقيقي ←" : "سجّل الدخول للّعب الحقيقي ←"}
              </button>
            ) : (
              <button
                onClick={() => setWhyLocked((v) => !v)}
                className="mt-4 text-[11px] font-bold text-teal underline-offset-4 hover:underline"
              >
                لماذا مقفل؟
              </button>
            )}

            {whyLocked && !configured && (
              <div className="mt-3 rounded-xl border border-edge bg-card2 p-3 text-[11px] leading-5 text-muted animate-toast-in">
                الطور الحقيقي يحتاج ربط المنصة بخادم (Supabase). بمجرد إضافة المفاتيح
                يُفتح تلقائيًا. تنبيه: في طور الحقيقة الإفلاس <b className="text-down">نهائي</b> —
                من تُشهر إفلاسه ولا يُنقذ خلال 5 ساعات يُحظر بريده من اللعبة للأبد.
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-muted">
          يمكنك تغيير الطور لاحقًا من إعدادات البروفايل · تقدمك في كل طور محفوظ على حدة
        </p>
      </div>
    </div>
  );
}
