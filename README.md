# World Time

A React world clock for GitHub Pages.

Features:

- TimeAPI-backed clock sync with browser fallback.
- Search by city, country, or IANA timezone.
- SVG world map timezone selection.
- 12h/24h modes, optional milliseconds, localized AM/PM labels, and black/white themes.
- Focus mode that hides everything except the clock.

Local commands:

```bash
npm install
npm run dev
npm run build
npm run deploy
```

Automatic deploy:

- Push to `main` to trigger GitHub Actions.
- The workflow builds the site and publishes `dist` to the `gh-pages` branch.
- In GitHub repository settings, make sure Pages is configured to deploy from the `gh-pages` branch.
