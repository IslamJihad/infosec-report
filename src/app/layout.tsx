import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfoSec Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
