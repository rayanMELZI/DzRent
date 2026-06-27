import type { Config } from 'tailwindcss';
import preset from '@dzrent/tokens/tailwind-preset';

export default {
  presets: [preset],
  content: [
    './src/**/*.{ts,tsx}',
    // Pick up Tailwind classes used inside shared workspace packages.
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
