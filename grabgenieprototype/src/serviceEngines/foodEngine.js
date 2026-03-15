export function buildFoodViewModel(foodSelection) {
  if (!foodSelection) {
    return null;
  }

  return {
    category: 'food',
    title: foodSelection.itemName || 'Food recommendation',
    subtitle: [foodSelection.providerName, foodSelection.cuisine].filter(Boolean).join(' · ') || 'Food delivery',
    price: foodSelection.estimatedPrice?.amount,
    currency: foodSelection.estimatedPrice?.currency || 'USD',
    etaLabel: typeof foodSelection.etaMinutes === 'number' ? `ETA ${foodSelection.etaMinutes} min` : 'ETA unavailable',
    rationale: foodSelection.rationale || 'Matched to your intent.',
    tags: Array.isArray(foodSelection.tags) ? foodSelection.tags : []
  };
}
