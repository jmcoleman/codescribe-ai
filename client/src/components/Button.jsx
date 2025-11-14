import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = 'flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950';

  const variants = {
    primary: 'bg-purple-600 hover:enabled:bg-purple-700 dark:bg-purple-400 dark:hover:enabled:bg-purple-500 text-white dark:text-slate-950 shadow-lg shadow-purple-600/20 dark:shadow-purple-400/30 hover:enabled:scale-[1.02] active:enabled:scale-[0.98]',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-600/50 hover:enabled:bg-slate-200 dark:hover:enabled:bg-slate-700 hover:enabled:scale-[1.02] hover:enabled:shadow-sm active:enabled:scale-[0.98]',
    icon: 'w-10 h-10 p-0 bg-transparent hover:enabled:bg-slate-100 dark:hover:enabled:bg-slate-800 hover:enabled:scale-[1.05] text-slate-600 dark:text-slate-400 active:enabled:scale-[0.98]',
    dark: 'bg-slate-900 dark:bg-purple-400 text-white dark:text-slate-950 hover:enabled:bg-slate-800 dark:hover:enabled:bg-purple-500 hover:enabled:scale-[1.02] shadow-lg shadow-slate-900/20 dark:shadow-purple-400/30 active:enabled:scale-[0.98]',
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading</span>
        </>
      ) : Icon ? (
        <Icon className="w-4 h-4" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}

// Icon-only button variant
export function IconButton({ icon: Icon, ...props }) {
  return <Button variant="icon" icon={Icon} {...props} />;
}