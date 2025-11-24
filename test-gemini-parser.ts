import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { parseLabReportWithGemini } from "./src/features/labs/lib/parse-lab-gemini";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testParser() {
  try {
    console.log("🚀 Testing Gemini Lab Parser...\n");

    // Read the PDF
    const pdfPath = path.join(__dirname, "analize_19.11.2025.pdf");
    console.log(`📂 Reading PDF: ${pdfPath}`);

    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`📄 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);

    // Parse with Gemini
    const result = await parseLabReportWithGemini(pdfBuffer);

    // Display results
    console.log("\n" + "=".repeat(60));
    console.log("EXTRACTION RESULTS");
    console.log("=".repeat(60));

    console.log("\n👤 PATIENT INFO:");
    console.log(`   Name: ${result.patient.firstName} ${result.patient.lastName}`);
    console.log(`   Birthdate: ${result.patient.birthdate}`);

    console.log("\n📋 METADATA:");
    console.log(`   Provider: ${result.meta.provider}`);
    console.log(`   Sampling Date: ${result.meta.samplingDate}`);
    console.log(`   Result Date: ${result.meta.resultDate}`);

    console.log(`\n🧪 LAB TESTS (${result.tests.length} total):`);
    console.log("-".repeat(60));

    // Group by section
    const bySection = result.tests.reduce((acc, test) => {
      const section = test.section || "Other";
      if (!acc[section]) acc[section] = [];
      acc[section].push(test);
      return acc;
    }, {} as Record<string, typeof result.tests>);

    for (const [section, tests] of Object.entries(bySection)) {
      console.log(`\n📊 ${section}:`);
      for (const test of tests) {
        const statusIcon =
          test.status === "normal" ? "✅" :
          test.status === "high" ? "🔺" :
          test.status === "low" ? "🔻" :
          test.status === "critical" ? "⚠️" : "❓";

        console.log(`   ${statusIcon} ${test.testName}`);
        console.log(`      Value: ${test.rawValue} ${test.unit || ""}`);
        if (test.referenceRange) {
          console.log(`      Reference: ${test.referenceRange}`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ TEST COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60) + "\n");

    // Save to JSON for inspection
    const outputPath = path.join(__dirname, "test-output.json");
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Full output saved to: ${outputPath}\n`);

  } catch (error) {
    console.error("❌ ERROR:", error);
    process.exit(1);
  }
}

testParser();
