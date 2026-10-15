export function getErrorMessage(err: unknown, fallback = "Internal server error"): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}
