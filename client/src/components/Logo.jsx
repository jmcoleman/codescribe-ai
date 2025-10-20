/**
 * Logo Component
 *
 * Custom CodeScribe AI brand logo featuring curly braces with document lines and AI sparkle.
 * This matches the favicon design to create consistent brand identity across the application.
 *
 * Design rationale:
 * - Curly braces { } represent code placeholders/variables
 * - Document lines inside show documentation purpose
 * - AI sparkle represents the magic that fills placeholders with docs
 * - Matches favicon visual language for brand consistency
 */

export function Logo({ className = "w-8 h-8", ...props }) {
  return (
    <img
      src="/logo.svg"
      alt="CodeScribe AI Logo"
      className={className}
      {...props}
    />
  );
}
