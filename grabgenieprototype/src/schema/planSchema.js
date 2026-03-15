export const SERVICE_CATEGORY = {
  FOOD: 'food',
  RIDE: 'ride',
  MART: 'mart'
};

const emptyMoney = { amount: null, currency: 'USD' };

const emptyLocation = {
  label: null,
  latitude: null,
  longitude: null,
  note: null
};

const emptyTimeWindow = {
  requestedAtIso: null,
  executeAfterMinutes: null,
  deadlineIso: null,
  flexibility: null
};

export function createEmptyPlan(inputText) {
  return {
    schemaVersion: '1.0.0',
    requestMeta: {
      requestId: `req_${Date.now()}`,
      source: 'text',
      originalText: inputText || '',
      normalizedText: inputText || '',
      language: 'en',
      createdAtIso: new Date().toISOString()
    },
    interpretation: {
      intents: [],
      constraints: {
        budget: { ...emptyMoney },
        partySize: null,
        dietaryNotes: [],
        accessibilityNeeds: [],
        urgency: null,
        deliveryLocation: { ...emptyLocation },
        pickupLocation: { ...emptyLocation },
        dropoffLocation: { ...emptyLocation },
        schedule: { ...emptyTimeWindow }
      },
      confidence: {
        overall: null,
        byService: {
          food: null,
          ride: null,
          mart: null
        },
        explanation: null
      },
      clarificationsNeeded: []
    },
    selectedServices: {
      food: null,
      ride: null,
      mart: null
    },
    recommendations: {
      food: [],
      ride: [],
      mart: []
    },
    orchestration: {
      combinedCostEstimate: { ...emptyMoney },
      executionOrder: [],
      notes: []
    },
    uiHints: {
      highlightReasons: [],
      fallbackMessage: null,
      processingSummary: []
    }
  };
}

export function buildSchemaTemplate() {
  const template = createEmptyPlan('');
  template.requestMeta.requestId = 'string';
  template.requestMeta.source = 'text | audio';
  template.requestMeta.originalText = 'string';
  template.requestMeta.normalizedText = 'string';
  template.requestMeta.language = 'string';
  template.requestMeta.createdAtIso = 'ISO-8601 string';

  template.interpretation.intents = ['food', 'ride', 'mart'];
  template.interpretation.constraints.budget.amount = 'number|null';
  template.interpretation.constraints.budget.currency = 'USD|SGD|...';
  template.interpretation.constraints.partySize = 'number|null';
  template.interpretation.constraints.dietaryNotes = ['string'];
  template.interpretation.constraints.accessibilityNeeds = ['string'];
  template.interpretation.constraints.urgency = 'low|normal|high|null';
  template.interpretation.constraints.deliveryLocation = {
    label: 'string|null',
    latitude: 'number|null',
    longitude: 'number|null',
    note: 'string|null'
  };
  template.interpretation.constraints.pickupLocation = {
    label: 'string|null',
    latitude: 'number|null',
    longitude: 'number|null',
    note: 'string|null'
  };
  template.interpretation.constraints.dropoffLocation = {
    label: 'string|null',
    latitude: 'number|null',
    longitude: 'number|null',
    note: 'string|null'
  };
  template.interpretation.constraints.schedule = {
    requestedAtIso: 'string|null',
    executeAfterMinutes: 'number|null',
    deadlineIso: 'string|null',
    flexibility: 'strict|flexible|null'
  };
  template.interpretation.confidence = {
    overall: '0..1|null',
    byService: { food: '0..1|null', ride: '0..1|null', mart: '0..1|null' },
    explanation: 'string|null'
  };
  template.interpretation.clarificationsNeeded = ['string'];

  template.selectedServices = {
    food: {
      category: 'food',
      providerName: 'string|null',
      itemName: 'string|null',
      cuisine: 'string|null',
      quantity: 'number|null',
      estimatedPrice: { amount: 'number|null', currency: 'string' },
      etaMinutes: 'number|null',
      rationale: 'string|null',
      tags: ['string']
    },
    ride: {
      category: 'ride',
      product: 'string|null',
      pickupLabel: 'string|null',
      dropoffLabel: 'string|null',
      seats: 'number|null',
      estimatedFare: { amount: 'number|null', currency: 'string' },
      pickupEtaMinutes: 'number|null',
      scheduledAfterMinutes: 'number|null',
      rationale: 'string|null',
      tags: ['string']
    },
    mart: {
      category: 'mart',
      storeName: 'string|null',
      itemSummary: 'string|null',
      items: [{ name: 'string', qty: 'number|null', note: 'string|null' }],
      estimatedPrice: { amount: 'number|null', currency: 'string' },
      etaMinutes: 'number|null',
      rationale: 'string|null',
      tags: ['string']
    }
  };

  template.recommendations = {
    food: [{ recommendationId: 'string', label: 'string', deltaPrice: 'number|null', reason: 'string', payload: {} }],
    ride: [{ recommendationId: 'string', label: 'string', deltaPrice: 'number|null', reason: 'string', payload: {} }],
    mart: [{ recommendationId: 'string', label: 'string', deltaPrice: 'number|null', reason: 'string', payload: {} }]
  };

  template.orchestration = {
    combinedCostEstimate: { amount: 'number|null', currency: 'string' },
    executionOrder: ['food -> ride -> mart'],
    notes: ['string']
  };

  template.uiHints = {
    highlightReasons: ['string'],
    fallbackMessage: 'string|null',
    processingSummary: ['string']
  };

  return template;
}

