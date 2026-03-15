async function requestWithModel({ apiKey, model, systemInstruction, userPrompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(`Gemini request failed: ${message}`);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini did not return text output.');
  }

  return text;
}

export async function runGeminiExtraction({ apiKey, model, systemInstruction, userPrompt }) {
  const candidates = Array.from(new Set([
    model,
    'gemini-2.5-flash'
  ].filter(Boolean)));

  let lastError = null;

  for (const candidate of candidates) {
    try {
      return await requestWithModel({
        apiKey,
        model: candidate,
        systemInstruction,
        userPrompt
      });
    } catch (error) {
      lastError = error;

      // Continue trying fallback models for not found or model support errors.
      if (error?.status === 404 || /not found|not supported/i.test(error?.message || '')) {
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Gemini request failed for all configured fallback models.');
}
