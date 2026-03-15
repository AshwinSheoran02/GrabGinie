import { buildFoodViewModel } from './foodEngine';
import { buildRideViewModel } from './rideEngine';
import { buildMartViewModel } from './martEngine';

export function buildSelectedViewModels(selectedServices) {
  return {
    food: buildFoodViewModel(selectedServices.food),
    ride: buildRideViewModel(selectedServices.ride),
    mart: buildMartViewModel(selectedServices.mart)
  };
}

export function buildRecommendationViewModels(recommendations) {
  const mapRecommendation = (category, recommendation) => ({
    ...recommendation,
    category,
    displayLabel: recommendation.label,
    deltaLabel: typeof recommendation.deltaPrice === 'number'
      ? `${recommendation.deltaPrice > 0 ? '+' : ''}${recommendation.deltaPrice}`
      : null
  });

  return {
    food: (recommendations.food || []).map((entry) => mapRecommendation('food', entry)),
    ride: (recommendations.ride || []).map((entry) => mapRecommendation('ride', entry)),
    mart: (recommendations.mart || []).map((entry) => mapRecommendation('mart', entry))
  };
}

export function calculateTotal(selectedServices) {
  const amount = [
    selectedServices.food?.estimatedPrice?.amount,
    selectedServices.ride?.estimatedFare?.amount,
    selectedServices.mart?.estimatedPrice?.amount
  ]
    .filter((value) => typeof value === 'number')
    .reduce((sum, value) => sum + value, 0);

  const currency = selectedServices.food?.estimatedPrice?.currency
    || selectedServices.ride?.estimatedFare?.currency
    || selectedServices.mart?.estimatedPrice?.currency
    || 'USD';

  return {
    amount: amount || null,
    currency
  };
}
