function getSpeechRecognition() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechToTextSupported() {
  return Boolean(getSpeechRecognition());
}

export function createTranscriptionSession({ language = 'en-US', onTranscript, onError } = {}) {
  const SpeechRecognition = getSpeechRecognition();

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let isActive = false;
  let finalizedParts = [];
  let latestText = '';
  let settleStop = null;
  let settleStopError = null;
  let stopTimeoutId = null;

  const clearStopSettlement = () => {
    if (stopTimeoutId) {
      clearTimeout(stopTimeoutId);
      stopTimeoutId = null;
    }

    settleStop = null;
    settleStopError = null;
  };

  const rebuildTranscript = (interimText = '') => {
    latestText = [...finalizedParts, interimText].join(' ').trim();
    if (onTranscript) {
      onTranscript(latestText);
    }
  };

  recognition.onresult = (event) => {
    let interim = '';

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const value = result[0]?.transcript?.trim() || '';

      if (!value) {
        continue;
      }

      if (result.isFinal) {
        finalizedParts.push(value);
      } else {
        interim = `${interim} ${value}`.trim();
      }
    }

    rebuildTranscript(interim);
  };

  recognition.onerror = (event) => {
    isActive = false;
    const message = event?.error ? `Speech recognition error: ${event.error}` : 'Speech recognition failed.';

    if (onError) {
      onError(message);
    }

    if (settleStopError) {
      settleStopError(new Error(message));
      clearStopSettlement();
    }
  };

  recognition.onend = () => {
    isActive = false;
    rebuildTranscript();

    if (settleStop) {
      settleStop(latestText.trim());
      clearStopSettlement();
    }
  };

  return {
    start() {
      finalizedParts = [];
      latestText = '';
      isActive = true;
      recognition.start();
    },
    stop() {
      if (!isActive) {
        return Promise.resolve(latestText.trim());
      }

      return new Promise((resolve, reject) => {
        settleStop = resolve;
        settleStopError = reject;
        recognition.stop();

        // Some browsers occasionally miss onend; resolve with latest transcript.
        stopTimeoutId = setTimeout(() => {
          if (settleStop) {
            settleStop(latestText.trim());
            clearStopSettlement();
          }
        }, 1400);
      });
    },
    cancel() {
      if (!isActive) {
        return;
      }

      isActive = false;
      recognition.abort();
    }
  };
}
