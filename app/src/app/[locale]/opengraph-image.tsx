import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Superteam Academy - Learn Solana Development';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: 'Learn Solana Development',
    pt: 'Aprenda Desenvolvimento Solana',
    es: 'Aprende Desarrollo en Solana',
  };

  const subtitles: Record<string, string> = {
    en: 'Interactive courses with on-chain credentials',
    pt: 'Cursos interativos com credenciais on-chain',
    es: 'Cursos interactivos con credenciales on-chain',
  };

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, #9945FF22 0%, transparent 50%), radial-gradient(circle at 75% 75%, #14F19522 0%, transparent 50%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#9945FF',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Superteam Academy
          </div>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#ffffff',
              textAlign: 'center',
              maxWidth: '900px',
              lineHeight: 1.2,
            }}
          >
            {titles[locale] ?? titles.en}
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#a1a1aa',
              textAlign: 'center',
            }}
          >
            {subtitles[locale] ?? subtitles.en}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '16px',
            }}
          >
            {['Soulbound XP', 'NFT Credentials', 'Gamified Learning'].map((tag) => (
              <div
                key={tag}
                style={{
                  padding: '8px 20px',
                  borderRadius: '999px',
                  border: '1px solid #9945FF44',
                  color: '#9945FF',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
