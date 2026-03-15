import { buildSchemaTemplate, normalizePlan } from '../../schema/planSchema';
import { getAiConfig, hasAiProvider } from './aiConfig';
import { runGeminiExtraction } from './providers/geminiProvider';
import { runOpenAiExtraction } from './providers/openaiProvider';
import { buildFallbackPlan } from '../planner/fallbackPlanner';

function buildSystemInstruction() {
  return [
    'You are Grab Genie intent orchestrator.',
    'Return only JSON. No markdown, no explanation.',
    'Always keep all keys in the target schema.',
    'Use null for unknown scalar values and [] for unknown arrays.',
    'Ensure selectedServices and recommendations can include food, ride, mart independently or together.',
    'Recommendations must include at least one alternative for every selected service when possible.',
    'Keep reasoning concise in rationale/reason fields.'
  ].join(' ');
}

function buildPrompt(inputText) {
  const schemaTemplate = buildSchemaTemplate();
  return [
    'Convert user request into this exact JSON structure.',
    'Do not omit keys.',
    'User request:',
    inputText,
    'Target schema template:',
    JSON.stringify(schemaTemplate, null, 2)
  ].join('\n\n');
}

function parseJsonSafely(rawText) {
  try {
    return JSON.parse(rawText);
  } catch (error) {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');

    if (start >= 0 && end > start) {
      const sliced = rawText.slice(start, end + 1);
      return JSON.parse(sliced);
    }

    throw error;
  }
}

export async function extractIntentSchemaFromText(inputText) {
  const config = getAiConfig();

  if (!hasAiProvider(config)) {
    return {
      plan: buildFallbackPlan(inputText),
      meta: {
        source: 'fallback',
        provider: 'none',
        warning: 'No AI provider key configured. Using robust local fallback planning.'
      }
    };
  }

  const systemInstruction = buildSystemInstruction();
  const userPrompt = buildPrompt(inputText);

  try {
    const rawResult = config.provider === 'gemini'
      ? await runGeminiExtraction({
          apiKey: config.geminiApiKey,
          model: config.geminiModel,
          systemInstruction,
          userPrompt
        })
      : await runOpenAiExtraction({
          apiKey: config.openAiApiKey,
          model: config.openAiModel,
          systemInstruction,
          userPrompt
        });

    const parsed = parseJsonSafely(rawResult);
    return {
      plan: normalizePlan(parsed, inputText),
      meta: {
        source: 'ai',
        provider: config.provider,
        warning: null
      }
    };
  } catch (error) {
    return {
      plan: buildFallbackPlan(inputText),
      meta: {
        source: 'fallback-after-ai-error',
        provider: config.provider,
        warning: `AI extraction failed. Fallback planner used. ${error.message}`
      }
    };
  }
}
