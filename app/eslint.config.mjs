import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
    baseDirectory: process.cwd()
});

const eslintConfig = [
  ...compat.extends("next", "prettier"),
];

export default eslintConfig;
