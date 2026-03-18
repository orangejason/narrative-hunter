module.exports = {
  apps: [{
    name: 'narrative-hunter',
    script: 'server.js',
    cwd: '/root/.openclaw/workspace/narrative-hunter/backend',
    env_file: '/root/.openclaw/workspace/narrative-hunter/backend/.env',
    env: {
      NODE_ENV: 'production',
      WEB_URL: 'https://four.meme',
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    restart_delay: 3000,
    max_restarts: 20,
    log_file: '/tmp/narrative-hunter.log',
    error_file: '/tmp/narrative-hunter-err.log',
    out_file: '/tmp/narrative-hunter-out.log',
    merge_logs: true,
  }]
};
