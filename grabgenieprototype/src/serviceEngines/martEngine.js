export function buildMartViewModel(martSelection) {
  if (!martSelection) {
    return null;
  }

  return {
    category: 'mart',
    title: martSelection.storeName || 'Mart delivery',
    subtitle: martSelection.itemSummary || 'General item ordering',
    price: martSelection.estimatedPrice?.amount,
    currency: martSelection.estimatedPrice?.currency || 'USD',
    etaLabel: typeof martSelection.etaMinutes === 'number' ? `ETA ${martSelection.etaMinutes} min` : 'ETA unavailable',
    rationale: martSelection.rationale || 'Built from your item needs.',
    tags: Array.isArray(martSelection.tags) ? martSelection.tags : []
  };
}
