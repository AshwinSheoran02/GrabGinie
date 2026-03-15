function pickFirstSelected(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  return entries.find((entry) => entry?.selected === true || entry?.enabled === true) || entries[0] || null;
}

function toMoney(price, fallbackCurrency = 'USD') {
  return {
    amount: typeof price?.amount === 'number' ? price.amount : null,
    currency: typeof price?.currency === 'string' && price.currency ? price.currency : fallbackCurrency
  };
}

function toLocationLabel(location, fallback) {
  if (!location || typeof location !== 'object') {
    return fallback || null;
  }

  if (typeof location.label === 'string' && location.label) {
    return location.label;
  }

  if (typeof location.value === 'string' && location.value) {
    if (location.value.toLowerCase() === 'home') return 'Home';
    if (location.value.toLowerCase() === 'office') return 'Office';
    return location.value;
  }

  if (location.type === 'current_location') {
    return 'Current location';
  }

  return fallback || null;
}

function toRideProduct(ride) {
  if (!ride) {
    return null;
  }

  return ride.rideType || ride.label || null;
}

function toRecommendationId(prefix, index) {
  return `${prefix}-rec-${index + 1}`;
}

function mapFoodSelected(plan, currency) {
  const selected = pickFirstSelected(plan?.selectedPlan?.food);
  if (!selected) {
    return null;
  }

  return {
    category: 'food',
    providerName: selected.vendorName || null,
    itemName: selected.itemName || selected.label || null,
    cuisine: selected.cuisine || null,
    quantity: typeof selected.quantity === 'number' ? selected.quantity : (typeof selected.peopleCount === 'number' ? selected.peopleCount : null),
    estimatedPrice: toMoney(selected.price, currency),
    etaMinutes: typeof selected.etaMinutes === 'number' ? selected.etaMinutes : null,
    rationale: selected?.qualitySignals?.matchReason || null,
    tags: ['selected']
  };
}

function mapRideSelected(plan, currency) {
  const selected = pickFirstSelected(plan?.selectedPlan?.ride);
  const requested = plan?.servicesRequested?.ride;
  if (!selected && !requested) {
    return null;
  }

  const pickup = selected?.pickup || requested?.pickup;
  const destination = selected?.destination || requested?.destination;

  return {
    category: 'ride',
    product: toRideProduct(selected) || requested?.rideTypePreference || 'Ride',
    pickupLabel: toLocationLabel(pickup, 'Current location'),
    dropoffLabel: toLocationLabel(destination, requested?.destination?.value || 'Selected destination'),
    seats: typeof selected?.constraints?.seatCount === 'number'
      ? selected.constraints.seatCount
      : typeof requested?.constraints?.seatCount === 'number'
        ? requested.constraints.seatCount
        : 4,
    estimatedFare: toMoney(selected?.price, currency),
    pickupEtaMinutes: typeof selected?.etaToPickupMinutes === 'number' ? selected.etaToPickupMinutes : null,
    scheduledAfterMinutes: typeof selected?.pickupInMinutes === 'number'
      ? selected.pickupInMinutes
      : typeof requested?.pickupTiming?.relativeDelayMinutes === 'number'
        ? requested.pickupTiming.relativeDelayMinutes
        : null,
    rationale: selected?.qualitySignals?.matchReason || null,
    tags: [
      requested?.constraints?.premiumPreferred ? 'premium' : null,
      requested?.constraints?.fastestPreferred ? 'fast' : null,
      'selected'
    ].filter(Boolean)
  };
}

function mapMartSelected(plan, currency) {
  const selected = pickFirstSelected(plan?.selectedPlan?.mart);
  if (!selected) {
    return null;
  }

  return {
    category: 'mart',
    storeName: selected.storeName || selected.label || null,
    itemSummary: selected.category || selected.subcategory || null,
    items: Array.isArray(selected.items)
      ? selected.items.map((entry) => ({
          name: entry?.itemName || 'Item',
          qty: typeof entry?.quantity === 'number' ? entry.quantity : null,
          note: null
        }))
      : [],
    estimatedPrice: toMoney(selected.price, currency),
    etaMinutes: typeof selected.etaMinutes === 'number' ? selected.etaMinutes : null,
    rationale: selected?.qualitySignals?.matchReason || null,
    tags: ['selected']
  };
}

