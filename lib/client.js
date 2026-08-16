window.__ModuleLoader__.load({
  id: 'dsh-plugin-smooth-stream',
  factory: (require) => {
    const React = require('react');
    const styles = {
      insert(css) {
        if (typeof document === 'undefined') return function () {};
        const prev = document.querySelector('style[data-plugin="dsh-plugin-smooth-stream"]');
        if (prev) {
          prev.textContent = css;
          return function () { prev.remove(); };
        }
        const tag = document.createElement('style');
        tag.dataset.plugin = 'dsh-plugin-smooth-stream';
        tag.textContent = css;
        document.head.appendChild(tag);
        return function () { tag.remove(); };
      }
    };
    return (function () {
// dsh-plugin-smooth-stream v1
// Smooth assistant output for DeepSeek Harness.

const SUMMARY_TICK_MS = 1000;
const BODY_POLL_MS = 200;
const THINK_MIN_CHARS = 1000;
const TEXT_MIN_CHARS = 500;
const FADE_MS = 450;
const SPEC_PRIMITIVES = '@deepseek-ai/dsh-client-ui-primitives';
const SPEC_ATTACHMENT = '@deepseek-ai/dsh-client-ui-attachment';

function firstLine(text) {
  const n = text.indexOf('\n');
  return n === -1 ? text : text.slice(0, n);
}
function latestLine(text) {
  const t = (text || '').trimEnd();
  const n = t.lastIndexOf('\n');
  return n === -1 ? t : t.slice(n + 1);
}
function realGlobal() {
  try { if (typeof window !== 'undefined' && window) return window; } catch (e) {}
  try { if (typeof globalThis !== 'undefined' && globalThis) return globalThis; } catch (e) {}
  try { return (0, eval)('globalThis'); } catch (e) {}
  return null;
}
function pickNamed(mod, key) {
  if (!mod) return null;
  if (typeof mod[key] === 'function') return mod;
  if (mod.default && typeof mod.default[key] === 'function') return mod.default;
  return null;
}
function fromSystem(ms, spec, key) {
  if (!ms) return null;
  const tries = [];
  try { if (ms.seed && typeof ms.seed.get === 'function') tries.push(ms.seed.get(spec)); } catch (e) {}
  try { if (ms.statics && typeof ms.statics.get === 'function') tries.push(ms.statics.get(spec)); } catch (e) {}
  try {
    if (ms.loadCache && typeof ms.loadCache.get === 'function') {
      const rec = ms.loadCache.get(spec);
      if (rec) tries.push(rec.exports || rec);
    }
  } catch (e) {}
  for (let i = 0; i < tries.length; i++) {
    const hit = pickNamed(tries[i], key);
    if (hit) return hit;
  }
  return null;
}
function resolveModule(spec, key) {
  const g = realGlobal();
  return fromSystem(g && g.__DSH_MODULES__, spec, key);
}
function lineTarget(text, shown, flush) {
  if (typeof text !== 'string') return 0;
  if (flush) return text.length;
  const nl = text.lastIndexOf('\n');
  const target = nl >= 0 ? nl + 1 : 0;
  return target > shown ? target : shown;
}
function isFenceLine(line) {
  return /^\s*```/.test(line);
}
function isTableLine(line) {
  return /^\s*\|/.test(line);
}
function lineAt(text, index) {
  const from = text.lastIndexOf('\n', index - 1) + 1;
  const to = text.indexOf('\n', index);
  return text.slice(from, to === -1 ? text.length : to);
}
function walkLines(text, fn) {
  let start = 0;
  while (start <= text.length) {
    const nl = text.indexOf('\n', start);
    const end = nl === -1 ? text.length : nl;
    fn(start, end, text.slice(start, end));
    if (nl === -1) break;
    start = nl + 1;
  }
}
function extendToSafeMarkdown(text, pos, flush) {
  if (pos >= text.length) return text.length;
  let fenceFrom = -1;
  let tableFrom = -1;
  let inFence = false;
  let inTable = false;
  walkLines(text, function (start, end, line) {
    if (isFenceLine(line)) {
      if (!inFence) {
        inFence = true;
        fenceFrom = start;
      } else {
        inFence = false;
        fenceFrom = -1;
      }
      inTable = false;
      tableFrom = -1;
      return;
    }
    if (!inFence && isTableLine(line)) {
      if (!inTable) {
        inTable = true;
        tableFrom = start;
      }
    } else if (inTable && line.trim() === '') {
      inTable = false;
      tableFrom = -1;
    } else if (inTable && !isTableLine(line)) {
      inTable = false;
      tableFrom = -1;
    }
  });
  if (inFence) return flush ? text.length : (fenceFrom > 0 ? fenceFrom : pos);
  if (inTable) {
    if (flush) return text.length;
    return tableFrom > 0 ? tableFrom : pos;
  }
  return pos;
}
function paragraphTarget(text, shown, flush, minChars) {
  if (typeof text !== 'string') return 0;
  if (flush) return text.length;
  const need = shown + minChars;
  if (text.length < need) return shown;
  let pos = -1;
  const para = text.indexOf('\n\n', need);
  if (para !== -1) pos = para + 2;
  else {
    const nl = text.indexOf('\n', need);
    if (nl !== -1) pos = nl + 1;
  }
  if (pos === -1) return shown;
  pos = extendToSafeMarkdown(text, pos, false);
  return pos > shown ? pos : shown;
}
function laterBlockStarted(blocks, index) {
  for (let i = index + 1; i < blocks.length; i++) {
    if (blocks[i]) return true;
  }
  return false;
}
function ensureRevealSlots(s, n) {
  while (s.shown.length < n) {
    s.shown.push(0);
    s.prev.push(0);
    s.sum.push(0);
    s.batch.push(0);
    s.sumBatch.push(0);
  }
}
function restartFade(node) {
  if (!node || !node.classList) return;
  node.classList.remove('dss-fresh');
  void node.offsetWidth;
  node.classList.add('dss-fresh');
}
function findScrollport(from) {
  if (from && from.closest) {
    const hit = from.closest('[data-conversation-scroll]');
    if (hit) return hit;
  }
  const g = realGlobal();
  const doc = g && g.document;
  return doc ? doc.querySelector('[data-conversation-scroll]') : null;
}
function classFromCss(css, suffix) {
  if (!css) return '';
  const m = css.match(new RegExp('\\.([A-Za-z0-9_-]+_' + suffix + ')\\b'));
  return m ? m[1] : '';
}
function thinkClasses() {
  const fallback = {
    root: 'dss-nr-root',
    row: 'dss-nr-row',
    leading: 'dss-nr-leading',
    chevron: 'dss-nr-chevron',
    title: 'dss-nr-title',
    separator: 'dss-nr-separator',
    summary: 'dss-nr-summary',
    thinkBody: 'dss-nr-body',
    hidden: 'dss-nr-hidden'
  };
  const g = realGlobal();
  const doc = g && g.document;
  if (!doc) return fallback;
  const tag = doc.querySelector('style[data-plugin-css*="ReasoningRow.module.css"]');
  const a11y = doc.querySelector('style[data-plugin-css*="accessibility.module.css"]');
  const css = tag && tag.textContent;
  const hidden = classFromCss(a11y && a11y.textContent, 'visuallyHidden') || fallback.hidden;
  return {
    root: classFromCss(css, 'root') || fallback.root,
    row: classFromCss(css, 'row') || fallback.row,
    leading: classFromCss(css, 'leading') || fallback.leading,
    chevron: classFromCss(css, 'chevron') || fallback.chevron,
    title: classFromCss(css, 'title') || fallback.title,
    separator: classFromCss(css, 'separator') || fallback.separator,
    summary: classFromCss(css, 'summary') || fallback.summary,
    thinkBody: classFromCss(css, 'thinkBody') || fallback.thinkBody,
    hidden: hidden
  };
}

const CSS = [
  '.dss-root{color:var(--dsw-alias-label-primary);flex-direction:column;font-size:16px;line-height:28px;display:flex}',
  '.dss-body{flex-direction:column;gap:16px;display:flex}',
  '.dss-stopped{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-tertiary);border-radius:6px;align-self:flex-start;padding:0 6px;font-size:11px;line-height:18px}',
  '.dss-dr-root{display:flex;flex-direction:column;width:100%;min-width:0}',
  '.dss-dr-row{position:relative;overflow:hidden;display:flex;align-items:center;height:24px;min-width:0}',
  '.dss-dr-row[data-expandable]{cursor:pointer}',
  '.dss-dr-leading{position:relative;flex:none;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;margin-right:6px;padding:0;border:none;background:none;color:var(--dsw-alias-label-tertiary)}',
  '.dss-dr-iconIdle{display:inline-flex;opacity:1;transition:opacity 100ms ease}',
  '.dss-dr-chevronHover{position:absolute;inset:0;margin:auto;opacity:0;transition:opacity 100ms ease;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary)}',
  '.dss-dr-row:hover .dss-dr-iconIdle{opacity:0}',
  '.dss-dr-row:hover .dss-dr-chevronHover{opacity:1}',
  '.dss-dr-title{flex:none;font-size:14px;line-height:24px;font-weight:400;color:var(--dsw-alias-label-secondary)}',
  '.dss-nr-chevron{color:var(--dsw-alias-label-secondary);display:inline-flex}',
  '.dss-nr-root{display:flex;flex-direction:column}',
  '.dss-nr-row{position:relative;overflow:hidden}',
  '.dss-nr-root[data-state=running] .dss-nr-row:after{content:"";position:absolute;inset-block:0;left:0;width:300px;background:linear-gradient(90deg,transparent 0%,color-mix(in srgb,var(--dsw-alias-bg-base) 60%,transparent) 55%,transparent 100%);animation:2.6s ease-out infinite dss-nr-sweep;pointer-events:none}',
  '@keyframes dss-nr-sweep{0%{left:-300px}90%,to{left:100%}}',
  '.dss-nr-separator{flex:none;width:2px;height:2px;margin:0 8px;border-radius:1px;background:var(--dsw-alias-label-caption)}',
  '.dss-nr-summary{min-width:0;overflow:hidden;flex:1 1 auto;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:24px;text-overflow:ellipsis;white-space:nowrap}',
  '.dss-nr-summary[data-follow-end]{text-overflow:clip}',
  '.dss-nr-body{padding:4px 0 4px 22px;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:24px;white-space:pre-wrap;word-break:break-word}',
  '.dss-nr-hidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}',
  '.dss-sum-fade{display:inline;animation:dss-fade ' + FADE_MS + 'ms ease-out both}',
  '.dss-line{display:block}',
  '.dss-plain{white-space:pre-wrap;overflow-wrap:anywhere}',
  '.dss-codeblock{background:var(--dsw-alias-markdown-code-block);border-radius:8px;padding:10px 12px;overflow:auto}',
  '.dss-code{font-family:var(--dsw-font-markdown-code,monospace);background:var(--dsw-alias-interactive-bg-hover);border-radius:4px;padding:0 4px}',
  '.dss-strong{font-weight:600}',
  '.dss-em{font-style:italic}',
  '.dss-image{max-width:100%;border-radius:8px}',
  '.dss-mdwrap table{border-collapse:collapse;width:100%;margin:8px 0 16px}',
  '.dss-mdwrap th,.dss-mdwrap td{border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.12));padding:10px 16px 10px 0;text-align:left;vertical-align:top}',
  '.dss-mdwrap th{font-weight:600}',
  '@keyframes dss-fade{from{opacity:0;filter:blur(5px);transform:translateY(6px)}to{opacity:1;filter:none;transform:none}}',
  '.dss-fresh{animation:dss-fade ' + FADE_MS + 'ms ease-out both}',
  // While a reply streams, the native bottom-follow's instant scrollTop writes
  // become eased glides. The class lives only during streaming so opening a
  // long conversation, paging prepends and saved-position restores stay instant.
  '[data-conversation-scroll].dss-smooth-follow{scroll-behavior:smooth}',
  '@media (prefers-reduced-motion:reduce){.dss-fresh,.dss-sum-fade{animation:none;filter:none;transform:none}.dss-nr-root[data-state=running] .dss-nr-row:after{animation:none}.dss-smooth-follow{scroll-behavior:auto}}'
].join('');

function inlineMarkdown(text) {
  const out = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] !== undefined) out.push(React.createElement('strong', { className: 'dss-strong', key: out.length }, m[2]));
    else if (m[3] !== undefined) out.push(React.createElement('em', { className: 'dss-em', key: out.length }, m[3]));
    else out.push(React.createElement('code', { className: 'dss-code', key: out.length }, m[4]));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function FallbackMarkdown(props) {
  const text = props.text || '';
  const lines = text.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i += 1; continue; }
    if (/^\s*\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(lines[i]);
        i += 1;
      }
      const body = rows.filter(function (row) { return !/^\s*\|?\s*:?-{3,}/.test(row); });
      out.push(React.createElement('table', { key: out.length },
        React.createElement('tbody', null, body.map(function (row, ri) {
          const cells = row.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|');
          return React.createElement('tr', { key: ri }, cells.map(function (cell, ci) {
            return React.createElement(ri === 0 ? 'th' : 'td', { key: ci }, inlineMarkdown(cell.trim()));
          }));
        }))
      ));
      continue;
    }
    if (/^\s*```/.test(line)) {
      const buf = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) { buf.push(lines[i]); i += 1; }
      i += 1;
      out.push(React.createElement('pre', { className: 'dss-codeblock', key: out.length }, React.createElement('code', null, buf.join('\n'))));
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      out.push(React.createElement('h' + Math.min(h[1].length, 6), { key: out.length }, inlineMarkdown(h[2])));
      i += 1;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i += 1; }
      out.push(React.createElement('blockquote', { key: out.length }, inlineMarkdown(buf.join(' '))));
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*+]\s+/, '')); i += 1; }
      out.push(React.createElement('ul', { key: out.length }, items.map(function (it, k) {
        return React.createElement('li', { key: k }, inlineMarkdown(it));
      })));
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)]\s+/, '')); i += 1; }
      out.push(React.createElement('ol', { key: out.length }, items.map(function (it, k) {
        return React.createElement('li', { key: k }, inlineMarkdown(it));
      })));
      continue;
    }
    const buf = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^\s*(```|#{1,6}\s|>\s?|[-*+]\s+|\d+[.)]\s+)/.test(lines[i])) {
      buf.push(lines[i]);
      i += 1;
    }
    out.push(React.createElement('p', { key: out.length }, inlineMarkdown(buf.join(' '))));
  }
  return React.createElement('div', null, out);
}

function SvgIcon(size, viewBox, paths) {
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: viewBox,
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true
  }, paths.map(function (p, i) {
    return React.createElement('path', {
      key: i,
      d: p.d,
      fill: 'currentColor',
      fillRule: p.fillRule,
      clipRule: p.clipRule
    });
  }));
}
function IconThink14() {
  return SvgIcon(14, '0 0 14 14', [
    { d: 'M7.06431 5.93342C7.68763 5.93342 8.19307 6.43904 8.19322 7.06233C8.19322 7.68573 7.68772 8.19123 7.06431 8.19123C6.44099 8.19113 5.9354 7.68567 5.9354 7.06233C5.93555 6.43911 6.44108 5.93353 7.06431 5.93342Z' },
    {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M8.6815 0.963693C10.1169 0.447019 11.6266 0.374829 12.5633 1.31135C13.5 2.24805 13.4277 3.75776 12.911 5.19319C12.7126 5.74431 12.4386 6.31796 12.0965 6.89729C12.4969 7.54638 12.8141 8.19018 13.036 8.80647C13.5527 10.2419 13.6251 11.7516 12.6883 12.6883C11.7516 13.625 10.242 13.5527 8.8065 13.036C8.19022 12.8141 7.54641 12.4969 6.89732 12.0965C6.31797 12.4386 5.74435 12.7125 5.19322 12.911C3.75777 13.4276 2.2481 13.5 1.31138 12.5633C0.374859 11.6266 0.447049 10.1168 0.963724 8.68147C1.17185 8.10338 1.46321 7.50063 1.82896 6.8924C1.52182 6.35711 1.27235 5.82825 1.08872 5.31819C0.572068 3.88278 0.499714 2.37306 1.43638 1.43635C2.37308 0.499655 3.8828 0.572044 5.31822 1.08869C5.82828 1.27232 6.35715 1.5218 6.89243 1.82893C7.50066 1.46318 8.10341 1.17181 8.6815 0.963693ZM11.3573 8.01154C10.9083 8.62253 10.3901 9.22873 9.80943 9.8094C9.22877 10.3901 8.62255 10.9083 8.01158 11.3572C8.4257 11.5841 8.8287 11.7688 9.21275 11.9071C10.5456 12.3868 11.4246 12.2547 11.8397 11.8397C12.2548 11.4246 12.3869 10.5456 11.9071 9.21272C11.7688 8.82866 11.5841 8.42568 11.3573 8.01154ZM2.56529 8.02912C2.37344 8.39322 2.21495 8.74796 2.09263 9.08772C1.61291 10.4204 1.74512 11.2995 2.16001 11.7147C2.57505 12.1297 3.45415 12.2618 4.78697 11.7821C5.11057 11.6656 5.44786 11.5164 5.7938 11.3367C5.249 10.9223 4.70922 10.4533 4.19029 9.9344C3.57578 9.31987 3.03169 8.67633 2.56529 8.02912ZM6.90708 3.2469C6.24065 3.70479 5.5646 4.26321 4.91392 4.91389C4.26325 5.56456 3.70482 6.24063 3.24693 6.90705C3.72674 7.63325 4.32777 8.37459 5.03892 9.08576C5.64943 9.69627 6.28183 10.2265 6.90806 10.6678C7.59368 10.2025 8.2908 9.63076 8.96079 8.96076C9.6308 8.29075 10.2025 7.59366 10.6678 6.90803C10.2265 6.2818 9.69631 5.6494 9.08579 5.03889C8.37462 4.32773 7.63328 3.72672 6.90708 3.2469ZM11.7147 2.15998C11.2996 1.74509 10.4204 1.61288 9.08775 2.0926C8.74835 2.21479 8.39382 2.37271 8.03013 2.56428C8.67728 3.03065 9.31995 3.5758 9.93443 4.19026C10.4534 4.7092 10.9223 5.24896 11.3368 5.79377C11.5164 5.44785 11.6656 5.11052 11.7821 4.78694C12.2618 3.45416 12.1297 2.57502 11.7147 2.15998ZM4.91197 2.2176C3.57922 1.73788 2.70004 1.86995 2.28501 2.28498C1.87001 2.70003 1.73791 3.5792 2.21763 4.91194C2.31709 5.18822 2.44112 5.47427 2.58677 5.7674C3.01931 5.1887 3.51474 4.6158 4.06529 4.06526C4.61584 3.5147 5.18872 3.01928 5.76743 2.58674C5.47431 2.4411 5.18824 2.31706 4.91197 2.2176Z'
    }
  ]);
}
function IconChevron14(className) {
  return React.createElement('span', { className: className },
    SvgIcon(14, '0 0 14 14', [{
      d: 'M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z'
    }])
  );
}

return {
  inject: ['timer'],
  apply(ctx) {
    const slots = ctx.get('slots');
    if (slots === undefined) return;
    ctx.effect(function () { return styles.insert(CSS); });

    const nr = thinkClasses();
    let prims = resolveModule(SPEC_PRIMITIVES, 'MarkdownText');
    let attach = resolveModule(SPEC_ATTACHMENT, 'ImageGallery');
    try {
      const svc = ctx.get('modules');
      if (!prims) prims = fromSystem(svc, SPEC_PRIMITIVES, 'MarkdownText');
      if (!attach) attach = fromSystem(svc, SPEC_ATTACHMENT, 'ImageGallery');
    } catch (e) {}

    function MarkdownView(props) {
      const wrapRef = React.useRef(null);
      const seenRef = React.useRef(0);
      React.useEffect(function () {
        const host = wrapRef.current;
        if (!host) return;
        const root = host.firstElementChild;
        const n = root ? root.children.length : 0;
        if (!props.animate || props.fromEmpty) {
          seenRef.current = n;
          return;
        }
        if (n > seenRef.current) {
          for (let i = seenRef.current; i < n; i++) restartFade(root.children[i]);
          seenRef.current = n;
          return;
        }
        if (n > 0) restartFade(root.children[n - 1]);
        else restartFade(host);
      }, [props.text, props.animate, props.fromEmpty, props.batchId]);

      const node = (prims && typeof prims.MarkdownText === 'function')
        ? React.createElement(prims.MarkdownText, {
          text: props.text,
          streaming: false,
          codeLabels: props.codeLabels,
          fileMentions: props.fileMentions
        })
        : React.createElement(FallbackMarkdown, { text: props.text });
      const cls = props.animate && props.fromEmpty ? 'dss-mdwrap dss-fresh' : 'dss-mdwrap';
      return React.createElement('div', { ref: wrapRef, className: cls, 'data-dss-prose': '1' }, node);
    }

    function ReasoningView(props) {
      const [expanded, setExpanded] = React.useState(false);
      const summaryRef = React.useRef(null);
      const summarySrc = props.summaryText !== undefined ? props.summaryText : props.text;
      const summary = props.running ? latestLine(summarySrc) : firstLine(summarySrc);
      React.useEffect(function () {
        const el = summaryRef.current;
        if (!el) return;
        el.scrollLeft = props.running ? el.scrollWidth - el.clientWidth : 0;
      }, [props.running, summary]);

      const stable = props.bodyStable || '';
      const fresh = props.bodyFresh || '';
      const body = React.createElement('div', { className: 'dss-nr-body' },
        stable ? React.createElement('div', { className: 'dss-line', style: { whiteSpace: 'pre-wrap' } }, stable) : null,
        fresh ? React.createElement('div', {
          key: 'f' + (props.batchId || 0),
          className: 'dss-line dss-fresh',
          style: { whiteSpace: 'pre-wrap' }
        }, fresh) : null
      );
      const summaryNode = React.createElement(React.Fragment, null,
        React.createElement('span', { className: 'dss-nr-separator', 'aria-hidden': true }),
        React.createElement('span', {
          ref: summaryRef,
          className: 'dss-nr-summary',
          'data-follow-end': props.running || undefined
        },
          React.createElement('span', {
            key: String(props.summaryBatch || props.batchId) + ':' + summary,
            className: 'dss-sum-fade'
          }, summary)
        )
      );
      const toggle = function () { setExpanded(function (v) { return !v; }); };
      const chevron = IconChevron14('dss-nr-chevron');
      const leading = expanded
        ? chevron
        : React.createElement(React.Fragment, null,
          React.createElement('span', { className: 'dss-dr-iconIdle' }, IconThink14()),
          IconChevron14('dss-dr-chevronHover')
        );

      return React.createElement('div', {
        className: 'dss-dr-root dss-nr-root',
        'data-variant': 'think',
        'data-state': props.running ? 'running' : 'ok',
        'data-open': expanded || undefined
      },
        props.running ? React.createElement('span', { className: 'dss-nr-hidden' }, 'Running') : null,
        React.createElement('div', {
          className: 'dss-dr-row dss-nr-row',
          'data-disclosure-row': true,
          'data-expandable': true,
          role: 'button',
          tabIndex: 0,
          'aria-expanded': expanded,
          onClick: toggle,
          onKeyDown: function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
          }
        },
          React.createElement('span', { className: 'dss-dr-leading' }, leading),
          React.createElement('span', { className: 'dss-dr-title' }, 'Think'),
          expanded ? null : summaryNode
        ),
        expanded ? body : null
      );
    }

    function ImageNode(props) {
      const [src, setSrc] = React.useState(null);
      React.useEffect(function () {
        let alive = true;
        if (typeof props.loadImage === 'function' && props.attachment) {
          Promise.resolve(props.loadImage(props.attachment)).then(function (url) {
            if (alive && typeof url === 'string') setSrc(url);
          }).catch(function () {});
        }
        return function () { alive = false; };
      }, [props.attachment, props.loadImage]);
      if (src === null) return null;
      return React.createElement('img', { className: 'dss-image', src: src, alt: '' });
    }

    function OtherView(props) {
      if (prims && typeof prims.JsonBlock === 'function') {
        return React.createElement(prims.JsonBlock, { label: 'Data', payload: props.payload });
      }
      return React.createElement('div', { className: 'dss-plain' }, '[data]');
    }

    function SmoothAssistantNode(props) {
      const node = props.node;
      const data = (node && node.data) || {};
      const blocks = Array.isArray(data.blocks) ? data.blocks : [];
      const status = data.status === 'running' ? 'running' : (data.status === 'interrupted' ? 'interrupted' : 'settled');
      const streaming = status === 'running';
      const t = typeof props.t === 'function' ? props.t : function (k) { return k; };

      const labelsRef = React.useRef(null);
      if (labelsRef.current === null) {
        labelsRef.current = { copyLabel: t('copy') || 'Copy', copiedLabel: t('copied') || 'Copied' };
      }
      const codeLabels = labelsRef.current;

      const loc = node && node.location;
      const turn = loc && (loc.kind === 'turn' || loc.kind === 'step') ? loc.turn : undefined;
      const tail = typeof props.useTurnData === 'function' ? props.useTurnData('turn-tail') : undefined;
      const mentions = React.useMemo(function () {
        if (typeof props.fileMentions !== 'function') return undefined;
        if (!turn || turn.status !== 'closed' || data.finalNode === undefined) return undefined;
        if (!tail || !tail.closing || !tail.closing.finalNode || tail.closing.finalNode.seq !== data.finalNode.seq) return undefined;
        return props.fileMentions({ turn: turn, seq: data.finalNode.seq, openFile: props.openFile });
      }, [data.finalNode, props.fileMentions, props.openFile, tail, turn]);

      const stateRef = React.useRef({ shown: [], prev: [], sum: [], batch: [], sumBatch: [] });
      const blocksRef = React.useRef(blocks);
      const streamingRef = React.useRef(streaming);
      blocksRef.current = blocks;
      streamingRef.current = streaming;
      const rootRef = React.useRef(null);
      const seenStreamRef = React.useRef(false);
      const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
      if (streaming) seenStreamRef.current = true;
      const liveReveal = seenStreamRef.current;
      const s0 = stateRef.current;
      ensureRevealSlots(s0, blocks.length);
      if (!streaming) {
        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i];
          if (!b || (b.kind !== 'text' && b.kind !== 'reasoning') || typeof b.text !== 'string') continue;
          if (!liveReveal) {
            s0.shown[i] = b.text.length;
            s0.prev[i] = b.text.length;
            if (b.kind === 'reasoning') s0.sum[i] = b.text.length;
            continue;
          }
          if (s0.shown[i] < b.text.length) {
            s0.prev[i] = s0.shown[i];
            s0.shown[i] = b.text.length;
            s0.batch[i] += 1;
          }
          if (b.kind === 'reasoning' && s0.sum[i] < b.text.length) {
            s0.sum[i] = b.text.length;
            s0.sumBatch[i] += 1;
          }
        }
      }

      React.useEffect(function () {
        const port = findScrollport(rootRef.current);
        if (!port) return undefined;
        if (streaming) port.classList.add('dss-smooth-follow');
        else port.classList.remove('dss-smooth-follow');
        return function () { port.classList.remove('dss-smooth-follow'); };
      }, [streaming]);

      React.useEffect(function () {
        function grow(kind) {
          const list = blocksRef.current;
          const live = streamingRef.current;
          const s = stateRef.current;
          ensureRevealSlots(s, list.length);
          let dirty = false;
          for (let i = 0; i < list.length; i++) {
            const b = list[i];
            if (!b || (b.kind !== 'text' && b.kind !== 'reasoning') || typeof b.text !== 'string') continue;
            const flush = !live || laterBlockStarted(list, i);
            if (kind === 'body' || b.kind === 'text') {
              const min = b.kind === 'reasoning' ? THINK_MIN_CHARS : TEXT_MIN_CHARS;
              const target = paragraphTarget(b.text, s.shown[i], flush, min);
              if (target > s.shown[i]) {
                s.prev[i] = s.shown[i];
                s.shown[i] = target;
                s.batch[i] += 1;
                dirty = true;
              }
            }
            if ((kind === 'sum' || flush) && b.kind === 'reasoning') {
              const target = lineTarget(b.text, s.sum[i], flush);
              if (target > s.sum[i]) {
                s.sum[i] = target;
                s.sumBatch[i] += 1;
                dirty = true;
              }
            }
          }
          if (dirty) force();
        }
        grow('body');
        grow('sum');
        if (!streaming) return undefined;
        const stopBody = ctx.interval(function () { grow('body'); }, BODY_POLL_MS);
        const stopSum = ctx.interval(function () { grow('sum'); }, SUMMARY_TICK_MS);
        return function () {
          if (typeof stopBody === 'function') stopBody();
          if (typeof stopSum === 'function') stopSum();
        };
      }, [streaming, blocks.length]);

      const rendered = [];
      const lastIdx = blocks.length - 1;
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (!b) continue;
        if (b.kind === 'tool-call') continue;
        if (b.kind === 'text' && typeof b.text === 'string') {
          const shown = Math.min(stateRef.current.shown[i] || 0, b.text.length);
          const prevShown = Math.min(stateRef.current.prev[i] || 0, shown);
          const batchId = stateRef.current.batch[i] || 0;
          if (shown === 0) continue;
          rendered.push(React.createElement(MarkdownView, {
            key: 't' + i,
            text: b.text.slice(0, shown),
            animate: liveReveal,
            fromEmpty: prevShown === 0,
            batchId: batchId,
            codeLabels: codeLabels,
            fileMentions: mentions
          }));
        } else if (b.kind === 'reasoning' && typeof b.text === 'string') {
          const bodyShown = Math.min(stateRef.current.shown[i] || 0, b.text.length);
          const sumShown = Math.min(stateRef.current.sum[i] || 0, b.text.length);
          const batchId = stateRef.current.batch[i] || 0;
          const summaryBatch = stateRef.current.sumBatch[i] || 0;
          if (bodyShown === 0 && sumShown === 0) continue;
          const prevShown = Math.min(stateRef.current.prev[i] || 0, bodyShown);
          rendered.push(React.createElement(ReasoningView, {
            key: 'r' + i,
            summaryText: b.text.slice(0, sumShown),
            bodyStable: b.text.slice(0, prevShown),
            bodyFresh: bodyShown > prevShown ? b.text.slice(prevShown, bodyShown) : '',
            batchId: batchId,
            summaryBatch: summaryBatch,
            running: streaming && i === lastIdx
          }));
        } else if (b.kind === 'image') {
          if (attach && typeof attach.ImageGallery === 'function') {
            const group = [b];
            while (i + 1 < blocks.length && blocks[i + 1] && blocks[i + 1].kind === 'image') {
              i += 1;
              group.push(blocks[i]);
            }
            rendered.push(React.createElement(attach.ImageGallery, {
              key: 'img' + i,
              images: group,
              load: props.loadImage || function () { return Promise.reject(new Error('no image loader')); },
              align: 'start'
            }));
          } else {
            rendered.push(React.createElement(ImageNode, {
              key: 'img' + i,
              attachment: b.attachment,
              loadImage: props.loadImage
            }));
          }
        } else if (b.kind === 'other') {
          rendered.push(React.createElement(OtherView, { key: 'o' + i, payload: b.block }));
        }
      }

      return React.createElement('div', { className: 'dss-root', ref: rootRef },
        React.createElement('div', { className: 'dss-body' },
          rendered,
          status === 'interrupted' ? React.createElement('span', { className: 'dss-stopped' }, t('message.stopped') || 'Stopped') : null
        )
      );
    }

    slots.inject('conversation.chat.node', function () {
      return slots.register(
        { name: 'conversation.chat.node', key: 'assistant-step', priority: -1 },
        SmoothAssistantNode
      );
    });
  }
};

    })();
  }
});
