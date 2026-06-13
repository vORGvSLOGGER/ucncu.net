"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageTitle } from "@/components/ui/PageTitle";
import { useAuth } from "@/lib/auth/AuthContext";
import { cloudConfigured, postFeed } from "@/lib/cloud/client";

export default function AdminPage() {
  const auth = useAuth();
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  if (!cloudConfigured()) {
    return (
      <div className="mx-auto max-w-md">
        <PageTitle icon="shield" title="لوحة الإدارة العليا" sub="حصرية لحسابات الإدارة في طور الحقيقة" />
        <Card className="p-6 text-center text-xs leading-6 text-muted">
          الطور الحقيقي غير مفعّل بعد — لوحة الإدارة تظهر عند ربط Supabase وتسجيل الدخول بحساب إداري.
          <Link href="/" className="mt-4 block font-bold text-teal hover:underline">العودة ←</Link>
        </Card>
      </div>
    );
  }

  if (!auth.isAdmin) {
    return (
      <div className="mx-auto max-w-md">
        <PageTitle icon="shield" title="لوحة الإدارة العليا" sub="حصرية لحسابات الإدارة" />
        <Card className="p-6 text-center text-xs leading-6 text-muted">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-down/40 bg-down/10 text-down">
            <Icon name="lock" size={22} />
          </span>
          غير مصرّح. هذه الصفحة حصرية لحسابات الإدارة العليا (بريدك ليس ضمن قائمة الإداريين).
          <Link href="/" className="mt-4 block font-bold text-teal hover:underline">العودة ←</Link>
        </Card>
      </div>
    );
  }

  const announce = async () => {
    const body = text.trim();
    if (!body || !auth.userId) return;
    const ok = await postFeed({
      authorId: auth.userId,
      authorName: "الإدارة العليا — UCNCU",
      kind: "milestone",
      text: body,
      isAdmin: true,
    });
    if (ok) {
      setText("");
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle icon="shield" title="لوحة الإدارة العليا 🏛️" sub={`مسجّل بصلاحية إدارية: ${auth.email}`} />

      <Card glow="gold" className="p-4">
        <SectionTitle icon="globe" title="إعلان رسمي" sub="يُنشر في الفيد العالمي بشارة «رسمي» لكل اللاعبين" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={280}
          placeholder="مثال: انطلاق موسم الأرباح المضاعفة لمدة 24 ساعة 🎉"
          className="w-full resize-none rounded-xl border border-edge bg-card2 px-3 py-2.5 text-xs text-ink outline-none focus:border-gold/50"
        />
        <button onClick={announce} disabled={!text.trim()} className="btn-gold mt-2 w-full py-2.5 text-sm">
          نشر الإعلان الرسمي 📣
        </button>
        {sent && <p className="mt-2 text-center text-[11px] text-up">✓ نُشر الإعلان للمجتمع</p>}
      </Card>

      <Card className="mt-4 p-4 text-[11px] leading-6 text-muted">
        <SectionTitle icon="settings" title="صلاحيات قادمة" />
        التوثيق، إطلاق المزادات الخاصة، أحداث السوق، والتتويج الأسبوعي تعمل حاليًا عبر
        «الإدارة الآلية» (NPC) في كل لعبة. ربط هذه الصلاحيات بحسابات الإدارة الحقيقية على
        مستوى الخادم هو الخطوة التالية بعد استقرار الأونلاين v1.
      </Card>
    </div>
  );
}
