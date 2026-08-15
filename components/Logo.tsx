import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textVariant?: 'full' | 'short';
}

export default function Logo({
  size = 'md',
  showText = true,
  textVariant = 'full',
}: LogoProps) {
  const dimensions = {
    sm: { box: 28, icon: 16, font: '15px' },
    md: { box: 36, icon: 20, font: '18px' },
    lg: { box: 48, icon: 26, font: '22px' },
    xl: { box: 60, icon: 34, font: '26px' },
  }[size];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? '8px' : '10px' }}>
      {/* Modern High-Tech AI Logo Mark */}
      <div
        style={{
          width: `${dimensions.box}px`,
          height: `${dimensions.box}px`,
          borderRadius: size === 'sm' ? '8px' : size === 'xl' ? '16px' : '10px',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #0d9488 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <svg
          width={dimensions.box * 0.75}
          height={dimensions.box * 0.75}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* AI Neural / Circuit Glyph */}
          <path
            d="M6 24L12 8L18 24"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.25 18.5H15.75"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M23 8V24"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="23" cy="4.5" r="1.75" fill="#38bdf8" />
          <circle cx="12" cy="4.5" r="1.75" fill="#38bdf8" />
          <circle cx="6" cy="27" r="1.5" fill="#38bdf8" />
          <circle cx="18" cy="27" r="1.5" fill="#38bdf8" />
          <circle cx="23" cy="27" r="1.5" fill="#38bdf8" />
        </svg>
      </div>

      {showText && (
        <span
          style={{
            fontWeight: 800,
            fontSize: dimensions.font,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #2563eb, #0d9488)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
            }}
          >
            AI
          </span>
          <span>{textVariant === 'full' ? 'Candidate Avatar' : 'Avatar'}</span>
        </span>
      )}
    </div>
  );
}
