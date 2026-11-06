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
      'reply.close': '关闭',
      'reply.edit': '编辑回复',
      'reply.delete': '删除回复',
      'reply.empty': '未填写回复',
      'reply.failed': '暂时无法加入输入框，请稍后再试',
      'replies.one': '{n} 条回复',
      'replies.count': '{n} 条回复',
      'replies.clear': '删除全部回复',
      'replies.quote': '所选文本：',
      'replies.reply': '用户回复：',
      'bubble.jump': '跳转到引用处',
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
      'reply.close': 'Close',
      'reply.edit': 'Edit reply',
      'reply.delete': 'Delete reply',
      'reply.empty': 'No reply text',
      'reply.failed': 'Could not add it to the composer. Try again shortly.',
      'replies.one': '{n} reply',
      'replies.count': '{n} replies',
      'replies.clear': 'Delete all replies',
      'replies.quote': 'Selected text:',
      'replies.reply': 'Your reply:',
      'bubble.jump': 'Jump to the quoted text',
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
    /** DeepSeek icon blue; the reply underline keeps it in both themes. */
    const ACCENT = '#4D6BFE';
    /** Exit animation length (ms); a closing toolbar or popover stays mounted this long. */
    const LEAVE_MS = 150;
    /** Lighter blue for a reply underline segment that directly follows another reply's segment, so the seam shows. */
    const ACCENT_ALT = '#8FA2FF';
    /** CSS custom highlights: pending reply underlines (two alternating shades) and the faded underline left by sent quotes. */
    const HIGHLIGHT = 'dsh-reply-quote';
    const HIGHLIGHT_ALT = 'dsh-reply-quote-alt';
    const HIGHLIGHT_SENT = 'dsh-reply-quote-sent';
    const ELEVATION = 'var(--dsw-elevation-prominent,0 0 0 .5px rgba(0,0,0,.16),0 3px 8px rgba(0,0,0,.04))';

    const STYLE_TEXT = `
.rsc-layer{position:fixed;z-index:60;transform:translateX(-50%);pointer-events:auto;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);--rsc-dy:6px}
.rsc-layer.rsc-below{--rsc-dy:-6px}
.rsc-layer.rsc-leaving{pointer-events:none}
.rsc-above .rsc-shake,.rsc-above .rsc-anim{transform-origin:50% 100%}
.rsc-below .rsc-shake,.rsc-below .rsc-anim{transform-origin:50% 0}
.rsc-anim{animation:rsc-bounce-in .26s cubic-bezier(.3,1.5,.5,1) both}
.rsc-anim.rsc-grow{animation:rsc-grow .22s cubic-bezier(.2,1.3,.4,1) both}
.rsc-leaving .rsc-anim{animation:rsc-fade-out ${LEAVE_MS}ms ease-in both}
@keyframes rsc-bounce-in{0%{opacity:0;transform:translateY(var(--rsc-dy)) scale(.7)}60%{opacity:1;transform:translateY(calc(var(--rsc-dy) * -.3)) scale(1.04)}100%{opacity:1;transform:none}}
@keyframes rsc-grow{0%{opacity:.2;transform:scale(.4,.3)}100%{opacity:1;transform:none}}
@keyframes rsc-fade-out{0%{opacity:1;transform:none}100%{opacity:0;transform:scale(.96)}}
@keyframes rsc-list-in{0%{opacity:0;transform:translateY(6px) scale(.98)}100%{opacity:1;transform:none}}
.rsc-toolbar{display:flex;align-items:center;background:var(--dsw-alias-bg-base);border-radius:var(--dsw-radius-lg,12px);box-shadow:${ELEVATION};padding:${TOOLBAR_PAD_Y}px 4px;white-space:nowrap;user-select:none}
.rsc-toolbar button{border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;padding:${TOOLBAR_BUTTON_PAD_Y}px 10px;border-radius:var(--dsw-radius-sm,6px);cursor:pointer}
.rsc-toolbar button:hover{background:var(--dsw-alias-interactive-bg-hover)}
.rsc-toolbar .rsc-sep{width:1px;align-self:stretch;margin:5px 2px;background:var(--dsw-alias-border-l2)}
.rsc-pop{position:relative;box-sizing:border-box;width:360px;max-width:calc(100vw - 24px);background:var(--dsw-alias-bg-base);border-radius:var(--dsw-radius-xl,16px);box-shadow:${ELEVATION};padding:12px 12px 8px}
.rsc-pop.rsc-closable .rsc-quote{margin-right:24px}
.rsc-pop-close{position:absolute;top:8px;right:8px;width:24px;height:24px}
.rsc-quote{border-left:3px solid var(--dsw-alias-border-l2);padding-left:8px;color:var(--dsw-alias-label-tertiary);white-space:pre-wrap;word-break:break-word;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3}
.rsc-pop-row{display:flex;align-items:flex-end;gap:8px;margin-top:10px}
.rsc-pop-text{flex:1;min-width:0;align-self:center;padding:2px 0;white-space:pre-wrap;word-break:break-word;max-height:160px;overflow-y:auto}
.rsc-pop-text,.rsc-pop textarea,.rsc-item-text{scrollbar-width:none}
.rsc-pop-text::-webkit-scrollbar,.rsc-pop textarea::-webkit-scrollbar,.rsc-item-text::-webkit-scrollbar{display:none}
.rsc-muted{color:var(--dsw-alias-label-tertiary)}
.rsc-pop-actions{flex:none;display:flex;align-items:center;gap:2px}
.rsc-pop textarea,.rsc-composer textarea{flex:1;min-width:0;resize:none;border:0;outline:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;padding:2px 0;max-height:160px}
.rsc-pop textarea::placeholder,.rsc-composer textarea::placeholder{color:var(--dsw-alias-label-tertiary)}
.rsc-icon-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.rsc-icon-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.rsc-icon-btn:disabled{opacity:.4;cursor:default}
.rsc-icon-btn.rsc-danger:hover:not(:disabled){color:var(--dsw-alias-state-error-primary)}
.rsc-error{margin-top:6px;color:var(--dsw-alias-state-error-primary);font-size:12px}
.rsc-edit-actions{display:flex;justify-content:flex-end;gap:4px;margin-top:6px}
.rsc-text-btn{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:20px;padding:2px 10px;border-radius:var(--dsw-radius-sm,6px);cursor:pointer}
.rsc-text-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.rsc-text-btn.rsc-primary,.rsc-text-btn.rsc-primary:hover{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base)}
.rsc-text-btn.rsc-primary:hover{opacity:.85}
[data-composer-card]:has(> [data-composer-overlay] .rsc-replies){padding-top:48px!important}
[data-composer-card]:has(> [data-composer-overlay] .rsc-replies[data-rsc-blank]) [data-composer-input]::before{content:attr(data-placeholder);position:absolute;top:4px;left:14px;right:8px;color:var(--dsw-alias-label-tertiary);pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rsc-replies{position:absolute;top:8px;left:12px;z-index:5;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);user-select:none}
.rsc-chip{position:relative;display:inline-flex;align-items:center;gap:6px;height:32px;box-sizing:border-box;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg,12px);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);cursor:default;outline:0}
.rsc-chip svg{color:var(--dsw-alias-label-secondary)}
.rsc-chip-clear{position:absolute;top:50%;right:4px;width:24px;height:24px;margin-top:-12px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:linear-gradient(var(--dsw-alias-interactive-bg-hover),var(--dsw-alias-interactive-bg-hover)),var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);opacity:0;transition:opacity .12s}
.rsc-chip:hover .rsc-chip-clear,.rsc-chip:focus-within .rsc-chip-clear{opacity:1}
.rsc-chip .rsc-chip-clear:hover:not(:disabled){background:linear-gradient(var(--dsw-alias-interactive-bg-hover),var(--dsw-alias-interactive-bg-hover)),linear-gradient(var(--dsw-alias-interactive-bg-hover),var(--dsw-alias-interactive-bg-hover)),var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.rsc-chip:hover .rsc-chip-label,.rsc-chip:focus-within .rsc-chip-label{-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 40px),transparent calc(100% - 14px));mask-image:linear-gradient(to right,#000 calc(100% - 40px),transparent calc(100% - 14px))}
.rsc-list{position:absolute;left:0;bottom:100%;padding-bottom:8px;width:400px;max-width:calc(100vw - 32px)}
.rsc-list-inner{box-sizing:border-box;max-height:min(420px,50vh);overflow:auto;padding:6px;background:var(--dsw-alias-bg-base);border-radius:var(--dsw-radius-xl,16px);box-shadow:${ELEVATION};transform-origin:0 100%;animation:rsc-list-in .16s ease-out both}
.rsc-item{position:relative;display:flex;gap:12px;padding:10px 72px 10px 12px;border-radius:var(--dsw-radius-lg,12px);transition:background-color .12s}
.rsc-item+.rsc-item::before{content:'';position:absolute;top:0;left:12px;right:12px;height:1px;background:var(--dsw-alias-border-l2)}
.rsc-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.rsc-item:hover::before,.rsc-item:hover+.rsc-item::before{opacity:0}
.rsc-item-no{flex:none;min-width:14px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.rsc-item-body{flex:1;min-width:0}
.rsc-label{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.rsc-item-text{margin-bottom:6px;white-space:pre-wrap;word-break:break-word;max-height:60px;overflow-y:auto}
.rsc-item-text:last-child{margin-bottom:0}
.rsc-item-actions{position:absolute;top:6px;right:8px;display:flex;gap:2px}
::highlight(${HIGHLIGHT}){text-decoration:underline wavy ${ACCENT};text-decoration-thickness:1.5px;text-underline-offset:3px}
::highlight(${HIGHLIGHT_ALT}){text-decoration:underline wavy ${ACCENT_ALT};text-decoration-thickness:1.5px;text-underline-offset:3px}
::highlight(${HIGHLIGHT_SENT}){text-decoration:underline wavy color-mix(in srgb,${ACCENT} 40%,transparent);text-decoration-thickness:1.5px;text-underline-offset:3px}
html[data-rsc-mark-hover] [data-conversation-session] *,html[data-rsc-mark-hover] [data-dsh-side-chat] *{cursor:pointer!important}
.rsc-tab{width:100%;min-width:0;height:100%;min-height:0;display:flex;flex-direction:column}
.rsc-empty{flex:1;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);font-size:14px}
.rsc-composer{margin:0 12px 12px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-xl,16px);background:var(--dsw-alias-bg-base);display:flex;align-items:flex-end;gap:8px;font-size:14px;line-height:22px}
.rsc-status{margin:8px 16px;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.rsc-status.rsc-bad{color:var(--dsw-alias-state-error-primary)}
.rsc-bubble-quote{display:block;border-left:3px solid var(--dsw-alias-border-l2);padding-left:8px;color:var(--dsw-alias-label-tertiary);white-space:pre-wrap;cursor:pointer;transition:color .12s,border-color .12s}
.rsc-bubble-quote:hover{color:var(--dsw-alias-label-secondary);border-left-color:${ACCENT}}
body[data-ds-dark-theme] .rsc-bubble-quote{color:var(--dsw-alias-label-secondary);border-left-color:var(--dsw-alias-label-tertiary)}
body[data-ds-dark-theme] .rsc-bubble-quote:hover{color:var(--dsw-alias-label-primary);border-left-color:${ACCENT}}
.rsc-bubble-reply{display:block;white-space:pre-wrap;margin-bottom:4px}
[data-composer-chip="${SOURCE}"]{display:none!important}
@media (prefers-reduced-motion:reduce){.rsc-anim,.rsc-anim.rsc-grow,.rsc-leaving .rsc-anim,.rsc-list-inner{animation:none}}
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
    const ICON_EDIT = ['M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z', 'M13.5 8.5l2 2'];
    const ICON_TRASH = ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12', 'M9 7V4h6v3'];
    const ICON_COMMENT = ['M5 6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-5l-4 3.5V15a2 2 0 0 1-2-2z'];
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
    /**
     * One pending reply as its chip ref: quoted text, reply, and where the quote starts — the message flow
     * item key and how many non-blank characters of that item precede it — so its underline survives re-renders.
     */
    function encodeRef(value) {
      const out = { q: value.quote, r: value.reply };
      if (typeof value.key === 'string') out.k = value.key;
      if (typeof value.offset === 'number') out.o = value.offset;
      return JSON.stringify(out);
    }
    function decodeRef(ref) {
      try {
        const value = JSON.parse(ref);
        if (value !== null && typeof value === 'object' && typeof value.q === 'string') {
          return {
            quote: value.q,
            reply: typeof value.r === 'string' ? value.r : '',
            key: typeof value.k === 'string' ? value.k : undefined,
            offset: typeof value.o === 'number' ? value.o : undefined,
          };
        }
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
    function quoteInsert(value) {
      return { source: SOURCE, ref: encodeRef(value), label: oneLine(value.quote, 40), clipboardText: clipboardOf(value.quote, value.reply) };
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

    // ---------------------------------------------------------------- locating quoted text

    /** Whitespace never takes part in matching: selection text and DOM text disagree on it across blocks. */
    function isBlank(code) {
      return code <= 32 || code === 160 || code === 0x1680 || (code >= 0x2000 && code <= 0x200b) || code === 0x2028 || code === 0x2029
        || code === 0x202f || code === 0x205f || code === 0x3000 || code === 0xfeff;
    }
    function compact(text) {
      let out = '';
      for (let i = 0; i < text.length; i++) if (!isBlank(text.charCodeAt(i))) out += text[i];
      return out;
    }
    function elementOf(node) {
      return node.nodeType === 1 ? node : node.parentElement;
    }
    /** Text of rendered messages, never the composer or this plugin's own floating UI. */
    function isMessageNode(node) {
      const element = node.parentElement;
      return element !== null && element.closest('[data-chat-flow-kind]') !== null
        && element.closest('[data-conversation-region="composer"], .rsc-layer') === null;
    }
    /** Non-blank characters under root, each mapped back to its text node and offset. */
    function indexText(root, accept = isMessageNode) {
      const chars = [];
      const nodes = [];
      const offsets = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        if (!accept(node)) continue;
        const data = node.data;
        for (let i = 0; i < data.length; i++) {
          if (isBlank(data.charCodeAt(i))) continue;
          chars.push(data[i]);
          nodes.push(node);
          offsets.push(i);
        }
      }
      return { text: chars.join(''), nodes, offsets };
    }
    function findAll(index, needle) {
      const hits = [];
      for (let at = index.text.indexOf(needle); at !== -1; at = index.text.indexOf(needle, at + 1)) hits.push(at);
      return hits;
    }
    function rangeOf(index, start, length) {
      const range = document.createRange();
      const last = start + length - 1;
      range.setStart(index.nodes[start], index.offsets[start]);
      range.setEnd(index.nodes[last], index.offsets[last] + 1);
      return range;
    }
    /** Where a fresh selection starts, in terms that survive re-rendering. */
    function anchorOf(range) {
      const item = elementOf(range.startContainer)?.closest('[data-chat-flow-key]');
      if (item === null || item === undefined) return {};
      const index = indexText(item);
      // Characters come in document order, so the first one inside the range is found by bisection.
      let low = 0;
      let high = index.nodes.length;
      while (low < high) {
        const mid = (low + high) >> 1;
        if (range.comparePoint(index.nodes[mid], index.offsets[mid]) < 0) low = mid + 1;
        else high = mid;
      }
      return { key: item.getAttribute('data-chat-flow-key'), offset: low };
    }
    /** Rendered conversation of one session: a side chat body or the main column. */
    function containerOf(sessionId) {
      const id = window.CSS.escape(sessionId);
      return document.querySelector(`[data-dsh-side-chat-fork="${id}"]`) ?? document.querySelector(`[data-conversation-session="${id}"]`);
    }
    /** Range of a pending quote: the match nearest its recorded start inside its own message, else the first match in the conversation. */
    function locateQuote(container, value, cache) {
      const needle = compact(value.quote);
      if (needle === '') return null;
      const item = value.key === undefined ? null : container.querySelector(`[data-chat-flow-key="${window.CSS.escape(value.key)}"]`);
      if (item !== null) {
        const index = indexText(item);
        const hits = findAll(index, needle);
        if (hits.length > 0) {
          const target = value.offset ?? 0;
          const best = hits.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
          return rangeOf(index, best, needle.length);
        }
      }
      // A quote spanning several messages only matches against the whole conversation.
      cache.all ??= indexText(container);
      const hits = findAll(cache.all, needle);
      if (hits.length === 0) return null;
      const own = item === null ? undefined : hits.find((at) => item.contains(cache.all.nodes[at]));
      return rangeOf(cache.all, own ?? hits[0], needle.length);
    }
    /** Bring a range to the upper third of its conversation scroller, leaving room for a popover above it. */
    function scrollToRange(range) {
      const start = elementOf(range.startContainer);
      const scroller = start?.closest('[data-conversation-scroll]');
      if (scroller !== null && scroller !== undefined && scroller.scrollHeight > scroller.clientHeight) {
        const box = scroller.getBoundingClientRect();
        const delta = range.getBoundingClientRect().top - box.top - box.height / 3;
        const from = scroller.scrollTop;
        scroller.scrollBy({ top: delta, behavior: 'smooth' });
        // The host cancels smooth scrolling while the column is pinned to the bottom; jump instead.
        setTimeout(() => {
          if (Math.abs(delta) > 2 && scroller.scrollTop === from) scroller.scrollTop = from + delta;
        }, 120);
      } else {
        start?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
    /** Conversation that renders a sent quote bubble: a side chat body or the main column. */
    function bubbleContainerOf(element) {
      return element.closest('[data-dsh-side-chat], [data-conversation-session]');
    }
    /** Message text a sent quote can point at; the quote lines of sent bubbles never count. */
    function isQuoteSource(node) {
      return isMessageNode(node) && node.parentElement.closest('.rsc-bubble-quote') === null;
    }
    /** Latest visible occurrence of a sent quote above its bubble, outside the bubble's own message. */
    function latestQuoteBefore(index, from, quote) {
      const needle = compact(quote);
      if (needle === '') return null;
      const own = from.closest('[data-chat-flow-kind]');
      const hits = findAll(index, needle);
      for (let i = hits.length - 1; i >= 0; i--) {
        const node = index.nodes[hits[i]];
        if (own !== null && own.contains(node)) continue;
        if ((from.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING) === 0) continue;
        const range = rangeOf(index, hits[i], needle.length);
        if (range.getClientRects().length > 0) return range;
      }
      return null;
    }
    /** Scroll to the text a sent quote points at; the faded underline marks the same place. */
    function jumpToQuote(from, quote) {
      const container = bubbleContainerOf(from);
      if (container === null) return;
      const range = latestQuoteBefore(indexText(container, isQuoteSource), from, quote);
      if (range !== null) scrollToRange(range);
    }
    /** Ranges of the text every sent quote bubble on the page points at. */
    function locateSentQuotes() {
      const byContainer = new Map();
      for (const bubble of document.querySelectorAll('.rsc-bubble-quote')) {
        const container = bubbleContainerOf(bubble);
        if (container === null) continue;
        if (!byContainer.has(container)) byContainer.set(container, []);
        byContainer.get(container).push(bubble);
      }
      const ranges = [];
      for (const [container, bubbles] of byContainer) {
        const index = indexText(container, isQuoteSource);
        for (const bubble of bubbles) {
          const range = latestQuoteBefore(index, bubble, bubble.textContent ?? '');
          if (range !== null) ranges.push(range);
        }
      }
      return ranges;
    }

    /** Document order of two boundary points. */
    function comparePoints(a, b) {
      const range = document.createRange();
      range.setStart(a.node, a.offset);
      return -range.comparePoint(b.node, b.offset);
    }
    function startOf(range) {
      return { node: range.startContainer, offset: range.startOffset };
    }
    function endOf(range) {
      return { node: range.endContainer, offset: range.endOffset };
    }
    /** Whether outer reaches from at or before inner's start to at or after its end. */
    function covers(outer, inner) {
      return outer.compareBoundaryPoints(Range.START_TO_START, inner) <= 0 && outer.compareBoundaryPoints(Range.END_TO_END, inner) >= 0;
    }
    /**
     * Cut overlapping underlines so every character belongs to one reply: a reply inside another wins over the
     * one containing it; of two crossing replies the newer one (higher `order`) wins the overlap.
     * @param marks - located replies of one conversation, each `{ range, order }`.
     * @returns owned segments in document order, `{ owner, range, layer }`; `layer` alternates where one
     * reply's segment directly follows another's so the seam stays visible.
     */
    function splitMarks(marks) {
      if (marks.length === 0) return [];
      const points = marks.flatMap((mark) => [startOf(mark.range), endOf(mark.range)]).sort(comparePoints);
      const stops = points.filter((point, i) => i === 0 || comparePoints(points[i - 1], point) !== 0);
      const beats = (x, y) => {
        const xInside = covers(y.range, x.range);
        const yInside = covers(x.range, y.range);
        return xInside !== yInside ? xInside : x.order > y.order;
      };
      const segments = [];
      let joined = -1;
      for (let i = 0; i + 1 < stops.length; i++) {
        const range = document.createRange();
        range.setStart(stops[i].node, stops[i].offset);
        range.setEnd(stops[i + 1].node, stops[i + 1].offset);
        const covering = marks.filter((mark) => covers(mark.range, range));
        if (covering.length === 0) continue;
        const owner = covering.find((x) => covering.every((y) => y === x || beats(x, y)))
          ?? covering.reduce((a, b) => (b.order > a.order ? b : a));
        const last = segments[segments.length - 1];
        const touching = joined === i;
        joined = i + 1;
        if (touching && last.owner === owner) {
          last.range.setEnd(stops[i + 1].node, stops[i + 1].offset);
          continue;
        }
        segments.push({ owner, range, layer: touching ? 1 - last.layer : 0 });
      }
      return segments;
    }

    function QuoteNode({ node, t }) {
      return h(Fragment, null,
        h('span', {
          className: 'rsc-bubble-quote',
          title: typeof t === 'function' ? t('bubble.jump') : undefined,
          onClick: (event) => {
            const selection = window.getSelection();
            if (selection !== null && !selection.isCollapsed) return;
            event.stopPropagation();
            jumpToQuote(event.currentTarget, node.data.quote);
          },
        }, node.data.quote),
        node.data.reply === '' ? null : h('span', { className: 'rsc-bubble-reply' }, node.data.reply));
    }

    /** Pending quotes per session, published by each composer's reply summary for the selection layer to underline. */
    function createBook() {
      let byId = new Map();
      const listeners = new Set();
      return {
        get: () => byId,
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        set(sessionId, quotes) {
          if (quotes.length === 0 && !byId.has(sessionId)) return;
          byId = new Map(byId);
          if (quotes.length === 0) byId.delete(sessionId);
          else byId.set(sessionId, quotes);
          for (const listener of [...listeners]) listener();
        },
      };
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
    /** Where a backward word deletion from the end of text stops: trailing blanks plus the last word. */
    function wordStart(text) {
      let end = text.length;
      while (end > 0 && isBlank(text.charCodeAt(end - 1))) end--;
      if (end === 0) return 0;
      if (typeof Intl.Segmenter !== 'function') return text.slice(0, end).search(/\S+$/u);
      let start = 0;
      for (const part of new Intl.Segmenter(undefined, { granularity: 'word' }).segment(text.slice(0, end))) start = part.index;
      return start;
    }
    const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

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
        /** Clipboard-projection offset of a detect-projection offset. */
        function clipboardOffset(state, detect) {
          let offset = detect;
          for (const occurrence of state.occurrences) {
            if (detectOffset(state, occurrence.offset) >= detect) break;
            offset += occurrence.length - 1;
          }
          return offset;
        }
        /** Detect offset just past the last quote chip, or -1 without quotes. Quote chips lead the draft; the user's text starts here. */
        function quotesEnd(state) {
          const quotes = quoteOccurrences(state);
          return quotes.length === 0 ? -1 : detectOffset(state, quotes[quotes.length - 1].offset) + 1;
        }
        function consumeSpan(target, start, end, draftRev) {
          return end > start && target.actx.bail(target.actx, 'slash/input-consume-token', { guard: { kind: 'span', span: { start, end, draftRev } } }) === true;
        }
        /** The editor puts a space after every inserted chip; quote chips are hidden, so those spaces would only indent the user's text. */
        function dropQuoteSpaces(target) {
          for (let guard = 0; guard < 200; guard++) {
            const state = target.input.state.getSnapshot();
            const occurrence = quoteOccurrences(state).find((o) => state.draft[o.offset + o.length] === ' ');
            if (occurrence === undefined) return;
            const start = detectOffset(state, occurrence.offset) + 1;
            if (!consumeSpan(target, start, start + 1, state.draftRev)) return;
          }
        }
        function addQuote(sessionId, value) {
          const target = inputOf(sessionId);
          if (target === undefined) return false;
          const state = target.input.state.getSnapshot();
          const quotes = quoteOccurrences(state);
          const at = quotes.length === 0 ? 0 : quotes[quotes.length - 1].offset + quotes[quotes.length - 1].length;
          const detect = detectOffset(state, at);
          const applied = target.input.insertReference(quoteInsert(value), { start: detect, end: detect, draftRev: state.draftRev });
          if (applied) {
            dropQuoteSpaces(target);
            target.input.focus();
          }
          return applied;
        }
        /**
         * Keep one deletion in a composer away from its quote chips.
         * @param span - the editor selection in detect coordinates.
         * @param backward - Backspace direction.
         * @param unit - how much a collapsed caret deletes: `char`, `word` or `line`.
         * @returns true when the default deletion must not run: refused, or done here without the chips.
         */
        function guardDeletion(sessionId, span, backward, unit) {
          const target = inputOf(sessionId);
          if (target === undefined) return false;
          const state = target.input.state.getSnapshot();
          const end = quotesEnd(state);
          if (end < 0) return false;
          if (span.start !== span.end) {
            if (span.start >= end) return false;
            consumeSpan(target, end, span.end, state.draftRev);
            return true;
          }
          const caret = span.start;
          if (caret < end || (backward && caret === end)) return true;
          if (!backward || unit === 'char') return false;
          // Word and line deletions on the chips' line would sweep the hidden chips along; cut them short here.
          const from = clipboardOffset(state, end);
          const before = state.draft.slice(from, clipboardOffset(state, caret));
          if (before.includes('\n')) return false;
          const start = unit === 'line' ? end : detectOffset(state, from + wordStart(before));
          consumeSpan(target, Math.max(start, end), caret, state.draftRev);
          return true;
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
          const applied = target.input.insertReference(quoteInsert({ ...decodeRef(occurrence.ref), reply }), chipSpan(state, occurrence, false));
          if (applied) dropQuoteSpaces(target);
          return applied;
        }
        function removeQuote(sessionId, occurrenceId) {
          const target = inputOf(sessionId);
          if (target === undefined) return false;
          const state = target.input.state.getSnapshot();
          const occurrence = findOccurrence(state, occurrenceId);
          if (occurrence === undefined) return false;
          return target.actx.bail(target.actx, 'slash/input-consume-token', { guard: { kind: 'span', span: chipSpan(state, occurrence, true) } }) === true;
        }
        function removeAllQuotes(sessionId) {
          const target = inputOf(sessionId);
          if (target === undefined) return;
          // Each removal bumps the draft revision, so every step re-reads the state.
          for (let guard = 0; guard < 200; guard++) {
            const remaining = quoteOccurrences(target.input.state.getSnapshot());
            if (remaining.length === 0 || !removeQuote(sessionId, remaining[remaining.length - 1].occurrenceId)) return;
          }
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
          locale: NS,
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

        const quoteBook = createBook();
        /** Bridge from the reply summary to the selection layer, which owns every popover. */
        const layer = { openQuote: undefined };

        const PROSE = 'p, li, td, th, h1, h2, h3, h4, h5, h6, blockquote';
        /** Harness controls are buttons; inline buttons inside prose (file mentions and the like) are message text. */
        function isChromeControl(element) {
          const control = element.closest('button, [role="button"]');
          if (control === null) return false;
          if (control.matches('[class*="_fileMention_"], [class*="_fileLink_"]')) return false;
          return !(control.closest(PROSE) !== null && getComputedStyle(control).display.startsWith('inline'));
        }
        /**
         * Whether one selected text node is message content: user text or model output (answer and thinking body).
         * Harness chrome — turn status, thinking headers, tool rows, usage, timestamps, action buttons — is not.
         */
        function isMessageText(element) {
          if (element === null) return false;
          if (element.closest('[data-disclosure-header], [data-slot="conversation.chat.assistant-actions"]') !== null) return false;
          if (isChromeControl(element)) return false;
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
          const element = elementOf(range.commonAncestorContainer);
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
        /**
         * Keep the floating element inside the conversation column the selection belongs to.
         * @param x - preferred horizontal center: the pointer side of the selection.
         * @param minAbove - room above the selection needed to stay above it.
         */
        function placement(rect, column, halfWidth, x, minAbove) {
          const above = rect.top > minAbove;
          const bounds = column?.isConnected ? column.getBoundingClientRect() : { left: 0, right: window.innerWidth, width: window.innerWidth };
          const left = bounds.width < halfWidth * 2 + 16
            ? bounds.left + bounds.width / 2
            : Math.min(Math.max(x, bounds.left + halfWidth + 8), bounds.right - halfWidth - 8);
          return { left, top: above ? rect.top - TOOLBAR_GAP : rect.bottom + TOOLBAR_GAP, above };
        }
        function columnOf(node) {
          return elementOf(node)?.closest('[data-conversation-scroll]') ?? null;
        }

        const SHAKE = [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-2.5deg)' },
          { transform: 'rotate(2.5deg)' },
          { transform: 'rotate(-1deg)' },
          { transform: 'rotate(0deg)' },
        ];
        let modeSeq = 0;

        /**
         * Toolbar and reply popover. Mode kinds: `toolbar`, `compose` (new reply), `view` (saved reply, pencil and trash),
         * `edit` (saved reply being edited). A closing mode keeps rendering with `leaving` set until its fade-out ends.
         */
        function SelectionLayer({ t }) {
          const [mode, setMode] = useState(null);
          const [, setTick] = useState(0);
          const modeRef = useRef(null);
          modeRef.current = mode;
          const layerRef = useRef(null);
          const shakeRef = useRef(null);
          /** Whether the compose popover holds typed text. */
          const dirtyRef = useRef(false);
          /** Underlined pending quotes as last located: `{ sessionId, occurrenceId, quote, range, segments }`; clicks hit `segments`, the parts this reply owns. */
          const marksRef = useRef([]);
          /** Last seen saved reply of the open popover, so it can still fade out after being deleted. */
          const shownRef = useRef(undefined);
          const book = useSyncExternalStore(quoteBook.subscribe, quoteBook.get);

          const api = useMemo(() => {
            const guarded = (m) => m !== null && !m.leaving && (m.kind === 'edit' || (m.kind === 'compose' && dirtyRef.current));
            const show = (next) => {
              if (next.kind !== 'compose') dirtyRef.current = false;
              modeRef.current = next;
              setMode(next);
            };
            const close = () => {
              const current = modeRef.current;
              if (current === null || current.leaving) return;
              dirtyRef.current = false;
              const leaving = { ...current, leaving: true };
              modeRef.current = leaving;
              setMode(leaving);
              setTimeout(() => {
                if (modeRef.current !== leaving) return;
                modeRef.current = null;
                setMode(null);
              }, LEAVE_MS);
            };
            const shake = () => shakeRef.current?.animate?.(SHAKE, { duration: 360, easing: 'ease-in-out' });
            const markAt = (x, y) => {
              for (const mark of marksRef.current) {
                for (const segment of mark.segments) {
                  for (const r of segment.getClientRects()) if (x >= r.left - 1 && x <= r.right + 1 && y >= r.top && y <= r.bottom + 5) return mark;
                }
              }
              return undefined;
            };
            const openMark = (mark, x, kind = 'view', id = ++modeSeq) => {
              const rect = mark.range.getBoundingClientRect();
              show({ id, kind, sessionId: mark.sessionId, occurrenceId: mark.occurrenceId, column: columnOf(mark.range.startContainer), dx: (x ?? rect.left + rect.width / 2) - rect.left });
            };
            return { guarded, show, close, shake, markAt, openMark };
          }, []);

          useEffect(() => {
            layer.openQuote = (sessionId, occurrenceId, fallback, kind = 'view') => {
              if (api.guarded(modeRef.current)) {
                api.shake();
                return;
              }
              const mark = marksRef.current.find((m) => m.sessionId === sessionId && m.occurrenceId === occurrenceId);
              if (mark !== undefined) {
                scrollToRange(mark.range);
                api.openMark(mark, undefined, kind);
                return;
              }
              // The quoted text is not on the page: open above the reply summary instead.
              if (fallback === null || fallback === undefined) return;
              const rect = fallback.getBoundingClientRect();
              api.show({ id: ++modeSeq, kind, sessionId, occurrenceId, fallback, column: columnOf(fallback), dx: rect.width / 2 });
            };
            return () => {
              layer.openQuote = undefined;
            };
          }, []);

          useEffect(() => {
            let press = null;
            const evaluate = (point) => {
              const current = modeRef.current;
              if (current !== null && !current.leaving && current.kind !== 'toolbar') return false;
              const selection = window.getSelection();
              if (selection === null || selection.isCollapsed || selection.rangeCount === 0) return false;
              const text = selection.toString();
              if (text.trim() === '') return false;
              const range = selection.getRangeAt(0).cloneRange();
              const target = selectionTarget(range);
              if (target === undefined) return false;
              const rect = range.getBoundingClientRect();
              const x = point === undefined ? rect.left + rect.width / 2 : Math.min(Math.max(point.x, rect.left), rect.right);
              const id = current !== null && !current.leaving && current.kind === 'toolbar' ? current.id : ++modeSeq;
              api.show({ id, kind: 'toolbar', range, text: text.trim(), target, anchor: anchorOf(range), column: columnOf(range.commonAncestorContainer), dx: x - rect.left });
              return true;
            };
            const inLayer = (event) => layerRef.current !== null && event.target instanceof Node && layerRef.current.contains(event.target);
            const onPointerDown = (event) => {
              if (inLayer(event)) return;
              const current = modeRef.current;
              press = null;
              // Unsaved text: refuse to close and shake instead.
              if (api.guarded(current)) {
                api.shake();
                return;
              }
              if (current !== null && !current.leaving && current.kind === 'view' && api.markAt(event.clientX, event.clientY)?.occurrenceId === current.occurrenceId) return;
              press = { x: event.clientX, y: event.clientY };
              if (current !== null) api.close();
            };
            const onPointerUp = (event) => {
              if (press === null) return;
              const down = press;
              press = null;
              if (inLayer(event)) return;
              const up = { x: event.clientX, y: event.clientY };
              setTimeout(() => {
                if (evaluate(up)) return;
                if (Math.abs(up.x - down.x) > 4 || Math.abs(up.y - down.y) > 4) return;
                const selection = window.getSelection();
                if (selection !== null && !selection.isCollapsed) return;
                const mark = api.markAt(up.x, up.y);
                if (mark !== undefined) api.openMark(mark, up.x);
              }, 0);
            };
            const onKeyUp = (event) => {
              if (event.shiftKey || event.key === 'Shift') evaluate();
            };
            // Esc closes every state, unsaved text included: it is the deliberate way out, like the close or cancel button.
            const onKeyDown = (event) => {
              if (event.key !== 'Escape' || event.isComposing) return;
              const current = modeRef.current;
              if (current === null || current.leaving) return;
              api.close();
              if (current.kind === 'toolbar') return;
              event.preventDefault();
              event.stopPropagation();
            };
            const onSelectionChange = () => {
              if (modeRef.current?.kind !== 'toolbar' || press !== null) return;
              const selection = window.getSelection();
              if (selection === null || selection.isCollapsed) api.close();
            };
            const onScroll = () => {
              if (modeRef.current !== null) setTick((n) => n + 1);
            };
            let frame = 0;
            const onMouseMove = (event) => {
              const root = document.documentElement;
              if (marksRef.current.length === 0) {
                if (root.hasAttribute('data-rsc-mark-hover')) root.removeAttribute('data-rsc-mark-hover');
                return;
              }
              if (frame !== 0) return;
              const { clientX, clientY } = event;
              frame = requestAnimationFrame(() => {
                frame = 0;
                const hit = api.markAt(clientX, clientY) !== undefined;
                if (hit !== root.hasAttribute('data-rsc-mark-hover')) root.toggleAttribute('data-rsc-mark-hover', hit);
              });
            };
            document.addEventListener('pointerdown', onPointerDown, true);
            document.addEventListener('pointerup', onPointerUp, true);
            document.addEventListener('keyup', onKeyUp, true);
            document.addEventListener('keydown', onKeyDown, true);
            document.addEventListener('selectionchange', onSelectionChange);
            document.addEventListener('mousemove', onMouseMove, { passive: true });
            window.addEventListener('scroll', onScroll, true);
            window.addEventListener('resize', onScroll);
            return () => {
              document.removeEventListener('pointerdown', onPointerDown, true);
              document.removeEventListener('pointerup', onPointerUp, true);
              document.removeEventListener('keyup', onKeyUp, true);
              document.removeEventListener('keydown', onKeyDown, true);
              document.removeEventListener('selectionchange', onSelectionChange);
              document.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('scroll', onScroll, true);
              window.removeEventListener('resize', onScroll);
              cancelAnimationFrame(frame);
              document.documentElement.removeAttribute('data-rsc-mark-hover');
            };
          }, []);

          // Underline every pending quote of the conversations on screen, plus the faded line sent quotes leave behind;
          // re-locate after the DOM settles.
          useEffect(() => {
            if (window.CSS?.highlights === undefined || typeof window.Highlight !== 'function') return undefined;
            let timer = 0;
            let sentCount = 0;
            const setHighlight = (name, ranges, priority) => {
              if (ranges.length === 0) {
                window.CSS.highlights.delete(name);
                return;
              }
              const highlight = new window.Highlight(...ranges);
              highlight.priority = priority;
              window.CSS.highlights.set(name, highlight);
            };
            const paint = () => {
              timer = 0;
              const marks = [];
              const layers = [[], []];
              for (const [sessionId, quotes] of quoteBook.get()) {
                const container = containerOf(sessionId);
                if (container === null) continue;
                const cache = {};
                const located = [];
                quotes.forEach((quote, order) => {
                  const range = locateQuote(container, quote, cache);
                  if (range !== null) located.push({ sessionId, occurrenceId: quote.occurrenceId, quote: quote.quote, range, order, segments: [] });
                });
                for (const segment of splitMarks(located)) {
                  segment.owner.segments.push(segment.range);
                  layers[segment.layer].push(segment.range);
                }
                marks.push(...located);
              }
              const sent = locateSentQuotes();
              sentCount = sent.length;
              marksRef.current = marks;
              setHighlight(HIGHLIGHT, layers[0], 1);
              setHighlight(HIGHLIGHT_ALT, layers[1], 1);
              setHighlight(HIGHLIGHT_SENT, sent, 0);
              const kind = modeRef.current?.kind;
              if (kind === 'view' || kind === 'edit') setTick((n) => n + 1);
            };
            const schedule = () => {
              if (timer === 0) timer = setTimeout(paint, 150);
            };
            const observer = new MutationObserver((records) => {
              if (quoteBook.get().size === 0 && marksRef.current.length === 0 && sentCount === 0 && document.querySelector('.rsc-bubble-quote') === null) return;
              for (const record of records) {
                const element = elementOf(record.target);
                if (element !== null && element.closest('.rsc-layer, [data-composer-card]') !== null) continue;
                schedule();
                return;
              }
            });
            observer.observe(document.body, { subtree: true, childList: true, characterData: true });
            const unsubscribe = quoteBook.subscribe(schedule);
            paint();
            return () => {
              unsubscribe();
              observer.disconnect();
              clearTimeout(timer);
              marksRef.current = [];
              for (const name of [HIGHLIGHT, HIGHLIGHT_ALT, HIGHLIGHT_SENT]) window.CSS.highlights.delete(name);
            };
          }, []);

          // A session switch invalidates whatever was selected.
          const mounted = useSyncExternalStore(ctx.sidebarRight.mounted.subscribe, ctx.sidebarRight.mounted.getSnapshot);
          useEffect(() => {
            dirtyRef.current = false;
            modeRef.current = null;
            setMode(null);
          }, [mounted]);

          // A saved reply removed elsewhere (summary trash, sent with the message) closes its popover.
          useEffect(() => {
            const current = modeRef.current;
            if (current === null || current.leaving || (current.kind !== 'view' && current.kind !== 'edit')) return;
            if (!(book.get(current.sessionId) ?? []).some((quote) => quote.occurrenceId === current.occurrenceId)) api.close();
          }, [book]);

          const hiddenRows = useStoreValue(store, (s) => Object.values(s.chats).filter((c) => c.forkId !== undefined).map((c) => c.forkId).join('\n'));
          const rowsCss = hiddenRows === '' ? null : h('style', null, `${hiddenRows.split('\n').map((id) => `[data-row-key="session:${window.CSS.escape(id)}"]`).join(',')}{display:none!important}`);
          const idle = h(Fragment, null, h(Style), rowsCss);
          if (mode === null) return idle;
          const rect = rectOf(mode);
          if (rect === null) return idle;
          if (mode.kind === 'toolbar' && (rect.bottom < 0 || rect.top > window.innerHeight || (rect.width === 0 && rect.height === 0))) return idle;
          const popover = mode.kind !== 'toolbar';
          const at = placement(rect, mode.column, popover ? 180 : 70, rect.left + mode.dx, popover ? 170 : 72);
          const position = at.above ? { left: at.left, bottom: window.innerHeight - at.top } : { left: at.left, top: at.top };
          const clearSelection = () => window.getSelection()?.removeAllRanges();

          let body;
          if (mode.kind === 'toolbar') {
            body = h('div', { className: 'rsc-toolbar', role: 'toolbar', onMouseDown: (event) => event.preventDefault() },
              h('button', {
                type: 'button',
                onClick: () => {
                  openSideChat(mode.text);
                  clearSelection();
                  api.close();
                },
              }, t('toolbar.sideChat')),
              h('span', { className: 'rsc-sep' }),
              h('button', {
                type: 'button',
                onClick: () => {
                  // Exactly the text of a pending reply again: edit that reply rather than adding a twin.
                  const twin = marksRef.current.find((mark) => mark.sessionId === mode.target.sessionId
                    && compact(mark.quote) === compact(mode.text) && covers(mode.range, mark.range));
                  if (twin === undefined) {
                    api.show({ ...mode, kind: 'compose' });
                    return;
                  }
                  api.openMark(twin, rect.left + mode.dx, 'edit', mode.id);
                  clearSelection();
                },
              }, t('toolbar.reply')));
          } else if (mode.kind === 'compose') {
            body = h(ComposePopover, {
              t,
              quote: mode.text,
              onDirty: (dirty) => {
                if (modeRef.current?.kind === 'compose' && !modeRef.current.leaving) dirtyRef.current = dirty;
              },
              onClose: api.close,
              onAdd: (reply) => {
                if (!addQuote(mode.target.sessionId, { ...mode.anchor, quote: mode.text, reply })) return false;
                clearSelection();
                api.close();
                return true;
              },
            });
          } else {
            const found = (book.get(mode.sessionId) ?? []).find((quote) => quote.occurrenceId === mode.occurrenceId);
            if (found !== undefined) shownRef.current = found;
            const value = found ?? (mode.leaving ? shownRef.current : undefined);
            if (value === undefined) return idle;
            body = h(SavedPopover, {
              t,
              value,
              editing: mode.kind === 'edit',
              onEdit: () => api.show({ ...mode, kind: 'edit' }),
              onCancel: () => api.show({ ...mode, kind: 'view' }),
              onDelete: () => {
                api.close();
                removeQuote(mode.sessionId, mode.occurrenceId);
              },
              onSave: (reply) => {
                api.close();
                replaceQuote(mode.sessionId, mode.occurrenceId, reply);
              },
            });
          }
          return h(Fragment, null, h(Style), rowsCss,
            h('div', { ref: layerRef, className: `rsc-layer ${at.above ? 'rsc-above' : 'rsc-below'}${mode.leaving ? ' rsc-leaving' : ''}`, style: position },
              h('div', { ref: shakeRef, className: 'rsc-shake' },
                h('div', { key: mode.id, className: popover ? 'rsc-anim rsc-grow' : 'rsc-anim' }, body))));

          function rectOf(m) {
            if (m.range !== undefined) return m.range.getBoundingClientRect();
            const mark = marksRef.current.find((x) => x.sessionId === m.sessionId && x.occurrenceId === m.occurrenceId);
            if (mark !== undefined) return mark.range.getBoundingClientRect();
            return m.fallback?.isConnected ? m.fallback.getBoundingClientRect() : null;
          }
        }

        function ComposePopover({ t, quote, onAdd, onClose, onDirty }) {
          const [reply, setReply] = useState('');
          const [failed, setFailed] = useState(false);
          const inputRef = useRef(null);
          useEffect(() => {
            inputRef.current?.focus({ preventScroll: true });
          }, []);
          useLayoutEffect(() => autosize(inputRef.current), [reply]);
          useEffect(() => onDirty(reply !== ''), [reply]);
          const submit = () => setFailed(!onAdd(reply));
          const closable = reply !== '';
          return h('div', { className: `rsc-pop${closable ? ' rsc-closable' : ''}`, role: 'dialog', 'aria-label': t('toolbar.reply') },
            closable ? h('button', { type: 'button', className: 'rsc-icon-btn rsc-pop-close', title: t('reply.close'), 'aria-label': t('reply.close'), onClick: onClose }, h(Icon, { d: ICON_CLOSE, size: 14 })) : null,
            h('div', { className: 'rsc-quote' }, quote),
            h('div', { className: 'rsc-pop-row' },
              h('textarea', {
                ref: inputRef,
                rows: 1,
                value: reply,
                placeholder: t('reply.placeholder'),
                onChange: (event) => setReply(event.target.value),
                onKeyDown: (event) => {
                  if (isSubmitKey(event)) {
                    event.preventDefault();
                    submit();
                  }
                },
              }),
              h('button', { type: 'button', className: 'rsc-icon-btn', title: t('reply.add'), 'aria-label': t('reply.add'), onClick: submit }, h(Icon, { d: ICON_ADD }))),
            failed ? h('div', { className: 'rsc-error' }, t('reply.failed')) : null);
        }

        /** A saved reply: read-only with pencil and trash, or being edited with cancel and save. */
        function SavedPopover({ t, value, editing, onEdit, onDelete, onCancel, onSave }) {
          const empty = value.reply.trim() === '';
          return h('div', { className: 'rsc-pop', role: 'dialog', 'aria-label': t('reply.edit') },
            h('div', { className: 'rsc-quote' }, value.quote),
            editing
              ? h(EditRow, { t, initial: value.reply, onCancel, onSave })
              : h('div', { className: 'rsc-pop-row' },
                h('div', { className: `rsc-pop-text${empty ? ' rsc-muted' : ''}` }, empty ? t('reply.empty') : value.reply),
                h('div', { className: 'rsc-pop-actions' },
                  h('button', { type: 'button', className: 'rsc-icon-btn', title: t('reply.edit'), 'aria-label': t('reply.edit'), onClick: onEdit }, h(Icon, { d: ICON_EDIT })),
                  h('button', { type: 'button', className: 'rsc-icon-btn rsc-danger', title: t('reply.delete'), 'aria-label': t('reply.delete'), onClick: onDelete }, h(Icon, { d: ICON_TRASH })))));
        }
        function EditRow({ t, initial, onCancel, onSave }) {
          const [reply, setReply] = useState(initial);
          const inputRef = useRef(null);
          useEffect(() => {
            const el = inputRef.current;
            el?.focus({ preventScroll: true });
            el?.setSelectionRange(el.value.length, el.value.length);
          }, []);
          useLayoutEffect(() => autosize(inputRef.current), [reply]);
          return h(Fragment, null,
            h('div', { className: 'rsc-pop-row' },
              h('textarea', {
                ref: inputRef,
                rows: 1,
                value: reply,
                placeholder: t('reply.placeholder'),
                onChange: (event) => setReply(event.target.value),
                onKeyDown: (event) => {
                  if (isSubmitKey(event)) {
                    event.preventDefault();
                    onSave(reply);
                  }
                },
              })),
            h('div', { className: 'rsc-edit-actions' },
              h('button', { type: 'button', className: 'rsc-text-btn', onClick: onCancel }, t('reply.cancel')),
              h('button', { type: 'button', className: 'rsc-text-btn rsc-primary', onClick: () => onSave(reply) }, t('reply.save'))));
        }

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'reply-and-side-chat.selection',
          order: 50,
          locale: NS,
        }, SelectionLayer));

        // ------------------------------------------------ reply summary inside the composer card

        /** "N replies" above the editor; hovering opens the detail list upward. Also publishes the quotes for underlining. */
        function QuoteSummary({ sessionId, useInput, inputActions, t }) {
          const occurrences = useInput((state) => state.occurrences);
          // The hidden chips keep the draft non-empty, so the host drops its placeholder; this one stands in for it.
          const blank = useInput((state) => {
            let rest = '';
            let at = 0;
            for (const occurrence of state.occurrences) {
              if (occurrence.source !== SOURCE) continue;
              rest += state.draft.slice(at, occurrence.offset);
              at = occurrence.offset + occurrence.length;
            }
            return `${rest}${state.draft.slice(at)}`.trim() === '';
          });
          const quotes = useMemo(() => occurrences
            .filter((occurrence) => occurrence.source === SOURCE)
            .map((occurrence) => ({ ...decodeRef(occurrence.ref), sessionId, occurrenceId: occurrence.occurrenceId })), [occurrences, sessionId]);
          useEffect(() => {
            quoteBook.set(sessionId, quotes);
          }, [sessionId, quotes]);
          useEffect(() => () => quoteBook.set(sessionId, []), [sessionId]);
          const [open, setOpen] = useState(false);
          const timer = useRef(0);
          const rootRef = useRef(null);
          const chipRef = useRef(null);
          useEffect(() => () => clearTimeout(timer.current), []);
          const hasQuotes = quotes.length > 0;
          // The hidden chips stay out of the user's reach: the caret never lands before them and deletions stop at them.
          useEffect(() => {
            if (!hasQuotes || typeof inputActions?.captureInsertion !== 'function') return undefined;
            const editorOf = () => rootRef.current?.closest('[data-composer-card]')?.querySelector('[data-composer-input]') ?? null;
            const inEditor = (node) => {
              const editor = editorOf();
              return editor !== null && node instanceof Node && editor.contains(node);
            };
            const guard = (event, backward, unit) => {
              if (!guardDeletion(sessionId, inputActions.captureInsertion(), backward, unit)) return;
              event.preventDefault();
              event.stopPropagation();
            };
            const onKeyDown = (event) => {
              if ((event.key !== 'Backspace' && event.key !== 'Delete') || event.isComposing || event.keyCode === 229 || !inEditor(event.target)) return;
              const unit = IS_MAC ? (event.metaKey ? 'line' : event.altKey ? 'word' : 'char') : (event.ctrlKey ? 'word' : 'char');
              guard(event, event.key === 'Backspace', unit);
            };
            const onBeforeInput = (event) => {
              const type = event.inputType ?? '';
              if (!type.startsWith('delete') || !inEditor(event.target)) return;
              guard(event, type.includes('Backward'), type.includes('Word') ? 'word' : type.includes('Line') ? 'line' : 'char');
            };
            const onSelectionChange = () => {
              const editor = editorOf();
              const selection = window.getSelection();
              if (editor === null || selection === null || selection.rangeCount === 0 || !editor.contains(selection.focusNode)) return;
              const chips = editor.querySelectorAll(`[data-composer-chip="${SOURCE}"]`);
              if (chips.length === 0) return;
              const floor = document.createRange();
              floor.setStartAfter(chips[chips.length - 1]);
              const below = (node, offset) => editor.contains(node) && floor.comparePoint(node, offset) < 0;
              const anchorBelow = below(selection.anchorNode, selection.anchorOffset);
              const focusBelow = below(selection.focusNode, selection.focusOffset);
              if (!anchorBelow && !focusBelow) return;
              selection.setBaseAndExtent(
                anchorBelow ? floor.startContainer : selection.anchorNode, anchorBelow ? floor.startOffset : selection.anchorOffset,
                focusBelow ? floor.startContainer : selection.focusNode, focusBelow ? floor.startOffset : selection.focusOffset);
            };
            document.addEventListener('keydown', onKeyDown, true);
            document.addEventListener('beforeinput', onBeforeInput, true);
            document.addEventListener('selectionchange', onSelectionChange);
            onSelectionChange();
            return () => {
              document.removeEventListener('keydown', onKeyDown, true);
              document.removeEventListener('beforeinput', onBeforeInput, true);
              document.removeEventListener('selectionchange', onSelectionChange);
            };
          }, [hasQuotes, sessionId, inputActions]);
          if (!hasQuotes) return null;
          const enter = () => {
            clearTimeout(timer.current);
            setOpen(true);
          };
          const leave = () => {
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setOpen(false), 160);
          };
          return h('div', { ref: rootRef, className: 'rsc-replies', 'data-rsc-blank': blank ? '' : undefined, onMouseEnter: enter, onMouseLeave: leave, onFocus: enter, onBlur: leave },
            h(Style),
            open ? h('div', { className: 'rsc-list' }, h('div', { className: 'rsc-list-inner', role: 'list' }, quotes.map((quote, i) => h('div', { key: quote.occurrenceId, className: 'rsc-item', role: 'listitem' },
              h('span', { className: 'rsc-item-no' }, String(i + 1)),
              h('div', { className: 'rsc-item-body' },
                h('div', { className: 'rsc-label' }, t('replies.quote')),
                h('div', { className: 'rsc-item-text' }, quote.quote),
                quote.reply.trim() === '' ? null : h(Fragment, null,
                  h('div', { className: 'rsc-label' }, t('replies.reply')),
                  h('div', { className: 'rsc-item-text' }, quote.reply))),
              h('div', { className: 'rsc-item-actions' },
                h('button', {
                  type: 'button',
                  className: 'rsc-icon-btn',
                  title: t('reply.edit'),
                  'aria-label': t('reply.edit'),
                  onClick: () => {
                    setOpen(false);
                    layer.openQuote?.(sessionId, quote.occurrenceId, chipRef.current, 'edit');
                  },
                }, h(Icon, { d: ICON_EDIT, size: 15 })),
                h('button', {
                  type: 'button',
                  className: 'rsc-icon-btn rsc-danger',
                  title: t('reply.delete'),
                  'aria-label': t('reply.delete'),
                  onClick: () => removeQuote(sessionId, quote.occurrenceId),
                }, h(Icon, { d: ICON_TRASH, size: 15 }))))))) : null,
            h('div', { ref: chipRef, className: 'rsc-chip', tabIndex: 0 },
              h(Icon, { d: ICON_COMMENT, size: 15 }),
              h('span', { className: 'rsc-chip-label' }, t(quotes.length === 1 ? 'replies.one' : 'replies.count', { n: quotes.length })),
              h('button', {
                type: 'button',
                className: 'rsc-icon-btn rsc-chip-clear',
                title: t('replies.clear'),
                'aria-label': t('replies.clear'),
                onClick: () => {
                  setOpen(false);
                  removeAllQuotes(sessionId);
                },
              }, h(Icon, { d: ICON_CLOSE, size: 13 }))));
        }

        ctx.slots.inject('conversation.input.overlay', () => ctx.slots.register({
          name: 'conversation.input.overlay',
          id: 'reply-and-side-chat.replies',
          order: 50,
          locale: NS,
        }, QuoteSummary));

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
