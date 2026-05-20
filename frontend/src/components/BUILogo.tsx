import React from 'react';

interface BUILogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export function BUILogo({ className = '', style }: BUILogoProps) {
  return (
    <svg
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="BUI"
    >
      {/* B */}
      <path
        d="M2 3h9.5c3.2 0 5.5 1.8 5.5 4.5 0 1.7-.85 3-2.2 3.7 1.7.65 2.9 2.1 2.9 4 0 3-2.3 5.3-5.8 5.3H2V3zm3.5 7h5c1.4 0 2.3-.85 2.3-2.1S11.9 5.8 10.5 5.8H5.5V10zm0 7.7H11c1.6 0 2.6-.95 2.6-2.35S12.6 13 11 13H5.5v4.7z"
        fill="currentColor"
      />
      {/* U */}
      <path
        d="M24 3v11c0 2.6 1.4 4.2 3.8 4.2s3.8-1.6 3.8-4.2V3h3.6v11.2c0 4.6-2.8 7.4-7.4 7.4s-7.4-2.8-7.4-7.4V3H24z"
        fill="currentColor"
      />
      {/* I */}
      <path d="M39 3h3.6v17.5H39V3z" fill="currentColor" />
      {/* BUI red signature dot */}
      <circle cx="46" cy="19" r="2.5" fill="#E3001B" />
      {/* Innovation · Delivery · Results */}
      <circle cx="53.5" cy="19" r="1.7" fill="#E3001B" opacity="0.65" />
      <circle cx="60" cy="19" r="1.7" fill="#E3001B" opacity="0.35" />
    </svg>
  );
}
