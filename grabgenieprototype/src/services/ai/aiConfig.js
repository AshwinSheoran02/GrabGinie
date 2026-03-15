export function getAiConfig() {
  return {
    provider: (process.env.REACT_APP_AI_PROVIDER || 'none').toLowerCase(),
    geminiApiKey: process.env.REACT_APP_GEMINI_API_KEY || '',
    openAiApiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
    geminiModel: process.env.REACT_APP_GEMINI_MODEL || 'gemini-1.5-flash',
    openAiModel: process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini'
  };
}

export function hasAiProvider(config) {
  if (config.provider === 'gemini') {
    return Boolean(config.geminiApiKey);
  }

  if (config.provider === 'openai') {
    return Boolean(config.openAiApiKey);
  }

  return false;
}
