import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

/* ─── SVG Icon Components ─── */

const CarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00B14F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17a2 2 0 100 4 2 2 0 000-4zm14 0a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);

const FoodIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00B14F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
  </svg>
);

const DeliveryIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00B14F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const MicIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="1" width="6" height="11" rx="3" />
    <path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#00B14F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" fill="#00B14F22" stroke="#00B14F" />
    <path d="M9 12l2 2 4-4" stroke="#00B14F" strokeWidth="2.5" />
  </svg>
);

const BackArrow = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800" stroke="#FFB800" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);


/* ═══════════════════════════════════════════
   SCREEN 1 — Home
   ═══════════════════════════════════════════ */
function HomeScreen({ onGenieClick, hasOrdered }) {
  return (
    <div className="screen home-screen">
      {/* Header */}
      <div className="home-header">
        <div>
          <div className="home-greeting">Good evening,</div>
          <div className="home-name">Ashwin</div>
        </div>
        <div className="avatar">A</div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <SearchIcon />
        <span className="search-placeholder">Where are you going?</span>
      </div>

      {/* Service Cards */}
      <div className="service-cards">
        {[
          { icon: <CarIcon />, label: 'Ride', cat: 'ride' },
          { icon: <FoodIcon />, label: 'Food', cat: 'food' },
          { icon: <DeliveryIcon />, label: 'Delivery', cat: 'delivery' },
        ].map((s) => (
          <div className={`service-card service-card-${s.cat}`} key={s.label}>
            <div className="service-icon">{s.icon}</div>
            <div className="service-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity — only shown after an order is placed */}
      {hasOrdered && (
        <>
          <div className="section-title">Recent Activity</div>
          <div className="activity-card activity-card-food">
            <div className="activity-row">
              <ClockIcon />
              <div className="activity-text">
                <div className="activity-title">Dragon Noodles — Chinese</div>
                <div className="activity-sub">Just now · $27.00</div>
              </div>
            </div>
          </div>
          <div className="activity-card activity-card-ride">
            <div className="activity-row">
              <ClockIcon />
              <div className="activity-text">
                <div className="activity-title">GrabCar to Home</div>
                <div className="activity-sub">Scheduled · 60 min</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Promo Banner */}
      <div className="promo-banner">
        <div className="promo-text">
          <div className="promo-title">Try Grab Genie</div>
          <div className="promo-sub">Your AI assistant — book rides &amp; order food in one sentence.</div>
        </div>
        <SparkleIcon />
      </div>

      {/* FAB */}
      <button className="fab" onClick={onGenieClick}>
        <SparkleIcon />
      </button>
    </div>
  );
}


/* ═══════════════════════════════════════════
   SCREEN 2 — Intro Modal
   ═══════════════════════════════════════════ */
function IntroModal({ onStart }) {
  return (
    <div className="screen intro-screen">
      <div className="intro-backdrop" />
      <div className="intro-modal">
        <div className="intro-sparkle-ring">
          <SparkleIcon />
        </div>
        <h1 className="intro-title">Grab Genie</h1>
        <p className="intro-tagline">Say it once. Grab handles the rest.</p>
        <p className="intro-desc">
          Order food, book rides, and schedule deliveries — all with a single voice command.
        </p>
        <button className="btn-primary" onClick={onStart}>
          Get Started
        </button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   SCREEN 3 — Assistant (idle)
   ═══════════════════════════════════════════ */
function AssistantScreen({ onMicClick, onBack }) {
  return (
    <div className="screen assistant-screen">
      <div className="title-bar">
        <button className="icon-btn" onClick={onBack}><BackArrow /></button>
        <span className="title-bar-text">Grab Genie</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="chat-area">
        <div className="chat-bubble bot">
          <div className="bubble-avatar"><SparkleIcon /></div>
          <div className="bubble-text">
            Hi! I'm Grab Genie. What can I help you with today?
          </div>
        </div>
      </div>

      <div className="mic-area">
        <p className="mic-hint">Tap to speak</p>
        <button className="mic-btn" onClick={onMicClick}>
          <MicIcon size={36} />
        </button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   SCREEN 4 — Listening
   ═══════════════════════════════════════════ */
function ListeningScreen({ onDone }) {
  const fullText = 'Chinese dinner for four under $30 and ride home after one hour.';
  const [displayed, setDisplayed] = useState('');

  // 5 seconds total. Typing ~63 chars over ~3.8 seconds = ~60ms per char. 
  // Then hold for ~1.2s before advancing.
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(id);
        setTimeout(onDone, 1220);
      }
    }, 60);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div className="screen listening-screen">
      <div className="title-bar">
        <div style={{ width: 36 }} />
        <span className="title-bar-text">Listening...</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="listening-body">
        <div className="pulse-ring">
          <div className="pulse-circle" />
          <div className="pulse-circle delay" />
          <button className="mic-btn listening-mic">
            <MicIcon size={36} />
          </button>
        </div>
        <div className="transcript">
          {displayed}<span className="cursor">|</span>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   SCREEN 5 — Processing
   ═══════════════════════════════════════════ */
function ProcessingScreen({ onDone }) {
  // 5 seconds duration for narrator to explain AI intent parsing
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="screen processing-screen">
      <div className="title-bar">
        <div style={{ width: 36 }} />
        <span className="title-bar-text">Understanding your request...</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="processing-body">
        <div className="spinner" />
        <div className="summary-cards">
          <div className="summary-card summary-card-food fade-in-up">
            <div className="summary-badge food">Food Order</div>
            <div className="summary-detail">Chinese cuisine</div>
            <div className="summary-detail">Budget: $30</div>
            <div className="summary-detail">Guests: 4</div>
          </div>
          <div className="summary-card summary-card-ride fade-in-up delay-card">
            <div className="summary-badge ride">Ride Booking</div>
            <div className="summary-detail">Destination: Home</div>
            <div className="summary-detail">Pickup in 60 minutes</div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   SCREEN 6 — Results
   ═══════════════════════════════════════════ */
const FOOD_OPTIONS = {
  default: { name: 'Dragon Noodles', sub: 'Chinese cuisine', price: 27, eta: '🕐 ETA 30 min', rating: '4.8', tag: 'Best match for your budget' },
  alt:     { name: 'Mango Ice Cream', sub: 'Cool Scoops',    price: 6,  eta: '🕐 ETA 20 min', rating: '4.6', tag: 'Budget pick' },
};
const RIDE_OPTIONS = {
  default: { name: 'GrabCar',      sub: 'Sedan · 4 seats',   price: 8,  eta: '🕐 Pickup in 60 min', tag: 'Scheduled ride' },
  alt:     { name: 'Priority Ride', sub: 'Premium · 4 seats', price: 12, eta: '🚀 Pickup in 2 min',  tag: 'Fastest option' },
};

function ResultsScreen({ onConfirm, onBack }) {
  const [showAlts, setShowAlts]   = useState(false);
  const [foodKey, setFoodKey]     = useState('default');
  const [rideKey, setRideKey]     = useState('default');

  useEffect(() => {
    const t = setTimeout(() => setShowAlts(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const food  = FOOD_OPTIONS[foodKey];
  const ride  = RIDE_OPTIONS[rideKey];
  const total = (food.price + ride.price).toFixed(2);

  return (
    <div className="screen results-screen">
      <div className="title-bar">
        <button className="icon-btn" onClick={onBack}><BackArrow /></button>
        <span className="title-bar-text">Here's what I found</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="results-body">
        <div className="results-section-label">Selected for you</div>

        {/* Food result */}
        <div className="result-card result-card-food">
          <div className="result-header">
            <FoodIcon />
            <div className="result-header-text">
              <div className="result-name">{food.name}</div>
              <div className="result-cuisine">{food.sub}</div>
            </div>
            <div className="result-price">${food.price}</div>
          </div>
          <div className="result-meta">
            <span className="result-eta">{food.eta}</span>
            <span className="result-rating"><StarIcon /> {food.rating}</span>
          </div>
          <div className="result-tag">{food.tag}</div>
        </div>

        {/* Ride result */}
        <div className="result-card result-card-ride">
          <div className="result-header">
            <CarIcon />
            <div className="result-header-text">
              <div className="result-name">{ride.name}</div>
              <div className="result-cuisine">{ride.sub}</div>
            </div>
            <div className="result-price">${ride.price}</div>
          </div>
          <div className="result-meta">
            <span className="result-eta">{ride.eta}</span>
            <span className="result-rating">Destination: Home</span>
          </div>
          <div className="result-tag ride-tag">{ride.tag}</div>
        </div>

        <div className="result-summary-bar">
          <span>Total</span>
          <span className="result-total">${total}</span>
        </div>

        {/* Recommended Alternatives */}
        {showAlts && (
          <div className="recs-section fade-in-up">
            <div className="results-section-label recs-label">✦ Recommended Alternatives</div>

            {foodKey === 'default' && (
              <div className="alt-card alt-card-food">
                <div className="alt-card-info">
                  <div className="alt-card-name">{FOOD_OPTIONS.alt.name}</div>
                  <div className="alt-card-sub">{FOOD_OPTIONS.alt.sub} · {FOOD_OPTIONS.alt.eta}</div>
                </div>
                <span className="alt-card-price">${FOOD_OPTIONS.alt.price}</span>
                <button className="alt-btn" onClick={() => setFoodKey('alt')}>Replace</button>
              </div>
            )}

            {rideKey === 'default' && (
              <div className="alt-card alt-card-ride">
                <div className="alt-card-info">
                  <div className="alt-card-name">{RIDE_OPTIONS.alt.name}</div>
                  <div className="alt-card-sub">{RIDE_OPTIONS.alt.sub} · {RIDE_OPTIONS.alt.eta}</div>
                </div>
                <span className="alt-card-price">${RIDE_OPTIONS.alt.price}</span>
                <button className="alt-btn" onClick={() => setRideKey('alt')}>Replace</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bottom-action">
        <button className="btn-primary full-width" onClick={onConfirm}>
          Confirm All
        </button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   SCREEN 7 — Confirmation
   ═══════════════════════════════════════════ */
function ConfirmationScreen({ onDone }) {
  return (
    <div className="screen confirmation-screen">
      <div className="confirmation-body">
        <div className="check-pop">
          <CheckCircleIcon />
        </div>
        <h1 className="confirm-title">All set!</h1>
        <div className="confirm-items">
          <div className="confirm-item confirm-item-food">
            <span className="confirm-dot food-dot" />
            Food order placed — Mango Ice Cream
          </div>
          <div className="confirm-item confirm-item-ride">
            <span className="confirm-dot ride-dot" />
            Ride scheduled — GrabCar in 60 min
          </div>
        </div>
        <button className="btn-primary" onClick={onDone} style={{ marginTop: 32 }}>
          Back to Home
        </button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   VIRTUAL CURSOR
   ═══════════════════════════════════════════ */
function VirtualCursor({ x, y, clicking, visible }) {
  if (!visible) return null;
  return (
    <div
      className={`virtual-cursor ${clicking ? 'vc-click' : ''}`}
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 3l14 8-6 2-3 6z" fill="#1a1a2e" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      {clicking && <div className="vc-ripple" />}
    </div>
  );
}


/* ═══════════════════════════════════════════
   DEMO TIMELINE CONFIG
   All times in milliseconds.
   Cursor x/y = pixel position inside the
   375×812 phone frame viewport.
   ═══════════════════════════════════════════ */

/*
   DEMO_STEPS use CSS selectors for targeting.
   Positions are resolved at runtime via getBoundingClientRect()
   relative to the phone-frame ref.
   shape: 'circle' | 'rect' — controls spotlight cutout shape.
*/

const DEMO_STEPS = [
  // ── Home establishing shot (0–4s) ──
  { at: 0,     action: 'screen',  value: 'home' },
  { at: 600,   action: 'zoom',    value: 1.06 },
  { at: 1000,  action: 'spot',    target: '.fab', shape: 'circle', pad: 12 },
  { at: 2500,  action: 'move',    target: '.fab' },
  { at: 3500,  action: 'click' },
  { at: 3700,  action: 'unspot' },
  { at: 3700,  action: 'zoom',    value: 1.0 },
  { at: 4000,  action: 'screen',  value: 'intro' },

  // ── Intro modal (4–7s) ──
  { at: 4500,  action: 'spot',    target: '.btn-primary', shape: 'rect', pad: 12 },
  { at: 5000,  action: 'move',    target: '.btn-primary' },
  { at: 6500,  action: 'click' },
  { at: 6700,  action: 'unspot' },
  { at: 7000,  action: 'screen',  value: 'assistant' },

  // ── Assistant → mic (7–10s) ──
  { at: 7500, action: 'spot',    target: '.mic-btn', shape: 'circle', pad: 12 },
  { at: 8000, action: 'move',    target: '.mic-btn' },
  { at: 8500, action: 'zoom',    value: 1.05 },
  { at: 9500, action: 'click' },
  { at: 9700, action: 'unspot' },
  { at: 10000, action: 'screen',  value: 'listening' },

  // ── Listening (10–15s) + Processing (15–20s) ──
  { at: 10200, action: 'zoom',    value: 1.06 },
  { at: 10500, action: 'move',    target: 'idle' },
  { at: 15000, action: 'screen',  value: 'processing' },
  { at: 20000, action: 'screen',  value: 'results' },
  { at: 20000, action: 'zoom',    value: 1.0 },

  // ── Results (20–25s) ──
  // Recs fade in automatically at 21.5s
  { at: 21500, action: 'zoom',    value: 1.04 },
  { at: 23000, action: 'spot',    target: '.recs-section', shape: 'rect', pad: 10 },
  { at: 24500, action: 'move',    target: '.alt-card-food .alt-btn' },
  { at: 28500, action: 'click',   target: '.alt-card-food .alt-btn' }, // Clicks "Replace" to show Mango Ice Cream
  { at: 29300, action: 'unspot' },
  { at: 29500, action: 'zoom',    value: 1.06 },
  { at: 29700, action: 'spot',    target: '.bottom-action .btn-primary', shape: 'rect', pad: 12 },
  { at: 30000, action: 'move',    target: '.bottom-action .btn-primary' },
  { at: 31300, action: 'click' },
  { at: 31400, action: 'unspot' },
  { at: 31400, action: 'zoom',    value: 1.0 },
  { at: 31500, action: 'screen',  value: 'confirmation' },

  // ── Confirmation ──
  { at: 32700, action: 'spot',    target: '.confirmation-body .btn-primary', shape: 'rect', pad: 12 },
  { at: 33000, action: 'move',    target: '.confirmation-body .btn-primary' },
  { at: 34300, action: 'click' },
  { at: 34400, action: 'unspot' },
  { at: 34500, action: 'screen',  value: 'home-final' },

  // ── Home with recent activity ──
  { at: 34700, action: 'zoom',    value: 1.04 },
  { at: 35200, action: 'zoom',    value: 1.0 },
  { at: 35500, action: 'end' },
];


/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
const SCREENS = ['home', 'intro', 'assistant', 'listening', 'processing', 'results', 'confirmation'];

function App() {
  const [screen, setScreen] = useState('home');
  const [animate, setAnimate] = useState(true);
  const [hasOrdered, setHasOrdered] = useState(false);

  /* ── Demo state ── */
  const [demoActive, setDemoActive] = useState(false);
  const [demoEnded, setDemoEnded] = useState(false);
  const [cursorX, setCursorX] = useState(187);
  const [cursorY, setCursorY] = useState(400);
  const [cursorClicking, setCursorClicking] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [spotStyle, setSpotStyle] = useState(null);  // { x, y, r }
  const demoTimers = useRef([]);
  const phoneRef = useRef(null);

  const go = useCallback((s) => {
    setAnimate(false);
    requestAnimationFrame(() => {
      if (s === 'home-final') {
        setHasOrdered(true);
        setScreen('home');
      } else {
        setScreen(s);
      }
      setAnimate(true);
    });
  }, []);

  /* ── Start demo ── */
  const startDemo = useCallback(() => {
    demoTimers.current.forEach(clearTimeout);
    demoTimers.current = [];
    setScreen('home');
    setHasOrdered(false);
    setAnimate(true);
    setDemoActive(true);
    setDemoEnded(false);
    setZoomLevel(1.0);
    setSpotStyle(null);
    setCursorX(187);
    setCursorY(400);
    setCursorClicking(false);

    /* Resolve element bounds relative to 375×812 phone coordinate space */
    const getElBounds = (selector) => {
      const phone = phoneRef.current;
      if (!phone) return null;
      const el = phone.querySelector(selector);
      if (!el) return null;
      const phoneRect = phone.getBoundingClientRect();
      const scale = phoneRect.width / 375;
      const elRect = el.getBoundingClientRect();
      return {
        x: (elRect.left - phoneRect.left + elRect.width / 2) / scale,
        y: (elRect.top - phoneRect.top + elRect.height / 2) / scale,
        w: elRect.width / scale,
        h: elRect.height / scale,
      };
    };

    DEMO_STEPS.forEach((step) => {
      const t = setTimeout(() => {
        switch (step.action) {
          case 'screen':
            go(step.value);
            break;
          case 'zoom':
            setZoomLevel(step.value);
            break;
          case 'spot': {
            const b = step.target ? getElBounds(step.target) : null;
            if (b) {
              const pad = step.pad || 10;
              setSpotStyle({
                x: b.x, y: b.y,
                w: b.w + pad * 2, h: b.h + pad * 2,
                r: Math.max(b.w, b.h) / 2 + pad,
                shape: step.shape || 'circle',
              });
            }
            break;
          }
          case 'unspot':
            setSpotStyle(null);
            break;
          case 'move': {
            if (step.target === 'idle') {
              setCursorX(187);
              setCursorY(406);
            } else if (step.target) {
              const b = getElBounds(step.target);
              if (b) {
                setCursorX(b.x);
                setCursorY(b.y);
              }
            }
            break;
          }
          case 'click':
            setCursorClicking(true);
            if (step.target) {
              const el = phoneRef.current?.querySelector(step.target);
              if (el) el.click();
            }
            setTimeout(() => setCursorClicking(false), 250);
            break;
          case 'end':
            setDemoActive(false);
            setDemoEnded(true);
            break;
          default:
            break;
        }
      }, step.at);
      demoTimers.current.push(t);
    });
  }, [go]);

  useEffect(() => {
    return () => demoTimers.current.forEach(clearTimeout);
  }, []);

  const currentIndex = SCREENS.indexOf(screen);

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen onGenieClick={() => { if (!demoActive) go('intro'); }} hasOrdered={hasOrdered} />;
      case 'intro':
        return <IntroModal onStart={() => { if (!demoActive) go('assistant'); }} />;
      case 'assistant':
        return <AssistantScreen onMicClick={() => { if (!demoActive) go('listening'); }} onBack={() => { if (!demoActive) go('home'); }} />;
      case 'listening':
        return <ListeningScreen onDone={() => { if (!demoActive) go('processing'); }} />;
      case 'processing':
        return <ProcessingScreen onDone={() => { if (!demoActive) go('results'); }} />;
      case 'results':
        return <ResultsScreen onConfirm={() => { if (!demoActive) go('confirmation'); }} onBack={() => { if (!demoActive) go('assistant'); }} />;
      case 'confirmation':
        return <ConfirmationScreen onDone={() => { if (!demoActive) { setHasOrdered(true); go('home'); } }} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-root">
      {/* Recording canvas area */}
      <div className="demo-canvas">
        {/* Phone frame */}
        <div
          ref={phoneRef}
          className={`phone-frame ${spotStyle ? 'has-spot' : ''}`}
          style={{ transform: `scale(${zoomLevel})`, transition: 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="phone-notch" />

          {/* Spotlight overlay — shape-aware box-shadow cutout */}
          {spotStyle && (
            <div
              className="spot-overlay"
              style={
                spotStyle.shape === 'circle'
                  ? {
                      left: spotStyle.x - spotStyle.r,
                      top: spotStyle.y - spotStyle.r,
                      width: spotStyle.r * 2,
                      height: spotStyle.r * 2,
                      borderRadius: '50%',
                      boxShadow: '0 0 12px 9999px rgba(0,0,0,0.48)',
                    }
                  : {
                      left: spotStyle.x - spotStyle.w / 2,
                      top: spotStyle.y - spotStyle.h / 2,
                      width: spotStyle.w,
                      height: spotStyle.h,
                      borderRadius: '14px',
                      boxShadow: '0 0 12px 9999px rgba(0,0,0,0.48)',
                    }
              }
            />
          )}

          <div className={`phone-content ${animate ? 'fade-in' : ''}`}>
            {renderScreen()}
          </div>

          {/* Virtual cursor */}
          <VirtualCursor x={cursorX} y={cursorY} clicking={cursorClicking} visible={demoActive} />
        </div>
      </div>

      {/* Control panel — right side, outside recording area */}
      {!demoActive && (
        <div className="control-panel">
          <div className="control-panel-title">Controls</div>
          {!demoEnded ? (
            <>
              <div className="control-nav-group">
                <button
                  className="demo-nav-btn"
                  disabled={currentIndex === 0}
                  onClick={() => go(SCREENS[currentIndex - 1])}
                >
                  ← Prev
                </button>
                <span className="demo-nav-label">
                  {currentIndex + 1}/{SCREENS.length}
                </span>
                <button
                  className="demo-nav-btn"
                  disabled={currentIndex === SCREENS.length - 1}
                  onClick={() => go(SCREENS[currentIndex + 1])}
                >
                  Next →
                </button>
              </div>
              <div className="control-screen-name">{screen}</div>
              <button className="demo-start-btn" onClick={startDemo}>
                ▶ Start Demo
              </button>
            </>
          ) : (
            <button className="demo-start-btn" onClick={startDemo}>
              ↻ Replay Demo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
