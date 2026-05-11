module.exports = {
  apps: [
    {
      name: 'shelter-api',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
        script: 'src/server.ts',
        interpreter: 'tsx',
        interpreter_args: 'watch',
      },
      max_memory_restart: '512M',
      restart_delay: 5000,
      max_restarts: 10,
      watch: false,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
      time: true,
    },
  ],
};
