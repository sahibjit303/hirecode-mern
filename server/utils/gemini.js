import { GoogleGenAI } from "@google/genai";

let genAI = null;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getClient() {
  if (genAI) return genAI;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("⚠️  GEMINI_API_KEY not set — AI evaluation disabled");
    return null;
  }
  genAI = new GoogleGenAI({ apiKey: key });
  return genAI;
}

/**
 * Helper function to call the Gemini API with retry logic and exponential backoff.
 * It will retry on 429 (Rate Limit / Quota Exceeded) errors, except when the quota limit is 0.
 */
async function callGeminiWithRetry(fn, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;

      const isRateLimit =
        err.status === 429 ||
        err.message?.includes("429") ||
        err.message?.includes("Too Many Requests") ||
        err.message?.includes("Quota exceeded") ||
        err.message?.includes("RESOURCE_EXHAUSTED");

      if (isRateLimit) {
        if (err.message?.includes("limit: 0") || err.message?.includes("limit:0")) {
          throw new Error(
            "Gemini API Quota is 0. Please verify your GEMINI_API_KEY is active and has quota in Google AI Studio (https://aistudio.google.com/)."
          );
        }

        if (attempt < maxRetries) {
          let delayMs = Math.pow(2, attempt) * 1000;
          const retryMatch = err.message?.match(/Please retry in (\d+(?:\.\d+)?s?)/);
          if (retryMatch) {
            const seconds = parseFloat(retryMatch[1]);
            if (!isNaN(seconds)) {
              delayMs = Math.ceil(seconds * 1000) + 1000;
            }
          }
          console.warn(`⚠️ Gemini API Rate Limit hit. Retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }
      throw err;
    }
  }
}

/**
 * Shared function to call Gemini with the correct config for the model.
 * gemini-2.5-flash is a "thinking" model — thinkingConfig must be set.
 */
async function generateContent(client, prompt, maxOutputTokens = 1024) {
  return callGeminiWithRetry(() =>
    client.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        maxOutputTokens,
        // Required for gemini-2.5-flash thinking model — disable thinking for simple tasks
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
  );
}

/**
 * Evaluate candidate code using Gemini AI.
 * Returns structured scores + feedback.
 */
export async function evaluateCode({
  code,
  problemTitle,
  problemDescription,
  language,
  testResults,
  antiCheat,
}) {
  const client = getClient();
  if (!client) {
    return {
      correctness: 0,
      codeQuality: 0,
      efficiency: 0,
      originality: 0,
      overallScore: 0,
      feedback: "AI evaluation unavailable — no API key configured.",
      rawResponse: "",
    };
  }

  // Safety: ensure code is a string
  const safeCode = code || "";
  const safeTestResults = Array.isArray(testResults) ? testResults : [];

  const testSummary = safeTestResults
    .map(
      (t, i) =>
        `Test ${i + 1}: ${t.passed ? "PASS" : "FAIL"} | Input: ${t.input} | Expected: ${t.expected} | Got: ${t.actual}${t.error ? ` | Error: ${t.error}` : ""}`
    )
    .join("\n") || "No test results";

  const cheatSummary = antiCheat
    ? `Tab switches: ${antiCheat.tabSwitches ?? 0}, Paste events: ${antiCheat.pasteEvents ?? 0}, Copy events: ${antiCheat.copyEvents ?? 0}, Avg typing speed: ${antiCheat.typingSpeed ?? 0} chars/min, Idle time: ${antiCheat.idleTime ?? 0}s`
    : "No anti-cheat data";

  // Truncate code to avoid exceeding token limits (keep first 3000 chars)
  const MAX_CODE_CHARS = 3000;
  const truncatedCode = safeCode.length > MAX_CODE_CHARS
    ? safeCode.slice(0, MAX_CODE_CHARS) + `\n... [truncated ${safeCode.length - MAX_CODE_CHARS} chars]`
    : safeCode;

  // Truncate problem description too
  const MAX_DESC_CHARS = 500;
  const truncatedDesc = (problemDescription || "").length > MAX_DESC_CHARS
    ? (problemDescription || "").slice(0, MAX_DESC_CHARS) + "..."
    : (problemDescription || "");

  const prompt = `You are a senior software engineer evaluating a candidate's coding assessment submission.

## Problem
**Title:** ${problemTitle}
**Description:** ${truncatedDesc}

## Candidate's Code (${language})
\`\`\`${language}
${truncatedCode}
\`\`\`

## Test Results
${testSummary}

## Anti-Cheat Metrics
${cheatSummary}

## Your Task
Evaluate this submission and return a JSON object with EXACTLY these fields:
{
  "correctness": <0-100 score based on test pass rate and logical correctness>,
  "codeQuality": <0-100 score for naming, structure, readability, best practices>,
  "efficiency": <0-100 score for time/space complexity, avoiding unnecessary operations>,
  "originality": <0-100 score — lower if code appears AI-generated, copy-pasted, or templated. Higher if it shows unique thinking>,
  "overallScore": <0-100 weighted average: correctness 40%, quality 20%, efficiency 20%, originality 20%>,
  "feedback": "<2-3 paragraph detailed feedback covering strengths, weaknesses, and suggestions. Be specific about the code.>"
}

Consider anti-cheat data: Tab switches, paste events or very fast typing with perfect code may indicate AI assistance (lower originality score).

Return ONLY valid JSON, no markdown fences, no extra text.`;

  try {
    const result = await generateContent(client, prompt, 1024);
    const text = result.text.trim();

    // Try to parse JSON from response (handle potential markdown fences)
    let jsonStr = text;
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    const parsed = JSON.parse(jsonStr);

    return {
      correctness: Math.min(100, Math.max(0, Math.round(parsed.correctness || 0))),
      codeQuality: Math.min(100, Math.max(0, Math.round(parsed.codeQuality || 0))),
      efficiency: Math.min(100, Math.max(0, Math.round(parsed.efficiency || 0))),
      originality: Math.min(100, Math.max(0, Math.round(parsed.originality || 0))),
      overallScore: Math.min(100, Math.max(0, Math.round(parsed.overallScore || 0))),
      feedback: parsed.feedback || "No feedback generated.",
      rawResponse: text,
    };
  } catch (err) {
    console.error("Gemini evaluation error:", err.message);
    return {
      correctness: 0,
      codeQuality: 0,
      efficiency: 0,
      originality: 0,
      overallScore: 0,
      feedback: `AI evaluation failed: ${err.message}`,
      rawResponse: err.message,
    };
  }
}

/**
 * Generate AI-powered comparison summary for candidates.
 */
export async function compareCandidates(candidates) {
  const client = getClient();
  if (!client) return "AI comparison unavailable — no API key configured.";

  const candidateList = candidates
    .map(
      (c) =>
        `- ${c.name} | Role: ${c.role} | Score: ${c.score}/100 | Stage: ${c.stage} | Stack: ${(c.stack || []).join(", ")}`
    )
    .join("\n");

  const prompt = `You are a hiring advisor. Compare these candidates and recommend who to advance in the pipeline.

## Candidates
${candidateList}

Write 2-3 concise paragraphs:
1. Quick comparison of strengths
2. Your recommendation with reasoning
3. Any concerns or caveats

Use candidate names.`;

  try {
    const result = await generateContent(client, prompt, 512);
    return result.text.trim();
  } catch (err) {
    console.error("Gemini comparison error:", err.message);
    return `AI comparison failed: ${err.message}`;
  }
}

/**
 * Multi-turn chat for AI assessment generation.
 * Returns { reply, assessment, ready } where assessment is the generated
 * assessment object (if ready) and ready=true means it's complete.
 */
export async function chatGenerateAssessment(messages, currentAssessment = null) {
  const client = getClient();
  if (!client) throw new Error("GEMINI_API_KEY not set");

  const systemPrompt = `You are an expert technical recruiter and coding assessment designer for CodeHire, a hiring platform.
Your job is to help recruiters create high-quality coding assessments through natural conversation.

## Your Personality
- Friendly, professional, concise
- Ask ONE clarifying question at a time if needed
- When you have enough info (role + topics + difficulty), generate the assessment immediately

## Assessment Structure
When generating, you MUST return a JSON block like this:

\`\`\`json
{
  "title": "string",
  "description": "string",
  "language": "javascript|python|typescript",
  "difficulty": "easy|medium|hard",
  "timeLimit": 45,
  "problems": [
    {
      "title": "string",
      "description": "string — full problem statement with examples and constraints",
      "starterCode": "// language-appropriate function skeleton",
      "hints": ["hint 1", "hint 2"],
      "testCases": [
        { "input": "string", "expectedOutput": "string", "isHidden": false },
        { "input": "string", "expectedOutput": "string", "isHidden": false },
        { "input": "string", "expectedOutput": "string", "isHidden": true },
        { "input": "string", "expectedOutput": "string", "isHidden": true }
      ]
    }
  ]
}
\`\`\`

## Rules
- Include 2 visible + 2-3 hidden test cases per problem
- starter code must match the language (Python def, JS function, etc.)
- Edge cases in hidden test cases (empty input, large values, negatives)
- After generating, ask "Want me to make it harder/easier or add another problem?"
- If the user asks to modify, update the JSON and return the full updated version
- ALWAYS include the JSON block when you have an assessment to show
- For simple conversation (greetings, questions), reply normally without JSON

## Current assessment context:
${currentAssessment ? JSON.stringify(currentAssessment, null, 2) : "None yet"}
`;

  // Build the conversation for Gemini
  const conversationText = messages
    .map((m) => `${m.role === "user" ? "Recruiter" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const fullPrompt = `${systemPrompt}\n\n## Conversation\n${conversationText}\n\nAssistant:`;

  const result = await generateContent(client, fullPrompt, 2048);
  const text = result.text.trim();

  // Extract JSON assessment if present
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  let assessment = null;
  let ready = false;

  if (jsonMatch) {
    try {
      assessment = JSON.parse(jsonMatch[1].trim());
      ready = true;
    } catch (e) {
      console.warn("Failed to parse AI assessment JSON:", e.message);
    }
  }

  // Clean the reply — remove the raw JSON block from conversational text
  const reply = text.replace(/```json[\s\S]*?```/g, "").trim();

  return {
    reply: reply || "Here's your assessment! Review it and let me know if you'd like any changes.",
    assessment,
    ready,
  };
}
