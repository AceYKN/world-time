function getParts(epochMs, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US-u-nu-latn', {
    timeZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(epochMs));

  const get = (type) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const hour = get('hour') % 24;

  return {
    hour,
    minute: get('minute'),
    second: get('second'),
    millisecond: new Date(epochMs).getUTCMilliseconds(),
  };
}

function pad(value, digits = 2) {
  return String(value).padStart(digits, '0');
}

export function formatClock(epochMs, timeZone, { hourMode, showMilliseconds, language }) {
  const parts = getParts(epochMs, timeZone);
  const isPM = parts.hour >= 12;
  const displayHour =
    hourMode === '24' ? parts.hour : parts.hour % 12 === 0 ? 12 : parts.hour % 12;

  return {
    time: `${pad(displayHour)}:${pad(parts.minute)}:${pad(parts.second)}${
      showMilliseconds ? `.${pad(parts.millisecond, 3)}` : ''
    }`,
    period: hourMode === '12' ? (isPM ? language.periods.pm : language.periods.am) : '',
    localHour: parts.hour,
  };
}

export function formatDateLine(epochMs, timeZone, language) {
  return new Intl.DateTimeFormat(language.locale, {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(epochMs));
}

export function formatShortTime(epochMs, timeZone, { hourMode, language }) {
  const parts = getParts(epochMs, timeZone);
  const isPM = parts.hour >= 12;
  const displayHour =
    hourMode === '24' ? parts.hour : parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  const suffix = hourMode === '12' ? ` ${isPM ? language.periods.pm : language.periods.am}` : '';

  return `${pad(displayHour)}:${pad(parts.minute)}${suffix}`;
}

export function formatOffset(epochMs, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date(epochMs));
    const value = parts.find((part) => part.type === 'timeZoneName')?.value;
    return value ? value.replace('GMT', 'UTC') : 'UTC';
  } catch {
    return 'UTC';
  }
}

export function formatTimeZoneName(epochMs, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      timeZoneName: 'short',
    }).formatToParts(new Date(epochMs));
    return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}
