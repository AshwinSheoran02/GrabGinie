import { useMemo, useRef, useState } from 'react';
import { extractIntentSchemaFromText } from '../services/ai/extractIntentSchemaFromText';
import { buildSelectedViewModels, buildRecommendationViewModels, calculateTotal } from '../serviceEngines';
import { createEmptyPlan, normalizePlan } from '../schema/planSchema';
import { getAiConfig, hasAiProvider } from '../services/ai/aiConfig';
import { createTranscriptionSession, isSpeechToTextSupported } from '../services/audio/transcribeAudio';

const SCREEN = {
  HOME: 'home',
  INTRO: 'intro',
  ASSISTANT: 'assistant',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  RESULTS: 'results',
  CONFIRMATION: 'confirmation'
};

function normalizeVoiceTranscript(rawText) {
  let text = (rawText || '').trim();

  // Common STT confusion for ride requests: "all right" or "alright".
  text = text.replace(/\b(all right|alright|a right)\b(?=\s+(to|home|airport|station|office|mall|hotel|back|now|later)\b)/gi, 'a ride');
  text = text.replace(/\b(book|need|get|call)\s+me\s+all\s+ride\b/gi, '$1 me a ride');
  text = text.replace(/\bfor\s+me\s+to\s+(home|airport|station|office|mall|hotel)\b/gi, 'for me a ride to $1');

  return text.replace(/\s{2,}/g, ' ').trim();
}

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
  const aiConfig = useMemo(() => getAiConfig(), []);
  const audioSessionRef = useRef(null);
  const transcriptRef = useRef('');

  const [screen, setScreen] = useState(SCREEN.HOME);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasOrdered, setHasOrdered] = useState(false);
  const [activity, setActivity] = useState([]);
  const [plan, setPlan] = useState(createEmptyPlan(''));
  const [extractMeta, setExtractMeta] = useState({ source: 'none', provider: 'none', warning: null });
  const [audioTranscript, setAudioTranscript] = useState('');
  const [audioError, setAudioError] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isStoppingAudio, setIsStoppingAudio] = useState(false);

  const selectedView = useMemo(() => buildSelectedViewModels(plan.selectedServices), [plan]);
  const recommendationView = useMemo(() => buildRecommendationViewModels(plan.recommendations), [plan]);
  const total = useMemo(() => calculateTotal(plan.selectedServices), [plan]);

  const startFlow = () => setScreen(SCREEN.INTRO);

  const startAssistant = () => setScreen(SCREEN.ASSISTANT);

  const backHome = () => setScreen(SCREEN.HOME);

  const backToAssistant = () => setScreen(SCREEN.ASSISTANT);

  const startListening = () => {
    if (audioSessionRef.current) {
      audioSessionRef.current.cancel();
      audioSessionRef.current = null;
    }

    setAudioError(null);
    setAudioTranscript('');
    transcriptRef.current = '';
    setScreen(SCREEN.LISTENING);

    if (!isSpeechToTextSupported()) {
      setAudioError('Speech-to-text is not available in this browser. Please type your request.');
      return;
    }

    try {
      const session = createTranscriptionSession({
        language: 'en-US',
        onTranscript: (text) => {
          transcriptRef.current = text;
          setAudioTranscript(text);
        },
        onError: (message) => setAudioError(message)
      });

      if (!session) {
        setAudioError('Speech-to-text is not available in this browser. Please type your request.');
        return;
      }

      audioSessionRef.current = session;
      session.start();
      setIsRecordingAudio(true);
    } catch (error) {
      setAudioError(error.message || 'Unable to start microphone capture.');
      setIsRecordingAudio(false);
    }
  };

  const processRequest = async (text) => {
    const startedAt = Date.now();

    const result = await extractIntentSchemaFromText(text);

    const elapsed = Date.now() - startedAt;
    const minimumProcessingMs = 950;
    if (elapsed < minimumProcessingMs) {
      await new Promise((resolve) => {
        setTimeout(resolve, minimumProcessingMs - elapsed);
      });
    }

    setPlan(result.plan);
    setExtractMeta(result.meta);
    setIsProcessing(false);
    setScreen(SCREEN.RESULTS);
  };

  const submitText = async (overrideText) => {
    const text = (overrideText ?? inputText).trim();
    if (!text) {
      return;
    }

    setIsProcessing(true);
    setScreen(SCREEN.PROCESSING);
    await processRequest(text);
  };

  const stopListeningAndSubmit = async () => {
    if (isStoppingAudio) {
      return;
    }

    const session = audioSessionRef.current;

    if (!session) {
      setScreen(SCREEN.ASSISTANT);
      return;
    }

    setIsStoppingAudio(true);
    setIsRecordingAudio(false);

    // Move to processing immediately on second mic tap for clear flow feedback.
    setIsProcessing(true);
    setScreen(SCREEN.PROCESSING);

    let spokenText = '';
    try {
      const stopResult = await Promise.race([
        session.stop(),
        new Promise((resolve) => {
          setTimeout(() => resolve(''), 900);
        })
      ]);
      spokenText = typeof stopResult === 'string' ? stopResult : '';
    } catch (error) {
      setAudioError(error.message || 'Unable to complete transcription.');
      setIsProcessing(false);
      setScreen(SCREEN.ASSISTANT);
      audioSessionRef.current = null;
      setIsStoppingAudio(false);
      return;
    }

    audioSessionRef.current = null;

    const finalText = normalizeVoiceTranscript(spokenText || transcriptRef.current || audioTranscript || '');

    if (!finalText) {
      setAudioError('No speech detected. Tap voice mode and try again.');
      setIsProcessing(false);
      setScreen(SCREEN.ASSISTANT);
      setIsStoppingAudio(false);
      return;
    }

    setInputText(finalText);
    try {
      await processRequest(finalText);
    } finally {
      setIsStoppingAudio(false);
    }
  };

  const cancelListening = () => {
    if (audioSessionRef.current) {
      audioSessionRef.current.cancel();
      audioSessionRef.current = null;
    }

    setIsRecordingAudio(false);
    setIsStoppingAudio(false);
    setScreen(SCREEN.ASSISTANT);
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
    aiConfig,
    aiEnabled: hasAiProvider(aiConfig),
    selectedView,
    recommendationView,
    total,
    audioTranscript,
    audioError,
    isRecordingAudio,
    isStoppingAudio,
    startFlow,
    startAssistant,
    backHome,
    backToAssistant,
    startListening,
    stopListeningAndSubmit,
    cancelListening,
    submitText,
    replaceSelection,
    confirmPlan,
    finishConfirmation
  };
}
