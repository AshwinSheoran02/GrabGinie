import React from 'react';
import './App.css';
import { useGrabGenie } from './hooks/useGrabGenie';
import { RecommendationCard } from './components/RecommendationCard';
import { SelectedServiceCard } from './components/SelectedServiceCard';
import { SamplePromptChips } from './components/SamplePromptChips';
import {
  BackArrow,
  CarIcon,
  CheckCircleIcon,
  FoodIcon,
  MartIcon,
  MicIcon,
  SearchIcon,
  SparkleIcon
} from './components/icons';

function HomeScreen({ onGenieClick, hasOrdered, activity }) {
  return (
    <div className="screen home-screen">
      <div className="home-header">
        <div>
          <div className="home-greeting">Good evening,</div>
          <div className="home-name">Ashwin</div>
        </div>
        <div className="avatar">A</div>
      </div>

      <div className="search-bar">
        <SearchIcon />
        <span className="search-placeholder">Where are you going?</span>
      </div>

      <div className="service-cards">
        <div className="service-card service-card-ride">
          <div className="service-icon"><CarIcon /></div>
          <div className="service-label">Ride</div>
        </div>
        <div className="service-card service-card-food">
          <div className="service-icon"><FoodIcon /></div>
          <div className="service-label">Food</div>
        </div>
        <div className="service-card service-card-mart">
          <div className="service-icon"><MartIcon /></div>
          <div className="service-label">Mart</div>
        </div>
      </div>

      {hasOrdered && activity[0] && (
        <>
          <div className="section-title">Recent Activity</div>
          {activity[0].items.map((entry) => (
            <div key={`${activity[0].id}-${entry.category}`} className={`activity-card activity-card-${entry.category}`}>
              <div className="activity-title">{entry.title}</div>
              <div className="activity-sub">{entry.detail}</div>
            </div>
          ))}
        </>
      )}

      <div className="promo-banner">
        <div className="promo-text">
          <div className="promo-title">Try Grab Genie</div>
          <div className="promo-sub">One request. Multi-service orchestration.</div>
        </div>
        <SparkleIcon />
      </div>

      <button className="fab" onClick={onGenieClick}>
        <SparkleIcon />
      </button>
    </div>
  );
}

function IntroScreen({ onStart }) {
  return (
    <div className="screen intro-screen">
      <div className="intro-backdrop" />
      <div className="intro-modal">
        <div className="intro-sparkle-ring"><SparkleIcon /></div>
        <h1 className="intro-title">Grab Genie</h1>
        <p className="intro-tagline">Say it once. Grab handles the rest.</p>
        <p className="intro-desc">
          Food, ride, and mart orchestration in a single request with AI-backed recommendations.
        </p>
        <button className="btn-primary" onClick={onStart}>Get Started</button>
      </div>
    </div>
  );
}

function AssistantScreen({
  onBack,
  onMic,
  inputText,
  onInputChange,
  onSubmit,
  onSamplePrompt,
  warning,
  aiLabel
}) {
  return (
    <div className="screen assistant-screen">
      <div className="title-bar">
        <button className="icon-btn" onClick={onBack}><BackArrow /></button>
        <span className="title-bar-text">Grab Genie</span>
        <div className="title-pad" />
      </div>

      <div className="chat-area">
        <div className="chat-bubble bot">
          <div className="bubble-avatar"><SparkleIcon /></div>
          <div className="bubble-text">
            Describe your plan with details like budget, time, and destination. I will build selected services plus alternatives.
          </div>
        </div>

        <textarea
          className="intent-input"
          value={inputText}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Type one natural request..."
        />

        <div className="engine-status">{aiLabel}</div>

        <SamplePromptChips onPickPrompt={onSamplePrompt} />

        {warning && <div className="warning-box">{warning}</div>}
      </div>

      <div className="assistant-actions">
        <button className="btn-secondary" onClick={onMic}>
          <MicIcon size={22} />
          Voice Mode
        </button>
        <button className="btn-primary" onClick={onSubmit}>Generate Plan</button>
      </div>
    </div>
  );
}

function ListeningScreen({ onDone, onCancel, transcript, isRecording, audioError }) {
  return (
    <div className="screen listening-screen">
      <div className="title-bar">
        <button className="icon-btn" onClick={onCancel}><BackArrow /></button>
        <span className="title-bar-text">Listening...</span>
        <div className="title-pad" />
      </div>
      <div className="listening-body">
        <div className="pulse-ring">
          <div className="pulse-circle" />
          <div className="pulse-circle delay" />
          <button className="mic-btn listening-mic" onClick={onDone}><MicIcon size={34} /></button>
        </div>
        <div className="listening-help">
          {isRecording ? 'Tap mic again to stop and generate your plan.' : 'Finalizing transcript and building your plan...'}
        </div>
        <div className="transcript">{transcript || 'Start speaking. Your words will appear here in real-time.'}</div>
        {audioError && <div className="warning-box">{audioError}</div>}
      </div>
    </div>
  );
}

