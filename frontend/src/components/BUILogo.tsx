import React from 'react';

interface BUILogoProps {
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

// Exact BUI logo from screenshot:
// Grey rectangle | amber "B" | white divider | amber "UI" | white divider | white "INNOVATION DELIVERY RESULTS"
export function BUILogo({ className = '', style, compact = false }: BUILogoProps) {
  if (compact) {
    // Just the square part without the text
    return (
      <div className={className} style={{ display: 'inline-flex', ...style }}>
        <svg viewBox="0 0 56 40" width="56" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="56" height="40" rx="3" fill="#5A5A5A" />
          {/* B in amber */}
          <text x="7" y="28" fontSize="22" fontWeight="700" fill="#F5A000" fontFamily="Arial, sans-serif">B</text>
          {/* White divider after B */}
          <rect x="24" y="6" width="1.5" height="28" fill="white" />
          {/* UI in amber */}
          <text x="28" y="28" fontSize="22" fontWeight="700" fill="#F5A000" fontFamily="Arial, sans-serif">UI</text>
        </svg>
      </div>
    );
  }

  return (
    <div className={className} style={{ display: 'inline-flex', ...style }}>
      <svg viewBox="0 0 210 44" width="210" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Grey background rectangle */}
        <rect width="210" height="44" rx="3" fill="#5A5A5A" />

        {/* "B" in amber */}
        <text x="9" y="31" fontSize="24" fontWeight="700" fill="#F5A000" fontFamily="Arial Black, Arial, sans-serif">B</text>

        {/* White vertical divider after B */}
        <rect x="31" y="7" width="2" height="30" fill="white" opacity="0.85" />

        {/* "UI" in amber */}
        <text x="36" y="31" fontSize="24" fontWeight="700" fill="#F5A000" fontFamily="Arial Black, Arial, sans-serif">UI</text>

        {/* White vertical divider after UI */}
        <rect x="72" y="7" width="2" height="30" fill="white" opacity="0.85" />

        {/* "INNOVATION" */}
        <text x="80" y="18" fontSize="8.5" fontWeight="400" fill="white" fontFamily="Arial, sans-serif" letterSpacing="0.5">INNOVATION</text>
        {/* "DELIVERY" */}
        <text x="80" y="28" fontSize="8.5" fontWeight="400" fill="white" fontFamily="Arial, sans-serif" letterSpacing="0.5">DELIVERY</text>
        {/* "RESULTS" */}
        <text x="80" y="38" fontSize="8.5" fontWeight="400" fill="white" fontFamily="Arial, sans-serif" letterSpacing="0.5">RESULTS</text>
      </svg>
    </div>
  );
}
