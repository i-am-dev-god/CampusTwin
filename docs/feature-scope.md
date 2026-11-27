# CampusTwin: map-free feature shortlist

## Scope rule

For the first release, do not require a campus map, 3D model, GPS, room coordinates, indoor positioning, live sensors, or an external campus system. A **plain-text building/room label** is fine; it is not turn-by-turn navigation. Treat all contact details, dates, venues, and counts in the dashboard as sample data until the college verifies them.

## Build first — useful without a map

These are the best low-dependency picks from the feature catalogue for a hackathon demo and a college-ready dashboard:

| Priority | Feature from the PDF | Map-free version |
| --- | --- | --- |
| 1 | Personalized Dashboard; Student-Friendly UI | One home screen for events, clubs, notices, and useful campus links. |
| 1 | Campus Event Explorer; Event Calendar; Hackathon Finder | Browse and filter a text-first events calendar; event detail and RSVP can be a local demo first. |
| 1 | Club Directory | Club cards, interest categories, next meet-up, and a join/interest button. |
| 1 | Notice Board; Campus News Feed; Smart Notifications | An official campus bulletin with unread state and in-app updates. |
| 1 | Search Facility; Fast Search; Category Filters | Search across events, clubs, people, departments, and services; filter by type. |
| 1 | Faculty Directory; Department Information; Campus Contact Directory | Searchable people, department, and contact records. Keep office/building names as text. |
| 1 | Library Information; Laboratory Directory; Facility Information | A resource directory with descriptions, hours, services, and a text-only campus/building label. |
| 1 | Lost and Found | A moderated list of found/missing items and a simple submission form. No location tracking. |
| 1 | Feedback System; Incident Reporting; Issue Management | A small form that collects an idea or campus issue. Add moderation and routing before a real launch. |
| 2 | Class Timetable; AI Timetable Assistant | A student-entered timetable and simple “what’s next?” view; no room-finding or route directions. |
| 2 | Smart FAQ System; Digital Campus Guide | Searchable, college-approved FAQs and a first-year welcome guide. Start rule-based; no AI integration required. |
| 2 | Favorites and Bookmarks; Search History | Save events, clubs, and directory entries in the browser first. |
| 2 | Workshop Registration; Event Feedback; Event Reminders | Local RSVP/feedback for a prototype; email/push reminders need a service and permissions. |
| 2 | Campus Gallery; Student Community | A small, moderated student-life feed/gallery. Use approved images and clear posting rules. |
| 2 | Emergency Contact Button; Emergency SOS | A clearly labelled call/contact page only after the college supplies and verifies emergency numbers. |
| 3 | Admin Dashboard; Event Management; Announcement Management | Admin forms and a preview can be mocked; publishing safely needs authentication, roles, and a database. |
| 3 | Multilingual Support | Translate the fixed interface and approved FAQs into Telugu/Hindi; validate with fluent speakers. |
| 3 | QR Code Navigation | A QR code may open a building information page without showing a map. Useful as an easy later demo. |

The current UI implements the first dashboard slice: **Overview, Events, Clubs, Campus Directory, Campus Bulletin, My Class / Section A, search, local RSVP/join/read states, local preview forms, and a chronological Update Log**. My Class updates and the student/class-representative preview role are stored only in the browser; posting does not notify other students and is not authenticated. A representative-preview post may optionally be pinned for 1–30 days, with a required expiry and only one active pin at a time. Interactions are local to the browser; this is not connected to a college account or database.

## Defer — needs a map, positioning, or spatial data

Keep these out of the first dashboard release: 3D campus visualization, building exploration/markers, map rotation/zoom, map-based facility search, smart/shortest/accessible/time-based/crowd-aware routes, indoor and room-level navigation, floor selectors, event-venue navigation, AR navigation, real-time location tracking, lost-student mode, landmark recognition, offline maps, security/first-aid/utility locators, emergency exits, night-safety routes, evacuation routes, and map updates. A text directory can still show a verified building name, but must not imply that it can navigate someone there.

Some catalogue items do not need a map but still need substantial material or integrations, so they are **not** good first-week tasks: live facility availability, live crowd data, AI/voice assistants, image recognition, 360° tours, virtual tours, user accounts, real analytics, PWA/offline support, IoT/smart parking, energy/water/occupancy monitoring, predictive maintenance, and multi-campus administration.

## Three small, fun additions

1. **“What’s the vibe?” one-tap poll** — a weekly, optional campus question (music for the fest? best study soundtrack?) with aggregate results. No location data; add moderation and an expiry date.
2. **Study-circle board** — students post a subject and a time, others can join. Start with manually chosen time slots; do not expose personal contact details publicly.
3. **Today’s menu + tiny rating** — a dining team posts the menu, students tap a quick rating or dietary note. It is useful, social, and independent of maps; the college can update it from a simple admin form later.

## Suggested hackathon cut

Demo the **dashboard → event details/RSVP → club discovery/join → bulletin/search** loop with believable sample content. Present maps, AI, and live campus data as future phases, not as capabilities the prototype already has. Before a real college rollout, replace sample content, add authentication/permissions, connect approved data sources, and review accessibility, privacy, and moderation.
