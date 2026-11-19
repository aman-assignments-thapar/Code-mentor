import { CheckCircle2, CircleDashed, Circle, X } from 'lucide-react';

export const DIFF_TEXT = { Easy: 'text-lc-easy', Medium: 'text-lc-medium', Hard: 'text-lc-hard' };
export const DIFF_BG = { Easy: 'bg-lc-easy', Medium: 'bg-lc-medium', Hard: 'bg-lc-hard' };

export function DifficultyBadge({ difficulty, pill = false }) {
  if (pill) {
    const bg = { Easy: 'bg-teal-500/15', Medium: 'bg-yellow-500/15', Hard: 'bg-rose-500/15' }[difficulty];
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bg} ${DIFF_TEXT[difficulty]}`}>{difficulty}</span>;
  }
  return <span className={`text-sm font-medium ${DIFF_TEXT[difficulty]}`}>{difficulty === 'Medium' ? 'Med.' : difficulty}</span>;
}

export function TopicTag({ topic, weak = false }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ${weak ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30' : 'bg-lc-layer text-neutral-300'}`}>
      {topic}
    </span>
  );
}

export function StatusIcon({ status }) {
  if (status === 'solved') return <CheckCircle2 size={17} className="text-lc-easy" aria-label="Solved" />;
  if (status === 'attempted') return <CircleDashed size={17} className="text-lc-medium" aria-label="Attempted" />;
  return <Circle size={17} className="text-neutral-700" aria-label="Todo" />;
}

export function ProgressBar({ value, max = 100, color = 'bg-lc-orange', height = 'h-2' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`w-full ${height} rounded-full bg-lc-layer overflow-hidden`} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className={`${height} ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Alert({ type = 'error', children, onClose }) {
  const styles = {
    error: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
    success: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
    info: 'bg-sky-500/10 border-sky-500/40 text-sky-300',
    warn: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
  };
  return (
    <div role="alert" className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${styles[type]}`}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="opacity-70 hover:opacity-100" aria-label="Dismiss">
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={onClose}>
      <div className={`card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-lc-border px-5 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-lc-muted hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, accent = 'text-lc-orange' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs text-lc-muted">
        {Icon && <Icon size={15} className={accent} />}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-lc-muted">{sub}</div>}
    </div>
  );
}

export function timeAgo(ts, now = Date.now()) {
  const diff = Math.max(0, now - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

export function formatDuration(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Tiny Markdown-ish renderer for problem statements: `code`, **bold**, *italic*, "- " lists, paragraphs. */
export function RichText({ text, className = '' }) {
  const renderInline = (str, keyBase) => {
    const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
    return parts.map((part, i) => {
      const key = `${keyBase}-${i}`;
      if (part.startsWith('`')) return <code key={key} className="rounded bg-lc-layer px-1 py-0.5 font-mono text-[0.85em] text-neutral-200">{part.slice(1, -1)}</code>;
      if (part.startsWith('**')) return <strong key={key} className="font-semibold text-white">{renderInline(part.slice(2, -2), key)}</strong>;
      if (part.startsWith('*') && part.length > 2) return <em key={key}>{renderInline(part.slice(1, -1), key)}</em>;
      return <span key={key}>{part}</span>;
    });
  };
  const blocks = String(text || '').split(/\n\n+/);
  return (
    <div className={`space-y-3 text-[15px] leading-relaxed text-neutral-300 ${className}`}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-6">
              {lines.map((l, li) => <li key={li}>{renderInline(l.trim().slice(2), `${bi}-${li}`)}</li>)}
            </ul>
          );
        }
        return (
          <div key={bi}>
            {lines.map((l, li) => {
              if (l.trim().startsWith('- ')) return <div key={li} className="pl-4">• {renderInline(l.trim().slice(2), `${bi}-${li}`)}</div>;
              return <p key={li}>{renderInline(l, `${bi}-${li}`)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}
