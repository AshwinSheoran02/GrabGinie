import { createEmptyPlan, normalizePlan, SERVICE_CATEGORY } from '../../schema/planSchema';

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
    .replace(/\bright\s+to\s+(the\s+)?airport\b/gi, 'ride to airport')
    .replace(/\ball\s+right\b/gi, 'a ride')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function pickCurrency(text) {
  if (/\bsgd\b|s\$/i.test(text)) {
    return 'SGD';
  }
  return 'USD';
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

function parseParty(text) {
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

function inferCuisine(text) {
  if (/chinese/i.test(text)) return 'Chinese';
  if (/indian/i.test(text)) return 'Indian';
  if (/thai/i.test(text)) return 'Thai';
  if (/italian/i.test(text)) return 'Italian';
  return null;
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function buildFallbackPlan(inputText) {
  const normalizedInput = normalizeInputText(inputText);
  const text = normalizedInput.toLowerCase();
  const currency = pickCurrency(text);
  const budget = parseBudget(text);
  const partySize = parseParty(text);
  const delayMins = parseDelayMinutes(text);

  const hasFood = includesAny(text, ['food', 'dinner', 'lunch', 'breakfast', 'eat', 'restaurant', 'ice cream', 'dessert', 'meal', 'noodle', 'pizza', 'sushi', 'order']);
  const hasRide = includesAny(text, ['ride', 'car', 'taxi', 'drop', 'pickup', 'go home', 'go to', 'trip', 'transport', 'right to']);
  const hasMart = includesAny(text, ['mart', 'grocery', 'groceries', 'milk', 'snack', 'snacks', 'item', 'items', 'buy', 'shop', 'delivery']);

  const plan = createEmptyPlan(normalizedInput);
  plan.requestMeta.normalizedText = normalizedInput;
  plan.interpretation.intents = [
    ...(hasFood ? [SERVICE_CATEGORY.FOOD] : []),
    ...(hasRide ? [SERVICE_CATEGORY.RIDE] : []),
    ...(hasMart ? [SERVICE_CATEGORY.MART] : [])
  ];

  plan.interpretation.constraints.budget = {
    amount: budget,
    currency
  };
  plan.interpretation.constraints.partySize = partySize;
  plan.interpretation.constraints.schedule.executeAfterMinutes = delayMins;

  if (!hasFood && !hasRide && !hasMart) {
    plan.uiHints.fallbackMessage = 'I kept your plan broad and ready. You can refine with food, ride, or mart details.';
    plan.interpretation.clarificationsNeeded = [
      'Would you like food, ride, mart, or a combination?',
      'Any target budget or timing?'
    ];
  }

  if (hasFood) {
    const cuisine = inferCuisine(text);
    const defaultFoodPrice = budget ? Math.max(8, Math.round(budget * 0.75)) : 24;

    plan.selectedServices.food = {
      category: SERVICE_CATEGORY.FOOD,
      providerName: cuisine ? `${cuisine} Kitchen` : 'Genie Food Picks',
      itemName: /ice cream|dessert/i.test(text) ? 'House Special Ice Cream Set' : 'Chef Combo Meal',
      cuisine,
      quantity: partySize,
      estimatedPrice: {
        amount: defaultFoodPrice,
        currency
      },
      etaMinutes: 25,
      rationale: 'Optimized for your request constraints and timing.',
      tags: ['selected', budget ? 'budget-aware' : 'balanced']
    };

    plan.recommendations.food = [
      {
        recommendationId: 'food-rec-1',
        label: /ice cream|dessert/i.test(text) ? 'Mango Ice Cream Tub' : 'Family Saver Set',
        deltaPrice: -3,
        reason: 'Lower total while keeping delivery speed strong.',
        payload: {
          category: SERVICE_CATEGORY.FOOD,
          providerName: 'Cool Scoops',
          itemName: /ice cream|dessert/i.test(text) ? 'Mango Ice Cream Tub' : 'Family Saver Set',
          cuisine: /ice cream|dessert/i.test(text) ? 'Dessert' : cuisine,
          quantity: partySize,
          estimatedPrice: {
            amount: Math.max(6, defaultFoodPrice - 3),
            currency
          },
          etaMinutes: 20,
          rationale: 'Recommended for better value.',
          tags: ['recommended', 'value']
        }
      },
      {
        recommendationId: 'food-rec-2',
        label: 'Priority Kitchen Express',
        deltaPrice: 4,
        reason: 'Faster kitchen prep for urgent delivery.',
        payload: {
          category: SERVICE_CATEGORY.FOOD,
          providerName: 'Priority Kitchen',
          itemName: 'Express Meal Set',
          cuisine,
          quantity: partySize,
          estimatedPrice: {
            amount: defaultFoodPrice + 4,
            currency
          },
          etaMinutes: 15,
          rationale: 'Recommended for speed.',
          tags: ['recommended', 'fast']
        }
      }
    ];
  }

  if (hasRide) {
    const fare = budget ? Math.max(6, Math.round(budget * 0.28)) : 9;
    plan.selectedServices.ride = {
      category: SERVICE_CATEGORY.RIDE,
      product: 'GrabCar',
      pickupLabel: 'Current location',
      dropoffLabel: /home/i.test(text) ? 'Home' : 'Selected destination',
      seats: partySize || 4,
      estimatedFare: {
        amount: fare,
        currency
      },
      pickupEtaMinutes: 6,
      scheduledAfterMinutes: delayMins,
      rationale: 'Reliable default with balanced wait time.',
      tags: ['selected', delayMins ? 'scheduled' : 'on-demand']
    };

    plan.recommendations.ride = [
      {
        recommendationId: 'ride-rec-1',
        label: 'Priority Ride',
        deltaPrice: 3,
        reason: 'Faster pickup and better matching probability.',
        payload: {
          category: SERVICE_CATEGORY.RIDE,
          product: 'Priority Ride',
          pickupLabel: 'Current location',
          dropoffLabel: /home/i.test(text) ? 'Home' : 'Selected destination',
          seats: partySize || 4,
          estimatedFare: {
            amount: fare + 3,
            currency
          },
          pickupEtaMinutes: 2,
          scheduledAfterMinutes: delayMins,
          rationale: 'Recommended for faster departure.',
          tags: ['recommended', 'fast']
        }
      },
      {
        recommendationId: 'ride-rec-2',
        label: 'Saver Car',
        deltaPrice: -2,
        reason: 'Cheaper option with slightly longer wait.',
        payload: {
          category: SERVICE_CATEGORY.RIDE,
          product: 'Saver Car',
          pickupLabel: 'Current location',
          dropoffLabel: /home/i.test(text) ? 'Home' : 'Selected destination',
          seats: partySize || 4,
          estimatedFare: {
            amount: Math.max(4, fare - 2),
            currency
          },
          pickupEtaMinutes: 8,
          scheduledAfterMinutes: delayMins,
          rationale: 'Recommended for lower fare.',
          tags: ['recommended', 'value']
        }
      }
    ];
  }

  if (hasMart) {
    const martCost = budget ? Math.max(10, Math.round(budget * 0.55)) : 18;
    plan.selectedServices.mart = {
      category: SERVICE_CATEGORY.MART,
      storeName: 'Genie Mart',
      itemSummary: 'Everyday essentials',
      items: [
        { name: 'Mixed groceries', qty: 1, note: null }
      ],
      estimatedPrice: {
        amount: martCost,
        currency
      },
      etaMinutes: 32,
      rationale: 'Chosen for stock availability and delivery coverage.',
      tags: ['selected', 'in-stock']
    };

    plan.recommendations.mart = [
      {
        recommendationId: 'mart-rec-1',
        label: 'Fresh Basket Mart',
        deltaPrice: 2,
        reason: 'Higher produce quality and packaging.',
        payload: {
          category: SERVICE_CATEGORY.MART,
          storeName: 'Fresh Basket Mart',
          itemSummary: 'Premium freshness basket',
          items: [
            { name: 'Fruit and dairy basket', qty: 1, note: null }
          ],
          estimatedPrice: {
            amount: martCost + 2,
            currency
          },
          etaMinutes: 28,
          rationale: 'Recommended for quality.',
          tags: ['recommended', 'quality']
        }
      },
      {
        recommendationId: 'mart-rec-2',
        label: 'Budget Pantry Stop',
        deltaPrice: -3,
        reason: 'Lower basket total for essentials.',
        payload: {
          category: SERVICE_CATEGORY.MART,
          storeName: 'Budget Pantry Stop',
          itemSummary: 'Cost-focused essentials',
          items: [
            { name: 'Basic pantry set', qty: 1, note: null }
          ],
          estimatedPrice: {
            amount: Math.max(8, martCost - 3),
            currency
          },
          etaMinutes: 36,
          rationale: 'Recommended for lower spend.',
          tags: ['recommended', 'value']
        }
      }
    ];
  }

  const total = [
    plan.selectedServices.food?.estimatedPrice?.amount,
    plan.selectedServices.ride?.estimatedFare?.amount,
    plan.selectedServices.mart?.estimatedPrice?.amount
  ]
    .filter((value) => typeof value === 'number')
    .reduce((sum, value) => sum + value, 0);

  plan.orchestration.combinedCostEstimate = {
    amount: total || null,
    currency
  };

  plan.orchestration.executionOrder = [
    ...(hasFood ? ['food.order'] : []),
    ...(hasMart ? ['mart.order'] : []),
    ...(hasRide ? ['ride.book'] : [])
  ];

  plan.uiHints.processingSummary = [
    ...(hasFood ? ['Prepared a food option with alternatives.'] : []),
    ...(hasRide ? ['Prepared a ride choice with speed vs cost options.'] : []),
    ...(hasMart ? ['Prepared a mart basket with recommendation variants.'] : [])
  ];

  plan.uiHints.highlightReasons = [
    ...(budget ? ['Applied your budget signal across services.'] : ['Generated balanced options without a strict budget.']),
    ...(delayMins ? [`Used your timing request (${delayMins} min).`] : []),
    'Recommendations are optimized for replace interactions.'
  ];

  return normalizePlan(plan, normalizedInput);
}
