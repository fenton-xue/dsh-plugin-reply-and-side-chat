window.__ModuleLoader__.load({
  id: 'dsh-plugin-reply-and-side-chat',
  factory(require) {
    const React = require('react');
    const { createElement: h, Fragment, useState, useEffect, useLayoutEffect, useRef, useMemo, useSyncExternalStore } = React;

    /** Locale namespace owned by this plugin. */
    const NS = 'replySideChat';
    /** Sidebar tab type identity; also the key of its body and title cells. */
    const TAB_ID = 'dsh-plugin-reply-and-side-chat/side-chat';
    const KIND = 'dsh-side-chat';
    /** Input-trigger source owning the hidden quote chips; also the chip's DOM marker. */
    const SOURCE = 'dsh-reply-quote';
    /** User-text rule id; also the key of the sent-bubble renderer. */
    const RULE_ID = 'dsh-reply-quote';
    const CHILD_SLOT = 'dsh-side-chat.conversation';
    const STORAGE_KEY = 'dsh-reply-and-side-chat.v1';
    const BOOT_META = 'dsh-reply-and-side-chat-boot';

    const zh = {
      'toolbar.sideChat': '侧边聊天',
      'toolbar.reply': '回复',
      'reply.placeholder': '回复这段内容',
      'reply.add': '添加回复',
      'reply.save': '保存',
      'reply.cancel': '取消',
      'reply.failed': '暂时无法加入输入框，请稍后再试',
      'card.label': '回复',
      'card.remove': '移除这条回复',
      'card.edit': '编辑回复',
      'tab.title': '侧边聊天 {n}',
      'tab.fallback': '侧边聊天',
      'guide.title': '侧边聊天',
      'guide.description': '基于当前对话开一个临时聊天',
      'empty': '还没有消息',
      'composer.placeholder': '在侧边聊天中提问',
      'composer.send': '发送',
      'composer.sending': '正在创建侧边聊天…',
      'error.fork': '创建侧边聊天失败：{message}',
      'error.send': '消息没有发出去：{message}。内容已放回输入框，可以重新发送。',
    };
    const en = {
      'toolbar.sideChat': 'Start a side chat',
      'toolbar.reply': 'Reply',
      'reply.placeholder': 'Reply to this',
      'reply.add': 'Add reply',
      'reply.save': 'Save',
      'reply.cancel': 'Cancel',
      'reply.failed': 'Could not add it to the composer. Try again shortly.',
      'card.label': 'Reply',
      'card.remove': 'Remove this reply',
      'card.edit': 'Edit reply',
      'tab.title': 'Side chat {n}',
      'tab.fallback': 'Side chat',
      'guide.title': 'Side chat',
      'guide.description': 'A temporary chat that knows this conversation',
      'empty': 'No messages yet',
      'composer.placeholder': 'Ask in the side chat',
      'composer.send': 'Send',
      'composer.sending': 'Creating side chat…',
      'error.fork': 'Could not create the side chat: {message}',
      'error.send': 'The message was not sent: {message}. It is back in the composer; send it again.',
    };

    // ---------------------------------------------------------------- styles

    /** Selection toolbar tuning (px): distance from the selection, the bar's own vertical padding, and each button's vertical padding. */
    const TOOLBAR_GAP = 14;
    const TOOLBAR_PAD_Y = 2;
    const TOOLBAR_BUTTON_PAD_Y = 3;

    const STYLE_TEXT = `
.rsc-layer{position:fixed;z-index:60;pointer-events:auto;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary)}
.rsc-toolbar{display:flex;align-items:center;transform:translate(-50%,0);background:var(--dsw-alias-bg-base);border-radius:var(--dsw-radius-lg,12px);box-shadow:var(--dsw-elevation-prominent,0 0 0 .5px rgba(0,0,0,.16),0 3px 8px rgba(0,0,0,.04));padding:${TOOLBAR_PAD_Y}px 4px;white-space:nowrap;user-select:none}
.rsc-toolbar button{border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;padding:${TOOLBAR_BUTTON_PAD_Y}px 10px;border-radius:var(--dsw-radius-sm,6px);cursor:pointer}
.rsc-toolbar button:hover{background:var(--dsw-alias-interactive-bg-hover)}
.rsc-toolbar .rsc-sep{width:1px;align-self:stretch;margin:5px 2px;background:var(--dsw-alias-border-l2)}
.rsc-pop{box-sizing:border-box;width:360px;max-width:calc(100vw - 24px);transform:translate(-50%,0);background:var(--dsw-alias-bg-base);border-radius:var(--dsw-radius-xl,16px);box-shadow:var(--dsw-elevation-prominent,0 0 0 .5px rgba(0,0,0,.16),0 3px 8px rgba(0,0,0,.04));padding:12px 12px 8px}
.rsc-quote{border-left:3px solid var(--dsw-alias-border-l2);padding-left:8px;color:var(--dsw-alias-label-tertiary);white-space:pre-wrap;word-break:break-word;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3}
.rsc-pop-row{display:flex;align-items:flex-end;gap:8px;margin-top:10px}
.rsc-pop textarea,.rsc-composer textarea{flex:1;min-width:0;resize:none;border:0;outline:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;padding:2px 0;max-height:160px}
.rsc-pop textarea::placeholder,.rsc-composer textarea::placeholder{color:var(--dsw-alias-label-tertiary)}
.rsc-icon-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.rsc-icon-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.rsc-icon-btn:disabled{opacity:.4;cursor:default}
.rsc-error{margin-top:6px;color:var(--dsw-alias-state-error-primary);font-size:12px}
.rsc-dock-wrap{display:flex;flex-direction:column;align-items:center;padding:0 var(--dsh-composer-side-clearance,16px)}
.rsc-dock-inner{box-sizing:border-box;width:100%;max-width:var(--dsh-composer-card-max-width,800px)}
.rsc-dock{display:flex;gap:8px;overflow-x:auto;padding:2px 0 8px}
.rsc-card{position:relative;flex:none;width:160px;min-height:76px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;padding:10px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg,12px);background:var(--dsw-alias-bg-base);cursor:pointer;text-align:left;font:inherit;font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary)}
.rsc-card:hover{background:var(--dsw-alias-interactive-bg-hover)}
.rsc-card .rsc-quote{-webkit-line-clamp:3}
.rsc-pill{align-self:flex-start;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;font-size:12px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.rsc-card-remove{position:absolute;top:4px;right:4px;width:22px;height:22px;opacity:0}
.rsc-card:hover .rsc-card-remove,.rsc-card:focus-within .rsc-card-remove{opacity:1}
.rsc-edit{margin:0 0 8px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg,12px);background:var(--dsw-alias-bg-base)}
.rsc-edit-actions{display:flex;justify-content:flex-end;gap:4px;margin-top:6px}
.rsc-text-btn{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;padding:2px 8px;border-radius:var(--dsw-radius-sm,6px);cursor:pointer}
.rsc-text-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.rsc-tab{width:100%;min-width:0;height:100%;min-height:0;display:flex;flex-direction:column}
.rsc-empty{flex:1;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);font-size:14px}
.rsc-composer{margin:0 12px 12px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-xl,16px);background:var(--dsw-alias-bg-base);display:flex;align-items:flex-end;gap:8px;font-size:14px;line-height:22px}
.rsc-status{margin:8px 16px;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.rsc-status.rsc-bad{color:var(--dsw-alias-state-error-primary)}
.rsc-bubble-quote{display:block;border-left:3px solid var(--dsw-alias-border-l2);padding-left:8px;color:var(--dsw-alias-label-tertiary);white-space:pre-wrap}
.rsc-bubble-reply{display:block;white-space:pre-wrap;margin-bottom:4px}
[data-composer-chip="${SOURCE}"]{display:none!important}
`;
    function Style() {
      return h('style', { 'data-plugin': 'dsh-plugin-reply-and-side-chat' }, STYLE_TEXT);
    }

    function Icon({ d, size = 16 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        d.map((p, i) => h('path', { key: i, d: p })));
    }
    const ICON_ADD = ['M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z', 'M12 6.5v6', 'M9 9.5h6'];
    const ICON_CLOSE = ['M6 6l12 12', 'M18 6L6 18'];
    const ICON_SEND = ['M20 5v7a3 3 0 0 1-3 3H5', 'M9 11l-4 4 4 4'];
    function SideChatIcon(props) {
      const size = typeof props?.size === 'number' ? props.size : 20;
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', className: props?.className, 'aria-hidden': true },
        h('path', { d: 'M3.5 6A2.5 2.5 0 0 1 6 3.5h7A2.5 2.5 0 0 1 15.5 6v4A2.5 2.5 0 0 1 13 12.5H8l-3.5 3v-3A1.5 1.5 0 0 1 3.5 11z' }),
        h('path', { d: 'M18 8.5a2.5 2.5 0 0 1 2.5 2.5v4a1.5 1.5 0 0 1-1 1.4v3.1l-3.5-3h-5a2.5 2.5 0 0 1-2.5-2.5v-.5' }));
    }

    // ---------------------------------------------------------------- quote codec

    function oneLine(text, max) {
      const flat = text.replace(/\s+/g, ' ').trim();
      return max !== undefined && flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
    }
    function encodeRef(quote, reply) {
      return JSON.stringify({ q: quote, r: reply });
    }
    function decodeRef(ref) {
      try {
        const value = JSON.parse(ref);
        if (value !== null && typeof value === 'object' && typeof value.q === 'string') return { quote: value.q, reply: typeof value.r === 'string' ? value.r : '' };
      } catch { /* fall through */ }
      return { quote: String(ref), reply: '' };
    }
    /** Keep content from closing the wrapper tags early; the bubble renderer undoes it. */
    function escapeTags(text) {
      return text.replace(/<\/(quote_reply|quote|reply)>/g, '<\u200b/$1>');
    }
    function unescapeTags(text) {
      return text.replace(/<\u200b\//g, '</');
    }
    /** Model text of one quote chip; the host splices it in at submit time. */
    function serializeQuote(ref) {
      const { quote, reply } = decodeRef(ref);
      let out = `<quote_reply>\n<quote>${escapeTags(quote)}</quote>\n`;
      if (reply.trim() !== '') out += `<reply>${escapeTags(reply.trim())}</reply>\n`;
      return `${out}</quote_reply>\n`;
    }
    function clipboardOf(quote, reply) {
      return `> ${oneLine(quote, 200)}${reply.trim() === '' ? '' : ` ${oneLine(reply, 200)}`}`;
    }
    function quoteInsert(quote, reply) {
      return { source: SOURCE, ref: encodeRef(quote, reply), label: oneLine(quote, 40), clipboardText: clipboardOf(quote, reply) };
    }
    const QUOTE_RE = /<quote_reply>\n<quote>([\s\S]*?)<\/quote>\n(?:<reply>([\s\S]*?)<\/reply>\n)?<\/quote_reply>\n? ?/g;
    const quoteRule = {
      id: RULE_ID,
      order: 10,
      match(text, from) {
        QUOTE_RE.lastIndex = from;
        const found = QUOTE_RE.exec(text);
        if (found === null) return undefined;
        return { id: RULE_ID, start: found.index, end: found.index + found[0].length, data: { quote: unescapeTags(found[1]), reply: unescapeTags(found[2] ?? '') } };
      },
    };
    function QuoteNode({ node }) {
      return h(Fragment, null,
        h('span', { className: 'rsc-bubble-quote' }, node.data.quote),
        node.data.reply === '' ? null : h('span', { className: 'rsc-bubble-reply' }, node.data.reply));
    }

    // ---------------------------------------------------------------- side chat store

    function createStore() {
      const empty = () => ({ boot: null, chats: {} });
      let state = empty();
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
        if (saved !== null && typeof saved === 'object' && saved.chats !== null && typeof saved.chats === 'object') state = { ...empty(), ...saved };
      } catch { /* start empty */ }
      const listeners = new Set();
      return {
        get: () => state,
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        update(recipe) {
          state = recipe(state);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          } catch { /* memory copy still works */ }
          for (const listener of [...listeners]) listener();
        },
      };
    }
    function patchChat(store, chatId, patch) {
      store.update((s) => (s.chats[chatId] === undefined ? s : { ...s, chats: { ...s.chats, [chatId]: { ...s.chats[chatId], ...patch } } }));
    }
    function removeChat(store, chatId) {
      store.update((s) => {
        if (s.chats[chatId] === undefined) return s;
        const chats = { ...s.chats };
        delete chats[chatId];
        return { ...s, chats };
      });
    }
    function useStoreValue(store, select) {
      return useSyncExternalStore(store.subscribe, () => select(store.get()));
    }
    /** Highest turn number carried by the fork's inherited event window. */
    function maxTurn(entries) {
      let max = -1;
      for (const entry of entries) {
        const turn = entry?.event?.data?.turn;
        if (typeof turn === 'number' && turn > max) max = turn;
      }
      return max;
    }
    function hideTurnsCss(chatId, through) {
      if (through < 0) return '';
      const scope = `[data-dsh-side-chat="${window.CSS.escape(chatId)}"]`;
      const selectors = [];
      for (let turn = 0; turn <= through; turn++) selectors.push(`${scope} [data-chat-turn="${turn}"]`);
      // Older pages hold only inherited turns, so the pager has nothing to show either.
      return `${selectors.join(',')},${scope} [class*="_older"]{display:none!important}`;
    }

    // ---------------------------------------------------------------- composer helpers

    function autosize(el) {
      if (el === null) return;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
    function isSubmitKey(event) {
      return event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229;
    }

    return {
      inject: ['slots', 'locale', 'sessions', 'uiWorkspace', 'sidebarRight', 'sidebarRightTabs', 'inputTriggers', 'uiConversation', 'conversation'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'reply-and-side-chat: dictionaries');
        const t = ctx.locale.bind(NS);
        const store = createStore();

        // ------------------------------------------------ restart cleanup

        /** Chats from a previous Host process; their restored tabs close on sight. */
        const stale = new Set();
        const boot = document.querySelector(`meta[name="${BOOT_META}"]`)?.getAttribute('content') ?? null;
        if (boot !== null && store.get().boot !== boot) {
          const previous = Object.values(store.get().chats);
          for (const chat of previous) {
            stale.add(chat.id);
            if (chat.forkId !== undefined && chat.archived !== true) archive(chat.forkId);
          }
          store.update(() => ({ boot, chats: {} }));
        }
        function archive(sessionId) {
          return ctx.uiWorkspace.archiveSession(sessionId, { stopActivity: true }).then(() => true, (error) => {
            console.warn('[reply-and-side-chat] archive failed', sessionId, error);
            return false;
          });
        }

        // ------------------------------------------------ quote chips in a session's composer

        function inputOf(sessionId) {
          const actx = ctx.sessions.scope(sessionId);
          if (actx === undefined) return undefined;
          try {
            return { actx, input: ctx.conversation.input.for(actx) };
          } catch (error) {
            console.warn('[reply-and-side-chat] no composer for', sessionId, error);
            return undefined;
          }
        }
        function quoteOccurrences(state) {
          return state.occurrences.filter((occurrence) => occurrence.source === SOURCE);
        }
        /** Map a clipboard-projection offset to the editor's detect projection, where every chip is one character. */
        function detectOffset(state, offset) {
          let detect = offset;
          for (const occurrence of state.occurrences) if (occurrence.offset + occurrence.length <= offset) detect -= occurrence.length - 1;
          return detect;
        }
        function addQuote(sessionId, quote, reply) {
          const target = inputOf(sessionId);
          if (target === undefined) return false;
          const state = target.input.state.getSnapshot();
          const quotes = quoteOccurrences(state);
          let at = 0;
          if (quotes.length > 0) {
            const last = quotes[quotes.length - 1];
            at = last.offset + last.length;
            if (state.draft[at] === ' ') at += 1;
          }
          const detect = detectOffset(state, at);
          const applied = target.input.insertReference(quoteInsert(quote, reply), { start: detect, end: detect, draftRev: state.draftRev });
          if (applied) target.input.focus();
          return applied;
        }
        function chipSpan(state, occurrence, withSpace) {
          const start = detectOffset(state, occurrence.offset);
          const space = withSpace && state.draft[occurrence.offset + occurrence.length] === ' ' ? 1 : 0;
          return { start, end: start + 1 + space, draftRev: state.draftRev };
        }
        function findOccurrence(state, occurrenceId) {
          return state.occurrences.find((occurrence) => occurrence.occurrenceId === occurrenceId);
        }
        function replaceQuote(sessionId, occurrenceId, reply) {
          const target = inputOf(sessionId);
          if (target === undefined) return false;
          const state = target.input.state.getSnapshot();
          const occurrence = findOccurrence(state, occurrenceId);
          if (occurrence === undefined) return false;
          const { quote } = decodeRef(occurrence.ref);
          return target.input.insertReference(quoteInsert(quote, reply), chipSpan(state, occurrence, false));
        }
        function removeQuote(sessionId, occurrenceId) {
          const target = inputOf(sessionId);
          if (target === undefined) return false;
          const state = target.input.state.getSnapshot();
          const occurrence = findOccurrence(state, occurrenceId);
          if (occurrence === undefined) return false;
          return target.actx.bail(target.actx, 'slash/input-consume-token', { guard: { kind: 'span', span: chipSpan(state, occurrence, true) } }) === true;
        }

        // The chip source never offers menu candidates; it only owns serialization.
        ctx.effect(() => ctx.inputTriggers.registerSource({
          trigger: '@',
          name: SOURCE,
          order: 1000,
          showGroupTitle: false,
          candidates: () => Promise.resolve([]),
          onPick: () => undefined,
          codec: {
            clipboardText: (ref) => {
              const { quote, reply } = decodeRef(ref);
              return clipboardOf(quote, reply);
            },
            serialize: (ref) => Promise.resolve(serializeQuote(ref)),
          },
        }), 'reply-and-side-chat: quote source');

        ctx.effect(() => ctx.uiConversation.userText.register(quoteRule), 'reply-and-side-chat: quote rule');
        ctx.slots.inject('conversation.user.text.node', () => ctx.slots.register({
          name: 'conversation.user.text.node',
          key: RULE_ID,
        }, QuoteNode));

        // ------------------------------------------------ side chat lifecycle

        /** Fork references taken by the first send, handed to the tab body so the Session never drops in between. */
        const handoff = new Map();

        function openSideChat(quote) {
          ctx.sidebarRight.openTab(KIND, quote === undefined ? {} : { params: { quote } });
        }
        function ensureChat(chatId, parent, quote) {
          if (store.get().chats[chatId] !== undefined) return;
          const draft = quote === undefined ? '' : `${quote.split('\n').map((line) => `> ${line}`).join('\n')}\n\n`;
          store.update((s) => ({ ...s, chats: { ...s.chats, [chatId]: { id: chatId, parent, created: Date.now(), draft } } }));
        }
        /** Tabs currently open in the right sidebar, when the controller publishes them. */
        const openTabs = ctx.sidebarRight.openTabs;
        /** 1-based position among the parent session's open side chats, by creation time. */
        function chatNumber(state, open, chatId) {
          const chat = state.chats[chatId];
          if (chat === undefined) return undefined;
          const siblings = Object.values(state.chats)
            .filter((c) => c.parent === chat.parent && (open === undefined || open.has(c.id) || c.id === chatId))
            .sort((a, b) => (a.created ?? 0) - (b.created ?? 0) || a.id.localeCompare(b.id));
          return siblings.findIndex((c) => c.id === chatId) + 1;
        }
        async function startSideChat(chatId, text) {
          const chat = store.get().chats[chatId];
          if (chat === undefined || chat.forkId !== undefined || chat.status === 'sending') return;
          patchChat(store, chatId, { status: 'sending', error: undefined });
          let reference;
          let binding;
          try {
            const forkId = await ctx.sessions.fork({ sessionId: chat.parent, increaseTitle: false });
            reference = ctx.sessions.retain(forkId, { source: 'sideChat' });
            binding = await reference.ready;
            const hideThroughTurn = maxTurn(binding.eventSource.getSnapshot().entries);
            handoff.set(forkId, reference);
            reference = undefined;
            // Archived Sessions refuse every step, so the fork stays live and is only hidden from the session list until closed.
            patchChat(store, chatId, { forkId, hideThroughTurn, draft: '', status: undefined });
            renameFork(binding, chat);
            // beginSubmission only shows the local echo; prompt() with its request id delivers the message.
            const submission = binding.session.beginSubmission({ mode: 'queue', text, attachments: [] });
            const result = await binding.session.prompt([{ type: 'text', text }], 'queue', undefined, submission.requestId);
            if (result.ok !== true) {
              submission.abandon();
              throw new Error(failureText(result.error));
            }
          } catch (error) {
            reference?.release();
            patchChat(store, chatId, { status: 'error', error: failureText(error) });
            // After the fork exists, hand the text back to its composer so the user can resend.
            if (binding !== undefined && store.get().chats[chatId]?.forkId !== undefined) {
              try {
                ctx.conversation.input.requestDraftInitialization(binding, { prompt: text, whenDraftExists: 'keep' });
              } catch { /* the error line still shows */ }
            }
          }
        }
        /** Name the fork after its side chat so it is recognizable in the archived list. */
        function renameFork(binding, chat) {
          const parentTitle = ctx.sessions.list.getSnapshot().byId?.[chat.parent]?.title;
          const title = typeof parentTitle === 'string' && parentTitle.trim() !== '' ? `${t('tab.fallback')} · ${parentTitle}` : t('tab.fallback');
          binding.session.rename(title).catch((error) => console.warn('[reply-and-side-chat] rename failed', error));
        }
        function failureText(error) {
          if (error instanceof Error) return error.message;
          if (error !== null && typeof error === 'object' && typeof error.message === 'string') return error.message;
          return typeof error === 'string' ? error : JSON.stringify(error);
        }

        if (typeof ctx.sidebarRight.registerCloseHandler === 'function') {
          ctx.effect(() => ctx.sidebarRight.registerCloseHandler(KIND, (_sessionId, tab) => {
            const chat = store.get().chats[tab.contentId];
            if (chat === undefined) return;
            if (chat.forkId !== undefined) archive(chat.forkId);
            removeChat(store, chat.id);
          }), 'reply-and-side-chat: close handler');
        }

        ctx.effect(() => ctx.sidebarRightTabs.register({
          id: TAB_ID,
          kind: KIND,
          multiple: true,
          priority: 'extension',
          title: () => t('tab.fallback'),
          guide: [{
            id: 'side-chat',
            order: 900,
            title: () => t('guide.title'),
            description: () => t('guide.description'),
            icon: SideChatIcon,
          }],
        }), 'reply-and-side-chat: tab type');

        // ------------------------------------------------ selection toolbar and reply popover

        /**
         * Whether one selected text node is message content: user text or model output (answer and thinking body).
         * Harness chrome — turn status, thinking headers, tool rows, usage, timestamps, action buttons — is not.
         */
        function isMessageText(element) {
          if (element === null) return false;
          if (element.closest('button, [role="button"], [data-disclosure-header], [data-slot="conversation.chat.assistant-actions"]') !== null) return false;
          const item = element.closest('[data-chat-flow-kind]');
          if (item === null) return false;
          const kind = item.getAttribute('data-chat-flow-kind');
          if (kind === 'assistant-step') return true;
          if (kind === 'user') return element.closest('[data-slot="conversation.user.text.node"]') !== null;
          return false;
        }
        /** Every non-blank piece of text inside the range must be message content. */
        function onlyMessageText(range) {
          const root = range.commonAncestorContainer;
          const nodes = [];
          if (root.nodeType === 3) nodes.push(root);
          else {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) if (range.intersectsNode(node)) nodes.push(node);
          }
          for (const node of nodes) {
            const start = node === range.startContainer ? range.startOffset : 0;
            const end = node === range.endContainer ? range.endOffset : node.data.length;
            if (node.data.slice(start, end).trim() === '') continue;
            if (!isMessageText(node.parentElement)) return false;
          }
          return true;
        }
        function selectionTarget(range) {
          const node = range.commonAncestorContainer;
          const element = node.nodeType === 1 ? node : node.parentElement;
          if (element === null) return undefined;
          if (element.closest('[contenteditable="true"], input, textarea, .rsc-layer')) return undefined;
          if (!onlyMessageText(range)) return undefined;
          const side = element.closest('[data-dsh-side-chat]');
          if (side !== null) {
            const fork = side.getAttribute('data-dsh-side-chat-fork');
            return fork === null || fork === '' ? undefined : { sessionId: fork };
          }
          if (element.closest('[data-sidebar-chat]') !== null) return undefined;
          if (element.closest('[data-conversation-scroll]') === null) return undefined;
          const sessionId = ctx.sidebarRight.mounted.getSnapshot();
          return sessionId === undefined ? undefined : { sessionId };
        }
        /** Keep the floating element inside the conversation column the selection belongs to. */
        function placement(rect, column, halfWidth) {
          const above = rect.top > 72;
          const bounds = column?.isConnected ? column.getBoundingClientRect() : { left: 0, right: window.innerWidth, width: window.innerWidth };
          const center = rect.left + rect.width / 2;
          const left = bounds.width < halfWidth * 2 + 16
            ? bounds.left + bounds.width / 2
            : Math.min(Math.max(center, bounds.left + halfWidth + 8), bounds.right - halfWidth - 8);
          return {
            left,
            top: above ? rect.top - TOOLBAR_GAP : rect.bottom + TOOLBAR_GAP,
            above,
          };
        }

        function SelectionLayer({ t }) {
          const [mode, setMode] = useState(null);
          const [, setTick] = useState(0);
          const modeRef = useRef(null);
          modeRef.current = mode;
          const layerRef = useRef(null);

          useEffect(() => {
            let pointerDown = false;
            const evaluate = () => {
              if (modeRef.current?.kind === 'reply') return;
              const selection = window.getSelection();
              if (selection === null || selection.isCollapsed || selection.rangeCount === 0) return;
              const text = selection.toString();
              if (text.trim() === '') return;
              const range = selection.getRangeAt(0).cloneRange();
              const target = selectionTarget(range);
              if (target === undefined) return;
              const anchor = range.commonAncestorContainer;
              const column = (anchor.nodeType === 1 ? anchor : anchor.parentElement)?.closest('[data-conversation-scroll]') ?? null;
              setMode({ kind: 'toolbar', range, text: text.trim(), target, column });
            };
            const inLayer = (event) => layerRef.current !== null && event.target instanceof Node && layerRef.current.contains(event.target);
            const onPointerDown = (event) => {
              if (inLayer(event)) return;
              pointerDown = true;
              if (modeRef.current !== null) setMode(null);
            };
            const onPointerUp = (event) => {
              if (!pointerDown) return;
              pointerDown = false;
              if (inLayer(event)) return;
              setTimeout(evaluate, 0);
            };
            const onKeyUp = (event) => {
              if (event.shiftKey || event.key === 'Shift') evaluate();
            };
            const onKeyDown = (event) => {
              if (event.key === 'Escape' && modeRef.current !== null) setMode(null);
            };
            const onSelectionChange = () => {
              if (modeRef.current?.kind !== 'toolbar' || pointerDown) return;
              const selection = window.getSelection();
              if (selection === null || selection.isCollapsed) setMode(null);
            };
            const onScroll = () => {
              if (modeRef.current !== null) setTick((n) => n + 1);
            };
            document.addEventListener('pointerdown', onPointerDown, true);
            document.addEventListener('pointerup', onPointerUp, true);
            document.addEventListener('keyup', onKeyUp, true);
            document.addEventListener('keydown', onKeyDown, true);
            document.addEventListener('selectionchange', onSelectionChange);
            window.addEventListener('scroll', onScroll, true);
            window.addEventListener('resize', onScroll);
            return () => {
              document.removeEventListener('pointerdown', onPointerDown, true);
              document.removeEventListener('pointerup', onPointerUp, true);
              document.removeEventListener('keyup', onKeyUp, true);
              document.removeEventListener('keydown', onKeyDown, true);
              document.removeEventListener('selectionchange', onSelectionChange);
              window.removeEventListener('scroll', onScroll, true);
              window.removeEventListener('resize', onScroll);
            };
          }, []);

          // A session switch invalidates whatever was selected.
          const mounted = useSyncExternalStore(ctx.sidebarRight.mounted.subscribe, ctx.sidebarRight.mounted.getSnapshot);
          useEffect(() => {
            setMode(null);
          }, [mounted]);

          const hiddenRows = useStoreValue(store, (s) => Object.values(s.chats).filter((c) => c.forkId !== undefined).map((c) => c.forkId).join('\n'));
          const rowsCss = hiddenRows === '' ? null : h('style', null, `${hiddenRows.split('\n').map((id) => `[data-row-key="session:${window.CSS.escape(id)}"]`).join(',')}{display:none!important}`);
          if (mode === null) return h(Fragment, null, h(Style), rowsCss);
          const rect = mode.range.getBoundingClientRect();
          if (mode.kind === 'toolbar' && (rect.bottom < 0 || rect.top > window.innerHeight || (rect.width === 0 && rect.height === 0))) return h(Fragment, null, h(Style), rowsCss);
          const at = placement(rect, mode.column, mode.kind === 'reply' ? 180 : 70);
          const position = at.above ? { left: at.left, bottom: window.innerHeight - at.top } : { left: at.left, top: at.top };
          const clearSelection = () => window.getSelection()?.removeAllRanges();

          const body = mode.kind === 'toolbar'
            ? h('div', { className: 'rsc-toolbar', role: 'toolbar', onMouseDown: (event) => event.preventDefault() },
              h('button', {
                type: 'button',
                onClick: () => {
                  openSideChat(mode.text);
                  clearSelection();
                  setMode(null);
                },
              }, t('toolbar.sideChat')),
              h('span', { className: 'rsc-sep' }),
              h('button', { type: 'button', onClick: () => setMode({ ...mode, kind: 'reply' }) }, t('toolbar.reply')))
            : h(ReplyPopover, {
              t,
              quote: mode.text,
              onCancel: () => setMode(null),
              onSubmit: (reply) => {
                if (!addQuote(mode.target.sessionId, mode.text, reply)) return false;
                clearSelection();
                setMode(null);
                return true;
              },
            });
          return h(Fragment, null, h(Style), rowsCss, h('div', { ref: layerRef, className: 'rsc-layer', style: position }, body));
        }

        function ReplyPopover({ t, quote, onSubmit, onCancel }) {
          const [reply, setReply] = useState('');
          const [failed, setFailed] = useState(false);
          const inputRef = useRef(null);
          useEffect(() => {
            inputRef.current?.focus({ preventScroll: true });
          }, []);
          useLayoutEffect(() => autosize(inputRef.current), [reply]);
          const submit = () => setFailed(!onSubmit(reply));
          return h('div', { className: 'rsc-pop', role: 'dialog', 'aria-label': t('toolbar.reply') },
            h('div', { className: 'rsc-quote' }, quote),
            h('div', { className: 'rsc-pop-row' },
              h('textarea', {
                ref: inputRef,
                rows: 1,
                value: reply,
                placeholder: t('reply.placeholder'),
                onChange: (event) => setReply(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    onCancel();
                  } else if (isSubmitKey(event)) {
                    event.preventDefault();
                    submit();
                  }
                },
              }),
              h('button', { type: 'button', className: 'rsc-icon-btn', title: t('reply.add'), 'aria-label': t('reply.add'), onClick: submit }, h(Icon, { d: ICON_ADD }))),
            failed ? h('div', { className: 'rsc-error' }, t('reply.failed')) : null);
        }

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'reply-and-side-chat.selection',
          order: 50,
          locale: NS,
        }, SelectionLayer));

        // ------------------------------------------------ quote cards above the composer

        function QuoteDock({ sessionId, useInput, t }) {
          const occurrences = useInput((state) => state.occurrences);
          const quotes = useMemo(() => occurrences.filter((occurrence) => occurrence.source === SOURCE), [occurrences]);
          const [editing, setEditing] = useState(null);
          const editingQuote = quotes.find((occurrence) => occurrence.occurrenceId === editing);
          if (quotes.length === 0) return null;
          return h('div', { className: 'rsc-dock-wrap' }, h('div', { className: 'rsc-dock-inner' },
            h(Style),
            editingQuote === undefined ? null : h(QuoteEditor, {
              key: editingQuote.occurrenceId,
              t,
              value: decodeRef(editingQuote.ref),
              onCancel: () => setEditing(null),
              onSave: (reply) => {
                replaceQuote(sessionId, editingQuote.occurrenceId, reply);
                setEditing(null);
              },
            }),
            h('div', { className: 'rsc-dock' }, quotes.map((occurrence) => {
              const { quote } = decodeRef(occurrence.ref);
              return h('div', {
                key: occurrence.occurrenceId,
                className: 'rsc-card',
                role: 'button',
                tabIndex: 0,
                title: t('card.edit'),
                onClick: () => setEditing(occurrence.occurrenceId),
                onKeyDown: (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setEditing(occurrence.occurrenceId);
                  }
                },
              },
              h('div', { className: 'rsc-quote' }, quote),
              h('span', { className: 'rsc-pill' }, t('card.label')),
              h('button', {
                type: 'button',
                className: 'rsc-icon-btn rsc-card-remove',
                title: t('card.remove'),
                'aria-label': t('card.remove'),
                onClick: (event) => {
                  event.stopPropagation();
                  if (editing === occurrence.occurrenceId) setEditing(null);
                  removeQuote(sessionId, occurrence.occurrenceId);
                },
              }, h(Icon, { d: ICON_CLOSE, size: 14 })));
            }))));
        }

        function QuoteEditor({ t, value, onSave, onCancel }) {
          const [reply, setReply] = useState(value.reply);
          const inputRef = useRef(null);
          useEffect(() => {
            const el = inputRef.current;
            el?.focus({ preventScroll: true });
            el?.setSelectionRange(el.value.length, el.value.length);
          }, []);
          useLayoutEffect(() => autosize(inputRef.current), [reply]);
          return h('div', { className: 'rsc-edit' },
            h('div', { className: 'rsc-quote' }, value.quote),
            h('div', { className: 'rsc-pop-row' },
              h('textarea', {
                ref: inputRef,
                rows: 1,
                value: reply,
                placeholder: t('reply.placeholder'),
                onChange: (event) => setReply(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    onCancel();
                  } else if (isSubmitKey(event)) {
                    event.preventDefault();
                    onSave(reply);
                  }
                },
              })),
            h('div', { className: 'rsc-edit-actions' },
              h('button', { type: 'button', className: 'rsc-text-btn', onClick: onCancel }, t('reply.cancel')),
              h('button', { type: 'button', className: 'rsc-text-btn', onClick: () => onSave(reply) }, t('reply.save'))));
        }

        ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
          name: 'conversation.input.dock',
          id: 'reply-and-side-chat.quotes',
          order: -10,
          locale: NS,
        }, QuoteDock));

        // ------------------------------------------------ side chat tab

        function SideChatTab({ sessionId, useTabInfo, SessionProvider, renderSlot, t }) {
          const { tab } = useTabInfo();
          const chatId = tab.contentId;
          const chat = useStoreValue(store, (s) => s.chats[chatId]);
          const quote = tab.navigation?.params?.quote;
          useEffect(() => {
            if (stale.has(chatId)) {
              tab.actions.close();
              return;
            }
            ensureChat(chatId, sessionId, typeof quote === 'string' ? quote : undefined);
          }, [chatId]);
          if (chat === undefined) return null;
          return h('div', { className: 'rsc-tab', 'data-dsh-side-chat': chatId, 'data-dsh-side-chat-fork': chat.forkId ?? '' },
            h(Style),
            chat.forkId === undefined
              ? h(PreForkView, { chat, t })
              : h(ForkView, { chat, SessionProvider, renderSlot, t }));
        }

        function PreForkView({ chat, t }) {
          const [draft, setDraft] = useState(chat.draft ?? '');
          const inputRef = useRef(null);
          const sending = chat.status === 'sending';
          useEffect(() => {
            const el = inputRef.current;
            if (el === null) return;
            el.focus({ preventScroll: true });
            el.setSelectionRange(el.value.length, el.value.length);
          }, []);
          useLayoutEffect(() => autosize(inputRef.current), [draft]);
          useEffect(() => {
            const timer = setTimeout(() => patchChat(store, chat.id, { draft }), 300);
            return () => clearTimeout(timer);
          }, [draft]);
          const send = () => {
            if (sending || draft.trim() === '') return;
            startSideChat(chat.id, draft.trim());
          };
          return h(Fragment, null,
            h('div', { className: 'rsc-empty' }, t('empty')),
            sending ? h('div', { className: 'rsc-status' }, t('composer.sending')) : null,
            chat.status === 'error' ? h('div', { className: 'rsc-status rsc-bad' }, t('error.fork', { message: chat.error ?? '' })) : null,
            h('div', { className: 'rsc-composer' },
              h('textarea', {
                ref: inputRef,
                rows: 1,
                value: draft,
                disabled: sending,
                placeholder: t('composer.placeholder'),
                onChange: (event) => setDraft(event.target.value),
                onKeyDown: (event) => {
                  if (isSubmitKey(event)) {
                    event.preventDefault();
                    send();
                  }
                },
              }),
              h('button', {
                type: 'button',
                className: 'rsc-icon-btn',
                title: t('composer.send'),
                'aria-label': t('composer.send'),
                disabled: sending || draft.trim() === '',
                onClick: send,
              }, h(Icon, { d: ICON_SEND }))));
        }

        function ForkView({ chat, SessionProvider, renderSlot, t }) {
          const [reference, setReference] = useState(null);
          useEffect(() => {
            const taken = handoff.get(chat.forkId);
            handoff.delete(chat.forkId);
            const held = taken ?? ctx.sessions.retain(chat.forkId, { source: 'sideChat' });
            setReference(held);
            if (chat.archived === true) {
              ctx.uiWorkspace.unarchiveSession(chat.forkId).then(() => patchChat(store, chat.id, { archived: false }), () => {});
            }
            return () => held.release();
          }, [chat.forkId]);
          const hide = useMemo(() => hideTurnsCss(chat.id, chat.hideThroughTurn ?? -1), [chat.id, chat.hideThroughTurn]);
          if (reference === null) return null;
          return h(Fragment, null,
            hide === '' ? null : h('style', null, hide),
            chat.status === 'error' ? h('div', { className: 'rsc-status rsc-bad' }, t('error.send', { message: chat.error ?? '' })) : null,
            h(SessionProvider, { session: reference, children: renderSlot(CHILD_SLOT, {}) }));
        }

        /** Same embedded Conversation the subagent sidebar chat uses, pinned to the Chat view. */
        function FixedChatView(props) {
          return h(Fragment, null, props.renderSlot('conversation.session', { view: 'chat' }));
        }
        function SideChatConversation({ sessionId, useSession, useConversation, useSessions, renderFactorySlot }) {
          const session = useSession((value) => value);
          const engaged = useConversation((value) => value).activeTargets.size > 0 || (!session.blank && !session.awaitingFirstTurn) || session.running;
          const phase = engaged ? 'active' : session.promptAttempted ? 'engaging' : 'blank';
          const summaryBlank = useSessions((state) => state.byId[sessionId]?.blank);
          const settling = phase === 'blank' && session.openState === 'loading' && summaryBlank !== true;
          const hero = phase === 'blank' && (session.openState === 'open' || summaryBlank === true);
          return renderFactorySlot('conversation.content', {
            variant: 'embedded',
            phase: settling ? 'settling' : hero ? 'hero' : 'active',
            hero,
          }, { slots: { views: FixedChatView } });
        }

        function SideChatTitle({ useTabInfo, t }) {
          const { tab } = useTabInfo();
          const open = useSyncExternalStore(openTabs?.subscribe ?? noSubscribe, () => openTabs?.getSnapshot?.());
          const openIds = useMemo(() => (Array.isArray(open) ? new Set(open.filter((item) => item.kind === KIND).map((item) => item.contentId)) : undefined), [open]);
          const n = useStoreValue(store, (s) => chatNumber(s, openIds, tab.contentId));
          return n === undefined ? t('tab.fallback') : t('tab.title', { n });
        }
        function noSubscribe() {
          return () => {};
        }

        ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: TAB_ID,
          locale: NS,
          children: { [CHILD_SLOT]: { kind: 'single', scope: 'session' } },
        }, SideChatTab));
        ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab.title',
          key: TAB_ID,
          locale: NS,
        }, SideChatTitle));
        ctx.slots.inject(CHILD_SLOT, () => ctx.slots.register({ name: CHILD_SLOT }, SideChatConversation));
      },
    };
  },
});
