# Myflows CI robot

Serves webhooks from Github and run tasks

## Initial setup

Make .env accordingly to .env-sample
Make sure app is running on port specified in /etc/nginx/vhosts/ci.myflows.ru (3031)

## Start app

`cd %app_dir%`
`npm install`
`npm run build`
`APP_NAME=mmf:ci pm2 start ecosystem.config.js`