function ProcessingScreen({ plan }) {
  return (
    <div className="screen processing-screen">
      <div className="title-bar">
        <div className="title-pad" />
        <span className="title-bar-text">Understanding your request...</span>
        <div className="title-pad" />
      </div>
      <div className="processing-body">
        <div className="spinner" />
        <div className="summary-cards">
          {(plan.uiHints.processingSummary || []).map((line) => (
            <div key={line} className="summary-card summary-card-food">{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsScreen({
  onBack,
  onConfirm,
  selectedView,
  recommendationView,
  onReplace,
  total,
  confidenceLine
}) {
  const selectedList = [selectedView.food, selectedView.ride, selectedView.mart].filter(Boolean);

  return (
    <div className="screen results-screen">
      <div className="title-bar">
        <button className="icon-btn" onClick={onBack}><BackArrow /></button>
        <span className="title-bar-text">Here is your plan</span>
        <div className="title-pad" />
      </div>

      <div className="results-body">
        <div className="results-section-label">Selected for you</div>
        {selectedList.length === 0 && (
          <div className="empty-results">No direct service selected yet. Try adding service keywords in your request.</div>
        )}
        {selectedList.map((item) => (
          <SelectedServiceCard key={item.category} item={item} />
        ))}

        <div className="result-summary-bar">
          <span>Total</span>
          <span className="result-total">
            {typeof total.amount === 'number'
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: total.currency, maximumFractionDigits: 0 }).format(total.amount)
              : '-'}
          </span>
        </div>

        {confidenceLine && <div className="confidence-note">{confidenceLine}</div>}

        <div className="recs-section">
          <div className="results-section-label recs-label">Recommended Alternatives</div>
          {['food', 'ride', 'mart'].map((category) => (
            <React.Fragment key={category}>
              {(recommendationView[category] || []).slice(0, 2).map((entry) => (
                <RecommendationCard
                  key={`${category}-${entry.recommendationId}`}
                  category={category}
                  recommendation={entry}
                  onReplace={onReplace}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bottom-action">
        <button className="btn-primary full-width" onClick={onConfirm}>Confirm All</button>
      </div>
    </div>
  );
}

function ConfirmationScreen({ selectedView, onDone }) {
  const selectedList = [selectedView.food, selectedView.ride, selectedView.mart].filter(Boolean);

  return (
    <div className="screen confirmation-screen">
      <div className="confirmation-body">
        <div className="check-pop"><CheckCircleIcon /></div>
        <h1 className="confirm-title">All set!</h1>
        <div className="confirm-items">
          {selectedList.map((item) => (
            <div key={item.category} className={`confirm-item confirm-item-${item.category}`}>
              {item.category.toUpperCase()}: {item.title}
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{ marginTop: 30 }} onClick={onDone}>Back to Home</button>
      </div>
    </div>
  );
}

function App() {
  const genie = useGrabGenie();

  const confidence = genie.plan.interpretation.confidence;
  const confidenceLine = typeof confidence?.overall === 'number'
    ? `Interpretation confidence ${(confidence.overall * 100).toFixed(0)}%`
    : confidence?.explanation;
  const aiLabel = genie.aiEnabled
    ? `AI extraction active (${genie.aiConfig.provider})`
    : 'AI key not configured. Using robust local fallback planner.';

  return (
    <div className="app-root">
      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-content fade-in">
          {genie.screen === genie.screens.HOME && (
            <HomeScreen onGenieClick={genie.startFlow} hasOrdered={genie.hasOrdered} activity={genie.activity} />
          )}

          {genie.screen === genie.screens.INTRO && (
            <IntroScreen onStart={genie.startAssistant} />
          )}

          {genie.screen === genie.screens.ASSISTANT && (
            <AssistantScreen
              onBack={genie.backHome}
              onMic={genie.startListening}
              inputText={genie.inputText}
              onInputChange={genie.setInputText}
              onSamplePrompt={genie.setInputText}
              onSubmit={() => genie.submitText()}
              warning={genie.extractMeta.warning}
              aiLabel={aiLabel}
            />
          )}

          {genie.screen === genie.screens.LISTENING && (
            <ListeningScreen
              onDone={genie.stopListeningAndSubmit}
              onCancel={genie.cancelListening}
              transcript={genie.audioTranscript}
              isRecording={genie.isRecordingAudio}
              audioError={genie.audioError}
            />
          )}

          {genie.screen === genie.screens.PROCESSING && (
            <ProcessingScreen plan={genie.plan} />
          )}

          {genie.screen === genie.screens.RESULTS && (
            <ResultsScreen
              onBack={genie.backToAssistant}
              onConfirm={genie.confirmPlan}
              selectedView={genie.selectedView}
              recommendationView={genie.recommendationView}
              onReplace={genie.replaceSelection}
              total={genie.total}
              confidenceLine={confidenceLine}
            />
          )}

          {genie.screen === genie.screens.CONFIRMATION && (
            <ConfirmationScreen selectedView={genie.selectedView} onDone={genie.finishConfirmation} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
