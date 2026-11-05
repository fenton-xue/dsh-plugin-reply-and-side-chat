/**
 * Host half of the reply-and-side-chat bundle.
 *
 * The Client owns all UI. The Host only stamps a per-process boot id into
 * index.html so the Client can tell a page refresh (same Host process, side
 * chats survive) from a Host restart (side chats are cleaned up).
 */
import { randomUUID } from 'node:crypto';

const BOOT_KEY = Symbol.for('dsh-plugin-reply-and-side-chat/boot');
const BOOT_META = 'dsh-reply-and-side-chat-boot';

export function apply(ctx) {
  // Kept on globalThis so reloading only this plugin does not count as a restart.
  globalThis[BOOT_KEY] ??= randomUUID();
  const boot = globalThis[BOOT_KEY];
  const meta = `<meta name="${BOOT_META}" content="${boot}">`;
  ctx.inject(['webServer'], (scope) => {
    scope.effect(
      () => scope.webServer.tapIndex((html) => html.replace(/<head(\s[^>]*)?>/i, (head) => `${head}${meta}`)),
      'reply-and-side-chat: boot id',
    );
  });
}
