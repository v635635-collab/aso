module.exports = {
  apps: [
    {
      name: 'aso-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 3001 },
    },
    {
      name: 'aso-cron',
      script: 'dist/cron/runner.js',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
    },
  ],
};
