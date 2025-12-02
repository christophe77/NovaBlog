import { useEffect, useState } from 'react';

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
}

export default function Loading({ fullScreen = false, message }: LoadingProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-lg)',
        padding: fullScreen ? 'var(--spacing-2xl)' : 'var(--spacing-xl)',
        minHeight: fullScreen ? '100vh' : 'auto',
      }}
    >
      {/* AI-themed animated loader */}
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
        }}
      >
        {/* Outer rotating ring */}
        <div
          style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            border: '4px solid transparent',
            borderTop: '4px solid var(--color-primary)',
            borderRight: '4px solid var(--color-secondary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        {/* Inner rotating ring (reverse) */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '80px',
            height: '80px',
            border: '3px solid transparent',
            borderBottom: '3px solid var(--color-primary)',
            borderLeft: '3px solid var(--color-secondary)',
            borderRadius: '50%',
            animation: 'spinReverse 0.8s linear infinite',
          }}
        />
        {/* Center AI brain icon */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '2rem',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          🧠
        </div>
      </div>

      {/* Loading text */}
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: 'var(--spacing-xs)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {message || 'Chargement'}
          {dots}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 'var(--spacing-xs)' }}>
          Traitement en cours...
        </p>
      </div>

      {/* Animated dots */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--spacing-md)' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              animation: `bounce 1.4s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes spinReverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--color-background)',
          zIndex: 9999,
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}

