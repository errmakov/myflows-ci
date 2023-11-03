import axios from "axios";
import express from "express";
import config from "./config/config.js";

let confKey = (process.env.SETTING || "development") as TConfigKey;
const cfg = config[confKey];

const app = express();

app.use(express.json());

function extractEntities(markdownText: string) {
  const entities = [];
  let match;

  // Regular expression to find Markdown entities
  const regex = /\*([^*]+)\*|_([^_]+)_|\`([^`]+)\`|\[([^\]]+)\]\(([^)]+)\)/g;

  while ((match = regex.exec(markdownText)) !== null) {
    const [fullMatch, bold, italic, code, linkText, linkUrl] = match;

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
    }
  }

  return entities;
}

// Example usage
const markdownText =
  "This is *bold*, _italic_, `code`, and [a link](https://example.com).";
const result = extractEntities(markdownText);
console.log(result);

const tgpost = (text: string) => {
  return axios.post(
    `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
    {
      chat_id: process.env.TG_CHAT_ID,
      text: text,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
      entities: extractEntities(text),
    }
  );
};

app.get("/ci/githubhook2/push", async (req, res) => {
  try {
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
