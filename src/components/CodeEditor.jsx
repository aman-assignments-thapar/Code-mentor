import { useRef } from 'react';

/** Lightweight monospace editor: line numbers, synced scroll, Tab = 4 spaces, auto-indent on Enter. */
export default function CodeEditor({ value, onChange, textareaRef }) {
  const gutterRef = useRef(null);
  const localRef = useRef(null);
  const ref = textareaRef || localRef;
  const lines = value.split('\n').length;

  const insert = (text, el) => {
    const { selectionStart: s, selectionEnd: e } = el;
    const next = value.slice(0, s) + text + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = s + text.length;
    });
  };

  const onKeyDown = (e) => {
    const el = e.currentTarget;
    if (e.key === 'Tab') {
      e.preventDefault();
      insert('    ', el);
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', el.selectionStart - 1) + 1;
      const line = value.slice(lineStart, el.selectionStart);
      let indent = line.match(/^\s*/)[0];
      if (/[{(\[:]\s*$/.test(line)) indent += '    ';
      insert(`\n${indent}`, el);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-[#1e1e1e] font-mono text-[13px] leading-[1.6]">
      <div ref={gutterRef} className="select-none overflow-hidden py-3 pl-3 pr-3 text-right text-neutral-600" aria-hidden>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(e) => {
          if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Code editor"
        className="h-full flex-1 resize-none whitespace-pre bg-transparent py-3 pr-4 text-neutral-200 caret-lc-orange outline-none"
        style={{ tabSize: 4 }}
      />
    </div>
  );
}
