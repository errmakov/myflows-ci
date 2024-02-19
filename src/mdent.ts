import axios from "axios";
import "dotenv/config";

const escapeMarkdownV2 = (text: string): string => {
  // Escaping Markdown v2 special characters
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
};

function extractEntities(markdownText: string) {
  const entities = [];
  let match;
  const regex = /\*([^*]+)\*|_(.+?)_|\[([^\]]+)]\((http[s]?:\/\/[^\s)]+)\)/g;

  while ((match = regex.exec(markdownText)) !== null) {
    const [bold, italic, text_link] = match;

    if (bold) {
      entities.push({
        type: "bold",
        offset: match.index + 1,
        length: bold.length - 1,
      });
    }
    if (italic) {
      entities.push({
        type: "italic",
        offset: match.index + 1,
        length: italic.length - 1,
      });
    }
    if (text_link) {
      console.log("text_link: ", text_link);
      console.log("match: ", match);
      entities.push({
        type: "text_link",
        offset: match.index + 1,
        length: text_link.length - 1,
        url: match[4],
      });
    }

    console.log("entities: ", entities);
    return entities;
  }
}
const tgpost = (text: string) => {
  const escapedText = escapeMarkdownV2(text);
  return axios.post(
    `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
    {
      chat_id: process.env.TG_CHAT_ID,
      text,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
      // entities: extractEntities(text),
    }
  );
};
await tgpost(
  `that is a *bold* text and this is an _italic_ text and this is *[a link](https://www.google.com)*`
);
