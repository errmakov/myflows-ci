import express, { NextFunction, Request, Response } from 'express';
import config from './config/config.js';
import { TConfigKey } from './types/types.js';
const app = express();
let confKey = (process.env.SETTING || 'development') as TConfigKey
const cfg = config[confKey];

// API key validation middleware
const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
    console.log('req in validateApiKey:', req)
    const apiKey = req.header('API-Key');
    if (apiKey !== process.env.SECRET) {
        return res.status(401).send('Invalid API key');
    }
    next();
};

// Apply middleware to all routes
app.use(validateApiKey);

// Route handler for GET requests
app.get('/', (req, res) => {
    res.send('Hello, HTTP world!');
});

// Start the server
app.listen(cfg.port, () => {
    console.log('Listening on port:', cfg.port);
});
