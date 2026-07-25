const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "key",
  "authorization",
  "cookie",
  "creditcard",
  "ssn",
  "apikey",
  "accesstoken",
  "refreshtoken",
];

const REDACTED_STRING = "[REDACTED]";

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function redactSensitiveFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveFields(item)) as unknown as T;
  }

  if (isPlainObject(obj)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveKey(key)) {
        result[key] = REDACTED_STRING;
      } else {
        result[key] = redactSensitiveFields(value);
      }
    }
    return result as T;
  }

  return obj;
}
