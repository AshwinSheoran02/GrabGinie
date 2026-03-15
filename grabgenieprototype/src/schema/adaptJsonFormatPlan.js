function pickFirstSelected(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  return entries.find((entry) => entry?.selected === true || entry?.enabled === true) || entries[0] || null;
}

function toMoney(price, fallbackCurrency = 'USD') {
  if (typeof price === 'number') {
    return { amount: price, currency: fallbackCurrency };
  }
  return {
    amount: typeof price?.amount === 'number' ? price.amount : null,
    currency: typeof price?.currency === 'string' && price.currency ? price.currency : fallbackCurrency
  };
}

function toLocationLabel(location, fallback) {
  if (typeof location === 'string' && location) {
    return location;
  }

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

  return ride.rideType || ride.vehicleClass || ride.label || null;
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
    providerName: selected.restaurant || null,
    itemName: selected.item || null,
    cuisine: null,
    quantity: typeof selected.quantity === 'number' ? selected.quantity : null,
    estimatedPrice: toMoney(selected.price, currency),
    etaMinutes: typeof selected.etaMinutes === 'number' ? selected.etaMinutes : null,
    rationale: null,
    tags: ['selected']
  };
}

function mapRideSelected(plan, currency) {
  const selected = pickFirstSelected(plan?.selectedPlan?.ride);
  const requested = plan?.servicesRequested?.ride;
  if (!selected && !requested) {
    return null;
  }

  const pickupLabel = toLocationLabel(selected?.pickup, null)
    || toLocationLabel(requested?.pickup, 'Current location');
  const destLabel = toLocationLabel(selected?.destination, null)
    || toLocationLabel(requested?.destination, 'Selected destination');

  return {
    category: 'ride',
    product: toRideProduct(selected) || requested?.ridePreferences?.vehicleClass || 'Ride',
    pickupLabel,
    dropoffLabel: destLabel,
    seats: typeof requested?.ridePreferences?.seatCount === 'number' ? requested.ridePreferences.seatCount : 4,
    estimatedFare: toMoney(selected?.price, currency),
    pickupEtaMinutes: typeof selected?.etaMinutes === 'number' ? selected.etaMinutes : null,
    scheduledAfterMinutes: typeof plan?.constraints?.time?.relativeDelayMinutes === 'number'
      ? plan.constraints.time.relativeDelayMinutes
      : null,
    rationale: null,
    tags: [
      requested?.ridePreferences?.premium ? 'premium' : null,
      requested?.ridePreferences?.fastest ? 'fast' : null,
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
    storeName: selected.store || null,
    itemSummary: null,
    items: Array.isArray(selected.items)
      ? selected.items.map((entry) => ({
          name: entry?.name || 'Item',
          qty: typeof entry?.quantity === 'number' ? entry.quantity : null,
          note: null
        }))
      : [],
    estimatedPrice: toMoney(selected.price, currency),
    etaMinutes: typeof selected.etaMinutes === 'number' ? selected.etaMinutes : null,
    rationale: null,
    tags: ['selected']
  };
}

function mapFoodRecommendations(plan, selectedFood, currency) {
  const entries = Array.isArray(plan?.recommendations?.food) ? plan.recommendations.food : [];
  return entries.map((entry, index) => {
    const amount = typeof entry?.price === 'number' ? entry.price
      : typeof entry?.price?.amount === 'number' ? entry.price.amount : null;
    const selectedAmount = selectedFood?.estimatedPrice?.amount;

    return {
      recommendationId: toRecommendationId('food', index),
      label: entry?.restaurant || entry?.item || 'Food alternative',
      deltaPrice: typeof amount === 'number' && typeof selectedAmount === 'number' ? amount - selectedAmount : null,
      reason: entry?.reason || 'Alternative food option.',
      payload: {
        category: 'food',
        providerName: entry?.restaurant || null,
        itemName: entry?.item || null,
        cuisine: null,
        quantity: selectedFood?.quantity || null,
        estimatedPrice: toMoney(entry?.price, currency),
        etaMinutes: typeof entry?.etaMinutes === 'number' ? entry.etaMinutes : null,
        rationale: entry?.reason || null,
        tags: ['recommended']
      }
    };
  });
}

function mapRideRecommendations(plan, selectedRide, currency) {
  const entries = Array.isArray(plan?.recommendations?.ride) ? plan.recommendations.ride : [];
  return entries.map((entry, index) => {
    const amount = typeof entry?.price === 'number' ? entry.price
      : typeof entry?.price?.amount === 'number' ? entry.price.amount : null;
    const selectedAmount = selectedRide?.estimatedFare?.amount;

    return {
      recommendationId: toRecommendationId('ride', index),
      label: entry?.rideType || entry?.vehicleClass || 'Ride alternative',
      deltaPrice: typeof amount === 'number' && typeof selectedAmount === 'number' ? amount - selectedAmount : null,
      reason: entry?.reason || 'Alternative ride option.',
      payload: {
        category: 'ride',
        product: entry?.rideType || entry?.vehicleClass || null,
        pickupLabel: selectedRide?.pickupLabel || 'Current location',
        dropoffLabel: selectedRide?.dropoffLabel || 'Selected destination',
        seats: selectedRide?.seats || 4,
        estimatedFare: toMoney(entry?.price, currency),
        pickupEtaMinutes: typeof entry?.etaMinutes === 'number' ? entry.etaMinutes : null,
        scheduledAfterMinutes: selectedRide?.scheduledAfterMinutes || null,
        rationale: entry?.reason || null,
        tags: ['recommended']
      }
    };
  });
}

function mapMartRecommendations(plan, selectedMart, currency) {
  const entries = Array.isArray(plan?.recommendations?.mart) ? plan.recommendations.mart : [];
  return entries.map((entry, index) => {
    const amount = typeof entry?.price === 'number' ? entry.price
      : typeof entry?.price?.amount === 'number' ? entry.price.amount : null;
    const selectedAmount = selectedMart?.estimatedPrice?.amount;

    return {
      recommendationId: toRecommendationId('mart', index),
      label: entry?.store || 'Mart alternative',
      deltaPrice: typeof amount === 'number' && typeof selectedAmount === 'number' ? amount - selectedAmount : null,
      reason: entry?.reason || 'Alternative mart option.',
      payload: {
        category: 'mart',
        storeName: entry?.store || null,
        itemSummary: null,
        items: Array.isArray(entry?.items)
          ? entry.items.map((item) => ({
              name: item?.name || 'Item',
              qty: typeof item?.quantity === 'number' ? item.quantity : null,
              note: null
            }))
          : [],
        estimatedPrice: toMoney(entry?.price, currency),
        etaMinutes: typeof entry?.etaMinutes === 'number' ? entry.etaMinutes : null,
        rationale: entry?.reason || null,
        tags: ['recommended']
      }
    };
  });
}

export function adaptJsonFormatPlan(rawPlan, originalText) {
  const currency = rawPlan?.constraints?.budget?.currency || 'USD';

  const selectedFood = mapFoodSelected(rawPlan, currency);
  const selectedRide = mapRideSelected(rawPlan, currency);
  const selectedMart = mapMartSelected(rawPlan, currency);

  const normalizedText = rawPlan?.meta?.normalizedInput || originalText;
  const rawInputText = rawPlan?.meta?.rawInput || originalText;

  return {
    schemaVersion: '1.0.0',
    requestMeta: {
      requestId: rawPlan?.meta?.requestId || null,
      source: rawPlan?.meta?.inputMode || 'text',
      originalText: typeof rawInputText === 'string' ? rawInputText : originalText,
      normalizedText,
      language: rawPlan?.meta?.language || 'en',
      createdAtIso: rawPlan?.meta?.timestamp || new Date().toISOString()
    },
    interpretation: {
      intents: [
        rawPlan?.servicesRequested?.food?.enabled ? 'food' : null,
        rawPlan?.servicesRequested?.ride?.enabled ? 'ride' : null,
        rawPlan?.servicesRequested?.mart?.enabled ? 'mart' : null
      ].filter(Boolean),
      constraints: {
        budget: {
          amount: typeof rawPlan?.constraints?.budget?.amount === 'number'
            ? rawPlan.constraints.budget.amount
            : null,
          currency
        },
        partySize: typeof rawPlan?.intent?.peopleCount === 'number' ? rawPlan.intent.peopleCount : null,
        dietaryNotes: [],
        accessibilityNeeds: [],
        urgency: rawPlan?.intent?.urgency || rawPlan?.intent?.priorityLevel || null,
        deliveryLocation: {
          label: typeof rawPlan?.servicesRequested?.food?.delivery?.destination === 'string'
            ? rawPlan.servicesRequested.food.delivery.destination
            : toLocationLabel(rawPlan?.servicesRequested?.food?.delivery?.destination, null),
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
          requestedAtIso: rawPlan?.meta?.timestamp || null,
          executeAfterMinutes: typeof rawPlan?.constraints?.time?.relativeDelayMinutes === 'number'
            ? rawPlan.constraints.time.relativeDelayMinutes
            : null,
          deadlineIso: rawPlan?.constraints?.time?.deadline || null,
          flexibility: rawPlan?.constraints?.time?.mode || null
        }
      },
      confidence: {
        overall: typeof rawPlan?.intent?.confidence === 'number' ? rawPlan.intent.confidence : null,
        byService: { food: null, ride: null, mart: null },
        explanation: Array.isArray(rawPlan?.interpretation?.notes) ? rawPlan.interpretation.notes.join(' ') : null
      },
      clarificationsNeeded: Array.isArray(rawPlan?.interpretation?.ambiguities) ? rawPlan.interpretation.ambiguities : []
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
        amount: null,
        currency
      },
      executionOrder: Array.isArray(rawPlan?.orchestration?.steps)
        ? rawPlan.orchestration.steps
            .map((step) => step?.service && step?.action ? `${step.service}.${step.action}` : null)
            .filter(Boolean)
        : [],
      notes: Array.isArray(rawPlan?.interpretation?.notes) ? rawPlan.interpretation.notes : []
    },
    uiHints: {
      highlightReasons: [],
      fallbackMessage: null,
      processingSummary: Array.isArray(rawPlan?.interpretation?.notes) ? rawPlan.interpretation.notes : []
    }
  };
}
