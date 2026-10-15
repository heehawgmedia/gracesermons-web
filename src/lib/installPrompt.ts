import { useSyncExternalStore } from 'react';

// Android Chrome fires `beforeinstallprompt` once, early in the page load, when
// the app is installable. Catch it at startup (imported from main.tsx) so the
// install button can open the native dialog later. iOS has no equivalent.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

/** True while the browser can show its install dialog. */
export function useCanPrompt(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => deferred !== null,
    () => false
  );
}

/** Opens the native install dialog (Android). Each prompt can be used once. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const evt = deferred;
  deferred = null;
  notify();
  await evt.prompt();
  return (await evt.userChoice).outcome === 'accepted';
}
