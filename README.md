# CampusTwin

CampusTwin is an interactive smart-campus concept, starting with the part that works before a map exists: a polished student dashboard for campus events, clubs, notices, and useful contacts.

## What’s in this prototype

- Responsive CampusTwin dashboard with an understated cyberpunk accent system.
- The opening dashboard prioritizes fixed Quick access links and useful next-step information over recommendations.
- Overview, Events, Clubs & communities, Campus directory, and Campus bulletin pages.
- Event summaries with an “At a glance” panel, event-type filters, and a collapsible club-wise view.
- Clubs page includes a compact upcoming-event glance and a demo club-event posting flow. New-event notices remain visible until the scheduled end time or user dismissal.
- Search across sample campus content, event detail/RSVP, club join state, unread notices, and a feedback/idea form.
- Sample activity and club-event posts are stored only in the current browser. No campus map, GPS, shared live data, accounts, or backend is connected.
- The recommended map-free shortlist and later phases are in [`docs/feature-scope.md`](docs/feature-scope.md).

## Run locally

```bash
npm install
npm run dev
```

Vite listens on `0.0.0.0` for the live preview. To make a production build:

```bash
npm run build
```

## GitHub Pages

Merging to `main` triggers `.github/workflows/deploy-pages.yml`, which builds the Vite app with the repository base path and publishes it to [i-am-dev-god.github.io/CampusTwin](https://i-am-dev-god.github.io/CampusTwin/). The repository’s Pages source is configured for GitHub Actions.

Before adopting this for a real institution, replace example people, venues, dates, and `campus.example` contact details with college-approved information; add authentication and a database for publishing and registrations.
