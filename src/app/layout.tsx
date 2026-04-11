import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from '@/components/theme/ThemeProvider';
import { DEFAULT_THEME_MODE, THEME_STORAGE_KEY } from '@/lib/theme';

export const metadata: Metadata = {
  title: "InfoSec Platform",
};

const themeInitScript = `
(() => {
  const STORAGE_KEY = '${THEME_STORAGE_KEY}';
  const DEFAULT_MODE = '${DEFAULT_THEME_MODE}';
  const normalize = (value) => (value === 'light' || value === 'dark' || value === 'system' ? value : DEFAULT_MODE);

  let mode = DEFAULT_MODE;
  try {
    const storedMode = window.localStorage.getItem(STORAGE_KEY);
    if (storedMode) {
      mode = normalize(storedMode);
    }
  } catch {
    mode = DEFAULT_MODE;
  }

  const prefersDark = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;

  const root = document.documentElement;
  root.setAttribute('data-theme-mode', mode);
  root.setAttribute('data-theme', resolved);
  root.classList.toggle('theme-dark', resolved === 'dark');
  root.classList.toggle('theme-light', resolved === 'light');
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ar' suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider initialMode={DEFAULT_THEME_MODE}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
