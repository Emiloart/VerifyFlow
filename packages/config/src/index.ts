export type EnvSource = Record<string, string | undefined>;

export function requiredEnv(env: EnvSource, key: string): string {
  const value = env[key];
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable ${key}.`);
  }

  return value;
}

export function optionalEnv(env: EnvSource, key: string, fallback: string): string {
  const value = env[key];
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return value;
}

export function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

