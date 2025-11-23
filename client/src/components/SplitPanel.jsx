/**
 * SplitPanel Component
 *
 * Provides a resizable split view for code and documentation panels.
 * Uses react-resizable-panels for smooth, performant resizing.
 *
 * Features:
 * - Draggable resize handle
 * - Persists panel sizes to localStorage
 * - Responsive: Vertical stack on mobile, horizontal split on desktop
 * - Accessible keyboard navigation
 * - Min/max size constraints
 *
 * Usage:
 * <SplitPanel
 *   leftPanel={<CodePanel />}
 *   rightPanel={<DocPanel />}
 * />
 */

import { useState, useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../constants/storage';

const DEFAULT_LEFT_SIZE = 50; // 50% of screen
const DEFAULT_RIGHT_SIZE = 50;
const MIN_PANEL_SIZE = 20; // 20% minimum
const MAX_PANEL_SIZE = 80; // 80% maximum

export function SplitPanel({ leftPanel, rightPanel, layout = 'split' }) {
  const [isMobile, setIsMobile] = useState(false);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update panel sizes when layout changes using imperative API
  useEffect(() => {
    if (!leftPanelRef.current || !rightPanelRef.current) return;

    if (layout === 'code') {
      leftPanelRef.current.resize(100);
      rightPanelRef.current.resize(0);
    } else if (layout === 'doc') {
      leftPanelRef.current.resize(0);
      rightPanelRef.current.resize(100);
    } else {
      // Split mode - restore saved sizes
      try {
        const saved = getStorageItem(STORAGE_KEYS.SPLIT_PANEL_SIZES);
        if (saved) {
          const { left, right } = JSON.parse(saved);
          leftPanelRef.current.resize(left);
          rightPanelRef.current.resize(right);
        } else {
          leftPanelRef.current.resize(DEFAULT_LEFT_SIZE);
          rightPanelRef.current.resize(DEFAULT_RIGHT_SIZE);
        }
      } catch (error) {
        leftPanelRef.current.resize(DEFAULT_LEFT_SIZE);
        rightPanelRef.current.resize(DEFAULT_RIGHT_SIZE);
      }
    }
  }, [layout]);

  // Handle panel resize (only save in split mode)
  const handleResize = (sizes) => {
    // Only save to localStorage when in split mode
    if (layout === 'split' && sizes && sizes.length === 2) {
      try {
        setStorageItem(STORAGE_KEYS.SPLIT_PANEL_SIZES, JSON.stringify({
          left: sizes[0],
          right: sizes[1]
        }));
      } catch (error) {
        console.error('[SplitPanel] Error saving panel sizes:', error);
      }
    }
  };

  // Mobile: Stack vertically (no resizing)
  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        {/* Code Panel - Top */}
        <div className="min-h-[600px] h-[70vh]">
          {leftPanel}
        </div>

        {/* Documentation Panel - Bottom */}
        <div className="min-h-[600px] h-[70vh]">
          {rightPanel}
        </div>
      </div>
    );
  }

  // Load initial sizes
  const getInitialSizes = () => {
    try {
      const saved = getStorageItem(STORAGE_KEYS.SPLIT_PANEL_SIZES);
      if (saved) {
        const { left, right } = JSON.parse(saved);
        return { left, right };
      }
    } catch (error) {
      console.error('[SplitPanel] Error loading panel sizes:', error);
    }
    return { left: DEFAULT_LEFT_SIZE, right: DEFAULT_RIGHT_SIZE };
  };

  const initialSizes = getInitialSizes();

  // Desktop/Tablet: Resizable horizontal split
  // Using imperative API for controlled sizing
  return (
    <div className="flex-1 min-h-0 flex flex-col h-full">
      <PanelGroup
        direction="horizontal"
        onLayout={handleResize}
        className="flex-1"
      >
        {/* Left Panel - Code */}
        <Panel
          ref={leftPanelRef}
          id="left-panel"
          order={1}
          defaultSize={initialSizes.left}
          minSize={layout === 'split' ? MIN_PANEL_SIZE : 0}
          maxSize={layout === 'split' ? MAX_PANEL_SIZE : 100}
          className="flex"
          collapsible={layout !== 'split'}
        >
          <div className="flex-1 min-h-0">
            {leftPanel}
          </div>
        </Panel>

        {/* Resize Handle - Only show in split mode */}
        {layout === 'split' && (
          <PanelResizeHandle className="split-panel-handle">
            <div className="split-panel-handle-inner">
              <div className="split-panel-handle-icon" />
            </div>
          </PanelResizeHandle>
        )}

        {/* Right Panel - Documentation */}
        <Panel
          ref={rightPanelRef}
          id="right-panel"
          order={2}
          defaultSize={initialSizes.right}
          minSize={layout === 'split' ? MIN_PANEL_SIZE : 0}
          maxSize={layout === 'split' ? MAX_PANEL_SIZE : 100}
          className="flex"
          collapsible={layout !== 'split'}
        >
          <div className="flex-1 min-h-0">
            {rightPanel}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

// Export resize handle styles to be added to global CSS
export const SPLIT_PANEL_STYLES = `
/* Split Panel Resize Handle */
.split-panel-handle {
  position: relative;
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  transition: background-color 200ms ease;
  background-color: transparent;
}

.split-panel-handle:hover,
.split-panel-handle[data-resize-handle-state="hover"] {
  background-color: rgb(226 232 240 / 0.5); /* slate-200 with opacity */
}

.dark .split-panel-handle:hover,
.dark .split-panel-handle[data-resize-handle-state="hover"] {
  background-color: rgb(51 65 85 / 0.5); /* slate-700 with opacity */
}

.split-panel-handle[data-resize-handle-state="drag"] {
  background-color: rgb(147 51 234); /* purple-600 */
}

.dark .split-panel-handle[data-resize-handle-state="drag"] {
  background-color: rgb(168 85 247); /* purple-500 */
}

/* Handle inner container */
.split-panel-handle-inner {
  width: 4px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background-color: rgb(203 213 225); /* slate-300 */
  transition: all 200ms ease;
}

.dark .split-panel-handle-inner {
  background-color: rgb(71 85 105); /* slate-600 */
}

.split-panel-handle:hover .split-panel-handle-inner,
.split-panel-handle[data-resize-handle-state="hover"] .split-panel-handle-inner {
  background-color: rgb(148 163 184); /* slate-400 */
  height: 60px;
}

.dark .split-panel-handle:hover .split-panel-handle-inner,
.dark .split-panel-handle[data-resize-handle-state="hover"] .split-panel-handle-inner {
  background-color: rgb(100 116 139); /* slate-500 */
}

.split-panel-handle[data-resize-handle-state="drag"] .split-panel-handle-inner {
  background-color: rgb(147 51 234); /* purple-600 */
  height: 80px;
  box-shadow: 0 0 0 2px rgb(147 51 234 / 0.2);
}

.dark .split-panel-handle[data-resize-handle-state="drag"] .split-panel-handle-inner {
  background-color: rgb(168 85 247); /* purple-500 */
  box-shadow: 0 0 0 2px rgb(168 85 247 / 0.2);
}

/* Handle icon (3 dots) */
.split-panel-handle-icon {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.5;
  position: relative;
}

.split-panel-handle-icon::before,
.split-panel-handle-icon::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background-color: currentColor;
  left: 0;
}

.split-panel-handle-icon::before {
  top: -6px;
}

.split-panel-handle-icon::after {
  bottom: -6px;
}

/* Focus styles for accessibility */
.split-panel-handle:focus-visible {
  outline: 2px solid rgb(147 51 234); /* purple-600 */
  outline-offset: 2px;
}

.dark .split-panel-handle:focus-visible {
  outline-color: rgb(168 85 247); /* purple-500 */
}

/* Mobile: Remove handle on small screens */
@media (max-width: 1023px) {
  .split-panel-handle {
    display: none;
  }
}
`;
