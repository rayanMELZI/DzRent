/** Backend: inherits the root TS config; `any` is tolerated (warn) while the
 * Prisma JSON / gateway payload types are being tightened. */
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
