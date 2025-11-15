import React from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Base custom toast component with rich content support
 *
 * @param {object} props - Toast properties
 * @param {object} props.t - Toast object from react-hot-toast
 * @param {string} props.type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {string} props.title - Toast title
 * @param {string} props.message - Toast message
 * @param {React.Component} props.icon - Custom icon component
 * @param {Array} props.actions - Array of action buttons with optional icons
 * @param {boolean} props.dismissible - Show dismiss button
 * @param {boolean} props.compact - Use compact styling
 */
export const CustomToast = ({
  t,
  type = 'info',
  title,
  message,
  icon: CustomIcon,
  actions = [],
  dismissible = true,
  compact = false,
}) => {
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBgColor: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30',
      bgColor: 'bg-white dark:bg-slate-800',
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-green-500 dark:focus-visible:ring-green-400',
      shadowColor: 'shadow-green-100 dark:shadow-green-900/30',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBgColor: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30',
      bgColor: 'bg-white dark:bg-slate-800',
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-red-600 dark:focus-visible:ring-red-400',
      shadowColor: 'shadow-red-100 dark:shadow-red-900/30',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      iconBgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30',
      bgColor: 'bg-white dark:bg-slate-800',
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-yellow-500 dark:focus-visible:ring-yellow-400',
      shadowColor: 'shadow-yellow-100 dark:shadow-yellow-900/30',
    },
    info: {
      icon: Info,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30',
      bgColor: 'bg-white dark:bg-slate-800',
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400',
      shadowColor: 'shadow-indigo-100 dark:shadow-indigo-900/30',
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = CustomIcon || config.icon;

  return (
    <div
      className={`${
        t.visible ? 'animate-toast-enter' : 'animate-toast-leave'
      } max-w-md w-full ${config.bgColor} rounded-xl pointer-events-auto flex border ${
        config.borderColor
      } backdrop-blur-sm transform transition-all duration-300 ease-out hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)] hover:scale-[1.02] shadow-[0_20px_50px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)]`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className={`flex-1 w-0 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center">
          {/* Icon with background - vertically centered */}
          <div className="flex-shrink-0">
            <div
              className={`${config.iconBgColor} rounded-lg ${
                compact ? 'p-1.5' : 'p-2'
              } ring-1 ring-white/50 shadow-sm flex items-center justify-center`}
            >
              <Icon className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${config.iconColor}`} />
            </div>
          </div>

          {/* Content */}
          <div className={`${compact ? 'ml-2.5' : 'ml-3'} flex-1 min-w-0`}>
            {title && (
              <p
                className={`${
                  compact ? 'text-xs' : 'text-sm'
                } font-semibold text-slate-900 dark:text-slate-100 leading-tight`}
              >
                {title}
              </p>
            )}
            {message && (
              <p
                className={`${title ? 'mt-1' : ''} ${
                  compact ? 'text-xs' : 'text-sm'
                } text-slate-700 dark:text-slate-300 leading-relaxed`}
              >
                {message}
              </p>
            )}

            {/* Action buttons */}
            {actions.length > 0 && (
              <div className={`${compact ? 'mt-2.5' : 'mt-3.5'} flex flex-wrap gap-2`}>
                {actions.map((action, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => {
                      action.onClick?.();
                      if (action.dismissOnClick !== false) {
                        toast.dismiss(t.id);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 ${
                      compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs'
                    } font-semibold rounded-lg ${
                      action.variant === 'primary'
                        ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:active:bg-purple-900 text-white focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30'
                        : action.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 dark:active:bg-red-900 text-white focus-visible:ring-red-600 dark:focus-visible:ring-red-400 shadow-lg shadow-red-600/20 dark:shadow-red-900/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 border border-slate-300 dark:border-slate-600'
                    } transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95`}
                  >
                    {action.icon && <action.icon className="h-3.5 w-3.5" />}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <div className="flex border-l border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className={`w-full border border-transparent rounded-none rounded-r-xl ${
              compact ? 'p-2' : 'p-3'
            } flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset ${
              config.ringColor
            } transition-all duration-200 active:scale-95`}
            aria-label="Dismiss notification"
          >
            <X className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Progress toast component for long-running operations
 *
 * @param {object} props - Toast properties
 * @param {object} props.t - Toast object from react-hot-toast
 * @param {string} props.title - Toast title
 * @param {string} props.message - Current status message
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {boolean} props.dismissible - Show dismiss button
 * @param {boolean} props.showPercentage - Show percentage text
 */
export const ProgressToast = ({
  t,
  title,
  message,
  progress = 0,
  dismissible = false,
  showPercentage = true,
}) => {
  const progressClamped = Math.min(100, Math.max(0, progress));
  const isComplete = progressClamped >= 100;

  return (
    <div
      className={`${
        t.visible ? 'animate-toast-enter' : 'animate-toast-leave'
      } max-w-md w-full bg-white dark:bg-slate-800 rounded-xl pointer-events-auto flex border border-slate-200 dark:border-slate-700 backdrop-blur-sm transform transition-all duration-300 ease-out shadow-[0_20px_50px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)]`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex-1 w-0 p-4">
        {/* Title and message */}
        <div className="flex items-center mb-3">
          <div className="flex-shrink-0">
            <div
              className={`${
                isComplete ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30' : 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30'
              } rounded-lg p-2 ring-1 ring-white/50 shadow-sm flex items-center justify-center`}
            >
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 dark:border-purple-400 border-t-transparent"></div>
              )}
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{title}</p>
            {message && <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{message}</p>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner ring-1 ring-slate-300/50 dark:ring-slate-600/50">
          <div
            className={`h-3 transition-all duration-500 ease-out ${
              isComplete
                ? 'bg-green-600 dark:bg-green-500 shadow-sm shadow-green-600/20 dark:shadow-green-500/20'
                : 'bg-purple-600 dark:bg-purple-500 shadow-sm shadow-purple-600/20 dark:shadow-purple-500/20'
            }`}
            style={{ width: `${progressClamped}%` }}
            role="progressbar"
            aria-valuenow={progressClamped}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>

        {/* Progress percentage */}
        {showPercentage && (
          <div className="mt-2.5 flex items-center justify-between">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {isComplete ? 'Complete' : 'In progress...'}
            </p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">{Math.round(progressClamped)}%</p>
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <div className="flex border-l border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-3 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 transition-all duration-200 active:scale-95"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Undo toast component for reversible actions
 *
 * @param {object} props - Toast properties
 * @param {object} props.t - Toast object from react-hot-toast
 * @param {string} props.message - Action message
 * @param {Function} props.onUndo - Undo callback
 */
export const UndoToast = ({ t, message, onUndo }) => {
  return (
    <div
      className={`${
        t.visible ? 'animate-toast-enter' : 'animate-toast-leave'
      } max-w-md w-full bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl pointer-events-auto flex backdrop-blur-sm border border-slate-700 transform transition-all duration-300 ease-out shadow-[0_20px_50px_rgba(0,0,0,0.25),0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.3)]`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex-1 w-0 p-4 flex items-center justify-between">
        <p className="text-sm text-white font-semibold tracking-tight">{message}</p>
        <button
          type="button"
          onClick={() => {
            onUndo?.();
            toast.dismiss(t.id);
          }}
          className="ml-4 flex-shrink-0 inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-purple-600 transition-all duration-150 shadow-lg shadow-purple-600/20 active:scale-95"
        >
          Undo
        </button>
      </div>
    </div>
  );
};

/**
 * Persistent toast component that doesn't auto-dismiss
 *
 * @param {object} props - Toast properties
 * @param {object} props.t - Toast object from react-hot-toast
 * @param {string} props.type - Toast type
 * @param {string} props.title - Toast title
 * @param {string} props.message - Toast message
 * @param {Array} props.actions - Array of action buttons
 */
export const PersistentToast = ({ t, type = 'info', title, message, actions = [] }) => {
  return (
    <CustomToast
      t={t}
      type={type}
      title={title}
      message={message}
      actions={actions}
      dismissible={true}
    />
  );
};

/**
 * Compact toast variant for minimal notifications
 *
 * @param {object} props - Toast properties
 * @param {object} props.t - Toast object from react-hot-toast
 * @param {string} props.type - Toast type
 * @param {string} props.message - Toast message (no title in compact mode)
 */
export const CompactToast = ({ t, type = 'info', message }) => {
  return <CustomToast t={t} type={type} message={message} compact={true} dismissible={false} />;
};

/**
 * Toast with image/avatar support
 *
 * @param {object} props - Toast properties
 * @param {object} props.t - Toast object from react-hot-toast
 * @param {string} props.type - Toast type
 * @param {string} props.title - Toast title
 * @param {string} props.message - Toast message
 * @param {string} props.avatarUrl - URL for avatar image
 * @param {string} props.avatarAlt - Alt text for avatar
 * @param {Array} props.actions - Array of action buttons
 */
export const AvatarToast = ({ t, type = 'info', title, message, avatarUrl, avatarAlt, actions = [] }) => {
  const typeConfig = {
    success: {
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-green-500 dark:focus-visible:ring-green-400',
    },
    error: {
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-red-600 dark:focus-visible:ring-red-400',
    },
    warning: {
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-yellow-500 dark:focus-visible:ring-yellow-400',
    },
    info: {
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400',
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      className={`${
        t.visible ? 'animate-toast-enter' : 'animate-toast-leave'
      } max-w-md w-full bg-white dark:bg-slate-800 rounded-xl pointer-events-auto flex border ${
        config.borderColor
      } backdrop-blur-sm transform transition-all duration-300 ease-out hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)] shadow-[0_20px_50px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)]`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-center">
          {/* Avatar - vertically centered */}
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={avatarAlt || 'Avatar'}
                className="h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-700 shadow-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 ring-2 ring-white dark:ring-slate-700 shadow-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {title?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="ml-3 flex-1 min-w-0">
            {title && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{title}</p>}
            {message && (
              <p className={`${title ? 'mt-1' : ''} text-sm text-slate-700 dark:text-slate-300 leading-relaxed`}>
                {message}
              </p>
            )}

            {/* Action buttons */}
            {actions.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {actions.map((action, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => {
                      action.onClick?.();
                      if (action.dismissOnClick !== false) {
                        toast.dismiss(t.id);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg ${
                      action.variant === 'primary'
                        ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:active:bg-purple-900 text-white focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30'
                        : action.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 dark:active:bg-red-900 text-white focus-visible:ring-red-600 dark:focus-visible:ring-red-400 shadow-lg shadow-red-600/20 dark:shadow-red-900/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 border border-slate-300 dark:border-slate-600'
                    } transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95`}
                  >
                    {action.icon && <action.icon className="h-3.5 w-3.5" />}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dismiss button */}
      <div className="flex border-l border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          className={`w-full border border-transparent rounded-none rounded-r-xl p-3 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset ${config.ringColor} transition-all duration-200 active:scale-95`}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Expandable toast with show more/less functionality
 *
 * @param {object} props - Toast properties
 * @param {object} props.t - Toast object from react-hot-toast
 * @param {string} props.type - Toast type
 * @param {string} props.title - Toast title
 * @param {string} props.preview - Short preview message
 * @param {string|React.Component} props.fullContent - Full content (shown when expanded)
 * @param {Array} props.actions - Array of action buttons
 */
export const ExpandableToast = ({ t, type = 'info', title, preview, fullContent, actions = [] }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBgColor: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30',
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-green-500 dark:focus-visible:ring-green-400',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBgColor: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30',
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-red-600 dark:focus-visible:ring-red-400',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      iconBgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30',
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-yellow-500 dark:focus-visible:ring-yellow-400',
    },
    info: {
      icon: Info,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30',
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400',
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`${
        t.visible ? 'animate-toast-enter' : 'animate-toast-leave'
      } max-w-md w-full bg-white dark:bg-slate-800 rounded-xl pointer-events-auto flex border ${
        config.borderColor
      } backdrop-blur-sm transform transition-all duration-300 ease-out hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)] shadow-[0_20px_50px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)]`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-center">
          {/* Icon - vertically centered */}
          <div className="flex-shrink-0">
            <div className={`${config.iconBgColor} rounded-lg p-2 ring-1 ring-white/50 shadow-sm flex items-center justify-center`}>
              <Icon className={`h-4 w-4 ${config.iconColor}`} />
            </div>
          </div>

          {/* Content */}
          <div className="ml-3 flex-1 min-w-0">
            {title && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{title}</p>}

            {/* Preview/Full Content */}
            <div className="mt-1.5">
              {isExpanded ? (
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{fullContent}</div>
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">{preview}</p>
              )}
            </div>

            {/* Toggle button */}
            {fullContent && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 focus:outline-none focus:underline underline-offset-2 transition-colors duration-150"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}

            {/* Action buttons */}
            {actions.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {actions.map((action, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => {
                      action.onClick?.();
                      if (action.dismissOnClick !== false) {
                        toast.dismiss(t.id);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg ${
                      action.variant === 'primary'
                        ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:active:bg-purple-900 text-white focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30'
                        : action.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 dark:active:bg-red-900 text-white focus-visible:ring-red-600 dark:focus-visible:ring-red-400 shadow-lg shadow-red-600/20 dark:shadow-red-900/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 border border-slate-300 dark:border-slate-600'
                    } transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95`}
                  >
                    {action.icon && <action.icon className="h-3.5 w-3.5" />}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dismiss button */}
      <div className="flex border-l border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          className={`w-full border border-transparent rounded-none rounded-r-xl p-3 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset ${config.ringColor} transition-all duration-200 active:scale-95`}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
