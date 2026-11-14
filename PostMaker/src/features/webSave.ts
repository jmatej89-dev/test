/**
 * Web build only (the artifact page opened from the chat): files are handed to the viewer through
 * the host's `downloads` capability – in the Claude iOS app that opens the system share sheet,
 * where "Uložit obrázek" puts the slide into Photos.
 */
type Downloads = { save: (r: { filename: string; data: Blob }) => Promise<unknown> };
type ClaudeHost = { use?: (name: string) => Promise<unknown> };

export async function webDownloads(): Promise<Downloads | null> {
  const host = (globalThis as unknown as { claude?: ClaudeHost }).claude;
  if (!host?.use) return null;
  try {
    return ((await host.use('downloads')) as Downloads | null) ?? null;
  } catch {
    return null;
  }
}

export function errorCode(e: unknown): string {
  return (e as { code?: string })?.code ?? 'unavailable';
}
