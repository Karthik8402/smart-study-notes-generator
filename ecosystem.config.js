/**
 * PM2 Ecosystem Configuration
 * Smart Study Notes Generator
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 logs
 *   pm2 restart all
 */

module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend',
      script: 'venv/bin/python',
      args: '-m uvicorn app.main:app --host 0.0.0.0 --port 8000',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'mcp-filesystem',
      cwd: './backend',
      script: 'venv/bin/python',
      args: '-m app.mcp.servers.filesystem_server',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      error_file: './logs/mcp-filesystem-error.log',
      out_file: './logs/mcp-filesystem-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'mcp-calendar',
      cwd: './backend',
      script: 'venv/bin/python',
      args: '-m app.mcp.servers.calendar_server',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      error_file: './logs/mcp-calendar-error.log',
      out_file: './logs/mcp-calendar-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'mcp-drive',
      cwd: './backend',
      script: 'venv/bin/python',
      args: '-m app.mcp.servers.drive_server',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      error_file: './logs/mcp-drive-error.log',
      out_file: './logs/mcp-drive-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