function mapFoodRecommendations(plan, selectedFood, currency) {
  const entries = Array.isArray(plan?.recommendations?.food) ? plan.recommendations.food : [];
  return entries.map((entry, index) => {
    const amount = typeof entry?.price?.amount === 'number' ? entry.price.amount : null;
    const selectedAmount = selectedFood?.estimatedPrice?.amount;

    return {
      recommendationId: toRecommendationId('food', index),
      label: entry?.itemName || entry?.label || 'Food alternative',
      deltaPrice: typeof amount === 'number' && typeof selectedAmount === 'number' ? amount - selectedAmount : null,
      reason: entry?.recommendationReason || 'Alternative food option.',
      payload: {
        category: 'food',
        providerName: entry?.vendorName || null,
        itemName: entry?.itemName || entry?.label || null,
        cuisine: entry?.cuisine || null,
        quantity: typeof entry?.quantity === 'number' ? entry.quantity : selectedFood?.quantity || null,
        estimatedPrice: toMoney(entry?.price, currency),
        etaMinutes: typeof entry?.etaMinutes === 'number' ? entry.etaMinutes : null,
        rationale: entry?.recommendationReason || null,
        tags: ['recommended']
      }
    };
  });
}

function mapRideRecommendations(plan, selectedRide, currency) {
  const entries = Array.isArray(plan?.recommendations?.ride) ? plan.recommendations.ride : [];
  return entries.map((entry, index) => {
    const amount = typeof entry?.price?.amount === 'number' ? entry.price.amount : null;
    const selectedAmount = selectedRide?.estimatedFare?.amount;

    return {
      recommendationId: toRecommendationId('ride', index),
      label: entry?.rideType || entry?.label || 'Ride alternative',
      deltaPrice: typeof amount === 'number' && typeof selectedAmount === 'number' ? amount - selectedAmount : null,
      reason: entry?.recommendationReason || 'Alternative ride option.',
      payload: {
        category: 'ride',
        product: entry?.rideType || entry?.label || null,
        pickupLabel: toLocationLabel(entry?.pickup, selectedRide?.pickupLabel || 'Current location'),
        dropoffLabel: toLocationLabel(entry?.destination, selectedRide?.dropoffLabel || 'Selected destination'),
        seats: selectedRide?.seats || 4,
        estimatedFare: toMoney(entry?.price, currency),
        pickupEtaMinutes: typeof entry?.etaToPickupMinutes === 'number' ? entry.etaToPickupMinutes : null,
        scheduledAfterMinutes: typeof entry?.pickupInMinutes === 'number' ? entry.pickupInMinutes : selectedRide?.scheduledAfterMinutes || null,
        rationale: entry?.recommendationReason || null,
        tags: ['recommended']
      }
    };
  });
}

function mapMartRecommendations(plan, selectedMart, currency) {
  const entries = Array.isArray(plan?.recommendations?.mart) ? plan.recommendations.mart : [];
  return entries.map((entry, index) => {
    const amount = typeof entry?.price?.amount === 'number' ? entry.price.amount : null;
    const selectedAmount = selectedMart?.estimatedPrice?.amount;

    return {
      recommendationId: toRecommendationId('mart', index),
      label: entry?.storeName || entry?.label || 'Mart alternative',
      deltaPrice: typeof amount === 'number' && typeof selectedAmount === 'number' ? amount - selectedAmount : null,
      reason: entry?.recommendationReason || 'Alternative mart option.',
      payload: {
        category: 'mart',
        storeName: entry?.storeName || entry?.label || null,
        itemSummary: entry?.category || entry?.subcategory || null,
        items: Array.isArray(entry?.items)
          ? entry.items.map((item) => ({
              name: item?.itemName || 'Item',
              qty: typeof item?.quantity === 'number' ? item.quantity : null,
              note: null
            }))
          : [],
        estimatedPrice: toMoney(entry?.price, currency),
        etaMinutes: typeof entry?.etaMinutes === 'number' ? entry.etaMinutes : null,
        rationale: entry?.recommendationReason || null,
        tags: ['recommended']
      }
    };
  });
}

