# Shadow Exchange — Trading Terminal

The frontend is a React + TypeScript + Vite application. Its current first pass is a deliberately art-directed **local prototype**: the market figures, chart series, depth levels and order activity are illustrative mock data.

## Run locally

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

To check the production build:

```powershell
npm run build
npm run preview
```

## Design direction

- Ink / graphite surfaces, warm chalk typography, and a restrained chartreuse signal color.
- Instrument Serif for editorial moments, DM Sans for interface copy, and DM Mono for prices and market data.
- Tight, deliberate data tables and fine dividers rather than a wall of floating rounded cards.
- Motion is reserved for useful feedback and state changes; reduced-motion preferences are respected.
- Responsive layouts for desktop, tablet and mobile.

## Important prototype boundary

Submitting an order currently stages it in local React state only. It does **not** call the Spring Boot API, move money, reserve shares or create a real backend order. Market values are not live financial data. The current backend does not yet expose all the read endpoints this terminal will need, so API integration comes after the initial visual review and endpoint audit.

## Next implementation steps

1. Review the interface at desktop and mobile widths.
2. Refine spacing, type scale, chart proportions and interaction details based on screenshots.
3. Add the missing read APIs and explicit API client.
4. Connect order submission and activity to the backend, with clear loading, success and error states.
5. Add integration tests and recoverable error handling.
