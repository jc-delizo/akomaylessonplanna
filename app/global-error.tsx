'use client'

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            alignItems: 'center',
            display: 'flex',
            fontFamily: 'system-ui, sans-serif',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div>
            <h1>We couldn&apos;t start the application</h1>
            <p>Please try loading it again.</p>
            <button
              onClick={reset}
              style={{ cursor: 'pointer', marginTop: '1rem', padding: '0.75rem 1.25rem' }}
              type="button"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
