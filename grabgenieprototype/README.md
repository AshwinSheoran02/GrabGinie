# Grab Genie Interactive Prototype

This app is the first real interactive version of Grab Genie, aligned to the visual and screen-flow language of the existing demo.

## Live URL

- https://ashwinsheoran02.github.io/GrabGinie/

## How To Use (Quick)

1. Open the app home screen and tap the Grab Genie FAB.
2. Enter a natural-language request in the text box, or tap Voice Mode.
3. For voice:
	- first mic tap starts recording
	- second mic tap stops recording and sends transcription for planning
4. Wait for processing, then review Selected for you + Recommended Alternatives.
5. Tap Replace on recommendations to swap into selected cards.
6. Tap Confirm All to complete and return to Home with recent activity.

## AI vs Fallback Behavior

- If `REACT_APP_AI_PROVIDER` and API key are configured, extraction uses live AI provider calls.
- If AI is unavailable or fails, the app automatically uses robust local fallback planning.
- The assistant screen shows current extraction mode so testing is transparent.

## Implemented Foundations

- Multi-screen product flow: Home -> Intro -> Assistant -> Listening -> Processing -> Results -> Confirmation -> Home activity
- Text-first extraction pipeline with clear audio integration boundary
- Strong structured JSON schema with null-safe fields and service-specific blocks
- AI extraction service with provider abstraction (Gemini/OpenAI) and strict schema prompt
- Fallback planner for resilience when AI config fails or output is malformed
- Service engines for food, ride, and mart rendering models
- Recommendation cards with working Replace interactions

## Project Structure

- `src/schema/planSchema.js`: schema shape, template generation, and normalization
- `src/services/ai/extractIntentSchemaFromText.js`: AI extraction orchestrator
- `src/services/ai/providers/`: Gemini and OpenAI provider adapters
- `src/services/planner/fallbackPlanner.js`: robust local fallback planning
- `src/services/audio/transcribeAudio.js`: future audio transcription integration point
- `src/serviceEngines/`: category engines + render model calculation
- `src/hooks/useGrabGenie.js`: state machine and orchestration hook
- `src/components/`: cards, icons, prompt chips

## Environment Configuration

Create `.env.local` and set values from `.env.example`.

Example:

```
REACT_APP_AI_PROVIDER=gemini
REACT_APP_GEMINI_API_KEY=your_key_here
REACT_APP_GEMINI_MODEL=gemini-1.5-flash
```

Supported providers:

- `gemini`
- `openai`
- `none` (automatic local fallback planner)

### Local AI Setup (Gemini)

1. Create/update `.env.local` in `grabgenieprototype/`:

```
REACT_APP_AI_PROVIDER=gemini
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_GEMINI_MODEL=gemini-1.5-flash
```

2. Restart dev server after env changes (`npm start` again).
3. In assistant screen, confirm status line shows `AI extraction active (gemini)`.

### GitHub Pages AI Setup (Required)

GitHub Pages uses GitHub Actions build-time env vars, not your local `.env.local`.

1. Open repository `Settings -> Secrets and variables -> Actions`.
2. Add repository secret:
	- `REACT_APP_GEMINI_API_KEY` = your Gemini key
3. Re-run workflow `Deploy GrabGenie Prototype to GitHub Pages` or push a new commit.
4. Open deployed URL and verify assistant status line shows AI active.

Security note:

- Never commit real API keys.
- Frontend keys in `REACT_APP_*` are exposed in browser bundles; use restricted keys for prototypes.
- For production, move AI calls to a backend proxy.

## Scripts

- `npm start`: run in development
- `npm test`: run test suite
- `npm run build`: create production build

## Local Development Steps

1. `cd grabgenieprototype`
2. `npm install`
3. Create `.env.local` from `.env.example`
4. `npm start`
5. Open http://localhost:3000

## Technical Notes

- UI flow state machine is in `src/hooks/useGrabGenie.js`.
- AI extraction orchestration is in `src/services/ai/extractIntentSchemaFromText.js`.
- Voice transcription session wrapper (browser speech-to-text) is in `src/services/audio/transcribeAudio.js`.
- Rendering models are derived by category service engines in `src/serviceEngines/`.
- Plan schema template/normalization lives in `src/schema/planSchema.js`.

## GitHub Pages Deployment (From Parent GrabGinie Repo)

This prototype is deployed through the parent repo workflow:

- `.github/workflows/deploy-grabgenieprototype-pages.yml`
- Build source: `grabgenieprototype/`
- Published artifact: `grabgenieprototype/build/`

Important setup notes:

- In GitHub repository settings, Pages source should be `GitHub Actions`.
- The app uses `"homepage": "."` in `package.json` so static assets resolve correctly under repo subpaths.
- Any push to `main` that changes `grabgenieprototype/**` triggers deployment.
