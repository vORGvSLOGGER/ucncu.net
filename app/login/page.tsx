"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/PageTitle";
import { useAuth } from "@/lib/auth/AuthContext";

export default function LoginPage() {
  const { status, email: sessionEmail, sendOtp, verifyOtp, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEmail = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await sendOtp(email.trim());
    setBusy(false);
    if (err) setError(err);
    else setStage("code");
  };

  const submitCode = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await verifyOtp(email.trim(), code.trim());
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="mx-auto max-w-md">
      <PageTitle icon="user" title="تسجيل الدخول" sub="حساب واحد لكل الأطوار — بريدك هو هويتك" />

      {status === "disabled" && (
        <Card glow="teal" className="p-6 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-edge bg-card text-muted">
            <Icon name="lock" size={22} />
          </span>
          <h3 className="text-sm font-bold text-ink">تسجيل الدخول غير مفعّل بعد</h3>
          <p className="mt-2 text-[11px] leading-6 text-muted">
            سيتوفر تسجيل الدخول بالبريد مع إطلاق <b className="text-gold">طور الحقيقة</b> —
            حيث يصبح تقدمك مرتبطًا بحسابك وتنافس لاعبين حقيقيين. حاليًا استمتع بالطور
            التجريبي كضيف، تقدمك محفوظ على جهازك.
          </p>
          <Link href="/" className="btn-gold mt-4 inline-block px-6 py-2.5 text-sm">
            متابعة كضيف ←
          </Link>
        </Card>
      )}

      {status === "authed" && (
        <Card glow="gold" className="p-6 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-up/50 bg-up/10 text-up">
            <Icon name="check" size={22} />
          </span>
          <h3 className="text-sm font-bold text-ink">مسجل الدخول</h3>
          <p className="mt-1 text-xs text-muted" dir="ltr">
            {sessionEmail}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/" className="btn-gold px-6 py-2.5 text-sm">
              إلى اللعبة ←
            </Link>
            <button onClick={() => signOut()} className="btn-ghost px-6 py-2.5 text-sm">
              تسجيل الخروج
            </button>
          </div>
        </Card>
      )}

      {(status === "guest" || status === "loading") && (
        <Card glow="teal" className="p-6">
          {stage === "email" ? (
            <>
              <label className="mb-1.5 block text-[11px] font-bold text-muted">
                البريد الإلكتروني
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && email.includes("@") && submitEmail()}
                type="email"
                dir="ltr"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-edge bg-card2 px-3 py-3 text-sm text-ink outline-none focus:border-teal/50"
              />
              <button
                disabled={busy || !email.includes("@")}
                onClick={submitEmail}
                className="btn-gold mt-3 w-full py-3 text-sm"
              >
                {busy ? "جارٍ الإرسال…" : "أرسل رمز التحقق ✉️"}
              </button>
              <p className="mt-3 text-center text-[10px] leading-5 text-muted">
                سنرسل رمزًا من 6 أرقام إلى بريدك — لا كلمات مرور هنا.
                <br />
                تنبيه: في طور الحقيقة، الإفلاس يحظر هذا البريد نهائيًا.
              </p>
            </>
          ) : (
            <>
              <p className="mb-3 text-center text-xs text-muted">
                أرسلنا رمز تحقق إلى <b className="text-ink" dir="ltr">{email}</b>
              </p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && code.length === 6 && submitCode()}
                inputMode="numeric"
                dir="ltr"
                placeholder="● ● ● ● ● ●"
                className="w-full rounded-xl border border-edge bg-card2 px-3 py-3 text-center font-mono text-xl tracking-[0.5em] text-ink outline-none focus:border-gold/50"
              />
              <button
                disabled={busy || code.length !== 6}
                onClick={submitCode}
                className="btn-gold mt-3 w-full py-3 text-sm"
              >
                {busy ? "جارٍ التحقق…" : "تحقق وادخل ←"}
              </button>
              <button
                onClick={() => {
                  setStage("email");
                  setCode("");
                  setError(null);
                }}
                className="btn-ghost mt-2 w-full py-2 text-xs"
              >
                تغيير البريد
              </button>
            </>
          )}
          {error && (
            <p className="mt-3 rounded-xl border border-down/40 bg-down/10 p-2.5 text-center text-[10px] text-down" dir="ltr">
              {error}
            </p>
          )}
          <Link href="/" className="mt-3 block text-center text-[10px] font-bold text-teal hover:underline">
            متابعة كضيف بدون حساب ←
          </Link>
        </Card>
      )}
    </div>
  );
}
