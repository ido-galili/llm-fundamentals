import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv"; // to read the .env file
import { REVIEW_SYSTEM_PROMPT, REVIEW_RESPONSE_SCHEMA } from "./reviewPrompt.js";

dotenv.config();
const claude = new Anthropic(); // initializes the Claude client and automatically loads ANTHROPIC_API_KEY from the .env file

const askClaude = async (userPrompt, systemPrompt, extraConfig = {}) => {
  const result = await claude.messages.create({
    model: "claude-haiku-4-5", // thinking is off by default on this model
    max_tokens: 1024,
    system: systemPrompt,
    temperature: 0.1,
    messages: [{ role: "user", content: userPrompt }],
    ...extraConfig,
  });

  const { input_tokens, output_tokens } = result.usage;
  console.log(`Input tokens: ${input_tokens}, Output tokens: ${output_tokens}`);

  const textBlock = result.content.find((block) => block.type === "text");
  return textBlock?.text || "";
};

// Gets a Node.js code snippet and returns a code review from the LLM
const reviewNodeCode = async (code) => {
  const response = await askClaude(code, REVIEW_SYSTEM_PROMPT, {
    output_config: {
      format: {
        type: "json_schema",
        schema: { ...REVIEW_RESPONSE_SCHEMA, additionalProperties: false }, // Claude requires additionalProperties: false
      },
    },
  });
  return JSON.parse(response);
};

const runNodeReview = async (userPrompt) => {
  console.log("Reviewing Node.js code snippet:\n", userPrompt);
  const review = await reviewNodeCode(userPrompt);
  console.log(JSON.stringify(review, null, 2));
};

const run = async () => {
  await runNodeReview(`
app.get("/ping", async (req, res) => {
  try {
    return res.json({ data: "pong" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
});`);

  await runNodeReview(`
app.get("/u", (req, res) => {
  const id = req.query.id;
  const sql = "SELECT * FROM users WHERE id = " + id;
  db.query(sql, (err, rows) => {
    if (err) return res.send("error");
    res.send(rows[0]);
  });
});`);
};

run();
