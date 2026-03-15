# Grab Genie Interactive Prototype

This app is the first real interactive version of Grab Genie, aligned to the visual and screen-flow language of the existing demo.

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

## Scripts

- `npm start`: run in development
- `npm test`: run test suite
- `npm run build`: create production build

## GitHub Pages Deployment (From Parent GrabGinie Repo)

This prototype is deployed through the parent repo workflow:

- `.github/workflows/deploy-grabgenieprototype-pages.yml`
- Build source: `grabgenieprototype/`
- Published artifact: `grabgenieprototype/build/`

Important setup notes:

- In GitHub repository settings, Pages source should be `GitHub Actions`.
- The app uses `"homepage": "."` in `package.json` so static assets resolve correctly under repo subpaths.
- Any push to `main` that changes `grabgenieprototype/**` triggers deployment.
