// Supabase's Postgrest/Auth errors carry message/hint/details/code — logging
// only `.message` (the default Error field) throws away the most useful part,
// usually `hint`, which often spells out the actual fix (e.g. for RLS denials).
export function describeError(err: unknown): string {
  console.error(err);
  if (err && typeof err === 'object') {
    const { message, hint, details, code } = err as Record<string, unknown>;
    const parts = [message, hint, details, code].filter(
      (part): part is string => typeof part === 'string' && part.length > 0
    );
    if (parts.length) return parts.join(' — ');
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}
