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
  const baseClasses = 'flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-purple hover:from-purple-600 hover:to-purple-700 active:scale-95',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95',
    icon: 'w-10 h-10 p-0 bg-transparent hover:bg-slate-100 text-slate-600',
    dark: 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}

// Icon-only button variant
export function IconButton({ icon: Icon, ...props }) {
  return <Button variant="icon" icon={Icon} {...props} />;
}