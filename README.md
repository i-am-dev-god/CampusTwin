# CampusTwin

CampusTwin is an interactive smart-campus concept, starting with the part that works before a map exists: a polished student dashboard for campus events, clubs, notices, and useful contacts.

## What’s in this prototype

- Responsive CampusTwin dashboard with an understated cyberpunk accent system.
- The opening dashboard prioritizes fixed Quick access links and useful next-step information over recommendations.
- Overview, Events, Clubs & communities, My Class, Campus directory, and Campus bulletin pages.
- Event summaries with an “At a glance” panel, event-type filters, and a collapsible club-wise view.
- My Class focuses on a visually prioritized personal deadline list and a section-only class-representative update board. Campus announcements remain separate and are identified as campus-wide notices. A local Student / Class Representative switch previews role-specific controls; it is not authentication or access control. New class-representative posts are highlighted for the student view until marked read. A CR can optionally pin one section update at a time for 1–30 days; the expiry is required and a new pin replaces the previous pin.
- Clubs page includes a compact upcoming-event glance. Club-event publishing controls are withheld until club leader/core-member profiles and authorization are designed; existing local event notices remain until their scheduled end time or user dismissal.
- Search across sample campus content, event detail/RSVP, club join state, unread notices, and a feedback/idea form.
- A slide-out Update log lists concise release highlights in chronological order; page changes use a short, reduced-motion-aware transition.
- Personal selections, task completion, and preview posts are stored only in the current browser. No campus map, GPS, shared live data, accounts, or backend is connected.
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