function normalizeMoney(money) {
  return {
    amount: typeof money?.amount === 'number' ? money.amount : null,
    currency: typeof money?.currency === 'string' && money.currency ? money.currency : 'USD'
  };
}

function normalizeLocation(location) {
  return {
    label: typeof location?.label === 'string' ? location.label : null,
    latitude: typeof location?.latitude === 'number' ? location.latitude : null,
    longitude: typeof location?.longitude === 'number' ? location.longitude : null,
    note: typeof location?.note === 'string' ? location.note : null
  };
}

function normalizeServiceItem(category, item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  if (category === SERVICE_CATEGORY.FOOD) {
    return {
      category: SERVICE_CATEGORY.FOOD,
      providerName: item.providerName || null,
      itemName: item.itemName || null,
      cuisine: item.cuisine || null,
      quantity: typeof item.quantity === 'number' ? item.quantity : null,
      estimatedPrice: normalizeMoney(item.estimatedPrice),
      etaMinutes: typeof item.etaMinutes === 'number' ? item.etaMinutes : null,
      rationale: item.rationale || null,
      tags: Array.isArray(item.tags) ? item.tags : []
    };
  }

  if (category === SERVICE_CATEGORY.RIDE) {
    return {
      category: SERVICE_CATEGORY.RIDE,
      product: item.product || null,
      pickupLabel: item.pickupLabel || null,
      dropoffLabel: item.dropoffLabel || null,
      seats: typeof item.seats === 'number' ? item.seats : null,
      estimatedFare: normalizeMoney(item.estimatedFare),
      pickupEtaMinutes: typeof item.pickupEtaMinutes === 'number' ? item.pickupEtaMinutes : null,
      scheduledAfterMinutes: typeof item.scheduledAfterMinutes === 'number' ? item.scheduledAfterMinutes : null,
      rationale: item.rationale || null,
      tags: Array.isArray(item.tags) ? item.tags : []
    };
  }

  return {
    category: SERVICE_CATEGORY.MART,
    storeName: item.storeName || null,
    itemSummary: item.itemSummary || null,
    items: Array.isArray(item.items)
      ? item.items.map((entry) => ({
          name: typeof entry?.name === 'string' ? entry.name : 'Item',
          qty: typeof entry?.qty === 'number' ? entry.qty : null,
          note: typeof entry?.note === 'string' ? entry.note : null
        }))
      : [],
    estimatedPrice: normalizeMoney(item.estimatedPrice),
    etaMinutes: typeof item.etaMinutes === 'number' ? item.etaMinutes : null,
    rationale: item.rationale || null,
    tags: Array.isArray(item.tags) ? item.tags : []
  };
}

function normalizeRecommendations(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((entry, index) => ({
    recommendationId: typeof entry?.recommendationId === 'string' ? entry.recommendationId : `rec_${index + 1}`,
    label: typeof entry?.label === 'string' ? entry.label : 'Recommended option',
    deltaPrice: typeof entry?.deltaPrice === 'number' ? entry.deltaPrice : null,
    reason: typeof entry?.reason === 'string' ? entry.reason : 'Alternative for this request.',
    payload: entry?.payload && typeof entry.payload === 'object' ? entry.payload : {}
  }));
}

