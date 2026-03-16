# Grab Genie Interactive Prototype

This app is the first real interactive version of Grab Genie, aligned to the visual and screen-flow language of the existing demo.

## Live URL

👉 **[Launch Grab Genie Application](https://ashwinsheoran02.github.io/GrabGinie/)** 👈

## How To Use

1. Open the **[Live URL](https://ashwinsheoran02.github.io/GrabGinie/)** and tap the **Try Grab Genie** banner or the bottom FAB.
2. Enter a natural-language request like *"I want chocolate ice cream and get me a ride to the airport"*, or tap **Voice Mode**.
3. For voice:
   - First mic tap starts recording.
   - Second mic tap stops recording and sends transcription for planning.
4. Wait for processing (AI parses intent directly to Grab services).
5. Review **Selected for you** + **Recommended Alternatives**.
6. Tap **Replace** on recommendations to instantly swap items.
7. Tap **Confirm All** to return to Home and view activity.

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
REACT_APP_GEMINI_MODEL=gemini-2.5-flash
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
REACT_APP_GEMINI_MODEL=gemini-2.5-flash
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

- **UX Flow Handling**: State machine orchestration via `src/hooks/useGrabGenie.js`.
- **AI Brain**: AI extraction runs in `src/services/ai/extractIntentSchemaFromText.js`, utilizing **Gemini 1.5 Flash 8B** (for exceptionally low 1-2s latency intent parsing).
- **Prompt Architecture**: We use a dynamic JSON Schema matching strict user intents, preserving exact specificity (e.g. "Chocolate ice cream" over generalized categories) in `src/schema/adaptJsonFormatPlan.js`.
- **Data Rendering**: Visual models are calculated locally by category service engines located in `src/serviceEngines/`.
- **Speech-to-Text**: Audio handling currently wrappers the browser's native `window.SpeechRecognition` Web Speech API (`src/services/audio/transcribeAudio.js`). *(Note: On Android mobile, native STT drops text quality compared to APIs like OpenAI Whisper).*
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
