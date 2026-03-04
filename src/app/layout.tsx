import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "تقرير أمن المعلومات",
  description: "نظام إنشاء تقارير أمن المعلومات الاحترافي – إدارة أمن المعلومات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ fontFamily: '"Cairo", sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
