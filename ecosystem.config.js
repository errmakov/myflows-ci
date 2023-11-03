module.exports = {
  apps: [
    {
      name: process.env.APP_NAME,
      script: "npm run markdown",
      restart_delay: 4000,
      watch: ["./dist"],
      ignore_watch: ["./node_modules", "*.js.map"],
    },
  ],
};