export function normalizePlan(rawPlan, originalText) {
  const base = createEmptyPlan(originalText);

  if (!rawPlan || typeof rawPlan !== 'object') {
    return base;
  }

  const normalized = {
    ...base,
    schemaVersion: typeof rawPlan.schemaVersion === 'string' ? rawPlan.schemaVersion : base.schemaVersion,
    requestMeta: {
      ...base.requestMeta,
      ...(rawPlan.requestMeta || {}),
      originalText: typeof rawPlan?.requestMeta?.originalText === 'string' ? rawPlan.requestMeta.originalText : originalText,
      normalizedText: typeof rawPlan?.requestMeta?.normalizedText === 'string' ? rawPlan.requestMeta.normalizedText : originalText
    },
    interpretation: {
      ...base.interpretation,
      ...(rawPlan.interpretation || {}),
      constraints: {
        ...base.interpretation.constraints,
        ...(rawPlan?.interpretation?.constraints || {}),
        budget: normalizeMoney(rawPlan?.interpretation?.constraints?.budget),
        deliveryLocation: normalizeLocation(rawPlan?.interpretation?.constraints?.deliveryLocation),
        pickupLocation: normalizeLocation(rawPlan?.interpretation?.constraints?.pickupLocation),
        dropoffLocation: normalizeLocation(rawPlan?.interpretation?.constraints?.dropoffLocation),
        schedule: {
          ...base.interpretation.constraints.schedule,
          ...(rawPlan?.interpretation?.constraints?.schedule || {})
        },
        dietaryNotes: Array.isArray(rawPlan?.interpretation?.constraints?.dietaryNotes)
          ? rawPlan.interpretation.constraints.dietaryNotes
          : [],
        accessibilityNeeds: Array.isArray(rawPlan?.interpretation?.constraints?.accessibilityNeeds)
          ? rawPlan.interpretation.constraints.accessibilityNeeds
          : []
      },
      intents: Array.isArray(rawPlan?.interpretation?.intents) ? rawPlan.interpretation.intents : [],
      confidence: {
        ...base.interpretation.confidence,
        ...(rawPlan?.interpretation?.confidence || {}),
        byService: {
          ...base.interpretation.confidence.byService,
          ...(rawPlan?.interpretation?.confidence?.byService || {})
        }
      },
      clarificationsNeeded: Array.isArray(rawPlan?.interpretation?.clarificationsNeeded)
        ? rawPlan.interpretation.clarificationsNeeded
        : []
    },
    selectedServices: {
      food: normalizeServiceItem(SERVICE_CATEGORY.FOOD, rawPlan?.selectedServices?.food),
      ride: normalizeServiceItem(SERVICE_CATEGORY.RIDE, rawPlan?.selectedServices?.ride),
      mart: normalizeServiceItem(SERVICE_CATEGORY.MART, rawPlan?.selectedServices?.mart)
    },
    recommendations: {
      food: normalizeRecommendations(rawPlan?.recommendations?.food),
      ride: normalizeRecommendations(rawPlan?.recommendations?.ride),
      mart: normalizeRecommendations(rawPlan?.recommendations?.mart)
    },
    orchestration: {
      ...base.orchestration,
      ...(rawPlan?.orchestration || {}),
      combinedCostEstimate: normalizeMoney(rawPlan?.orchestration?.combinedCostEstimate),
      executionOrder: Array.isArray(rawPlan?.orchestration?.executionOrder) ? rawPlan.orchestration.executionOrder : [],
      notes: Array.isArray(rawPlan?.orchestration?.notes) ? rawPlan.orchestration.notes : []
    },
    uiHints: {
      ...base.uiHints,
      ...(rawPlan?.uiHints || {}),
      highlightReasons: Array.isArray(rawPlan?.uiHints?.highlightReasons) ? rawPlan.uiHints.highlightReasons : [],
      processingSummary: Array.isArray(rawPlan?.uiHints?.processingSummary) ? rawPlan.uiHints.processingSummary : []
    }
  };

  return normalized;
}
