export const ISMS_WORKSPACE_ID = "default";

const RESERVED_KEYS = new Set(["id", "workspace", "workspaceId", "createdAt", "updatedAt"]);

export function sanitizeEntityPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const source = payload as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (RESERVED_KEYS.has(key)) continue;
    cleaned[key] = value;
  }

  return cleaned;
}

export function parseJsonMap<T>(value: string, fallback: T): T {
  try {
    const parsed = JSON.parse(value);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function stringifyJsonMap(value: unknown, fallback: unknown): string {
  const target = value === undefined ? fallback : value;

  try {
    return JSON.stringify(target ?? fallback);
  } catch {
    return JSON.stringify(fallback);
  }
}
