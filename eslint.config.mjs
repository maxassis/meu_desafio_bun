import antfu from '@antfu/eslint-config'

export default antfu({
  lessOpinionated: true,
  react: true,
  typescript: true,
}, {
  rules: {
    'antfu/no-top-level-await': 'off',
    'no-console': ['error', { allow: ['warn', 'error', 'log'] }],
    'node/prefer-global/buffer': 'off',
    'node/prefer-global/process': 'off',
  },
}, {
  files: ['src/lib/email/templates/**/*.tsx'],
  rules: {
    'react-refresh/only-export-components': 'off',
    'ts/no-use-before-define': 'off',
  },
})
