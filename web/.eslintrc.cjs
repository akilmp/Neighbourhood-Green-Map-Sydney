module.exports = {
  extends: ['../.eslintrc.cjs', 'next/core-web-vitals'],
  env: { browser: true },
  parserOptions: { ecmaFeatures: { jsx: true } }
};
