import React from 'react';

interface BUILogoProps {
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

export function BUILogo({ className = '', style, compact = false }: BUILogoProps) {
  const height = compact ? 28 : 38;

  return (
    <img
      src="/bui-logo.png"
      alt="BUI — Innovation Delivery Results"
      className={className}
      style={{
        height,
        width: 'auto',
        objectFit: 'contain',
        // mix-blend-mode:screen removes the black background on any bg colour
        // The amber letters and grey text remain visible, black becomes transparent
        mixBlendMode: 'screen',
        ...style,
      }}
    />
  );
}
