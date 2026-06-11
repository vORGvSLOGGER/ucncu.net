"use client";

import { useState } from "react";
import { useGameMode } from "@/lib/state/GameContext";
import { Icon } from "../ui/Icon";

export function ModeSelect() {
  const { chooseMode } = useGameMode();
  const [whyLocked, setWhyLocked] = useState(false);

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-gold/50 bg-gold/10 text-gold glow-gold">
            <Icon name="shield" size={28} />
          </span>
          <h1 className="text-2xl font-extrabold tracking-wide text-gold-grad" dir="ltr">
            UCNCU.NET
          </h1>
          <p className="mt-2 text-sm text-muted">اختر طور اللعب — لكل طور اقتصاده وتخزينه المنفصل تمامًا</p>
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

          {/* real mode — locked */}
          <div className="card-base relative overflow-hidden p-6 opacity-80">
            <div className="mb-3 flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-edge bg-card text-muted">
                <Icon name="globe" size={24} />
              </span>
              <span className="flex items-center gap-1 rounded-full border border-edge bg-card px-3 py-1 text-[10px] font-bold text-muted">
                <Icon name="lock" size={11} />
                قريبًا
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-muted">طور الحقيقة</h2>
            <p className="mt-2 text-xs leading-6 text-muted">
              اقتصاد حقيقي مشترك بين لاعبين حقيقيين، بتسجيل دخول عبر البريد. نفس اللعبة
              التي تعرفها في التجريبي — لكن منافسوك بشر.
            </p>
            <button
              onClick={() => setWhyLocked((v) => !v)}
              className="mt-4 text-[11px] font-bold text-teal underline-offset-4 hover:underline"
            >
              لماذا مقفل؟
            </button>
            {whyLocked && (
              <div className="mt-3 rounded-xl border border-edge bg-card2 p-3 text-[11px] leading-5 text-muted animate-toast-in">
                نطور اللعبة كاملة في الطور التجريبي أولًا، وبعد اعتماد المجتمع لها يُفتح
                الأون لاين. تنبيه: في طور الحقيقة الإفلاس <b className="text-down">نهائي</b> —
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
