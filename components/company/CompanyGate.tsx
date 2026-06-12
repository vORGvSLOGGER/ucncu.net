"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { activeCompany } from "@/lib/engine/company";
import { useGame } from "@/lib/state/GameContext";
import type { Company } from "@/lib/types";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";

/** renders children with the active company, or a founding CTA when none exists */
export function CompanyGate({ children }: { children: (company: Company) => ReactNode }) {
  const game = useGame();
  const company = activeCompany(game);

  if (!company) {
    return (
      <div className="grid place-items-center py-16">
        <Card glow="teal" className="max-w-md p-8 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-teal/40 bg-teal/10 text-teal">
            <Icon name="briefcase" size={26} />
          </span>
          <h2 className="text-base font-extrabold text-ink">عالم الشركات بانتظارك</h2>
          <p className="mt-2 text-xs leading-6 text-muted">
            ابدأ فردًا، راكم رأس المال، ثم أسس شركتك لتدخل هذا الوضع: وظّف منسوبين، خذ
            العقود، وزّع الأرباح، ونافس على توب 10 — كل ذلك بشريط تحكم خاص بالشركة.
          </p>
          <Link href="/companies" className="btn-gold mt-5 inline-block px-6 py-2.5 text-sm">
            أسس شركتك الأولى 🚀
          </Link>
        </Card>
      </div>
    );
  }

  return <>{children(company)}</>;
}
