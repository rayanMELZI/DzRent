import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Internal workspace packages ship raw TS; Next transpiles them on demand.
  transpilePackages: ['@dzrent/tokens', '@dzrent/i18n', '@dzrent/types'],
  // Self-contained server bundle for the Docker image (enabled only in the
  // container build via BUILD_STANDALONE=1). In a monorepo, trace from the repo
  // root so the workspace packages are bundled into .next/standalone. Left off
  // for local dev because standalone tracing trips over pnpm symlinks on Windows.
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
};

export default nextConfig;
