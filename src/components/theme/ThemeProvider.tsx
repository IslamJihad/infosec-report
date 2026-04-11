'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_THEME_MODE,
  normalizeThemeMode,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeMode,
} from '@/lib/theme';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: ResolvedTheme;
  setMode: (nextMode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeToDocument(mode: ThemeMode, resolvedMode: ResolvedTheme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.setAttribute('data-theme-mode', mode);
  root.setAttribute('data-theme', resolvedMode);
  root.classList.toggle('theme-dark', resolvedMode === 'dark');
  root.classList.toggle('theme-light', resolvedMode === 'light');
}

function readStoredThemeMode(): ThemeMode | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored ? normalizeThemeMode(stored) : null;
  } catch {
    return null;
  }
}

function writeStoredThemeMode(mode: ThemeMode) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Ignore storage write failures in locked-down browser contexts.
  }
}

async function persistThemeMode(mode: ThemeMode) {
  try {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: mode }),
      keepalive: true,
    });
  } catch {
    // Theme will still persist locally if network/API fails.
  }
}

async function fetchPersistedThemeMode(): Promise<ThemeMode | null> {
  try {
    const response = await fetch('/api/settings', { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { theme?: string };
    return payload.theme ? normalizeThemeMode(payload.theme) : null;
  } catch {
    return null;
  }
}

export default function ThemeProvider({
  children,
  initialMode = DEFAULT_THEME_MODE,
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(() => normalizeThemeMode(initialMode));

  const [prefersDark, setPrefersDark] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const onChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const domMode = document.documentElement.getAttribute('data-theme-mode');
    if (!domMode) {
      return;
    }

    const normalizedMode = normalizeThemeMode(domMode);

    void Promise.resolve().then(() => {
      setModeState((currentMode) => currentMode === normalizedMode ? currentMode : normalizedMode);
    });
  }, []);

  useEffect(() => {
    if (readStoredThemeMode()) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const persistedMode = await fetchPersistedThemeMode();
      if (!persistedMode || cancelled) {
        return;
      }

      setModeState((currentMode) => normalizeThemeMode(currentMode) === persistedMode ? currentMode : persistedMode);
      writeStoredThemeMode(persistedMode);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedMode = useMemo(
    () => resolveTheme(mode, prefersDark),
    [mode, prefersDark],
  );

  useEffect(() => {
    applyThemeToDocument(mode, resolvedMode);
  }, [mode, resolvedMode]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    const normalized = normalizeThemeMode(nextMode);
    setModeState(normalized);
    writeStoredThemeMode(normalized);
    void persistThemeMode(normalized);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedMode, setMode }),
    [mode, resolvedMode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
