module.exports = {
  apps: [
    {
      name: "cmscrm-frontend",
      cwd: "./",
      script: "npm",
      args: "run dev",
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 8800,
      },
    },
  ],
};
