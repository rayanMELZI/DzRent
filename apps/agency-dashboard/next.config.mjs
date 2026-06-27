/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Internal workspace packages ship raw TS; Next transpiles them on demand.
  transpilePackages: ['@dzrent/tokens', '@dzrent/i18n', '@dzrent/types'],
};

export default nextConfig;
