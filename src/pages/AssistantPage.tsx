import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Trash2,
  HelpCircle,
  Clock,
  Compass,
  Calendar,
  CloudRain,
  Sun,
  Wind,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  Shirt,
  Umbrella,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  Search,
  Check,
  X,
  ShieldCheck,
  Volume2
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { AssistantIntent, AssistantMessage, DayComparisonResult, LocationComparisonResult, TravelWeatherResult } from '../types/assistant';
import { IntentParser } from '../services/assistant/IntentParser';
import { WeatherReasoningEngine } from '../services/assistant/WeatherReasoningEngine';
import { AssistantStorage } from '../services/assistant/AssistantStorage';
import { defaultVoiceProvider } from '../services/voice/VoiceInputProvider';
import { LocationService } from '../services/locationService';
import { WeatherService } from '../services/weatherService';
import { LocationItem, CurrentWeather, AirQualityData, DailyForecastItem } from '../types/weather';
import './AssistantPage.css';

type AssistantTab = 'chat' | 'compare-days' | 'travel-planner' | 'compare-locations';

export const AssistantPage: React.FC = () => {
  const {
    currentLocation,
    currentWeather,
    hourlyForecast,
    dailyForecast,
    airQuality,
    settings,
    setIsSearchOpen
  } = useApp();

  // Assistant state
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [explainSimply, setExplainSimply] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AssistantTab>('chat');

  // Day Comparison state
  const [selectedDay1Index, setSelectedDay1Index] = useState<number>(0); // Today
  const [selectedDay2Index, setSelectedDay2Index] = useState<number>(1); // Tomorrow

  // Travel Planner state
  const [travelQuery, setTravelQuery] = useState('');
  const [travelSearchResults, setTravelSearchResults] = useState<LocationItem[]>([]);
  const [selectedTravelLoc, setSelectedTravelLoc] = useState<LocationItem | null>(null);
  const [travelDate, setTravelDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [travelLoading, setTravelLoading] = useState(false);
  const [travelResult, setTravelResult] = useState<TravelWeatherResult | null>(null);

  // Compare Locations state
  const [locCompareQuery, setLocCompareQuery] = useState('');
  const [locCompareResults, setLocCompareResults] = useState<LocationItem[]>([]);
  const [targetLoc, setTargetLoc] = useState<LocationItem | null>(null);
  const [targetWeather, setTargetWeather] = useState<CurrentWeather | null>(null);
  const [targetAqi, setTargetAqi] = useState<AirQualityData | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedHistory = useRef<boolean>(false);

  // Memoized current Outdoor Score
  const currentOutdoorScore = useMemo(() => {
    return WeatherReasoningEngine.calculateOutdoorScore(currentWeather, hourlyForecast, airQuality);
  }, [currentWeather, hourlyForecast, airQuality]);

  // Memoized Best Time Outside
  const bestTimes = useMemo(() => {
    return WeatherReasoningEngine.analyzeBestTimeOutside(hourlyForecast);
  }, [hourlyForecast]);

  // Memoized Umbrella Intelligence
  const umbrellaIntelligence = useMemo(() => {
    return WeatherReasoningEngine.evaluateUmbrella(currentWeather, hourlyForecast);
  }, [currentWeather, hourlyForecast]);

  // Memoized Clothing Guide
  const clothingGuide = useMemo(() => {
    return WeatherReasoningEngine.getClothingAdvice(currentWeather);
  }, [currentWeather]);

  // Memoized Day Periods Summary (Morning, Afternoon, Evening, Night)
  const dayPeriods = useMemo(() => {
    return WeatherReasoningEngine.buildDayPeriods(hourlyForecast);
  }, [hourlyForecast]);

  // Memoized Timeline Events
  const timelineEvents = useMemo(() => {
    return WeatherReasoningEngine.buildTimelineInsights(currentWeather, hourlyForecast, dailyForecast);
  }, [currentWeather, hourlyForecast, dailyForecast]);

  // Load conversation history on mount
  useEffect(() => {
    if (!hasLoadedHistory.current) {
      hasLoadedHistory.current = true;
      const history = AssistantStorage.getHistory();
      if (history.length > 0) {
        setMessages(history);
      } else {
        // Welcome initial message
        const welcome = WeatherReasoningEngine.answerQuery(
          'आज का मौसम',
          'CURRENT_WEATHER',
          currentLocation,
          currentWeather,
          hourlyForecast,
          dailyForecast,
          airQuality,
          false
        );
        welcome.headline = `Welcome to Weather Intelligence for ${currentLocation?.name || 'your area'}`;
        setMessages([welcome]);
      }
    }
  }, [currentLocation, currentWeather, hourlyForecast, dailyForecast, airQuality]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Handle location change: update context and recalculate
  useEffect(() => {
    // When location changes, if history exists, we notify user with fresh contextual note
    if (currentLocation && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.locationName !== currentLocation.name) {
        const updateNotice = WeatherReasoningEngine.answerQuery(
          `Weather in ${currentLocation.name}`,
          'CURRENT_WEATHER',
          currentLocation,
          currentWeather,
          hourlyForecast,
          dailyForecast,
          airQuality,
          false
        );
        updateNotice.headline = `Context updated to ${currentLocation.name}`;
        setMessages((prev) => AssistantStorage.saveMessage(updateNotice));
      }
    }
  }, [currentLocation?.id]);

  // Submit Query
  const handleSendQuery = (textToSend?: string) => {
    const q = (textToSend || inputText).trim();
    if (!q) return;

    // Parse intent locally
    const parsed = IntentParser.parse(q);

    // If intent is travel and mentions a city, or user asks about compare
    if (parsed.intent === 'TRAVEL_PLANNER' && parsed.targetLocationQuery) {
      setActiveTab('travel-planner');
      setTravelQuery(parsed.targetLocationQuery);
      handleSearchTravel(parsed.targetLocationQuery);
    } else if (parsed.intent === 'WEATHER_COMPARISON') {
      setActiveTab('compare-days');
    }

    // Generate local factual answer using deterministic engine
    const answer = WeatherReasoningEngine.answerQuery(
      q,
      parsed.intent,
      currentLocation,
      currentWeather,
      hourlyForecast,
      dailyForecast,
      airQuality,
      parsed.isHindiOrHinglish
    );

    const updated = AssistantStorage.saveMessage(answer);
    setMessages(updated);
    setInputText('');
  };

  // Voice recognition toggle
  const toggleVoiceInput = () => {
    if (!defaultVoiceProvider.isSupported()) {
      setVoiceError('Speech recognition is not available in your browser.');
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    if (isListening) {
      defaultVoiceProvider.stopListening();
      setIsListening(false);
    } else {
      setVoiceError(null);
      setIsListening(true);
      defaultVoiceProvider.startListening(
        (transcript) => {
          setInputText(transcript);
        },
        (error) => {
          setIsListening(false);
          setVoiceError(error);
          setTimeout(() => setVoiceError(null), 4000);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  // Clear chat history
  const handleClearHistory = () => {
    AssistantStorage.clearHistory();
    const fresh = WeatherReasoningEngine.answerQuery(
      'Current weather',
      'CURRENT_WEATHER',
      currentLocation,
      currentWeather,
      hourlyForecast,
      dailyForecast,
      airQuality,
      false
    );
    fresh.headline = `Intelligence reset for ${currentLocation?.name || 'Local Area'}`;
    setMessages([fresh]);
  };

  // Quick Action Buttons
  const quickActions: { label: string; query: string; icon: any }[] = [
    { label: "Today's Weather", query: 'आज मौसम कैसा है?', icon: Sun },
    { label: 'Rain Timing', query: 'आज बारिश होगी और कब शुरू हो सकती है?', icon: CloudRain },
    { label: 'Best Time Outside', query: 'आज बाहर जाना कब सही रहेगा?', icon: Compass },
    { label: 'Umbrella?', query: 'क्या आज छाता ले जाना चाहिए?', icon: Umbrella },
    { label: 'What to Wear', query: 'आज क्या कपड़े पहनूं?', icon: Shirt },
    { label: 'Temperature', query: 'आज सबसे गर्म समय कब होगा?', icon: Sun },
    { label: 'Wind Speed', query: 'आज हवा कितनी तेज है?', icon: Wind },
    { label: 'UV Index', query: 'UV कितना है?', icon: Sun },
    { label: 'Air Quality', query: 'आज AQI कैसा है?', icon: Activity },
    { label: 'Compare Days', query: 'कल और परसों में कौन सा दिन बेहतर है?', icon: Calendar },
    { label: 'Travel Weather', query: 'Travel weather planner', icon: MapPin }
  ];

  // Travel planner search
  const handleSearchTravel = async (qText?: string) => {
    const q = qText || travelQuery;
    if (!q || q.length < 2) return;
    try {
      setTravelLoading(true);
      const results = await LocationService.searchLocations(q);
      setTravelSearchResults(results);
      if (results.length > 0 && !selectedTravelLoc) {
        setSelectedTravelLoc(results[0]);
      }
    } catch {
      setTravelSearchResults([]);
    } finally {
      setTravelLoading(false);
    }
  };

  // Execute Travel Plan calculation
  const handleCalculateTravelPlan = async () => {
    if (!selectedTravelLoc) return;

    try {
      setTravelLoading(true);
      // Fetch destination real weather + daily forecast
      const [destCurrent, destDaily, destAqi] = await Promise.all([
        WeatherService.getCurrentWeather(selectedTravelLoc.latitude, selectedTravelLoc.longitude),
        WeatherService.getDailyForecast(selectedTravelLoc.latitude, selectedTravelLoc.longitude),
        WeatherService.getAirQuality(selectedTravelLoc.latitude, selectedTravelLoc.longitude)
      ]);

      const selectedDateObj = new Date(travelDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDateObj.setHours(0, 0, 0, 0);

      const diffDays = Math.round((selectedDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0 || diffDays >= destDaily.length) {
        setTravelResult({
          destination: selectedTravelLoc.name,
          date: travelDate,
          available: false,
          statusMessage: 'Forecast is not currently available for this date. We only provide validated meteorological projections up to 7 days ahead without fabricating long-range data.',
          considerations: ['Select a date within the next 7 days for verified forecast telemetry.']
        });
        setTravelLoading(false);
        return;
      }

      const matchDay = destDaily[diffDays];
      const outdoor = WeatherReasoningEngine.calculateOutdoorScore(destCurrent, [], destAqi);

      const considerations: string[] = [];
      if ((matchDay.precipitationProbability ?? 0) > 40) {
        considerations.push(`Precipitation probability is elevated (${matchDay.precipitationProbability}%). Rain protection advisable.`);
      } else {
        considerations.push('Favorable dry conditions expected with low rain likelihood.');
      }

      if ((matchDay.windSpeedMax ?? 0) > 35) {
        considerations.push(`Stronger gusts up to ${Math.round(matchDay.windSpeedMax ?? 0)} km/h possible.`);
      }

      if ((matchDay.uvIndexMax ?? 0) >= 7) {
        considerations.push(`High UV index (~${matchDay.uvIndexMax?.toFixed(1)}). Bring sun protection.`);
      }

      setTravelResult({
        destination: `${selectedTravelLoc.name}, ${selectedTravelLoc.country || ''}`,
        date: matchDay.date,
        available: true,
        tempRange: `${Math.round(matchDay.lowTemp ?? 20)}°C – ${Math.round(matchDay.highTemp ?? 30)}°C`,
        rainProb: matchDay.precipitationProbability,
        wind: matchDay.windSpeedMax,
        uv: matchDay.uvIndexMax,
        aqi: destAqi?.aqi,
        condition: matchDay.conditionText,
        outdoorScore: outdoor.score,
        considerations
      });
    } catch {
      setTravelResult({
        destination: selectedTravelLoc.name,
        date: travelDate,
        available: false,
        statusMessage: 'Could not retrieve forecast telemetry for the selected destination.',
        considerations: []
      });
    } finally {
      setTravelLoading(false);
    }
  };

  // Compare Locations search
  const handleSearchLocCompare = async () => {
    if (!locCompareQuery || locCompareQuery.length < 2) return;
    try {
      setCompareLoading(true);
      const results = await LocationService.searchLocations(locCompareQuery);
      setLocCompareResults(results);
    } catch {
      setLocCompareResults([]);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleSelectCompareLoc = async (loc: LocationItem) => {
    setTargetLoc(loc);
    try {
      setCompareLoading(true);
      const [w, aqi] = await Promise.all([
        WeatherService.getCurrentWeather(loc.latitude, loc.longitude),
        WeatherService.getAirQuality(loc.latitude, loc.longitude)
      ]);
      setTargetWeather(w);
      setTargetAqi(aqi);
    } catch {
      // error
    } finally {
      setCompareLoading(false);
    }
  };

  // Memoized Day Comparison for selected days
  const activeDayComparison = useMemo(() => {
    return WeatherReasoningEngine.compareDays(dailyForecast, selectedDay1Index, selectedDay2Index);
  }, [dailyForecast, selectedDay1Index, selectedDay2Index]);

  return (
    <div className="page-container assistant-page-container">
      {/* Page Header */}
      <div className="assistant-header-bar">
        <div className="assistant-header-left">
          <div className="assistant-icon-badge">
            <Sparkles size={20} className="sparkle-icon" />
          </div>
          <div>
            <div className="assistant-title-row">
              <h1 className="page-title assistant-title">Weather Intelligence</h1>
              <span className="ai-engine-tag">Local Reasoning Engine</span>
            </div>
            <p className="page-subtitle">
              Deterministic, zero-hallucination meteorological assistant for {currentLocation?.name || 'Local Area'}
            </p>
          </div>
        </div>

        {/* Feature Tabs Dock */}
        <div className="assistant-tabs-dock" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'chat'}
            className={`assistant-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <Sparkles size={14} />
            <span>Assistant Chat</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'compare-days'}
            className={`assistant-tab-btn ${activeTab === 'compare-days' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare-days')}
          >
            <Calendar size={14} />
            <span>Compare Days</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'travel-planner'}
            className={`assistant-tab-btn ${activeTab === 'travel-planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('travel-planner')}
          >
            <Compass size={14} />
            <span>Travel Planner</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'compare-locations'}
            className={`assistant-tab-btn ${activeTab === 'compare-locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare-locations')}
          >
            <MapPin size={14} />
            <span>Compare Cities</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Two columns on Desktop, responsive on Mobile */}
      <div className="assistant-layout-grid">
        {/* LEFT COLUMN: Conversation / Feature Panel */}
        <div className="assistant-main-col">
          {/* TAB 1: CONVERSATION PANEL */}
          {activeTab === 'chat' && (
            <div className="glass-card conversation-card">
              {/* Conversation Top Controls */}
              <div className="conversation-header-row">
                <div className="explain-toggle-box">
                  <label className="explain-toggle-label">
                    <input
                      type="checkbox"
                      checked={explainSimply}
                      onChange={(e) => setExplainSimply(e.target.checked)}
                    />
                    <span className="toggle-custom-box" />
                    <span className="explain-text">Explain simply (सरल भाषा)</span>
                  </label>
                </div>

                <div className="conversation-actions">
                  <button
                    className="btn-icon-subtle"
                    onClick={handleClearHistory}
                    title="Clear Chat History"
                    aria-label="Clear Chat History"
                  >
                    <Trash2 size={15} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Quick Action Suggestion Chips */}
              <div className="quick-suggestions-track" aria-label="Suggested Weather Questions">
                {quickActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      className="suggestion-chip-btn"
                      onClick={() => handleSendQuery(action.query)}
                      title={action.query}
                    >
                      <Icon size={13} className="chip-icon" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Chat Thread */}
              <div className="chat-thread-container" role="log" aria-live="polite">
                {messages.map((msg) => (
                  <article key={msg.id} className="assistant-message-entry">
                    {/* User Query Echo if available */}
                    {msg.query && (
                      <div className="user-query-bubble">
                        <span className="query-label">Question:</span>
                        <p className="query-text">"{msg.query}"</p>
                      </div>
                    )}

                    {/* Assistant Response Card */}
                    <div className="assistant-answer-bubble">
                      <div className="bubble-header-row">
                        <div className="bubble-brand">
                          <Sparkles size={15} className="text-primary" />
                          <strong className="bubble-title">{msg.headline}</strong>
                        </div>
                        <span className={`confidence-chip ${msg.dataConfidence.toLowerCase()}`}>
                          {msg.dataConfidence} Confidence
                        </span>
                      </div>

                      {/* Main Explanation */}
                      <div className="bubble-body-text">
                        {explainSimply && msg.simplifiedText ? (
                          <div className="simplified-callout">
                            <span className="simplified-badge">Simplified View:</span>
                            <p>{msg.simplifiedText}</p>
                          </div>
                        ) : (
                          <p className="primary-desc">{msg.detailedText}</p>
                        )}
                      </div>

                      {/* Contextual Weather Reference Badges */}
                      <div className="bubble-metrics-strip">
                        {msg.outdoorScore && (
                          <div className="strip-metric-item">
                            <span className="metric-tag">Outdoor Score:</span>
                            <strong className="metric-val">{msg.outdoorScore.score}/100 ({msg.outdoorScore.category})</strong>
                          </div>
                        )}
                        {msg.umbrellaAdvice && (
                          <div className="strip-metric-item">
                            <span className="metric-tag">Umbrella:</span>
                            <strong className="metric-val">{msg.umbrellaAdvice.recommendation}</strong>
                          </div>
                        )}
                        {msg.comfortEstimate?.currentTemp !== null && (
                          <div className="strip-metric-item">
                            <span className="metric-tag">Feels Like:</span>
                            <strong className="metric-val">{msg.comfortEstimate?.feelsLike}°C</strong>
                          </div>
                        )}
                      </div>

                      {/* Data Transparency Footer */}
                      <div className="bubble-transparency-footer">
                        <div className="transparency-left">
                          <span className="based-on-label">Based on:</span>
                          <span className="based-on-values">{msg.basedOn.join(' • ')}</span>
                        </div>
                        <span className="source-label">Source: {msg.source}</span>
                      </div>
                    </div>
                  </article>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Voice Status or Error */}
              {voiceError && (
                <div className="voice-alert-banner">
                  <AlertCircle size={14} />
                  <span>{voiceError}</span>
                </div>
              )}

              {/* Question Input Bar */}
              <form
                className="assistant-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
              >
                <button
                  type="button"
                  className={`voice-mic-btn ${isListening ? 'listening' : ''}`}
                  onClick={toggleVoiceInput}
                  title={isListening ? 'Stop Listening' : 'Voice Input (Hindi/English)'}
                  aria-label={isListening ? 'Stop Listening' : 'Voice Input'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <input
                  type="text"
                  className="assistant-text-field"
                  placeholder="Ask in Hindi, English, or Hinglish (e.g., 'आज बारिश होगी?' or 'best time outside?')"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />

                <button
                  type="submit"
                  className="assistant-send-btn"
                  disabled={!inputText.trim()}
                  aria-label="Send Query"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: COMPARE DAYS (Feature 10) */}
          {activeTab === 'compare-days' && (
            <div className="glass-card compare-days-panel">
              <div className="panel-title-row">
                <Calendar size={18} className="text-primary" />
                <h2 className="panel-heading">Daily Weather Comparison</h2>
              </div>
              <p className="panel-subtitle">
                Compare multi-day meteorological indices side-by-side using validated 7-day Open-Meteo forecasts.
              </p>

              {/* Day Pickers */}
              <div className="day-selectors-row">
                <div className="selector-group">
                  <label>First Day:</label>
                  <select
                    className="custom-select"
                    value={selectedDay1Index}
                    onChange={(e) => setSelectedDay1Index(Number(e.target.value))}
                  >
                    {dailyForecast.map((d, idx) => (
                      <option key={idx} value={idx}>
                        {d.day} ({d.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="comparison-vs-badge">VS</div>

                <div className="selector-group">
                  <label>Second Day:</label>
                  <select
                    className="custom-select"
                    value={selectedDay2Index}
                    onChange={(e) => setSelectedDay2Index(Number(e.target.value))}
                  >
                    {dailyForecast.map((d, idx) => (
                      <option key={idx} value={idx}>
                        {d.day} ({d.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison Results Card */}
              {activeDayComparison ? (
                <div className="comparison-result-card">
                  {/* Winner Recommendation Banner */}
                  <div className="comparison-verdict-box">
                    <CheckCircle2 size={20} className="text-emerald" />
                    <div>
                      <strong>Recommended: {activeDayComparison.preferredDay}</strong>
                      <p>{activeDayComparison.explanation}</p>
                    </div>
                  </div>

                  {/* Side by Side Grid */}
                  <div className="comparison-metrics-grid">
                    {/* Day 1 Column */}
                    <div className="day-metric-col">
                      <div className="col-header">
                        <h3>{activeDayComparison.day1Name}</h3>
                        <span className="col-date">{activeDayComparison.day1Date}</span>
                        <div className="col-score-badge">
                          Score: {activeDayComparison.day1Metrics.outdoorScore}/100
                        </div>
                      </div>

                      <div className="metric-row">
                        <span className="key">Condition:</span>
                        <span className="val">{activeDayComparison.day1Metrics.condition}</span>
                      </div>
                      <div className="metric-row">
                        <span className="key">Temperature:</span>
                        <span className="val">
                          {Math.round(activeDayComparison.day1Metrics.tempMin ?? 0)}°C – {Math.round(activeDayComparison.day1Metrics.tempMax ?? 0)}°C
                        </span>
                      </div>
                      <div className="metric-row">
                        <span className="key">Rain Probability:</span>
                        <span className="val">{activeDayComparison.day1Metrics.rainProb ?? 0}%</span>
                      </div>
                      <div className="metric-row">
                        <span className="key">Peak Wind:</span>
                        <span className="val">{Math.round(activeDayComparison.day1Metrics.windSpeed ?? 0)} km/h</span>
                      </div>
                      <div className="metric-row">
                        <span className="key">Max UV Index:</span>
                        <span className="val">{activeDayComparison.day1Metrics.uvIndex?.toFixed(1) ?? 'N/A'}</span>
                      </div>
                    </div>

                    {/* Day 2 Column */}
                    <div className="day-metric-col">
                      <div className="col-header">
                        <h3>{activeDayComparison.day2Name}</h3>
                        <span className="col-date">{activeDayComparison.day2Date}</span>
                        <div className="col-score-badge">
                          Score: {activeDayComparison.day2Metrics.outdoorScore}/100
                        </div>
                      </div>

                      <div className="metric-row">
                        <span className="key">Condition:</span>
                        <span className="val">{activeDayComparison.day2Metrics.condition}</span>
                      </div>
                      <div className="metric-row">
                        <span className="key">Temperature:</span>
                        <span className="val">
                          {Math.round(activeDayComparison.day2Metrics.tempMin ?? 0)}°C – {Math.round(activeDayComparison.day2Metrics.tempMax ?? 0)}°C
                        </span>
                      </div>
                      <div className="metric-row">
                        <span className="key">Rain Probability:</span>
                        <span className="val">{activeDayComparison.day2Metrics.rainProb ?? 0}%</span>
                      </div>
                      <div className="metric-row">
                        <span className="key">Peak Wind:</span>
                        <span className="val">{Math.round(activeDayComparison.day2Metrics.windSpeed ?? 0)} km/h</span>
                      </div>
                      <div className="metric-row">
                        <span className="key">Max UV Index:</span>
                        <span className="val">{activeDayComparison.day2Metrics.uvIndex?.toFixed(1) ?? 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="no-data-text">Multi-day forecast is required to perform day comparisons.</p>
              )}
            </div>
          )}

          {/* TAB 3: TRAVEL WEATHER PLANNER (Feature 12) */}
          {activeTab === 'travel-planner' && (
            <div className="glass-card travel-planner-panel">
              <div className="panel-title-row">
                <Compass size={18} className="text-primary" />
                <h2 className="panel-heading">Travel Weather Planner</h2>
              </div>
              <p className="panel-subtitle">
                Plan trips with validated real-time forecasts. Strictly zero synthetic long-range estimates.
              </p>

              {/* Destination Search & Date Row */}
              <div className="travel-form-grid">
                <div className="form-field">
                  <label>Destination City:</label>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      className="text-input"
                      placeholder="e.g. Udaipur, Shimla, Mumbai, London"
                      value={travelQuery}
                      onChange={(e) => setTravelQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchTravel();
                      }}
                    />
                    <button
                      type="button"
                      className="btn-search-trigger"
                      onClick={() => handleSearchTravel()}
                      disabled={travelLoading}
                    >
                      <Search size={15} />
                    </button>
                  </div>

                  {/* Search Results Dropdown */}
                  {travelSearchResults.length > 0 && (
                    <div className="search-dropdown-list">
                      {travelSearchResults.slice(0, 5).map((loc) => (
                        <div
                          key={loc.id}
                          className={`search-dropdown-item ${selectedTravelLoc?.id === loc.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedTravelLoc(loc);
                            setTravelSearchResults([]);
                          }}
                        >
                          <MapPin size={13} />
                          <span>{loc.name}, {loc.state ? `${loc.state}, ` : ''}{loc.country}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTravelLoc && (
                    <span className="selected-loc-chip">
                      Selected: <strong>{selectedTravelLoc.name}</strong>
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label>Travel Date:</label>
                  <input
                    type="date"
                    className="text-input"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="travel-action-row">
                <button
                  className="btn-primary-action"
                  onClick={handleCalculateTravelPlan}
                  disabled={!selectedTravelLoc || travelLoading}
                >
                  {travelLoading ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" />
                      <span>Fetching Synoptic Telemetry...</span>
                    </>
                  ) : (
                    <>
                      <Compass size={14} />
                      <span>Retrieve Destination Intelligence</span>
                    </>
                  )}
                </button>
              </div>

              {/* Travel Forecast Result */}
              {travelResult && (
                <div className="travel-result-display">
                  {!travelResult.available ? (
                    <div className="travel-unavailable-box">
                      <AlertCircle size={20} className="text-warning" />
                      <div>
                        <strong>{travelResult.destination} — {travelResult.date}</strong>
                        <p>{travelResult.statusMessage}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="travel-card-body">
                      <div className="travel-summary-header">
                        <div>
                          <h3 className="dest-name">{travelResult.destination}</h3>
                          <span className="dest-date">{travelResult.date} • {travelResult.condition}</span>
                        </div>
                        {travelResult.outdoorScore !== null && (
                          <div className="travel-outdoor-badge">
                            Outdoor Score: {travelResult.outdoorScore}/100
                          </div>
                        )}
                      </div>

                      <div className="travel-metrics-row">
                        <div className="travel-metric">
                          <span className="k">Temp Range</span>
                          <span className="v">{travelResult.tempRange}</span>
                        </div>
                        <div className="travel-metric">
                          <span className="k">Rain Risk</span>
                          <span className="v">{travelResult.rainProb ?? 0}%</span>
                        </div>
                        <div className="travel-metric">
                          <span className="k">Peak Wind</span>
                          <span className="v">{Math.round(travelResult.wind ?? 0)} km/h</span>
                        </div>
                        <div className="travel-metric">
                          <span className="k">Max UV</span>
                          <span className="v">{travelResult.uv?.toFixed(1) ?? 'N/A'}</span>
                        </div>
                        {travelResult.aqi && (
                          <div className="travel-metric">
                            <span className="k">Est. AQI</span>
                            <span className="v">{travelResult.aqi}</span>
                          </div>
                        )}
                      </div>

                      <div className="travel-considerations">
                        <strong>Important Travel Considerations:</strong>
                        <ul>
                          {travelResult.considerations.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPARE CITIES (Feature 13) */}
          {activeTab === 'compare-locations' && (
            <div className="glass-card compare-locations-panel">
              <div className="panel-title-row">
                <MapPin size={18} className="text-primary" />
                <h2 className="panel-heading">Location Comparison</h2>
              </div>
              <p className="panel-subtitle">
                Compare your current station against another city in real time.
              </p>

              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="text-input"
                  placeholder="Search city to compare (e.g. Delhi, Jaipur, Bengaluru, Dubai)"
                  value={locCompareQuery}
                  onChange={(e) => setLocCompareQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchLocCompare();
                  }}
                />
                <button
                  type="button"
                  className="btn-search-trigger"
                  onClick={handleSearchLocCompare}
                  disabled={compareLoading}
                >
                  <Search size={15} />
                </button>
              </div>

              {locCompareResults.length > 0 && (
                <div className="search-dropdown-list">
                  {locCompareResults.slice(0, 5).map((loc) => (
                    <div
                      key={loc.id}
                      className="search-dropdown-item"
                      onClick={() => {
                        handleSelectCompareLoc(loc);
                        setLocCompareResults([]);
                      }}
                    >
                      <MapPin size={13} />
                      <span>{loc.name}, {loc.state ? `${loc.state}, ` : ''}{loc.country}</span>
                    </div>
                  ))}
                </div>
              )}

              {targetLoc && targetWeather && (
                <div className="city-comparison-table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>{currentLocation?.name || 'Current'}</th>
                        <th>{targetLoc.name}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Condition</td>
                        <td>{currentWeather?.conditionText || 'Fair'}</td>
                        <td>{targetWeather.conditionText || 'Fair'}</td>
                      </tr>
                      <tr>
                        <td>Temperature</td>
                        <td>{currentWeather?.temperature !== null ? `${Math.round(currentWeather?.temperature ?? 0)}°C` : 'N/A'}</td>
                        <td>{targetWeather.temperature !== null ? `${Math.round(targetWeather.temperature)}°C` : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td>Feels Like</td>
                        <td>{currentWeather?.feelsLike !== null ? `${Math.round(currentWeather?.feelsLike ?? 0)}°C` : 'N/A'}</td>
                        <td>{targetWeather.feelsLike !== null ? `${Math.round(targetWeather.feelsLike ?? targetWeather.temperature)}°C` : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td>Rain Probability</td>
                        <td>{currentWeather?.precipitationProbability ?? 0}%</td>
                        <td>{targetWeather.precipitationProbability ?? 0}%</td>
                      </tr>
                      <tr>
                        <td>Wind Speed</td>
                        <td>{currentWeather?.windSpeed !== null ? `${Math.round(currentWeather?.windSpeed ?? 0)} km/h` : 'N/A'}</td>
                        <td>{targetWeather.windSpeed !== null ? `${Math.round(targetWeather.windSpeed)} km/h` : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td>Relative Humidity</td>
                        <td>{currentWeather?.humidity ?? 'N/A'}%</td>
                        <td>{targetWeather.humidity ?? 'N/A'}%</td>
                      </tr>
                      <tr>
                        <td>UV Index</td>
                        <td>{currentWeather?.uvIndex?.toFixed(1) ?? 'N/A'}</td>
                        <td>{targetWeather.uvIndex?.toFixed(1) ?? 'N/A'}</td>
                      </tr>
                      <tr>
                        <td>Air Quality (AQI)</td>
                        <td>{airQuality?.aqi ?? 'Standby'}</td>
                        <td>{targetAqi?.aqi ?? 'Standby'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE WEATHER & INTELLIGENCE CONTEXT (Desktop Two-Column) */}
        <aside className="assistant-context-col" aria-label="Live Weather Context Panel">
          {/* Outdoor Score Gauge Card (Feature 6) */}
          <div className="glass-card context-widget outdoor-score-widget">
            <div className="widget-header">
              <div className="widget-title-box">
                <Compass size={16} className="text-primary" />
                <h3 className="widget-title">Outdoor Score</h3>
              </div>
              <span className={`score-badge ${currentOutdoorScore.category.toLowerCase().replace(' ', '-')}`}>
                {currentOutdoorScore.category}
              </span>
            </div>

            <div className="outdoor-score-main">
              <div className="score-ring">
                <span className="score-number">{currentOutdoorScore.score}</span>
                <span className="score-max">/ 100</span>
              </div>
              <div className="score-factors-summary">
                {currentOutdoorScore.reasons.slice(0, 3).map((r, i) => (
                  <p key={i} className="score-reason-line">• {r}</p>
                ))}
              </div>
            </div>

            {currentOutdoorScore.normalizedNotice && (
              <span className="normalized-note">{currentOutdoorScore.normalizedNotice}</span>
            )}
          </div>

          {/* Best Time Outside Ranked List (Feature 5) */}
          <div className="glass-card context-widget best-times-widget">
            <div className="widget-header">
              <div className="widget-title-box">
                <Clock size={16} className="text-primary" />
                <h3 className="widget-title">Best Time Outside</h3>
              </div>
              <span className="widget-sub">Next 24 Hours</span>
            </div>

            <div className="best-times-list">
              {bestTimes.length > 0 ? (
                bestTimes.map((item) => (
                  <div key={item.rank} className={`best-time-row rank-${item.rank}`}>
                    <div className="rank-indicator">
                      <span className="rank-num">#{item.rank}</span>
                      <span className={`rank-tag ${item.label.toLowerCase().replace(' ', '-')}`}>
                        {item.label}
                      </span>
                    </div>
                    <div className="rank-details">
                      <strong className="time-window">{item.timeRange}</strong>
                      <p className="time-explain">{item.explanation}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data-text">Hourly forecast data required for time recommendations.</p>
              )}
            </div>
            <p className="disclaimer-footnote">
              *Weather-based recommendation only. Does not guarantee safety or conditions.
            </p>
          </div>

          {/* Quick Recommendations: Umbrella & Clothing (Features 7 & 8) */}
          <div className="context-duo-grid">
            <div className="glass-card duo-card">
              <div className="duo-icon-box">
                <Umbrella size={16} className="text-primary" />
              </div>
              <div className="duo-meta">
                <span className="duo-label">Umbrella?</span>
                <strong className="duo-val">{umbrellaIntelligence.recommendation}</strong>
                <span className="duo-sub">{umbrellaIntelligence.reason}</span>
              </div>
            </div>

            <div className="glass-card duo-card">
              <div className="duo-icon-box">
                <Shirt size={16} className="text-primary" />
              </div>
              <div className="duo-meta">
                <span className="duo-label">What to Wear</span>
                <strong className="duo-val">{clothingGuide.tags.slice(0, 2).join(', ')}</strong>
                <span className="duo-sub">{clothingGuide.summary}</span>
              </div>
            </div>
          </div>

          {/* 4-Period Day Summary (Morning, Afternoon, Evening, Night) (Feature 15) */}
          <div className="glass-card context-widget periods-widget">
            <div className="widget-header">
              <div className="widget-title-box">
                <Layers size={16} className="text-primary" />
                <h3 className="widget-title">Day Period Breakdown</h3>
              </div>
            </div>

            <div className="periods-vertical-grid">
              {dayPeriods.map((p) => (
                <div key={p.period} className="period-box">
                  <div className="period-header">
                    <span className="period-name">{p.period}</span>
                    <span className="period-time">{p.timeSpan}</span>
                  </div>
                  <div className="period-values">
                    <span className="p-temp">{p.temperature !== null ? `${p.temperature}°C` : 'N/A'}</span>
                    <span className="p-cond">{p.conditionText}</span>
                    {p.rainProbability !== null && p.rainProbability > 20 && (
                      <span className="p-rain">{p.rainProbability}% rain</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weather Timeline Insights (Feature 14) */}
          <div className="glass-card context-widget timeline-widget">
            <div className="widget-header">
              <div className="widget-title-box">
                <Activity size={16} className="text-primary" />
                <h3 className="widget-title">Timeline Milestones</h3>
              </div>
            </div>

            <div className="timeline-events-list">
              {timelineEvents.map((evt) => (
                <div key={evt.id} className="timeline-event-item">
                  <div className="timeline-time-bubble">{evt.time}</div>
                  <div className="timeline-meta">
                    <strong className="evt-title">{evt.title} ({evt.value})</strong>
                    <span className="evt-sub">{evt.subtext}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
