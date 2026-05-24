const TIME_API_ENDPOINT = 'https://timeapi.io/api/TimeZone/zone';

function parseApiLocalTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/.exec(value);

  if (!match) {
    throw new Error('Unexpected TimeAPI date format');
  }

  const [, year, month, day, hour, minute, second, fraction = '0'] = match;
  const millisecond = Number(fraction.padEnd(3, '0').slice(0, 3));

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond,
  };
}

export async function fetchTimeAnchor(timeZone, signal) {
  const url = `${TIME_API_ENDPOINT}?timeZone=${encodeURIComponent(timeZone)}`;
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`TimeAPI responded with ${response.status}`);
  }

  const payload = await response.json();
  const local = parseApiLocalTime(payload.currentLocalTime);
  const offsetMs =
    payload.currentUtcOffset?.milliseconds ??
    (payload.currentUtcOffset?.seconds ? payload.currentUtcOffset.seconds * 1000 : undefined);

  if (typeof offsetMs !== 'number') {
    throw new Error('TimeAPI response did not include a UTC offset');
  }

  const epochMs =
    Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
      local.millisecond,
    ) - offsetMs;

  return {
    epochMs,
    receivedAtMs: Date.now(),
    source: 'timeapi.io',
    rawOffsetMs: offsetMs,
    dstActive: Boolean(payload.isDayLightSavingActive),
  };
}
