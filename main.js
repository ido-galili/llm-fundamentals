import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv"; // to read the .env file
import { REVIEW_SYSTEM_PROMPT, REVIEW_RESPONSE_SCHEMA } from "./reviewPrompt.js";

dotenv.config();
const gemini = new GoogleGenAI({}); // initializes the Gemini client and automatically loads the API key from the .env file

// gemini.models.listModels().then((models) => {
//   console.log("Available models:");
//   models.forEach((model) => {
//     console.log(`- ${model.name}`);
//   });
// });

const askGemini = async (userPrompt, systemPrompt, extraConfig = {}) => {
  const result = await gemini.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.1,
      thinkingConfig: {
        thinkingBudget: 0, // Disables thinking
      },
      ...extraConfig,
    },
  });

  const { promptTokenCount, candidatesTokenCount } = result.usageMetadata;
  console.log(`Input tokens: ${promptTokenCount}, Output tokens: ${candidatesTokenCount}`);

  return result.text || "";
};

// Gets a Node.js code snippet and returns a code review from the LLM
const reviewNodeCode = async (code) => {
  const response = await askGemini(code, REVIEW_SYSTEM_PROMPT, {
    responseMimeType: "application/json",
    responseSchema: REVIEW_RESPONSE_SCHEMA,
  });
  return JSON.parse(response);
};

const runNodeReview = async (userPrompt) => {
  const review = await reviewNodeCode(userPrompt);
  console.log(JSON.stringify(review, null, 2));
};

const run = async () => {
  console.log("Sample A - Should Pass")
  await runNodeReview(`
app.get("/ping", async (req, res) => {
  try {
    return res.json({ data: "pong" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
});`);

console.log("\n******************************\n")

console.log("Sample B - Should Fail")
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
