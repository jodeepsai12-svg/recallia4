import { Brain } from 'lucide-react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 shadow-soft">
        <Brain className="h-6 w-6 text-white" strokeWidth={2.5} />
      </div>
      <span className="font-display text-2xl font-semibold text-teal-800">Recallia</span>
    </div>
  );
}
