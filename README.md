# CampusTwin

CampusTwin is an interactive smart-campus concept, starting with the part that works before a map exists: a polished student dashboard for campus events, clubs, notices, and useful contacts.

## What’s in this prototype

- Responsive CampusTwin dashboard with an understated cyberpunk accent system.
- The opening dashboard prioritizes fixed Quick access links and useful next-step information over recommendations.
- Overview, Events, Clubs & communities, My Class, Campus directory, and Campus bulletin pages.
- Event summaries with an “At a glance” panel, event-type filters, and a collapsible club-wise view.
- My Class focuses on a visually prioritized personal deadline list and a section-only class-representative update board. Campus announcements remain separate and are identified as campus-wide notices. A local Student / Class Representative switch previews role-specific controls; it is not authentication or access control. New class-representative posts are highlighted for the student view until marked read. A CR can optionally pin one section update at a time for 1–30 days; the expiry is required and a new pin replaces the previous pin.
- Clubs page includes a compact upcoming-event glance. Real-user club-event publishing is withheld until club leader/core-member profiles and authorization are designed; Developer Mode alone exposes a local-only posting preview. Preview event notices remain until their scheduled end time or user dismissal.
- Supabase email/password sign-up, sign-in, email confirmation, password reset, and sign-out. CampusTwin uses the existing OS-GOD Supabase Auth project, so the account pool is shared.
- Account-free Developer Mode from the sign-in screen: it opens the full prototype with a local-only developer profile, enables preview-only club-event publishing, and keeps developer data in a separate browser-local storage namespace. Class Representative actions remain preview-only. No Developer Mode sign-in, user, or content is written to Supabase.
- Search across sample campus content, event detail/RSVP, club join state, unread notices, and a feedback/idea form.
- A dedicated Update log screen records itemized changes from the original launch to the latest update, newest first; page changes use a short, reduced-motion-aware transition.
- Personal selections, task completion, and preview posts are stored in this browser, scoped per signed-in account. Email authentication is implemented, but campus content, roles, publishing, and registrations are not yet stored in a shared CampusTwin database.
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

### Supabase authentication setup

Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The publishable key is intended for browser use; **never** put a Supabase `service_role`/secret key in Vite variables. GitHub Pages uses the same public client values in its build workflow. Without these variables, the app stays in local demo mode.

CampusTwin currently uses the existing `os-god` Supabase Auth project. Accounts therefore share that project's Auth user pool, and its existing new-user trigger creates the project's standard display-name profile row. CampusTwin does not change existing application tables or store event/class content in Supabase yet. The Student / Class Representative switch is still a demo-only control, not a permission system.

### Account-free Developer Mode

On a configured sign-in screen, choose **Start Developer Mode** to enter without creating an account or authenticating with Supabase. Developer Mode uses a synthetic local profile and its own browser-local storage keys; event posts, class-representative preview actions, registrations, and other preview changes stay in this browser. The **Start from start** control in the sidebar returns to the Dashboard as a Student and closes open overlays, but deliberately keeps saved local preview data. Exiting Developer Mode returns to the normal sign-in/session flow. Club-event publishing is available only in this local developer preview and is not a real role or authorization grant.

## GitHub Pages

Merging to `main` triggers `.github/workflows/deploy-pages.yml`, which builds the Vite app with the repository base path and publishes it to [i-am-dev-god.github.io/CampusTwin](https://i-am-dev-god.github.io/CampusTwin/). The repository’s Pages source is configured for GitHub Actions.

Before adopting this for a real institution, replace example people, venues, dates, and `campus.example` contact details with college-approved information; design trusted role assignments and connect an approved database for publishing and registrations.
