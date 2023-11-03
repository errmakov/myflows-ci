import axios from "axios";
import express from "express";
import config from "./config/config.js";

let confKey = (process.env.SETTING || "development") as TConfigKey;
const cfg = config[confKey];

const app = express();

app.use(express.json());

const tgpost = (text: string) => {
  return axios.post(
    `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
    {
      chat_id: process.env.TG_CHAT_ID,
      text: text,
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
