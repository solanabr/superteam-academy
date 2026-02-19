/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config) => {
    // Исключаем проблемные пакеты из бандла (они не нужны в браузере)
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Для Node.js-ориентированных пакетов (если нужно)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // Альтернатива в Next.js 14+ (более рекомендуемая)
  //serverExternalPackages: ['pino-pretty', 'lokijs', 'encoding'],
};

module.exports = nextConfig;