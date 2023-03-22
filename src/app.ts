import { execSync } from 'child_process';
import crypto from 'crypto';
import express, { NextFunction, Request, Response } from 'express';
import config from './config/config.js';
import { TConfigKey } from './types/types.js';

let confKey = (process.env.SETTING || 'development') as TConfigKey
const cfg = config[confKey];

// Middleware to verify the signature using the secret token
const verifySignatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const payloadBody = JSON.stringify(req.body);
    const signatureHeader = req.headers['x-hub-signature-256'];
    if (!signatureHeader) {
        console.log('Missing signature header')
        return res.status(400).send('Missing signature header');
    }
    const signature = 'sha256=' + crypto.createHmac('sha256', cfg.secret!).update(payloadBody).digest('hex');
    if (Array.isArray(signatureHeader)) {
        console.log('Array.isArray(signatureHeader)');
        const validSignature = signatureHeader.find((header) =>
            crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(header))
        );
        if (!validSignature) {
            console.log('Signatures didn\'t match!')
            return res.status(500).send("Signatures didn't match!");
        }
    } else {
        console.log('!Array.isArray(signatureHeader)')
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(signatureHeader))) {
            console.log('Signatures didn\'t match! 2222')
            return res.status(500).send("Signatures didn't match!");
        }
    }
    req.body = JSON.parse(payloadBody);
    console.log('Signatures matched!')
    next();
};

const app = express();

app.use(express.json());

// Apply middleware to all routes
app.use(verifySignatureMiddleware);

app.post('/githubhook/push', (req, res) => {
    try {
        if (req.body.ref.includes('stage')) {
            res.status(200).send('Deployment started!');
            console.log(`Push event received at ${new Date().toISOString()}`);
            execSync(`cd ${process.env.DEPLOY_DIR} && git checkout ${process.env.TARGET_BRANCH} && git pull`);
            execSync(`cd ${process.env.DEPLOY_DIR} && npm run build`);
            execSync(`cd ${process.env.DEPLOY_DIR} && npm run cy:run:login`);

            // axios.post(`https://api.telegram.org/bot'${process.env.TG_API_KEY}'/sendMessage`, {
            //     chat_id: process.env.TG_CHAT_ID,
            //     text: 'Deployment successful!',
            // });    
        } else {
            res.status(200).send(`Branch ${req.body.ref} is not allowed to deploy!`);
        }
    } catch (e) {
        console.log(`Deployment failed at ${new Date().toISOString()} \n with error: ${e}`);
        execSync('git reset --hard HEAD@{1}');

        // axios.post(`https://api.telegram.org/bot'${process.env.TG_API_KEY}'/sendMessage`, {
        //     chat_id: process.env.TG_CHAT_ID,
        //     text: 'Deployment failed!',
        // });

    }
});

// Start the server
app.listen(cfg.port, () => {
    console.log(`Deploy service started listening at ${new Date().toISOString()} on port ${cfg.port}`);
});
