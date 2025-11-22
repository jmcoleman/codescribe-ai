import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Tooltip Component
 *
 * Lightweight tooltip with fast display time (150ms default).
 * Replaces slow native browser tooltips.
 * Automatically adjusts position to stay within viewport.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Element to attach tooltip to
 * @param {string} props.content - Tooltip text content
 * @param {number} props.delay - Delay before showing tooltip in ms (default: 150)
 * @param {string} props.placement - Tooltip placement: 'top' | 'bottom' | 'left' | 'right' (default: 'bottom')
 */
export function Tooltip({
  children,
  content,
  delay = 150,
  placement = 'bottom'
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPlacement, setActualPlacement] = useState(placement);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Calculate tooltip position using fixed positioning (viewport coordinates)
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !containerRef.current) return;

    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 8; // Minimum margin from viewport edge
    const gap = 8; // Gap between trigger and tooltip

    let newPlacement = placement;
    let top = 0;
    let left = 0;

    // Calculate base position for each placement
    if (placement === 'bottom') {
      top = containerRect.bottom + gap;
      left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);

      // Check if there's enough space below
      if (top + tooltipRect.height + margin > viewportHeight) {
        // Not enough space below, try top
        if (containerRect.top - tooltipRect.height - gap - margin > 0) {
          newPlacement = 'top';
          top = containerRect.top - tooltipRect.height - gap;
        }
      }
    } else if (placement === 'top') {
      top = containerRect.top - tooltipRect.height - gap;
      left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);

      // Check if there's enough space above
      if (top < margin) {
        // Not enough space above, try bottom
        if (containerRect.bottom + tooltipRect.height + gap + margin < viewportHeight) {
          newPlacement = 'bottom';
          top = containerRect.bottom + gap;
        }
      }
    } else if (placement === 'left') {
      top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
      left = containerRect.left - tooltipRect.width - gap;

      // Check if there's enough space on left
      if (left < margin) {
        // Not enough space on left, try right
        if (containerRect.right + tooltipRect.width + gap + margin < viewportWidth) {
          newPlacement = 'right';
          left = containerRect.right + gap;
        }
      }
    } else if (placement === 'right') {
      top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
      left = containerRect.right + gap;

      // Check if there's enough space on right
      if (left + tooltipRect.width + margin > viewportWidth) {
        // Not enough space on right, try left
        if (containerRect.left - tooltipRect.width - gap - margin > 0) {
          newPlacement = 'left';
          left = containerRect.left - tooltipRect.width - gap;
        }
      }
    }

    // Adjust horizontal position to stay within viewport (for top/bottom placements)
    if (newPlacement === 'top' || newPlacement === 'bottom') {
      if (left < margin) {
        left = margin;
      } else if (left + tooltipRect.width + margin > viewportWidth) {
        left = viewportWidth - tooltipRect.width - margin;
      }
    }

    // Adjust vertical position to stay within viewport (for left/right placements)
    if (newPlacement === 'left' || newPlacement === 'right') {
      if (top < margin) {
        top = margin;
      } else if (top + tooltipRect.height + margin > viewportHeight) {
        top = viewportHeight - tooltipRect.height - margin;
      }
    }

    setActualPlacement(newPlacement);
    setTooltipPosition({ top, left });
  }, [isVisible, placement]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!content) {
    return children;
  }

  // Calculate arrow position based on placement
  const getArrowStyle = () => {
    if (!containerRef.current || !tooltipRef.current) return {};

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;

    if (actualPlacement === 'bottom' || actualPlacement === 'top') {
      // Arrow should point to center of trigger element
      const arrowLeft = containerCenterX - tooltipPosition.left - 4; // 4px is half arrow width
      return {
        left: `${arrowLeft}px`,
        ...(actualPlacement === 'bottom'
          ? { top: '-4px' }
          : { bottom: '-4px' })
      };
    } else {
      // Left/right placement
      const arrowTop = containerCenterY - tooltipPosition.top - 4;
      return {
        top: `${arrowTop}px`,
        ...(actualPlacement === 'right'
          ? { left: '-4px' }
          : { right: '-4px' })
      };
    }
  };

  const tooltipContent = isVisible && (
    <div
      ref={tooltipRef}
      id={tooltipId.current}
      role="tooltip"
      className="fixed z-[99999] px-2.5 py-1.5 text-xs font-medium text-slate-50 dark:text-slate-100 bg-slate-800 dark:bg-slate-700 border border-slate-700 dark:border-slate-600 rounded-md shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-150"
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`
      }}
    >
      {content}
      {/* Arrow */}
      <div
        className="absolute w-2 h-2 bg-slate-800 dark:bg-slate-700 border-slate-700 dark:border-slate-600 rotate-45"
        style={{
          ...getArrowStyle(),
          borderWidth: actualPlacement === 'top' ? '0 1px 1px 0' : actualPlacement === 'bottom' ? '1px 0 0 1px' : actualPlacement === 'left' ? '0 0 1px 1px' : '1px 1px 0 0'
        }}
      />
    </div>
  );

  return (
    <>
      <div
        ref={containerRef}
        className="inline-flex"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {/* Clone children and add aria-describedby for accessibility */}
        <div aria-describedby={isVisible ? tooltipId.current : undefined}>
          {children}
        </div>
      </div>

      {/* Render tooltip via portal at document body level */}
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
}
