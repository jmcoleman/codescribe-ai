import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  SkeletonLoader,
  CodePanelSkeleton,
  DocPanelSkeleton,
  DocPanelGeneratingSkeleton,
} from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  describe('Base Component', () => {
    describe('Rendering', () => {
      it('renders a div element', () => {
        const { container } = render(<SkeletonLoader />);
        expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
      });

      it('has base classes for skeleton appearance', () => {
        const { container } = render(<SkeletonLoader />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('animate-pulse');
        expect(skeleton).toHaveClass('bg-slate-200');
        expect(skeleton).toHaveClass('rounded');
      });

      it('applies custom className', () => {
        const { container } = render(<SkeletonLoader className="custom-class" />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('custom-class');
      });

      it('merges custom className with base classes', () => {
        const { container } = render(<SkeletonLoader className="custom-class" />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('custom-class');
        expect(skeleton).toHaveClass('animate-pulse');
        expect(skeleton).toHaveClass('bg-slate-200');
      });
    });

    describe('Variants', () => {
      it('renders text variant with correct classes', () => {
        const { container } = render(<SkeletonLoader variant="text" />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('h-4');
        expect(skeleton).toHaveClass('w-full');
      });

      it('renders text-short variant with correct classes', () => {
        const { container } = render(<SkeletonLoader variant="text-short" />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('h-4');
        expect(skeleton).toHaveClass('w-3/4');
      });

      it('renders text-xs variant with correct classes', () => {
        const { container } = render(<SkeletonLoader variant="text-xs" />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('h-3');
        expect(skeleton).toHaveClass('w-1/2');
      });

      it('renders heading variant with correct classes', () => {
        const { container } = render(<SkeletonLoader variant="heading" />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('h-6');
        expect(skeleton).toHaveClass('w-2/3');
      });

      it('renders circle variant with correct classes', () => {
        const { container } = render(<SkeletonLoader variant="circle" />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('h-3');
        expect(skeleton).toHaveClass('w-3');
        expect(skeleton).toHaveClass('rounded-full');
      });

      it('renders badge variant with correct classes', () => {
        const { container } = render(<SkeletonLoader variant="badge" />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('h-6');
        expect(skeleton).toHaveClass('w-16');
      });

      it('renders button variant with correct classes', () => {
        const { container } = render(<SkeletonLoader variant="button" />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('h-9');
        expect(skeleton).toHaveClass('w-24');
      });

      it('renders line variant with correct classes', () => {
        const { container } = render(<SkeletonLoader variant="line" />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('h-px');
        expect(skeleton).toHaveClass('w-full');
      });

      it('renders code variant with correct classes', () => {
        const { container } = render(<SkeletonLoader variant="code" />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('h-4');
        expect(skeleton).toHaveClass('w-11/12');
        expect(skeleton).toHaveClass('font-mono');
      });

      it('defaults to text variant when no variant specified', () => {
        const { container } = render(<SkeletonLoader />);
        const skeleton = container.firstChild;
        expect(skeleton).toHaveClass('h-4');
        expect(skeleton).toHaveClass('w-full');
      });
    });

    describe('Accessibility', () => {
      it('is a non-interactive element', () => {
        render(<SkeletonLoader />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
      });

      it('has motion-safe animation', () => {
        const { container } = render(<SkeletonLoader />);
        const skeleton = container.firstChild;
        // Pulse animation respects prefers-reduced-motion
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });
  });

  describe('CodePanelSkeleton', () => {
    describe('Structure', () => {
      it('renders with correct container classes', () => {
        const { container } = render(<CodePanelSkeleton />);
        const wrapper = container.firstChild;
        expect(wrapper).toHaveClass('flex');
        expect(wrapper).toHaveClass('flex-col');
        expect(wrapper).toHaveClass('h-full');
        expect(wrapper).toHaveClass('bg-white');
        expect(wrapper).toHaveClass('rounded-xl');
      });

      it('has header section with slate background', () => {
        const { container } = render(<CodePanelSkeleton />);
        const header = container.querySelector('.bg-slate-50');
        expect(header).toBeInTheDocument();
        expect(header).toHaveClass('border-b');
        expect(header).toHaveClass('border-slate-200');
      });

      it('has body section with code lines', () => {
        const { container } = render(<CodePanelSkeleton />);
        const body = container.querySelector('.flex-1');
        expect(body).toBeInTheDocument();
        expect(body).toHaveClass('overflow-hidden');
        expect(body).toHaveClass('p-4');
      });

      it('has footer section', () => {
        const { container } = render(<CodePanelSkeleton />);
        const footer = container.querySelector('.border-t');
        expect(footer).toBeInTheDocument();
        expect(footer).toHaveClass('bg-slate-50');
      });
    });

    describe('Header Elements', () => {
      it('renders traffic light dots', () => {
        const { container } = render(<CodePanelSkeleton />);
        const circles = container.querySelectorAll('.rounded-full');
        // Should have at least 3 circles for traffic lights (may have more in footer)
        expect(circles.length).toBeGreaterThanOrEqual(3);
      });

      it('renders filename placeholder', () => {
        const { container } = render(<CodePanelSkeleton />);
        const header = container.querySelector('.bg-slate-50');
        // Header should contain skeleton loaders
        expect(header.querySelector('.animate-pulse')).toBeInTheDocument();
      });

      it('renders language badge placeholder', () => {
        const { container } = render(<CodePanelSkeleton />);
        const header = container.querySelector('.bg-slate-50');
        const badges = header.querySelectorAll('.h-5');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    describe('Code Lines', () => {
      it('renders 12 code line placeholders', () => {
        const { container } = render(<CodePanelSkeleton />);
        const body = container.querySelector('.flex-1');
        const codeLines = body.querySelectorAll('.font-mono');
        expect(codeLines).toHaveLength(12);
      });

      it('code lines have staggered animation delays', () => {
        const { container } = render(<CodePanelSkeleton />);
        const body = container.querySelector('.flex-1');
        const codeLines = body.querySelectorAll('.font-mono');

        // Check first few lines have different animation delays
        // Animation delays are set via inline styles
        expect(codeLines[0]).toHaveAttribute('style');
        expect(codeLines[1]).toHaveAttribute('style');
        expect(codeLines[2]).toHaveAttribute('style');

        // Verify delays are different (checking the actual style string)
        expect(codeLines[0].getAttribute('style')).toContain('animation-delay: 0ms');
        expect(codeLines[1].getAttribute('style')).toContain('animation-delay: 50ms');
        expect(codeLines[2].getAttribute('style')).toContain('animation-delay: 100ms');
      });

      it('all code lines have pulse animation', () => {
        const { container } = render(<CodePanelSkeleton />);
        const body = container.querySelector('.flex-1');
        const codeLines = body.querySelectorAll('.font-mono');

        codeLines.forEach((line) => {
          expect(line).toHaveClass('animate-pulse');
        });
      });
    });

    describe('Footer Elements', () => {
      it('renders status info placeholder', () => {
        const { container } = render(<CodePanelSkeleton />);
        const footer = container.querySelector('.border-t');
        const skeletons = footer.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DocPanelSkeleton', () => {
    describe('Structure', () => {
      it('renders with correct container classes', () => {
        const { container } = render(<DocPanelSkeleton />);
        const wrapper = container.firstChild;
        expect(wrapper).toHaveClass('flex');
        expect(wrapper).toHaveClass('flex-col');
        expect(wrapper).toHaveClass('h-full');
        expect(wrapper).toHaveClass('bg-white');
        expect(wrapper).toHaveClass('rounded-xl');
      });

      it('has header section with purple background', () => {
        const { container } = render(<DocPanelSkeleton />);
        const header = container.querySelector('.bg-purple-50');
        expect(header).toBeInTheDocument();
        expect(header).toHaveClass('border-b');
        expect(header).toHaveClass('border-purple-200');
      });

      it('has scrollable body section', () => {
        const { container } = render(<DocPanelSkeleton />);
        const body = container.querySelector('.flex-1');
        expect(body).toBeInTheDocument();
        expect(body).toHaveClass('overflow-y-auto');
        expect(body).toHaveClass('p-6');
      });

      it('has footer section', () => {
        const { container } = render(<DocPanelSkeleton />);
        const footer = container.querySelector('.border-t');
        expect(footer).toBeInTheDocument();
        expect(footer).toHaveClass('bg-slate-50');
      });
    });

    describe('Header Elements', () => {
      it('renders icon placeholder', () => {
        const { container } = render(<DocPanelSkeleton />);
        const header = container.querySelector('.bg-purple-50');
        const circles = header.querySelectorAll('.rounded-full');
        expect(circles.length).toBeGreaterThan(0);
      });

      it('renders title placeholder', () => {
        const { container } = render(<DocPanelSkeleton />);
        const header = container.querySelector('.bg-purple-50');
        const textSkeletons = header.querySelectorAll('.w-48');
        expect(textSkeletons.length).toBeGreaterThan(0);
      });

      it('renders button placeholders', () => {
        const { container } = render(<DocPanelSkeleton />);
        const header = container.querySelector('.bg-purple-50');
        const buttons = header.querySelectorAll('.h-8');
        expect(buttons.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('Content Structure', () => {
      it('renders heading placeholders', () => {
        const { container } = render(<DocPanelSkeleton />);
        const body = container.querySelector('.flex-1');
        const headings = body.querySelectorAll('.h-6');
        expect(headings.length).toBeGreaterThan(0);
      });

      it('renders paragraph line placeholders', () => {
        const { container } = render(<DocPanelSkeleton />);
        const body = container.querySelector('.flex-1');
        const paragraphs = body.querySelectorAll('.space-y-2');
        expect(paragraphs.length).toBeGreaterThan(0);
      });

      it('renders code block placeholder', () => {
        const { container } = render(<DocPanelSkeleton />);
        const body = container.querySelector('.flex-1');
        const codeBlock = body.querySelector('.bg-slate-50.border.border-slate-200.rounded-lg');
        expect(codeBlock).toBeInTheDocument();
      });

      it('renders list items with bullet points', () => {
        const { container } = render(<DocPanelSkeleton />);
        const body = container.querySelector('.flex-1');
        const listContainer = body.querySelector('.ml-4');
        expect(listContainer).toBeInTheDocument();

        const listItems = listContainer.querySelectorAll('.flex.items-center.gap-2');
        expect(listItems).toHaveLength(4);
      });

      it('list bullets are circular', () => {
        const { container } = render(<DocPanelSkeleton />);
        const body = container.querySelector('.flex-1');
        const listContainer = body.querySelector('.ml-4');
        const bullets = listContainer.querySelectorAll('.w-1\\.5');
        expect(bullets.length).toBeGreaterThan(0);
      });
    });

    describe('Footer Elements', () => {
      it('renders metadata placeholders', () => {
        const { container } = render(<DocPanelSkeleton />);
        const footer = container.querySelector('.border-t');
        const metaItems = footer.querySelectorAll('.w-28, .w-32, .w-24');
        expect(metaItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DocPanelGeneratingSkeleton', () => {
    describe('Structure', () => {
      it('renders with correct container classes', () => {
        const { container } = render(<DocPanelGeneratingSkeleton />);
        const wrapper = container.firstChild;
        expect(wrapper).toHaveClass('flex');
        expect(wrapper).toHaveClass('flex-col');
        expect(wrapper).toHaveClass('h-full');
        expect(wrapper).toHaveClass('bg-white');
        expect(wrapper).toHaveClass('rounded-xl');
      });

      it('has header with purple background', () => {
        const { container } = render(<DocPanelGeneratingSkeleton />);
        const header = container.querySelector('.bg-purple-50');
        expect(header).toBeInTheDocument();
        expect(header).toHaveClass('border-b');
        expect(header).toHaveClass('border-purple-200');
      });

      it('has centered content layout', () => {
        const { container } = render(<DocPanelGeneratingSkeleton />);
        const contentContainer = container.querySelector('.flex.flex-col.items-center.justify-center');
        expect(contentContainer).toBeInTheDocument();
        expect(contentContainer).toHaveClass('text-center');
      });
    });

    describe('Header', () => {
      it('displays sparkle icons', () => {
        render(<DocPanelGeneratingSkeleton />);
        const sparkles = screen.getAllByText('✨');
        expect(sparkles.length).toBeGreaterThan(0);
      });

      it('displays title text', () => {
        render(<DocPanelGeneratingSkeleton />);
        expect(screen.getByText('Generated Documentation')).toBeInTheDocument();
      });

      it('sparkle icon has pulse animation', () => {
        const { container } = render(<DocPanelGeneratingSkeleton />);
        const sparkle = container.querySelector('.text-purple-600');
        expect(sparkle).toHaveClass('animate-pulse');
      });
    });

    describe('Animated Icon', () => {
      it('renders centered sparkle with bounce animation', () => {
        const { container } = render(<DocPanelGeneratingSkeleton />);
        const animatedSparkle = container.querySelector('.animate-bounce');
        expect(animatedSparkle).toBeInTheDocument();
        expect(animatedSparkle.textContent).toBe('✨');
      });

      it('has blur effect background', () => {
        const { container } = render(<DocPanelGeneratingSkeleton />);
        const blurBg = container.querySelector('.blur-xl');
        expect(blurBg).toBeInTheDocument();
        expect(blurBg).toHaveClass('bg-purple-200');
        expect(blurBg).toHaveClass('rounded-full');
        expect(blurBg).toHaveClass('animate-pulse');
      });
    });

    describe('Status Text', () => {
      it('displays generating message', () => {
        render(<DocPanelGeneratingSkeleton />);
        expect(screen.getByText('Generating documentation...')).toBeInTheDocument();
      });

      it('displays helper text', () => {
        render(<DocPanelGeneratingSkeleton />);
        expect(screen.getByText('This may take a few moments')).toBeInTheDocument();
      });

      it('status text has correct styling', () => {
        render(<DocPanelGeneratingSkeleton />);
        const statusText = screen.getByText('Generating documentation...');
        expect(statusText).toHaveClass('text-sm');
        expect(statusText).toHaveClass('font-medium');
        expect(statusText).toHaveClass('text-slate-700');
      });

      it('helper text has correct styling', () => {
        render(<DocPanelGeneratingSkeleton />);
        const helperText = screen.getByText('This may take a few moments');
        expect(helperText).toHaveClass('text-xs');
        expect(helperText).toHaveClass('text-slate-500');
      });
    });

    describe('Streaming Content Lines', () => {
      it('renders 3 animated content lines', () => {
        const { container } = render(<DocPanelGeneratingSkeleton />);
        const contentArea = container.querySelector('.max-w-md');
        const lines = contentArea.querySelectorAll('.animate-pulse');
        expect(lines).toHaveLength(3);
      });

      it('content lines have staggered animation delays', () => {
        const { container } = render(<DocPanelGeneratingSkeleton />);
        const contentArea = container.querySelector('.max-w-md');
        const lines = contentArea.querySelectorAll('.animate-pulse');

        // Animation delays are set via inline styles
        expect(lines[0]).toHaveAttribute('style');
        expect(lines[1]).toHaveAttribute('style');
        expect(lines[2]).toHaveAttribute('style');

        // Verify delays are different (checking the actual style string)
        expect(lines[0].getAttribute('style')).toContain('animation-delay: 0ms');
        expect(lines[1].getAttribute('style')).toContain('animation-delay: 100ms');
        expect(lines[2].getAttribute('style')).toContain('animation-delay: 200ms');
      });
    });
  });

  describe('Visual Consistency', () => {
    it('all skeletons use consistent base classes', () => {
      const { container: base } = render(<SkeletonLoader />);
      const { container: code } = render(<CodePanelSkeleton />);
      const { container: doc } = render(<DocPanelSkeleton />);
      const { container: gen } = render(<DocPanelGeneratingSkeleton />);

      const baseEl = base.firstChild;
      const codeSkeletons = code.querySelectorAll('.animate-pulse');
      const docSkeletons = doc.querySelectorAll('.animate-pulse');
      const genSkeletons = gen.querySelectorAll('.animate-pulse');

      // All should have pulse animation
      expect(baseEl).toHaveClass('animate-pulse');
      expect(codeSkeletons.length).toBeGreaterThan(0);
      expect(docSkeletons.length).toBeGreaterThan(0);
      expect(genSkeletons.length).toBeGreaterThan(0);
    });

    it('all skeletons use consistent color scheme', () => {
      const { container: code } = render(<CodePanelSkeleton />);
      const { container: doc } = render(<DocPanelSkeleton />);

      const codeGrayElements = code.querySelectorAll('.bg-slate-200');
      const docGrayElements = doc.querySelectorAll('.bg-slate-200');

      expect(codeGrayElements.length).toBeGreaterThan(0);
      expect(docGrayElements.length).toBeGreaterThan(0);
    });
  });
});
