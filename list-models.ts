import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log("📋 Fetching available models...\n");

  try {
    const models = await genAI.listModels();

    console.log("✅ Available models:\n");
    for (const model of models) {
      console.log(`  • ${model.name}`);
      console.log(`    Description: ${model.description || "N/A"}`);
      console.log(`    Supported: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`);
      console.log("");
    }
  } catch (error) {
    console.error("❌ Error listing models:", error);
  }
}

listModels();
