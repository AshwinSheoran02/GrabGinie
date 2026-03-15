import React from 'react';
import { CarIcon, FoodIcon, MartIcon } from './icons';

function pickIcon(category) {
  if (category === 'food') return <FoodIcon />;
  if (category === 'ride') return <CarIcon />;
  return <MartIcon />;
}

function formatPrice(value, currency) {
  if (typeof value !== 'number') {
    return '-';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export function SelectedServiceCard({ item }) {
  if (!item) {
    return null;
  }

  return (
    <div className={`result-card result-card-${item.category}`}>
      <div className="result-header">
        {pickIcon(item.category)}
        <div className="result-header-text">
          <div className="result-name">{item.title}</div>
          <div className="result-cuisine">{item.subtitle}</div>
        </div>
        <div className="result-price">{formatPrice(item.price, item.currency)}</div>
      </div>
      <div className="result-meta">
        <span>{item.etaLabel}</span>
      </div>
      <div className="result-tag">{item.rationale}</div>
    </div>
  );
}
