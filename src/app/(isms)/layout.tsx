import type { Metadata } from "next";
import { Fira_Code, Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-fira-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ISO 27001 CISO Command Suite",
};

export default function IsmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section lang="en" dir="ltr" className={`${spaceGrotesk.className} ${firaCode.variable} min-h-full`}>
      {children}
    </section>
  );
}
