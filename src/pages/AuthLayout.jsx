import { Code2, Target, Lightbulb, Flame } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-lc-bg px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-lc-border bg-lc-panel shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-[#2a2112] via-lc-panel to-lc-panel p-8 md:flex">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-lc-orange text-black"><Code2 size={20} strokeWidth={2.5} /></span>
              Code Mentor
            </div>
            <h2 className="mt-8 text-2xl font-semibold leading-snug text-white">Practice DSA.<br />Learn from every mistake.</h2>
            <p className="mt-3 text-sm text-lc-muted">A LeetCode-style practice platform that tracks where you fail and recommends exactly what to practise next.</p>
          </div>
          <ul className="mt-8 space-y-3 text-sm text-neutral-300">
            <li className="flex items-center gap-2"><Target size={16} className="text-rose-400" /> Weak-topic detection & targeted practice</li>
            <li className="flex items-center gap-2"><Lightbulb size={16} className="text-amber-400" /> Progressive "I'm Stuck" hints</li>
            <li className="flex items-center gap-2"><Flame size={16} className="text-lc-orange" /> Daily goals, streaks & leaderboard</li>
          </ul>
        </div>
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
