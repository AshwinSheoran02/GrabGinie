import { buildSchemaTemplate, normalizePlan } from '../../schema/planSchema';
import { getAiConfig, hasAiProvider } from './aiConfig';
import { runGeminiExtraction } from './providers/geminiProvider';
import { runOpenAiExtraction } from './providers/openaiProvider';
import { buildFallbackPlan } from '../planner/fallbackPlanner';

const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60
};

function wordToNumber(word) {
  if (!word) {
    return null;
  }

  return NUMBER_WORDS[word.toLowerCase()] ?? null;
}

function normalizeInputText(rawText) {
  const text = (rawText || '').trim();
  if (!text) {
    return text;
  }

  return text
    .replace(/\bpremium\s+right\s+to\b/gi, 'premium ride to')
    .replace(/\bbook\s+the\s+fastest\s+premium\s+right\b/gi, 'book the fastest premium ride')
    .replace(/\bright\s+to\s+(the\s+)?airport\b/gi, 'ride to airport')
    .replace(/\ball\s+right\b/gi, 'a ride')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function parseBudget(text) {
  const numericMatch = text.match(/(?:under|below|budget|max|within)\s*\$?\s*(\d+(?:\.\d+)?)/i) || text.match(/\$\s*(\d+(?:\.\d+)?)/i);
  if (numericMatch) {
    return Number(numericMatch[1]);
  }

  const wordMatch = text.match(/(?:under|below|budget|max|within)\s+([a-z]+)\s*(?:dollars?|bucks?)?/i);
  const parsed = wordToNumber(wordMatch?.[1]);
  return typeof parsed === 'number' ? parsed : null;
}

function parsePartySize(text) {
  const numericMatch = text.match(/(?:for|party of)\s*(\d+)/i);
  if (numericMatch) {
    return Number(numericMatch[1]);
  }

  const wordMatch = text.match(/(?:for|party of)\s+([a-z]+)/i);
  const parsed = wordToNumber(wordMatch?.[1]);
  return typeof parsed === 'number' ? parsed : null;
}

function parseDelayMinutes(text) {
  const hour = text.match(/(\d+)\s*hour/i);
  if (hour) {
    return Number(hour[1]) * 60;
  }

  const minute = text.match(/(\d+)\s*min/i);
  if (minute) {
    return Number(minute[1]);
  }

  const minuteWord = text.match(/\b([a-z]+)\s+minutes?\b/i);
  const parsed = wordToNumber(minuteWord?.[1]);
  return typeof parsed === 'number' ? parsed : null;
}

function inferCurrency(text, fallbackCurrency) {
  if (/\bsgd\b|s\$/i.test(text)) {
    return 'SGD';
  }

  if (/\busd\b|\$/i.test(text)) {
    return 'USD';
  }

  return fallbackCurrency || 'USD';
}

function inferFoodItem(text) {
  if (/sushi/i.test(text)) {
    return { itemName: 'Sushi Set', cuisine: 'Japanese', providerName: 'Genie Sushi House' };
  }

  if (/ice cream|dessert/i.test(text)) {
    return { itemName: 'Dessert Box', cuisine: 'Dessert', providerName: 'Sweet Picks' };
  }

  return { itemName: 'Chef Combo Meal', cuisine: null, providerName: 'Genie Food Picks' };
}

function ensureFoodDefaults(plan, text, currency) {
  const budget = parseBudget(text);
  const partySize = parsePartySize(text);
  const baseFoodPrice = budget ? Math.max(8, Math.round(budget * 0.75)) : 24;
  const inferred = inferFoodItem(text);

  if (!plan.selectedServices.food) {
    plan.selectedServices.food = {
      category: 'food',
      providerName: inferred.providerName,
      itemName: inferred.itemName,
      cuisine: inferred.cuisine,
      quantity: partySize,
      estimatedPrice: { amount: baseFoodPrice, currency },
      etaMinutes: 24,
      rationale: 'Inferred from your food ordering intent.',
      tags: ['selected', 'intent-repaired']
    };
  }

  if (!Array.isArray(plan.recommendations.food) || plan.recommendations.food.length === 0) {
    plan.recommendations.food = [
      {
        recommendationId: 'food-rec-guardrail-1',
        label: inferred.cuisine ? `${inferred.cuisine} Value Set` : 'Value Meal Set',
        deltaPrice: -3,
        reason: 'Lower cost alternative while keeping similar food profile.',
        payload: {
          ...plan.selectedServices.food,
          estimatedPrice: { amount: Math.max(6, baseFoodPrice - 3), currency },
          tags: ['recommended', 'value']
        }
      },
      {
        recommendationId: 'food-rec-guardrail-2',
        label: 'Express Kitchen',
        deltaPrice: 4,
        reason: 'Faster prep and dispatch for quicker delivery.',
        payload: {
          ...plan.selectedServices.food,
          providerName: 'Express Kitchen',
          estimatedPrice: { amount: baseFoodPrice + 4, currency },
          etaMinutes: 15,
          tags: ['recommended', 'fast']
        }
      }
    ];
  }
}

function ensureRideDefaults(plan, text, currency) {
  const budget = parseBudget(text);
  const partySize = parsePartySize(text);
  const delayMinutes = parseDelayMinutes(text);
  const wantsPremium = /premium|luxury|executive/i.test(text);
  const wantsFastest = /fastest|quickest|asap|urgent|priority/i.test(text);
  const toAirport = /airport/i.test(text);

  const rideProduct = wantsPremium ? 'Premium Ride' : wantsFastest ? 'Priority Ride' : 'GrabCar';
  const baseFare = budget ? Math.max(6, Math.round(budget * 0.28)) : wantsPremium ? 14 : 9;

  if (!plan.selectedServices.ride) {
    plan.selectedServices.ride = {
      category: 'ride',
      product: rideProduct,
      pickupLabel: 'Current location',
      dropoffLabel: toAirport ? 'Airport' : 'Selected destination',
      seats: partySize || 4,
      estimatedFare: { amount: baseFare, currency },
      pickupEtaMinutes: wantsFastest ? 2 : 6,
      scheduledAfterMinutes: delayMinutes,
      rationale: wantsFastest ? 'Matched fastest ride preference.' : 'Matched ride booking intent.',
      tags: ['selected', wantsPremium ? 'premium' : 'balanced']
    };
  } else {
    if (toAirport && !plan.selectedServices.ride.dropoffLabel) {
      plan.selectedServices.ride.dropoffLabel = 'Airport';
    }
    if (wantsPremium && !/premium|luxury/i.test(plan.selectedServices.ride.product || '')) {
      plan.selectedServices.ride.product = 'Premium Ride';
      plan.selectedServices.ride.tags = Array.from(new Set([...(plan.selectedServices.ride.tags || []), 'premium']));
    } else if (wantsFastest && !/priority|fast|premium/i.test(plan.selectedServices.ride.product || '')) {
      plan.selectedServices.ride.product = 'Priority Ride';
      plan.selectedServices.ride.tags = Array.from(new Set([...(plan.selectedServices.ride.tags || []), 'fast']));
    }
  }

  if (!Array.isArray(plan.recommendations.ride) || plan.recommendations.ride.length === 0) {
    const selectedFare = typeof plan.selectedServices.ride?.estimatedFare?.amount === 'number'
      ? plan.selectedServices.ride.estimatedFare.amount
      : baseFare;

    plan.recommendations.ride = [
      {
        recommendationId: 'ride-rec-guardrail-1',
        label: 'Priority Ride',
        deltaPrice: 3,
        reason: 'Faster pickup and better matching probability.',
        payload: {
          ...plan.selectedServices.ride,
          product: 'Priority Ride',
          estimatedFare: { amount: selectedFare + 3, currency },
          pickupEtaMinutes: 2,
          tags: ['recommended', 'fast']
        }
      },
      {
        recommendationId: 'ride-rec-guardrail-2',
        label: 'Saver Car',
        deltaPrice: -2,
        reason: 'Lower fare with slightly longer waiting time.',
        payload: {
          ...plan.selectedServices.ride,
          product: 'Saver Car',
          estimatedFare: { amount: Math.max(4, selectedFare - 2), currency },
          pickupEtaMinutes: 8,
          tags: ['recommended', 'value']
        }
      }
    ];
  }
}

function enforceServiceCoverage(plan, inputText) {
  const text = normalizeInputText(inputText).toLowerCase();
  const currency = inferCurrency(text, plan?.interpretation?.constraints?.budget?.currency);

  const hasFoodSignal = includesAny(text, [
    'food', 'dinner', 'lunch', 'breakfast', 'eat', 'restaurant', 'meal', 'dessert', 'ice cream', 'sushi', 'pizza', 'order'
  ]);
  const hasRideSignal = includesAny(text, [
    'ride', 'car', 'taxi', 'book', 'booked', 'pickup', 'drop', 'airport', 'transport', 'trip', 'right to'
  ]);

  if (hasFoodSignal) {
    ensureFoodDefaults(plan, text, currency);
  }

  if (hasRideSignal) {
    ensureRideDefaults(plan, text, currency);
  }

  plan.interpretation.intents = Array.from(new Set([
    ...(Array.isArray(plan.interpretation.intents) ? plan.interpretation.intents : []),
    ...(hasFoodSignal ? ['food'] : []),
    ...(hasRideSignal ? ['ride'] : [])
  ]));

  const total = [
    plan.selectedServices.food?.estimatedPrice?.amount,
    plan.selectedServices.ride?.estimatedFare?.amount,
    plan.selectedServices.mart?.estimatedPrice?.amount
  ]
    .filter((value) => typeof value === 'number')
    .reduce((sum, value) => sum + value, 0);

  if (total > 0) {
    plan.orchestration.combinedCostEstimate = {
      amount: total,
      currency
    };
  }

  return plan;
}

function buildDebugJson(plan) {
  return {
    requestMeta: {
      requestId: plan.requestMeta.requestId,
      rawInput: {
        mode: plan.requestMeta.source,
        text: plan.requestMeta.originalText,
        language: plan.requestMeta.language
      },
      normalizedInput: plan.requestMeta.normalizedText,
      timestamp: plan.requestMeta.createdAtIso
    },
    interpretation: {
      intents: plan.interpretation.intents,
      confidence: plan.interpretation.confidence,
      constraints: plan.interpretation.constraints
    },
    servicePlan: {
      selected: plan.selectedServices,
      recommendations: plan.recommendations
    },
    orchestration: plan.orchestration,
    uiHints: plan.uiHints
  };
}

function buildSystemInstruction() {
  return [
    'You are Grab Genie intent orchestrator.',
    'Return only JSON. No markdown, no explanation.',
    'Always keep all keys in the target schema.',
    'Use null for unknown scalar values and [] for unknown arrays.',
    'Resolve likely speech-to-text ambiguities when obvious from context (example: all right/alright in transport context often means a ride).',
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
  const normalizedInputText = normalizeInputText(inputText);
  const config = getAiConfig();

  if (!hasAiProvider(config)) {
    const fallbackPlan = buildFallbackPlan(normalizedInputText);
    console.log('[GrabGenie][PlanJSON][fallback-no-ai]', JSON.stringify(buildDebugJson(fallbackPlan), null, 2));

    return {
      plan: fallbackPlan,
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
    const normalized = normalizePlan(parsed, normalizedInputText);
    const repaired = enforceServiceCoverage(normalized, normalizedInputText);
    const finalPlan = normalizePlan(repaired, normalizedInputText);

    console.log('[GrabGenie][PlanJSON][ai]', JSON.stringify(buildDebugJson(finalPlan), null, 2));

    return {
      plan: finalPlan,
      meta: {
        source: 'ai',
        provider: config.provider,
        warning: null
      }
    };
  } catch (error) {
    const fallbackPlan = buildFallbackPlan(normalizedInputText);
    console.log('[GrabGenie][PlanJSON][fallback-after-ai-error]', JSON.stringify(buildDebugJson(fallbackPlan), null, 2));
    console.warn('[GrabGenie][AIError]', error?.message || error);

    return {
      plan: fallbackPlan,
      meta: {
        source: 'fallback-after-ai-error',
        provider: config.provider,
        warning: 'AI temporarily unavailable. Smart fallback planner used.'
      }
    };
  }
}
