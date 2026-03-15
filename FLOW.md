# Grab Genie — Flow Summary (Demo Prototype)

This file documents the visual flow used in the hackathon demo video.

## Page Summary

### 1) Home
- Greeting header, search bar, service cards (Ride, Food, Delivery), promo banner.
- Floating Genie FAB starts the assistant journey.
- Recent Activity is hidden on first load.

### 2) Grab Genie Intro
- Sparkle hero, Genie title, one-line value proposition.
- Get Started CTA moves user into assistant mode.

### 3) Assistant (Idle)
- Chat bubble introduces Genie.
- Bottom microphone CTA invites voice input.

### 4) Listening
- Pulsing mic animation and typed transcript.
- Auto-advances after transcript completes.

### 5) Processing
- Loader plus two interpreted intent summaries:
  - Food Order details.
  - Ride Booking details.
- Auto-advances to results.

### 6) Results (Selected + AI Alternatives)
- Section: Selected for you
  - Primary Food card.
  - Primary Ride card.
  - Total bar.
- Section: Recommended Alternatives (appears after ~1.5s)
  - Smaller alternative cards for Food and Ride.
  - Replace buttons visually swap selected cards (demo-only interaction).
- Confirm All CTA proceeds to confirmation.

### 7) Confirmation
- Success checkmark, completion text, and summary lines.
- Back to Home returns to Home.

### 8) Home (Post-Order State)
- Same Home page, now with Recent Activity visible.
- Shows the completed food and ride actions for demo credibility.

## Linear Flow Map

Home -> Intro -> Assistant -> Listening -> Processing -> Results -> Confirmation -> Home (with activity)

## Demo Mode Summary

- Virtual cursor moves and clicks key CTAs.
- Spotlight and gentle zoom emphasize focal actions.
- Results stage now highlights Recommended Alternatives before Confirm All.
- Current autoplay duration is precisely timed at 40 seconds to align with demo video narration.

## Timing Breakdown (40s Total)

1. **Home screen** (6s): Introduce starting point. Cursor moves to FAB at ~4.5s, clicks at 5.5s.
2. **Genie Intro** (5s): Focus on value proposition. Spotlight on Get Started CTA.
3. **Assistant Idle** (5s): Cursor moves to microphone.
4. **Listening** (6s): Transcript types out naturally (~80ms per char) for voice input feel.
5. **Processing** (6s): Hold screen to show interpreted intents (Food & Ride).
6. **Results** (7s): Selected cards show first. Recommended alternatives fade in at 1.5s, highlighted with spotlight. Cursor moves to Confirm All and clicks.
7. **Confirmation** (3s): Success checkmark and summary.
8. **Home (Activity)** (2s): Briefly show completed actions in Recent Activity.
