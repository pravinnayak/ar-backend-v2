module.exports = {
  apps: [
    {
      
      name: "Ar-backend",
      script: "app.ts",
      instances: 1,
      max_memory_restart: "1000M",

      // Logging
      out_file: "./out.log",
      error_file: "./error.log",
      merge_logs: true,
      log_date_format: "DD-MM HH:mm:ss Z",

      interpreter : 'ts-node'

    },
  ],
};