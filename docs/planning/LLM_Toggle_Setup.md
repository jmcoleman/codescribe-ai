# 🤖 LLM Toggle Setup: Claude ↔ OpenAI

## 📋 Overview
This guide describes how to configure a **toggle-based system** that allows a Node.js application to seamlessly switch between **Anthropic’s Claude API** and **OpenAI’s GPT models** for large language model (LLM) requests.

This pattern lets you:
- Dynamically switch between providers without code changes  
- Reuse a single interface for both APIs  
- Preserve compatibility for future providers (e.g., Gemini, Mistral)

---

## 🧩 Project Structure

```
project-root/
├── config/
│   └── llm.config.json        # LLM provider configuration
├── src/
│   ├── providers/
│   │   ├── anthropicProvider.js
│   │   ├── openaiProvider.js
│   │   └── llmClient.js       # Unified LLM handler
│   └── app.js
├── .env
└── package.json
```

---

## ⚙️ Step 1: Install Dependencies

```bash
npm install openai @anthropic-ai/sdk dotenv
```

---

## ⚙️ Step 2: Add Environment Variables

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## ⚙️ Step 3: Create the Configuration File

`config/llm.config.json`

```json
{
  "provider": "openai", 
  "models": {
    "openai": "gpt-5",
    "anthropic": "claude-3-5-sonnet"
  }
}
```

To switch providers, simply change:

```json
"provider": "anthropic"
```

---

## 🧠 Step 4: Implement the Provider Modules

### **Anthropic Provider** (`src/providers/anthropicProvider.js`)
```js
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function sendClaudeMessage(prompt, model = "claude-3-5-sonnet") {
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }]
  });

  return response.content[0].text;
}
```

---

### **OpenAI Provider** (`src/providers/openaiProvider.js`)
```js
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function sendOpenAIMessage(prompt, model = "gpt-5") {
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }]
  });

  return response.choices[0].message.content;
}
```

---

## ⚡ Step 5: Create the Unified LLM Client

`src/providers/llmClient.js`
```js
import fs from "fs";
import path from "path";
import { sendOpenAIMessage } from "./openaiProvider.js";
import { sendClaudeMessage } from "./anthropicProvider.js";

const configPath = path.resolve("config/llm.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

export async function askLLM(prompt) {
  const provider = config.provider;
  const model = config.models[provider];

  if (provider === "openai") {
    return await sendOpenAIMessage(prompt, model);
  }

  if (provider === "anthropic") {
    return await sendClaudeMessage(prompt, model);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
```

---

## 🧰 Step 6: Example Usage

`src/app.js`
```js
import { askLLM } from "./providers/llmClient.js";

(async () => {
  const prompt = "Explain how to implement caching in Node.js.";
  const output = await askLLM(prompt);
  console.log("LLM Response:\n", output);
})();
```

---

## 🔄 Step 7: Toggle Providers

Change your active model in **`config/llm.config.json`**:

```json
"provider": "anthropic"
```

or

```json
"provider": "openai"
```

Then rerun:

```bash
node src/app.js
```

---

## 🧪 Optional Enhancements

| Feature | Description |
|----------|--------------|
| 🔁 **CLI Switch** | Add a script to toggle providers directly from the terminal |
| 🧩 **Fallback Logic** | Automatically retry a request with the alternate provider if one fails |
| 🧠 **Prompt Memory** | Store previous prompts/responses in JSON for reuse |
| ⚙️ **Streaming Support** | Integrate OpenAI and Anthropic streaming APIs for real-time responses |
| 💾 **Logging Layer** | Save all requests/responses to a `logs/` directory with timestamps |

Example CLI toggle command:
```bash
node toggleProvider.js openai
```

---

## 🧱 Example CLI Toggle Script

`toggleProvider.js`
```js
import fs from "fs";
const provider = process.argv[2];
if (!provider) {
  console.error("Usage: node toggleProvider.js [openai|anthropic]");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync("./config/llm.config.json", "utf8"));
config.provider = provider;
fs.writeFileSync("./config/llm.config.json", JSON.stringify(config, null, 2));

console.log(`✅ Provider switched to: ${provider}`);
```

---

## ✅ Summary

| Step | Purpose |
|------|----------|
| 1 | Install dependencies |
| 2 | Add API keys |
| 3 | Configure `llm.config.json` |
| 4 | Create provider modules |
| 5 | Implement unified LLM client |
| 6 | Use it in your app |
| 7 | Toggle easily between Claude & OpenAI |

---

**Result:**  
A single, configurable Node.js setup where you can dynamically switch between **Claude** and **OpenAI** by editing one line — or by running a CLI command — without changing your app logic.
