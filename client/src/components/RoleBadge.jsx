import { Shield, Users, Star } from 'lucide-react';

/**
 * Role Badge Component
 *
 * Displays a user's role with appropriate styling and icon.
 * Used in Settings page and potentially admin dashboards.
 *
 * Design:
 * - user: Default slate/gray badge (no icon)
 * - support: Blue badge with Users icon
 * - admin: Purple badge with Shield icon
 * - super_admin: Purple gradient badge with Star icon
 *
 * @param {Object} props
 * @param {string} props.role - User role ('user', 'support', 'admin', 'super_admin')
 * @param {string} props.size - Badge size ('sm', 'md', 'lg') - default 'md'
 * @param {string} props.className - Additional CSS classes
 */
export function RoleBadge({ role = 'user', size = 'md', className = '' }) {
  const roleConfig = {
    user: {
      label: 'User',
      icon: null,
      bgClass: 'bg-slate-100 dark:bg-slate-800',
      textClass: 'text-slate-700 dark:text-slate-300',
      borderClass: 'border-slate-200 dark:border-slate-700',
    },
    support: {
      label: 'Support',
      icon: Users,
      bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      textClass: 'text-blue-700 dark:text-blue-300',
      borderClass: 'border-blue-200 dark:border-blue-800',
    },
    admin: {
      label: 'Admin',
      icon: Shield,
      bgClass: 'bg-purple-50 dark:bg-purple-900/20',
      textClass: 'text-purple-700 dark:text-purple-300',
      borderClass: 'border-purple-200 dark:border-purple-800',
    },
    super_admin: {
      label: 'Super Admin',
      icon: Star,
      bgClass: 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
      textClass: 'text-purple-700 dark:text-purple-300',
      borderClass: 'border-purple-200 dark:border-purple-800',
    },
  };

  const config = roleConfig[role] || roleConfig.user;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-md border font-medium
        ${config.bgClass}
        ${config.textClass}
        ${config.borderClass}
        ${sizeClasses[size]}
        ${className}
      `}
      role="status"
      aria-label={`User role: ${config.label}`}
    >
      {Icon && <Icon size={iconSizes[size]} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}

export default RoleBadge;
