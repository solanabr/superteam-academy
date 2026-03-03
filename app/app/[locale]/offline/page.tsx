/**
 * Offline Page — shown when PWA has no network connection.
 */

export default function OfflinePage() {
    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#0a0a1a',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📡</div>
            <h1
                style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    marginBottom: '0.75rem',
                    letterSpacing: '-0.02em',
                }}
            >
                You&apos;re Offline
            </h1>
            <p
                style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '1.125rem',
                    maxWidth: '400px',
                    lineHeight: 1.6,
                    marginBottom: '2rem',
                }}
            >
                Check your internet connection and try again. Some cached content may still be available.
            </p>
            <button
                onClick={() => typeof window !== 'undefined' && window.location.reload()}
                style={{
                    padding: '0.75rem 2rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #9945FF, #14F195)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    border: 'none',
                    cursor: 'pointer',
                }}
            >
                Retry
            </button>
        </div>
    );
}
