import {
  AE,
  AR,
  AU,
  BR,
  CA,
  CL,
  CN,
  CO,
  DE,
  EG,
  ES,
  ET,
  FI,
  FJ,
  FR,
  GB,
  GR,
  HK,
  ID,
  IE,
  IL,
  IN,
  IR,
  IS,
  IT,
  JP,
  KE,
  KR,
  MA,
  MX,
  MY,
  NG,
  NL,
  NZ,
  PE,
  PH,
  RU,
  SA,
  SE,
  SG,
  TH,
  TR,
  TW,
  US,
  VN,
  WS,
  ZA,
} from 'country-flag-icons/react/3x2';

const flagsByCountryCode = {
  AE,
  AR,
  AU,
  BR,
  CA,
  CL,
  CN,
  CO,
  DE,
  EG,
  ES,
  ET,
  FI,
  FJ,
  FR,
  GB,
  GR,
  HK,
  ID,
  IE,
  IL,
  IN,
  IR,
  IS,
  IT,
  JP,
  KE,
  KR,
  MA,
  MX,
  MY,
  NG,
  NL,
  NZ,
  PE,
  PH,
  RU,
  SA,
  SE,
  SG,
  TH,
  TR,
  TW,
  US,
  VN,
  WS,
  ZA,
};

let cachedFlagEmojiSupport;

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ');
}

function toFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) {
    return null;
  }

  return countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join('');
}

function pixelsMatch(left, right) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

function getRenderedPixels(context, canvas, text) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height).data;
}

function supportsFlagEmoji() {
  if (cachedFlagEmojiSupport !== undefined) {
    return cachedFlagEmojiSupport;
  }

  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent ?? '';
    const platform = navigator.userAgentData?.platform ?? navigator.platform ?? '';

    if (/windows/i.test(userAgent) || /^win/i.test(platform)) {
      cachedFlagEmojiSupport = false;
      return cachedFlagEmojiSupport;
    }
  }

  if (typeof document === 'undefined') {
    cachedFlagEmojiSupport = true;
    return cachedFlagEmojiSupport;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 32;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    cachedFlagEmojiSupport = false;
    return cachedFlagEmojiSupport;
  }

  context.textBaseline = 'top';
  context.font = '28px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  context.fillStyle = '#111';

  const flagPixels = getRenderedPixels(context, canvas, '🇺🇸');
  const lettersPixels = getRenderedPixels(context, canvas, 'US');
  const emptyPixels = getRenderedPixels(context, canvas, '');

  cachedFlagEmojiSupport =
    !pixelsMatch(flagPixels, lettersPixels) && !pixelsMatch(flagPixels, emptyPixels);

  return cachedFlagEmojiSupport;
}

function isTaiwanFlagLikelyBlocked() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent ?? '';
  const platform = navigator.platform ?? '';
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;
  const isAppleMobile =
    /iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);

  if (!isAppleMobile) {
    return false;
  }

  const locales = [
    navigator.language,
    ...(navigator.languages ?? []),
    Intl.DateTimeFormat().resolvedOptions().locale,
  ]
    .filter(Boolean)
    .map((locale) => locale.toLowerCase());

  return locales.some(
    (locale) =>
      locale === 'zh-cn' ||
      locale.startsWith('zh-cn-') ||
      locale.endsWith('-cn') ||
      locale.includes('hans-cn'),
  );
}

export default function CountryFlag({ countryCode, className = '' }) {
  const normalizedCountryCode = countryCode?.toUpperCase();
  const flagEmoji = normalizedCountryCode ? toFlagEmoji(normalizedCountryCode) : null;
  const FlagIcon = normalizedCountryCode ? flagsByCountryCode[normalizedCountryCode] : null;

  if (!flagEmoji && !FlagIcon) {
    return null;
  }

  const useSvgFallback =
    Boolean(FlagIcon) &&
    (!supportsFlagEmoji() || (normalizedCountryCode === 'TW' && isTaiwanFlagLikelyBlocked()));

  return (
    <span className={joinClassNames('country-flag', className)} aria-hidden="true">
      {useSvgFallback ? (
        <FlagIcon className="country-flag-fallback" focusable="false" />
      ) : (
        <span className="country-flag-emoji">{flagEmoji}</span>
      )}
    </span>
  );
}