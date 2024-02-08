import axios from "axios";
import express from "express";
import config from "./config/config.js";

let confKey = (process.env.SETTING || "development") as TConfigKey;
const cfg = config[confKey];

const app = express();

app.use(express.json());

const escapeMarkdownV2 = (text: string): string => {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\-]/g, "\\$&");
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
      entities: extractEntities(text),
    }
  );
};

app.get("/ci/githubhook3/push", async (req, res) => {
  try {
    await tgpost(
      `✅ Hello 😱 from *github* _webhook_! This is [link](https://google.com)`
    );
    await tgpost(
      `🚥 *Deployment started* 🚥\n[${"some-commit"}](${"http://some-url.com"}) by 👨‍🚀 ${"pushers-name"}`
    );
    await tgpost(
      `🏁 *Deployment finished* 🏁 \n[${"some-string"}](${"http://some-url.com"}) by 👨‍🚀 ${"some-name"}`
    );

    await tgpost(
      `🛑 Deployment  [${"commit id-1111"}](${"http://some-url.com"}) by 🐒 ${"pusher-name"} failed 😱😱😱 at ${new Date().toISOString()} \n with error: some-error!/1233zsdf""`
    );
    res.send("Deploy succeeded");
  } catch (e) {
    console.log("e: ", e);
    tgpost("e: " + e);
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
