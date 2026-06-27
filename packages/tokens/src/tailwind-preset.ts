/**
 * Shared Tailwind preset built from the DzRent design tokens.
 *
 * Every app (agency dashboard, client PWA) extends this preset so brand colors,
 * status palette, fonts, radii and shadows stay identical across surfaces.
 *
 * Usage (app `tailwind.config.ts`):
 *   import preset from '@dzrent/tokens/tailwind-preset';
 *   export default { presets: [preset], content: [...] };
 */
import type { Config } from 'tailwindcss';
import { colors, fonts, radii, shadows, status } from './index';

const preset = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: colors.primary,
          deep: colors.primaryDeep,
          soft: colors.primarySoft,
        },
        clay: {
          DEFAULT: colors.clay,
          soft: colors.claySoft,
        },
        sand: colors.sand,
        canvas: colors.canvas,
        paper: colors.paper,
        ink: {
          DEFAULT: colors.ink,
          2: colors.ink2,
          3: colors.ink3,
          4: colors.ink4,
          5: colors.ink5,
        },
        line: {
          DEFAULT: colors.line,
          2: colors.line2,
          3: colors.line3,
        },
        deposit: {
          bg: colors.depositBg,
          ink: colors.depositInk,
          line: colors.depositLine,
        },
        // Status palette — flattened so classes like `bg-status-approved-bg`
        // and `text-status-refused-ink` are available everywhere.
        status: {
          'approved-ink': status.approved.ink,
          'approved-bg': status.approved.bg,
          'approved-dot': status.approved.dot,
          'pending-ink': status.pending.ink,
          'pending-bg': status.pending.bg,
          'pending-dot': status.pending.dot,
          'refused-ink': status.refused.ink,
          'refused-bg': status.refused.bg,
          'refused-dot': status.refused.dot,
          'expiring-ink': status.expiring.ink,
          'expiring-bg': status.expiring.bg,
          'expiring-dot': status.expiring.dot,
          'none-ink': status.none.ink,
          'none-bg': status.none.bg,
          'none-dot': status.none.dot,
          'blacklist-ink': status.blacklist.ink,
          'blacklist-bg': status.blacklist.bg,
          'blacklist-dot': status.blacklist.dot,
        },
      },
      fontFamily: {
        sans: [fonts.sans],
        arabic: [fonts.arabic],
        mono: [fonts.mono],
      },
      borderRadius: {
        r1: radii.r1,
        r2: radii.r2,
        r3: radii.r3,
        r4: radii.r4,
      },
      boxShadow: {
        card: shadows.shadowCard,
        soft: shadows.shadow,
        up: shadows.shadowUp,
      },
    },
  },
} satisfies Partial<Config>;

export default preset;
