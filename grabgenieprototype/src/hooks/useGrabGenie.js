import { useMemo, useState } from 'react';
import { extractIntentSchemaFromText } from '../services/ai/extractIntentSchemaFromText';
import { buildSelectedViewModels, buildRecommendationViewModels, calculateTotal } from '../serviceEngines';
import { createEmptyPlan, normalizePlan } from '../schema/planSchema';

const SCREEN = {
  HOME: 'home',
  INTRO: 'intro',
  ASSISTANT: 'assistant',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  RESULTS: 'results',
  CONFIRMATION: 'confirmation'
};

function applyReplacement(plan, category, recommendationId) {
  const recommendation = (plan.recommendations?.[category] || []).find((entry) => entry.recommendationId === recommendationId);

  if (!recommendation?.payload) {
    return plan;
  }

  const next = {
    ...plan,
    selectedServices: {
      ...plan.selectedServices,
      [category]: recommendation.payload
    },
    recommendations: {
      ...plan.recommendations,
      [category]: (plan.recommendations?.[category] || []).map((entry) =>
        entry.recommendationId === recommendationId
          ? {
              ...entry,
              payload: plan.selectedServices?.[category] || entry.payload,
              label: (plan.selectedServices?.[category]?.itemName
                || plan.selectedServices?.[category]?.product
                || plan.selectedServices?.[category]?.storeName
                || entry.label),
              reason: 'Swapped from selected card.'
            }
          : entry
      )
    }
  };

  return normalizePlan(next, plan.requestMeta.originalText);
}

export function useGrabGenie() {
  const [screen, setScreen] = useState(SCREEN.HOME);
  const [inputText, setInputText] = useState('Chinese dinner for four under $30 and a ride home after one hour.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasOrdered, setHasOrdered] = useState(false);
  const [activity, setActivity] = useState([]);
  const [plan, setPlan] = useState(createEmptyPlan(''));
  const [extractMeta, setExtractMeta] = useState({ source: 'none', provider: 'none', warning: null });

  const selectedView = useMemo(() => buildSelectedViewModels(plan.selectedServices), [plan]);
  const recommendationView = useMemo(() => buildRecommendationViewModels(plan.recommendations), [plan]);
  const total = useMemo(() => calculateTotal(plan.selectedServices), [plan]);

  const startFlow = () => setScreen(SCREEN.INTRO);

  const startAssistant = () => setScreen(SCREEN.ASSISTANT);

  const backHome = () => setScreen(SCREEN.HOME);

  const backToAssistant = () => setScreen(SCREEN.ASSISTANT);

  const startListening = () => setScreen(SCREEN.LISTENING);

  const submitText = async (overrideText) => {
    const text = (overrideText ?? inputText).trim();
    if (!text) {
      return;
    }

    setIsProcessing(true);
    setScreen(SCREEN.PROCESSING);

    const result = await extractIntentSchemaFromText(text);

    setPlan(result.plan);
    setExtractMeta(result.meta);
    setIsProcessing(false);
    setScreen(SCREEN.RESULTS);
  };

  const replaceSelection = (category, recommendationId) => {
    setPlan((current) => applyReplacement(current, category, recommendationId));
  };

  const confirmPlan = () => {
    const summary = [];
    if (plan.selectedServices.food) {
      summary.push({
        category: 'food',
        title: plan.selectedServices.food.itemName || 'Food order',
        detail: plan.selectedServices.food.providerName || 'Food delivery'
      });
    }

    if (plan.selectedServices.ride) {
      summary.push({
        category: 'ride',
        title: plan.selectedServices.ride.product || 'Ride booked',
        detail: plan.selectedServices.ride.dropoffLabel || 'Ride destination'
      });
    }

    if (plan.selectedServices.mart) {
      summary.push({
        category: 'mart',
        title: plan.selectedServices.mart.storeName || 'Mart order',
        detail: plan.selectedServices.mart.itemSummary || 'General item ordering'
      });
    }

    setActivity((current) => [
      {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        items: summary
      },
      ...current
    ]);

    setHasOrdered(true);
    setScreen(SCREEN.CONFIRMATION);
  };

  const finishConfirmation = () => {
    setScreen(SCREEN.HOME);
  };

  return {
    screen,
    screens: SCREEN,
    inputText,
    setInputText,
    isProcessing,
    hasOrdered,
    activity,
    plan,
    extractMeta,
    selectedView,
    recommendationView,
    total,
    startFlow,
    startAssistant,
    backHome,
    backToAssistant,
    startListening,
    submitText,
    replaceSelection,
    confirmPlan,
    finishConfirmation
  };
}
