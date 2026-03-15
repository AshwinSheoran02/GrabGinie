export function buildRideViewModel(rideSelection) {
  if (!rideSelection) {
    return null;
  }

  const scheduleText = typeof rideSelection.scheduledAfterMinutes === 'number'
    ? `Scheduled in ${rideSelection.scheduledAfterMinutes} min`
    : typeof rideSelection.pickupEtaMinutes === 'number'
      ? `Pickup in ${rideSelection.pickupEtaMinutes} min`
      : 'Pickup ETA unavailable';

  return {
    category: 'ride',
    title: rideSelection.product || 'Ride option',
    subtitle: [rideSelection.pickupLabel, rideSelection.dropoffLabel].filter(Boolean).join(' -> ') || 'Ride booking',
    price: rideSelection.estimatedFare?.amount,
    currency: rideSelection.estimatedFare?.currency || 'USD',
    etaLabel: scheduleText,
    rationale: rideSelection.rationale || 'Matched to your trip request.',
    tags: Array.isArray(rideSelection.tags) ? rideSelection.tags : []
  };
}
