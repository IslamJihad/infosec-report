import type { Metadata } from "next";
import { Cairo } from "next/font/google";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "تقرير أمن المعلومات",
  description: "نظام إنشاء تقارير أمن المعلومات الاحترافي",
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <section dir="rtl" className={`${cairo.className} min-h-full`}>
      {children}
    </section>
  );
}
