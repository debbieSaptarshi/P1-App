type Extra = Record<string, unknown>;

function describe(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function captureException(error: unknown, extra?: Extra): void {
  console.error('[adaptive-food-coach]', describe(error), extra ?? '');
}

export function captureMessage(message: string, extra?: Extra): void {
  console.warn('[adaptive-food-coach]', message, extra ?? '');
}
