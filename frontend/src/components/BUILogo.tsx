import React from 'react';

interface BUILogoProps {
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

// Exact BUI logo from screenshot:
// Square amber box with "BUI" letters inside + "INNOVATION / DELIVERY / RESULTS" text to the right
export function BUILogo({ className = '', style, compact = false }: BUILogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={style}>
      {/* Square amber icon box - matches screenshot exactly */}
      <div style={{
        width: 44,
        height: 44,
        background: '#F5A000',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg viewBox="0 0 44 44" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* B */}
          <path
            d="M8 10h7.5c2.8 0 4.8 1.6 4.8 4 0 1.5-.75 2.7-2 3.3 1.6.6 2.7 2 2.7 3.7 0 2.7-2.1 4.8-5.2 4.8H8V10zm3 6.5h4c1.2 0 2-.75 2-1.9S16.2 12.8 15 12.8H11V16.5zm0 7.2H15.2c1.4 0 2.3-.85 2.3-2.1S16.6 19.5 15.2 19.5H11v4.2z"
            fill="#1A1C24"
          />
          {/* U */}
          <path
            d="M23 10v9.8c0 2.3 1.2 3.7 3.3 3.7s3.3-1.4 3.3-3.7V10H33v10c0 4-2.5 6.5-6.7 6.5S19.6 24 19.6 20V10H23z"
            fill="#1A1C24"
          />
          {/* I */}
          <path d="M35 10h3.2v15.8H35V10z" fill="#1A1C24" />
          {/* Three dots */}
          <circle cx="8" cy="33" r="1.8" fill="#1A1C24" />
          <circle cx="13.5" cy="33" r="1.8" fill="#1A1C24" />
          <circle cx="19" cy="33" r="1.8" fill="#1A1C24" />
        </svg>
      </div>

      {/* "INNOVATION / DELIVERY / RESULTS" text - matches screenshot */}
      {!compact && (
        <div style={{ lineHeight: 1.25 }}>
          <div style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: '#F5A000',
            fontFamily: 'Inter, sans-serif',
          }}>INNOVATION</div>
          <div style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: '#F5A000',
            fontFamily: 'Inter, sans-serif',
          }}>DELIVERY</div>
          <div style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: '#F5A000',
            fontFamily: 'Inter, sans-serif',
          }}>RESULTS</div>
        </div>
      )}
    </div>
  );
}
