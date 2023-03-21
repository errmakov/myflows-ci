module.exports = {
    apps : [{
        name: process.env.APP_NAME,
        script : "npm run start",
        restart_delay: 4000,
        watch: ['./dist'],
        ignore_watch:['./node_modules']
    }]
}
