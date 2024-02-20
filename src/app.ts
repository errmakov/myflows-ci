import axios from "axios";
import { execSync } from "child_process";
import express from "express";
import config from "./config/config.js";
import verifySignatureMiddleware from "./verifySignatureMiddleware.js";

let confKey = (process.env.SETTING || "development") as TConfigKey;
const cfg = config[confKey];

// Middleware to verify the signature using the secret token

const app = express();

app.use(express.json({ limit: "8mb" }));

// Apply middleware to all routes
app.use(verifySignatureMiddleware);

const escapeMarkdownV2 = (text: string): string => {
  return text.replace(/[-.!=]/g, "\\$&");
};

function extractEntities(markdownText: string) {
  const entities = [];
  let match;

  // Regular expression to find Markdown entities with escaping for reserved characters
  const regex =
    /\*([^*]+)\*|_([^_]+)_|\`([^`]+)\`|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/\S+\.(?:png|jpe?g|gif|svg))|!?\[([^\]]+)\]\(([^)]+)\)/g;

  const escapedText = escapeMarkdownV2(markdownText);
  while ((match = regex.exec(escapedText)) !== null) {
    const [
      fullMatch,
      bold,
      italic,
      code,
      linkText,
      linkUrl,
      imageText,
      imageUrl,
    ] = match;

    if (bold) {
      entities.push({ type: "bold", offset: match.index, length: bold.length });
    } else if (italic) {
      entities.push({
        type: "italic",
        offset: match.index,
        length: italic.length,
      });
    } else if (code) {
      entities.push({ type: "code", offset: match.index, length: code.length });
    } else if (linkText && linkUrl) {
      entities.push({
        type: "text_link",
        offset: match.index,
        length: linkText.length,
        url: linkUrl,
      });
    } else if (imageUrl && !imageText) {
      entities.push({
        type: "text_link",
        offset: match.index,
        length: imageUrl.length,
        url: imageUrl,
      });
    } else if (imageText && imageUrl) {
      entities.push({
        type: "text_link",
        offset: match.index,
        length: imageText.length,
        url: imageUrl,
      });
    }
  }

  return entities;
}

const tgpost = (text: string) => {
  const escapedText = escapeMarkdownV2(text);
  return axios.post(
    `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
    {
      chat_id: process.env.TG_CHAT_ID,
      text: escapedText,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
    }
  );
};

app.post("/ci/githubhook2/push", async (req, res) => {
  try {
    if ((req.body.ref as string).includes("stage")) {
      res.status(200).send("Deployment started!");
      console.log("Deployment started!");
      await tgpost(
        `🚥 *Deployment started* 🚥\n[${req.body.head_commit.id}](${req.body.head_commit.url}) by 👨‍🚀 ${req.body.pusher.name}`
      );

      const ansible = execSync(
        `ANSIBLE_LOG_PATH=/tmp/ansible.log ansible-playbook -i ${process.env.ROOT_DIR}/inventory.ini ${process.env.ROOT_DIR}/stage.pb.yaml -e "target_host=stage_local"`,
        { encoding: "utf8", maxBuffer: 1024 * 1024 * 1024 }
      ).toString();
      console.log("Ansible out:", ansible);

      await tgpost(
        `🏁 *Deployment finished* 🏁 \n[${req.body.head_commit.id}](${req.body.head_commit.url}) by 👨‍🚀 ${req.body.pusher.name}`
      );
      console.log("Deployment finished!");
    } else {
      res.status(200).send(`Branch ${req.body.ref} is not allowed to deploy!`);
      await tgpost(`Branch ${req.body.ref} is not allowed to deploy!`);
    }
  } catch (e: any) {
    console.log(`${new Date().toISOString()} Error catch 1:`, e.message, e);
    try {
      await tgpost(
        `🛑 Deployment  [${req.body.head_commit.id}](${
          req.body.head_commit.url
        }) by 🐒 ${
          req.body.pusher.name
        } failed 😱😱😱 at ${new Date().toISOString()} \n with error: ${
          e.message
        }`
      );

      await tgpost(`👷‍♀️ Trying to rollback: \`git reset --hard HEAD@{1}\``);

      const rollback = execSync("git reset --hard HEAD@{1}", {
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
      });
      console.log("Rollback out:", rollback);
    } catch (e: any) {
      console.log(`${new Date().toISOString()} Error catch 2:`, e.message, e);
      await tgpost(`👷‍♀️ Rollback failed with error: ${e.message}`);
    }
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
