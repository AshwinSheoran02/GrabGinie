import { normalizePlan } from '../../schema/planSchema';
import jsonFormatTemplate from '../../JsonFormat.json';
import { adaptJsonFormatPlan } from '../../schema/adaptJsonFormatPlan';
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
        label: plan.selectedServices.food?.cuisine ? `${plan.selectedServices.food.cuisine} Value Set` : 'Value Meal Set',
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

  let rideProductParts = [];
  if (wantsFastest) rideProductParts.push('Priority');
  if (wantsPremium) rideProductParts.push('Premium');
  if (rideProductParts.length === 0) rideProductParts.push('GrabCar');
  else rideProductParts.push('Ride');
  
  const rideProduct = rideProductParts.join(' ');
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
      tags: ['selected', wantsPremium ? 'premium' : 'balanced'].filter(Boolean)
    };
  } else {
    if (toAirport && (!plan.selectedServices.ride.dropoffLabel || plan.selectedServices.ride.dropoffLabel === 'Selected destination')) {
      plan.selectedServices.ride.dropoffLabel = 'Airport';
    }
    const tags = new Set(plan.selectedServices.ride.tags || []);
    if (wantsPremium) tags.add('premium');
    if (wantsFastest) tags.add('fast');
    plan.selectedServices.ride.tags = Array.from(tags);

    const currentProduct = plan.selectedServices.ride.product || '';
    const hasPremium = /premium|luxury/i.test(currentProduct) || wantsPremium;
    const hasPriority = /priority|fast/i.test(currentProduct) || wantsFastest;
    
    let updatedProductParts = [];
    if (hasPriority) updatedProductParts.push('Priority');
    if (hasPremium) updatedProductParts.push('Premium');
    
    if (updatedProductParts.length > 0) {
      updatedProductParts.push('Ride');
      plan.selectedServices.ride.product = updatedProductParts.join(' ');
    } else if (!currentProduct || currentProduct === 'Ride') {
      plan.selectedServices.ride.product = 'GrabCar';
    }
  }

  if (!Array.isArray(plan.recommendations.ride) || plan.recommendations.ride.length === 0) {
    const selectedFare = typeof plan.selectedServices.ride?.estimatedFare?.amount === 'number'
      ? plan.selectedServices.ride.estimatedFare.amount
      : baseFare;

    // ensure recommendations contrast with the potentially combined selection
    const rec1Product = (wantsPremium && !wantsFastest) ? 'Premium Economy' : 'Priority Ride';

    plan.recommendations.ride = [
      {
        recommendationId: 'ride-rec-guardrail-1',
        label: rec1Product,
        deltaPrice: 3,
        reason: 'Faster pickup or alternate premium option.',
        payload: {
          ...plan.selectedServices.ride,
          product: rec1Product,
          estimatedFare: { amount: selectedFare + 3, currency },
          pickupEtaMinutes: 2,
          tags: ['recommended', 'alternative']
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

  const hasFood = plan.selectedServices.food != null;
  const hasRide = plan.selectedServices.ride != null;
  const hasMart = plan.selectedServices.mart != null;

  const missingPrices = (hasFood && typeof plan.selectedServices.food?.estimatedPrice?.amount !== 'number') || 
                        (hasRide && typeof plan.selectedServices.ride?.estimatedFare?.amount !== 'number') || 
                        (hasMart && typeof plan.selectedServices.mart?.estimatedPrice?.amount !== 'number');

  if (missingPrices) {
    plan.orchestration.combinedCostEstimate = null;
    plan.uiHints = plan.uiHints || {};
    plan.uiHints.fallbackMessage = plan.uiHints.fallbackMessage || "Note: Total cost unavailable due to missing price estimates.";
  } else {
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
  return (
    'You are a STRICT structured intent extraction engine for a super-app assistant. ' +
    'Your job is to convert the user\'s request into EXACTLY one valid JSON object matching the target schema.'
  );
}

function buildPrompt(inputText) {
  const schemaBlock = JSON.stringify(jsonFormatTemplate, null, 2);

  return `NON-NEGOTIABLE RULES

1. Return JSON only.
2. Do not return markdown.
3. Do not explain anything outside the JSON.
4. Do not rename keys.
5. Do not remove keys.
6. Do not add new top-level keys.
7. Use null for unknown scalar values.
8. Use [] for empty arrays.
9. Preserve every meaningful user-supplied term somewhere in the JSON.
10. If a term cannot be mapped confidently to a main field, put it in interpretation.unmappedTokens or interpretation.notes.
11. Never silently drop meaningful information.

MEANINGFUL INFORMATION INCLUDES BUT IS NOT LIMITED TO:
- priority
- premium
- fastest
- cheapest
- budget
- under $X
- for N people
- airport
- home
- office
- dessert
- sweet
- spicy
- healthy
- cold
- hot
- after one hour
- when I reach home
- after I get there
- if budget allows
- if unavailable
- recommend
- replace
- add
- luggage
- breakfast
- lunch
- dinner
- groceries
- ice cream
- mart items

If the user says "priority premium ride", both "priority" and "premium" must be preserved in the ride-related fields or interpretation notes. Do not collapse them into one concept unless both are still represented.

If the user says something conditional like:
- "if budget allows"
- "if unavailable"
- "if it fits the budget"
- "only if"
then preserve that inside constraints.conditionals.

If the user says timing-dependent things like:
- "after one hour"
- "when I reach home"
- "after I reach"
- "before I get there"
then preserve them inside constraints.time and service timing fields.

If the user combines multiple services, enable all relevant service blocks.

If the user request is contradictory, do NOT silently fix it.
Record the contradiction in interpretation.contradictions and still produce the best possible structured interpretation.

If a field is implied but not explicit, infer only when it is obvious.
Otherwise leave it null and note uncertainty in interpretation.ambiguities or interpretation.notes.

TARGET SCHEMA TEMPLATE:
${schemaBlock}

EXTRACTION INSTRUCTIONS

- Fill meta.rawInput with the original user text exactly.
- Fill meta.normalizedInput with a cleaned lowercase version.
- Set servicesRequested.ride.enabled true only if a ride/transport request exists.
- Set servicesRequested.food.enabled true only if a food/restaurant/snack/dessert/drink request exists.
- Set servicesRequested.mart.enabled true only if grocery/general item/market order request exists.
- Keep selectedPlan arrays present even when empty.
- Keep recommendations arrays present even when empty.
- If the user explicitly asks for recommendations, alternatives, upgrades, replacements, backups, or better options, preserve that.
- If the user implies a better option could exist, recommendations should still be allowed.
- If "peopleCount" appears globally and also affects food, preserve it in both relevant places where applicable.
- If there is a budget, preserve it globally and in the relevant service budget blocks when clearly applicable.
- If the destination is a saved-place concept like home or office, preserve that text exactly.
- Preserve premium/priority/fastest/cheapest separately. They are not interchangeable.
- Preserve dessert/sweet/cold separately. They are not interchangeable.
- Preserve ride timing and food timing separately when the request implies coordination.

VALIDATION BEFORE RETURNING

Before returning JSON, mentally verify:
- Did I preserve every meaningful adjective and modifier?
- Did I preserve every budget, timing, destination, and quantity?
- Did I preserve conditionals?
- Did I preserve unmapped but meaningful tokens?
- Did I preserve priority and premium separately if both exist?
- Did I return all keys from the schema?
- Is the output valid JSON only?

USER REQUEST:
${inputText}`;
}

function isJsonFormatShape(plan) {
  return Boolean(
    plan
    && typeof plan === 'object'
    && (plan.meta || plan.requestMeta)
    && plan.servicesRequested
    && plan.selectedPlan
  );
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
    console.log('[GrabGenie][Debug] 1. Raw AI JSON:', JSON.stringify(parsed, null, 2));

    const convertedPlan = isJsonFormatShape(parsed)
      ? adaptJsonFormatPlan(parsed, normalizedInputText)
      : parsed;
    
    console.log('[GrabGenie][Debug] 2. After Adapter Plan:', JSON.stringify(convertedPlan, null, 2));

    const normalized = normalizePlan(convertedPlan, normalizedInputText);
    const repaired = enforceServiceCoverage(normalized, normalizedInputText);
    const finalPlan = normalizePlan(repaired, normalizedInputText);

    console.log('[GrabGenie][Debug] 3. Final Rendered Selected Plan:', JSON.stringify(finalPlan.selectedServices, null, 2));
    console.log('[GrabGenie][Debug] 4. Final Recommendations:', JSON.stringify(finalPlan.recommendations, null, 2));
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
