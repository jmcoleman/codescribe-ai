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
      iconColor: 'text-green-600',
      iconBgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      bgColor: 'bg-white',
      borderColor: 'border-green-300',
      ringColor: 'focus:ring-green-500',
      shadowColor: 'shadow-green-100',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      iconBgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      bgColor: 'bg-white',
      borderColor: 'border-red-300',
      ringColor: 'focus:ring-red-500',
      shadowColor: 'shadow-red-100',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      iconBgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      bgColor: 'bg-white',
      borderColor: 'border-yellow-300',
      ringColor: 'focus:ring-yellow-500',
      shadowColor: 'shadow-yellow-100',
    },
    info: {
      icon: Info,
      iconColor: 'text-indigo-600',
      iconBgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      bgColor: 'bg-white',
      borderColor: 'border-indigo-300',
      ringColor: 'focus:ring-purple-600',
      shadowColor: 'shadow-indigo-100',
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
                } font-semibold text-slate-900 leading-tight`}
              >
                {title}
              </p>
            )}
            {message && (
              <p
                className={`${title ? 'mt-1' : ''} ${
                  compact ? 'text-xs' : 'text-sm'
                } text-slate-700 leading-relaxed`}
              >
                {message}
              </p>
            )}

            {/* Action buttons */}
            {actions.length > 0 && (
              <div className={`${compact ? 'mt-2.5' : 'mt-3.5'} flex flex-wrap gap-2`}>
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick?.();
                      if (action.dismissOnClick !== false) {
                        toast.dismiss(t.id);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 ${
                      compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs'
                    } font-semibold rounded-lg shadow-sm ${
                      action.variant === 'primary'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 focus:ring-purple-600 shadow-purple-200'
                        : action.variant === 'danger'
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-red-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400 border border-slate-300'
                    } transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:shadow-md active:scale-95`}
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
        <div className="flex border-l border-slate-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className={`w-full border border-transparent rounded-none rounded-r-xl ${
              compact ? 'p-2' : 'p-3'
            } flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-inset ${
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
      } max-w-md w-full bg-white rounded-xl pointer-events-auto flex border ${
        isComplete ? 'border-green-300' : 'border-purple-300'
      } backdrop-blur-sm transform transition-all duration-300 ease-out shadow-[0_20px_50px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)]`}
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
                isComplete ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-purple-50 to-purple-100'
              } rounded-lg p-2 ring-1 ring-white/50 shadow-sm flex items-center justify-center`}
            >
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
              )}
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{title}</p>
            {message && <p className="mt-1 text-sm text-slate-700 leading-relaxed">{message}</p>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner ring-1 ring-slate-300/50">
          <div
            className={`h-3 transition-all duration-500 ease-out ${
              isComplete
                ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-200'
                : 'bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 shadow-lg shadow-purple-200'
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
            <p className="text-xs text-slate-600 font-medium">
              {isComplete ? 'Complete' : 'In progress...'}
            </p>
            <p className="text-xs font-bold text-slate-800 tabular-nums">{Math.round(progressClamped)}%</p>
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <div className="flex border-l border-slate-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-3 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-600 transition-all duration-200 active:scale-95"
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
          onClick={() => {
            onUndo?.();
            toast.dismiss(t.id);
          }}
          className="ml-4 flex-shrink-0 inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-600 transition-all duration-150 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 active:scale-95"
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
      borderColor: 'border-green-300',
      ringColor: 'focus:ring-green-500',
    },
    error: {
      borderColor: 'border-red-300',
      ringColor: 'focus:ring-red-500',
    },
    warning: {
      borderColor: 'border-yellow-300',
      ringColor: 'focus:ring-yellow-500',
    },
    info: {
      borderColor: 'border-indigo-300',
      ringColor: 'focus:ring-purple-600',
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      className={`${
        t.visible ? 'animate-toast-enter' : 'animate-toast-leave'
      } max-w-md w-full bg-white rounded-xl pointer-events-auto flex border ${
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
                className="h-10 w-10 rounded-full ring-2 ring-white shadow-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 ring-2 ring-white shadow-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {title?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="ml-3 flex-1 min-w-0">
            {title && <p className="text-sm font-semibold text-slate-900 leading-tight">{title}</p>}
            {message && (
              <p className={`${title ? 'mt-1' : ''} text-sm text-slate-700 leading-relaxed`}>
                {message}
              </p>
            )}

            {/* Action buttons */}
            {actions.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick?.();
                      if (action.dismissOnClick !== false) {
                        toast.dismiss(t.id);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm ${
                      action.variant === 'primary'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 focus:ring-purple-600 shadow-purple-200'
                        : action.variant === 'danger'
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-red-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400 border border-slate-300'
                    } transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:shadow-md active:scale-95`}
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
      <div className="flex border-l border-slate-200">
        <button
          onClick={() => toast.dismiss(t.id)}
          className={`w-full border border-transparent rounded-none rounded-r-xl p-3 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-inset ${config.ringColor} transition-all duration-200 active:scale-95`}
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
      iconColor: 'text-green-600',
      iconBgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-300',
      ringColor: 'focus:ring-green-500',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      iconBgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      borderColor: 'border-red-300',
      ringColor: 'focus:ring-red-500',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      iconBgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      borderColor: 'border-yellow-300',
      ringColor: 'focus:ring-yellow-500',
    },
    info: {
      icon: Info,
      iconColor: 'text-indigo-600',
      iconBgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-300',
      ringColor: 'focus:ring-purple-600',
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`${
        t.visible ? 'animate-toast-enter' : 'animate-toast-leave'
      } max-w-md w-full bg-white rounded-xl pointer-events-auto flex border ${
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
            {title && <p className="text-sm font-semibold text-slate-900 leading-tight">{title}</p>}

            {/* Preview/Full Content */}
            <div className="mt-1.5">
              {isExpanded ? (
                <div className="text-sm text-slate-700 leading-relaxed">{fullContent}</div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">{preview}</p>
              )}
            </div>

            {/* Toggle button */}
            {fullContent && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2.5 text-xs font-semibold text-purple-600 hover:text-purple-700 focus:outline-none focus:underline underline-offset-2 transition-colors duration-150"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}

            {/* Action buttons */}
            {actions.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick?.();
                      if (action.dismissOnClick !== false) {
                        toast.dismiss(t.id);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm ${
                      action.variant === 'primary'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 focus:ring-purple-600 shadow-purple-200'
                        : action.variant === 'danger'
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-red-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400 border border-slate-300'
                    } transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:shadow-md active:scale-95`}
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
      <div className="flex border-l border-slate-200">
        <button
          onClick={() => toast.dismiss(t.id)}
          className={`w-full border border-transparent rounded-none rounded-r-xl p-3 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-inset ${config.ringColor} transition-all duration-200 active:scale-95`}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
