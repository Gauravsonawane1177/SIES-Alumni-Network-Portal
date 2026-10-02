export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-maroon-700" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-maroon-200 border-t-maroon-700" />
      <span>{label}…</span>
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="surface-card border border-dashed border-maroon-100 p-10 text-center">
      <h3 className="font-display text-2xl text-maroon-800">{title}</h3>
      <p className="mt-2 text-slate-600">{text}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
      <p className="font-medium">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button type="button" className="mt-3 font-semibold underline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Badge({ children, tone = 'maroon' }) {
  const map = {
    maroon: 'bg-maroon-50 text-maroon-800',
    gold: 'bg-amber-100 text-amber-900',
    green: 'bg-emerald-100 text-emerald-800',
    gray: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700'
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${map[tone]}`}>{children}</span>;
}

export function Field({ label, children, error }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-red-700">{error}</span>}
    </label>
  );
}

export function inputClass() {
  return 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition focus:border-maroon-500 focus:outline-none focus:ring-2 focus:ring-maroon-100';
}

export function Button({ children, className = '', variant = 'primary', ...props }) {
  const styles = {
    primary: 'bg-maroon-700 text-white hover:bg-maroon-800 shadow-sm',
    gold: 'bg-gold-500 text-maroon-900 hover:bg-gold-600 shadow-sm',
    ghost: 'border border-maroon-200 bg-white text-maroon-800 hover:bg-maroon-50',
    danger: 'bg-red-700 text-white hover:bg-red-800'
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return <section className={`surface-card ${className}`}>{children}</section>;
}