export function adaptJsonFormatPlan(rawPlan, originalText) {
  const currency = rawPlan?.globalIntent?.overallBudget?.currency
    || rawPlan?.budgeting?.globalBudget?.currency
    || 'USD';

  const selectedFood = mapFoodSelected(rawPlan, currency);
  const selectedRide = mapRideSelected(rawPlan, currency);
  const selectedMart = mapMartSelected(rawPlan, currency);

  const normalizedText = rawPlan?.requestMeta?.normalizedInput || originalText;
  const rawInputText = typeof rawPlan?.requestMeta?.rawInput === 'string'
    ? rawPlan.requestMeta.rawInput
    : rawPlan?.requestMeta?.rawInput?.text || originalText;

  return {
    schemaVersion: '1.0.0',
    requestMeta: {
      requestId: rawPlan?.requestMeta?.requestId || null,
      source: rawPlan?.requestMeta?.inputMode || rawPlan?.requestMeta?.rawInput?.mode || 'text',
      originalText: rawInputText,
      normalizedText,
      language: rawPlan?.requestMeta?.language || 'en',
      createdAtIso: rawPlan?.requestMeta?.timestamp || new Date().toISOString()
    },
    interpretation: {
      intents: [
        rawPlan?.servicesRequested?.food?.enabled ? 'food' : null,
        rawPlan?.servicesRequested?.ride?.enabled ? 'ride' : null,
        rawPlan?.servicesRequested?.mart?.enabled ? 'mart' : null
      ].filter(Boolean),
      constraints: {
        budget: {
          amount: typeof rawPlan?.globalIntent?.overallBudget?.amount === 'number'
            ? rawPlan.globalIntent.overallBudget.amount
            : null,
          currency
        },
        partySize: typeof rawPlan?.globalIntent?.peopleCount === 'number' ? rawPlan.globalIntent.peopleCount : null,
        dietaryNotes: Array.isArray(rawPlan?.userContext?.preferences?.dietary) ? rawPlan.userContext.preferences.dietary : [],
        accessibilityNeeds: [],
        urgency: rawPlan?.globalIntent?.priorityMode || null,
        deliveryLocation: {
          label: toLocationLabel(rawPlan?.servicesRequested?.food?.destination, null),
          latitude: null,
          longitude: null,
          note: null
        },
        pickupLocation: {
          label: toLocationLabel(rawPlan?.servicesRequested?.ride?.pickup, null),
          latitude: null,
          longitude: null,
          note: null
        },
        dropoffLocation: {
          label: toLocationLabel(rawPlan?.servicesRequested?.ride?.destination, null),
          latitude: null,
          longitude: null,
          note: null
        },
        schedule: {
          requestedAtIso: rawPlan?.globalIntent?.timeContext?.requestedAt || null,
          executeAfterMinutes: typeof rawPlan?.globalIntent?.timeContext?.relativeDelayMinutes === 'number'
            ? rawPlan.globalIntent.timeContext.relativeDelayMinutes
            : null,
          deadlineIso: rawPlan?.globalIntent?.timeContext?.mustArriveBefore || null,
          flexibility: rawPlan?.globalIntent?.timeContext?.coordinateServices ? 'flexible' : null
        }
      },
      confidence: {
        overall: typeof rawPlan?.interpretation?.confidence === 'number' ? rawPlan.interpretation.confidence : null,
        byService: { food: null, ride: null, mart: null },
        explanation: Array.isArray(rawPlan?.interpretation?.notes) ? rawPlan.interpretation.notes.join(' ') : null
      },
      clarificationsNeeded: Array.isArray(rawPlan?.interpretation?.missingFields) ? rawPlan.interpretation.missingFields : []
    },
    selectedServices: {
      food: selectedFood,
      ride: selectedRide,
      mart: selectedMart
    },
    recommendations: {
      food: mapFoodRecommendations(rawPlan, selectedFood, currency),
      ride: mapRideRecommendations(rawPlan, selectedRide, currency),
      mart: mapMartRecommendations(rawPlan, selectedMart, currency)
    },
    orchestration: {
      combinedCostEstimate: {
        amount: typeof rawPlan?.budgeting?.selectedTotal?.amount === 'number'
          ? rawPlan.budgeting.selectedTotal.amount
          : typeof rawPlan?.budgeting?.selectedSubtotal?.amount === 'number'
            ? rawPlan.budgeting.selectedSubtotal.amount
            : null,
        currency
      },
      executionOrder: Array.isArray(rawPlan?.timingPlan?.steps)
        ? rawPlan.timingPlan.steps
            .map((step) => step?.serviceType && step?.action ? `${step.serviceType}.${step.action}` : null)
            .filter(Boolean)
        : [],
      notes: Array.isArray(rawPlan?.timingPlan?.synchronizationNotes) ? rawPlan.timingPlan.synchronizationNotes : []
    },
    uiHints: {
      highlightReasons: Array.isArray(rawPlan?.finalNarrative?.adjustments) ? rawPlan.finalNarrative.adjustments : [],
      fallbackMessage: rawPlan?.interpretation?.fallbackApplied ? (rawPlan?.interpretation?.fallbackReason || null) : null,
      processingSummary: [rawPlan?.finalNarrative?.summary].filter(Boolean)
    }
  };
}
