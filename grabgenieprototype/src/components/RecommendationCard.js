import React from 'react';

function formatDelta(delta) {
  if (typeof delta !== 'number') {
    return 'Price change N/A';
  }

  return delta >= 0 ? `+${delta}` : `${delta}`;
}

export function RecommendationCard({ category, recommendation, onReplace }) {
  return (
    <div className={`alt-card alt-card-${category}`}>
      <div className="alt-card-info">
        <div className="alt-card-name">{recommendation.displayLabel}</div>
        <div className="alt-card-sub">{recommendation.reason}</div>
      </div>
      <span className="alt-card-price">{formatDelta(recommendation.deltaPrice)}</span>
      <button className="alt-btn" onClick={() => onReplace(category, recommendation.recommendationId)}>
        Replace
      </button>
    </div>
  );
}
