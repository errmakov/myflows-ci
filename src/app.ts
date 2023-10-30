import axios from "axios";
import { execSync } from "child_process";
import crypto from "crypto";
import express, { NextFunction, Request, Response } from "express";
import config from "./config/config.js";

let confKey = (process.env.SETTING || "development") as TConfigKey;
const cfg = config[confKey];

// Middleware to verify the signature using the secret token
const verifySignatureMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("req: ", req);
  const payloadBody = JSON.stringify(req.body);
  console.log("payloadBody", payloadBody);
  const signatureHeader = req.headers["x-hub-signature-256"];
  if (!signatureHeader) {
    console.log("Missing signature header");
    return res.status(400).send("Missing signature header");
  }
  const signature =
    "sha256=" +
    crypto.createHmac("sha256", cfg.secret!).update(payloadBody).digest("hex");
  if (Array.isArray(signatureHeader)) {
    console.log("Array.isArray(signatureHeader)");
    const validSignature = signatureHeader.find((header) =>
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(header))
    );
    if (!validSignature) {
      console.log("Signatures didn't match!");
      return res.status(500).send("Signatures didn't match!");
    }
  } else {
    console.log("!Array.isArray(signatureHeader)");
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(signatureHeader)
      )
    ) {
      console.log("Signatures didn't match! 2222");
      return res.status(500).send("Signatures didn't match!");
    }
  }
  req.body = JSON.parse(payloadBody);
  console.log("Signatures matched!");
  next();
};

const app = express();

app.use(express.json());

// Apply middleware to all routes
app.use(verifySignatureMiddleware);

const tgpost = (text: string) => {
  return axios.post(
    `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
    {
      chat_id: process.env.TG_CHAT_ID,
      text: text,
    }
  );
};

app.post("/githubhook/push", async (req, res) => {
  try {
    if (req.body.ref.includes("stage")) {
      res.status(200).send("Deployment started!");
      await tgpost(
        `*Deployment started*:\n[${req.body.head_commit.id}](${req.body.head_commit.url}) by ${req.body.pusher.name}`
      );
      console.log(`Push event received at ${new Date().toISOString()}`);
      await tgpost(`run \`git checkout\``);
      execSync(
        `cd ${process.env.DEPLOY_DIR} && git checkout ${process.env.TARGET_BRANCH} && git pull`
      );
      await tgpost(`run \`npm run build\``);
      execSync(`cd ${process.env.DEPLOY_DIR} && npm run build`);

      await tgpost(`run jest unit tests: \`npm run test:j\``);
      execSync(`cd ${process.env.DEPLOY_DIR} && npm run test:j`);

      await tgpost(`run cypress e2e: \`npm run test:cy:ci\``);
      execSync(`cd ${process.env.DEPLOY_DIR} && npm run test:cy:ci`);

      //await tgpost(`Make CI great again a little bit later (skipping e2e tests right now)`);

      execSync(
        `cd ${process.env.DEPLOY_DIR} && echo '${req.body.head_commit.url}///${req.body.head_commit.id}///${req.body.head_commit.timestamp}///${req.body.pusher.name}'> public/version.txt`
      );

      await tgpost(
        `*Deployment finished!*\n[${req.body.head_commit.id}](${req.body.head_commit.url}) by ${req.body.pusher.name}`
      );
    } else {
      res.status(200).send(`Branch ${req.body.ref} is not allowed to deploy!`);
      await tgpost(`Branch ${req.body.ref} is not allowed to deploy!`);
    }
  } catch (e) {
    console.log(
      `Deployment  ${req.body.head_commit.id} by ${
        req.body.pusher.name
      } failed at ${new Date().toISOString()} \n with error: ${e}`
    );
    await tgpost(
      `Deployment  [${req.body.head_commit.id}](${
        req.body.head_commit.url
      }) by ${
        req.body.pusher.name
      } failed at ${new Date().toISOString()} \n with error: ${e}`
    );

    await tgpost(`Trying to rollback: \`git reset --hard HEAD@{1}\``);

    execSync("git reset --hard HEAD@{1}");
  }
});

app.post("/ci/githubhook2/push", async (req, res) => {
  try {
    if (req.body.ref.includes("stage")) {
      res.status(200).send("Deployment started!");
      await tgpost(
        `*Deployment started*:\n[${req.body.head_commit.id}](${req.body.head_commit.url}) by ${req.body.pusher.name}`
      );

      const ansible = execSync(
        "ansible-playbook -i ../dev2.myflows.ru/inventory.ini ../dev2.myflows.ru/stage.pb.yaml"
      );
    } else {
      res.status(200).send(`Branch ${req.body.ref} is not allowed to deploy!`);
      await tgpost(`Branch ${req.body.ref} is not allowed to deploy!`);
    }
  } catch (e) {
    await tgpost(
      `Deployment  [${req.body.head_commit.id}](${
        req.body.head_commit.url
      }) by ${
        req.body.pusher.name
      } failed at ${new Date().toISOString()} \n with error: ${e}`
    );

    await tgpost(`Trying to rollback: \`git reset --hard HEAD@{1}\``);

    execSync("git reset --hard HEAD@{1}");
  }
});

// Start the server
app.listen(cfg.port, () => {
  console.log(
    `Deploy service started listening at ${new Date().toISOString()} on port ${
      cfg.port
    }`
  );
});
