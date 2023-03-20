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
        return res.status(400).send('Missing signature header');
    }
    const signature = 'sha256=' + crypto.createHmac('sha256', cfg.secret!).update(payloadBody).digest('hex');
    if (Array.isArray(signatureHeader)) {
        const validSignature = signatureHeader.find((header) =>
            crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(header))
        );
        if (!validSignature) {
            return res.status(500).send("Signatures didn't match!");
        }
    } else {
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(signatureHeader))) {
            return res.status(500).send("Signatures didn't match!");
        }
    }
    req.body = JSON.parse(payloadBody);
    next();
};

const app = express();

app.use(express.json());

// Apply middleware to all routes
app.use(verifySignatureMiddleware);

// Route handler for GET requests
app.get('/', (req, res) => {
    res.send('Hello, HTTP world!');
});

// Start the server
app.listen(cfg.port, () => {
    console.log('Listening on port:', cfg.port);
});
