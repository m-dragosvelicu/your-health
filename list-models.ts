import * as dotenv from "dotenv";

dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set");
    process.exit(1);
  }

  console.log("📋 Fetching available models...\n");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const data = (await res.json()) as {
      models?: Array<{
        name: string;
        description?: string;
        supportedGenerationMethods?: string[];
      }>;
    };
    const models = data.models ?? [];

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
