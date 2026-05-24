import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Clock3,
  Copy,
  Languages,
  MapPin,
  Moon,
  RefreshCw,
  Search,
  Sun,
  Timer,
} from 'lucide-react';
import WorldMap from './components/WorldMap.jsx';
import { defaultLanguageId, languages } from './data/languages.js';
import { defaultLocationId, featuredLocationIds, locations } from './data/locations.js';
import { usePersistentState } from './hooks/usePersistentState.js';
import { useSyncedClock } from './hooks/useSyncedClock.js';
import {
  formatClock,
  formatDateLine,
  formatOffset,
  formatShortTime,
  formatTimeZoneName,
} from './lib/timeFormat.js';

const fallbackLocation = locations.find((location) => location.id === defaultLocationId) ?? locations[0];

function inferDefaultLocation() {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return locations.find((location) => location.timeZone === localTimeZone) ?? fallbackLocation;
}

function normalizeSavedOption(items, value, fallbackId) {
  return items.some((item) => item.id === value) ? value : fallbackId;
}

function getThemeDefault() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'black' : 'white';
}

function SearchBox({ selectedLocation, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const pool = term
      ? locations.filter((location) =>
          `${location.city} ${location.country} ${location.timeZone} ${location.region}`
            .toLowerCase()
            .includes(term),
        )
      : locations.filter((location) => featuredLocationIds.includes(location.id));

    return pool.slice(0, 9);
  }, [query]);

  function choose(location) {
    onSelect(location);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className="search-box">
      <Search size={18} aria-hidden="true" />
      <input
        ref={inputRef}
        value={query}
        type="search"
        placeholder={`${selectedLocation.city}, ${selectedLocation.country}`}
        aria-label="Search city or country"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && results[0]) {
            choose(results[0]);
          }
          if (event.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
      />
      {open && (
        <div className="search-results" role="listbox">
          {results.length === 0 ? (
            <div className="search-empty">No match</div>
          ) : (
            results.map((location) => (
              <button
                key={location.id}
                className="search-result"
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(location)}
              >
                <span>
                  <strong>{location.city}</strong>
                  <span>{location.country}</span>
                </span>
                <code>{formatOffset(Date.now(), location.timeZone)} · {location.region}</code>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SegmentedMode({ value, onChange }) {
  return (
    <div className="segmented" aria-label="Hour mode">
      {['24', '12'].map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          className={value === mode ? 'active' : ''}
          onClick={() => onChange(mode)}
        >
          {mode}h
        </button>
      ))}
    </div>
  );
}

function TopBar({
  selectedLocation,
  onSelectLocation,
  hourMode,
  setHourMode,
  showMilliseconds,
  setShowMilliseconds,
  languageId,
  setLanguageId,
  theme,
  setTheme,
}) {
  return (
    <header className="top-bar">
      <div className="brand" aria-label="World Time">
        <Clock3 size={22} aria-hidden="true" />
        <span>World Time</span>
      </div>

      <SearchBox selectedLocation={selectedLocation} onSelect={onSelectLocation} />

      <div className="toolbar">
        <SegmentedMode value={hourMode} onChange={setHourMode} />

        <button
          className={`tool-button ${showMilliseconds ? 'active' : ''}`}
          type="button"
          aria-pressed={showMilliseconds}
          onClick={() => setShowMilliseconds((value) => !value)}
        >
          <Timer size={17} aria-hidden="true" />
          <span>ms</span>
        </button>

        <label className="select-shell">
          <Languages size={17} aria-hidden="true" />
          <select
            value={languageId}
            aria-label="Language"
            onChange={(event) => setLanguageId(event.target.value)}
          >
            {languages.map((language) => (
              <option key={language.id} value={language.id}>
                {language.label}
              </option>
            ))}
          </select>
        </label>

        <button
          className="icon-button"
          type="button"
          aria-label={theme === 'black' ? 'Switch to white mode' : 'Switch to black mode'}
          onClick={() => setTheme((value) => (value === 'black' ? 'white' : 'black'))}
        >
          {theme === 'black' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}

function ClockPanel({
  clock,
  selectedLocation,
  dateLine,
  offset,
  zoneName,
  anchor,
  onSync,
  onBlankClick,
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy(event) {
    event.stopPropagation();
    const text = clock.period ? `${clock.time} ${clock.period}` : clock.time;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <section className="clock-panel" onClick={onBlankClick}>
      <div className="clock-meta">
        <span className="location-chip">
          <MapPin size={16} aria-hidden="true" />
          {selectedLocation.city}, {selectedLocation.country}
        </span>
        <span className="tz-badge">{selectedLocation.timeZone}</span>
      </div>

      <time
        className={`clock-face ${clock.time.includes('.') ? 'has-ms' : ''}`}
        dateTime={new Date().toISOString()}
        aria-live="polite"
      >
        <span>{clock.time}</span>
        {clock.period && <em>{clock.period}</em>}
      </time>

      <div className="date-line">{dateLine}</div>

      <div className="source-line">
        <span>
          {offset} · {zoneName}
        </span>
        <div className="source-actions">
          <button
            type="button"
            className={`copy-button ${copied ? 'done' : ''}`}
            onClick={handleCopy}
          >
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button type="button" className="sync-button" onClick={(event) => {
            event.stopPropagation();
            onSync();
          }}>
            <RefreshCw size={15} aria-hidden="true" className={anchor.status === 'loading' ? 'spin' : ''} />
            <span>{anchor.status === 'synced' ? 'timeapi.io' : anchor.status === 'loading' ? 'syncing' : 'browser'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function CityRail({ nowMs, selectedLocation, hourMode, language, onSelect }) {
  const featured = featuredLocationIds
    .map((id) => locations.find((location) => location.id === id))
    .filter(Boolean);

  return (
    <section className="city-rail" aria-label="Featured world times">
      {featured.map((location) => (
        <button
          key={location.id}
          type="button"
          className={`city-row ${location.id === selectedLocation.id ? 'active' : ''}`}
          onClick={() => onSelect(location)}
        >
          <span>
            <strong>{location.city}</strong>
            <small>{formatOffset(nowMs, location.timeZone)}</small>
          </span>
          <time>{formatShortTime(nowMs, location.timeZone, { hourMode, language })}</time>
        </button>
      ))}
    </section>
  );
}

function MapPanel({ selectedLocation, nowMs, hourMode, language, onSelect }) {
  return (
    <section className="map-panel">
      <div className="section-heading">
        <span>Map</span>
        <strong>{selectedLocation.region}</strong>
      </div>
      <WorldMap locations={locations} selectedLocation={selectedLocation} onSelect={onSelect} />
      <CityRail
        nowMs={nowMs}
        selectedLocation={selectedLocation}
        hourMode={hourMode}
        language={language}
        onSelect={onSelect}
      />
    </section>
  );
}

function FocusClock({ clock, onExit }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onExit();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onExit]);

  return (
    <main className="focus-stage" onClick={onExit}>
      <time className={`focus-clock ${clock.time.includes('.') ? 'has-ms' : ''}`} aria-live="polite">
        <span>{clock.time}</span>
        {clock.period && <em>{clock.period}</em>}
      </time>
    </main>
  );
}

export default function App() {
  const inferredDefault = useMemo(inferDefaultLocation, []);
  const [selectedId, setSelectedId] = usePersistentState('world-time.location', inferredDefault.id);
  const [hourMode, setHourMode] = usePersistentState('world-time.hour-mode', '24');
  const [showMilliseconds, setShowMilliseconds] = usePersistentState('world-time.show-ms', false);
  const [languageId, setLanguageId] = usePersistentState('world-time.language', defaultLanguageId);
  const [theme, setTheme] = usePersistentState('world-time.theme', getThemeDefault());
  const [focusMode, setFocusMode] = useState(false);

  const selectedLocation =
    locations.find((location) => location.id === selectedId) ?? inferredDefault ?? fallbackLocation;
  const safeLanguageId = normalizeSavedOption(languages, languageId, defaultLanguageId);
  const language = languages.find((option) => option.id === safeLanguageId) ?? languages[0];

  const { nowMs, anchor, sync } = useSyncedClock(selectedLocation.timeZone, showMilliseconds);
  const clock = formatClock(nowMs, selectedLocation.timeZone, {
    hourMode: hourMode === '12' ? '12' : '24',
    showMilliseconds,
    language,
  });
  const dateLine = formatDateLine(nowMs, selectedLocation.timeZone, language);
  const offset = formatOffset(nowMs, selectedLocation.timeZone);
  const zoneName = formatTimeZoneName(nowMs, selectedLocation.timeZone);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.title = `${clock.time} ${selectedLocation.city} | World Time`;
  }, [clock.time, selectedLocation.city]);

  useEffect(() => {
    function handleKey(event) {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;
      if ((event.key === 'f' || event.key === 'F') && !event.metaKey && !event.ctrlKey) {
        setFocusMode(true);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  function selectLocation(location) {
    setSelectedId(location.id);
  }

  if (focusMode) {
    return (
      <div className={`app-shell ${theme}`}>
        <FocusClock clock={clock} onExit={() => setFocusMode(false)} />
      </div>
    );
  }

  return (
    <div className={`app-shell ${theme}`}>
      <TopBar
        selectedLocation={selectedLocation}
        onSelectLocation={selectLocation}
        hourMode={hourMode}
        setHourMode={setHourMode}
        showMilliseconds={showMilliseconds}
        setShowMilliseconds={setShowMilliseconds}
        languageId={safeLanguageId}
        setLanguageId={setLanguageId}
        theme={theme}
        setTheme={setTheme}
      />

      <main className="workspace">
        <ClockPanel
          clock={clock}
          selectedLocation={selectedLocation}
          dateLine={dateLine}
          offset={offset}
          zoneName={zoneName}
          anchor={anchor}
          onSync={() => sync(new AbortController().signal)}
          onBlankClick={(event) => {
            if (event.currentTarget === event.target) {
              setFocusMode(true);
            }
          }}
        />

        <MapPanel
          selectedLocation={selectedLocation}
          nowMs={nowMs}
          hourMode={hourMode}
          language={language}
          onSelect={selectLocation}
        />
      </main>
    </div>
  );
}
