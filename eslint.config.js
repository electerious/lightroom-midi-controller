import config from '@electerious/eslint-config'

export default [
  ...config,
  {
    rules: {
      'unicorn/no-break-in-nested-loop': 'off',
    },
  },
]
