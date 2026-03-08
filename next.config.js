/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'spirited-friendship-production-fb20.up.railway.app',
      },
    ],
  },
};

module.exports = nextConfig;
