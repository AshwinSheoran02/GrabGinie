import React from 'react';

const PROMPTS = [
  'Chinese dinner for four under $30 and a ride home after one hour.',
  'Get groceries: milk, bananas, and cereal, then book me a ride to office by 9am.',
  'Ice cream delivered to my condo and a budget ride in 45 minutes.',
  'Dinner for two with vegetarian options and pickup ride after the meal.'
];

export function SamplePromptChips({ onPickPrompt }) {
  return (
    <div className="sample-chips">
      {PROMPTS.map((prompt) => (
        <button key={prompt} className="sample-chip" onClick={() => onPickPrompt(prompt)}>
          {prompt}
        </button>
      ))}
    </div>
  );
}
