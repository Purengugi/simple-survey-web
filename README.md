# simple-survey-web

The web app for the Flow Survey Platform. Admins manage surveys and
questions here, and anyone can browse surveys and fill one out.

## Prerequisites

- Node.js 20+
- `simple-survey-api` running locally (defaults to `http://localhost:4000`)

## Installation

```bash
npm install
```

## Running locally

```bash
npm run dev
```

Opens on `http://localhost:5173`. Requests to `/api/*` are proxied to
`http://localhost:4000` in dev (see `vite.config.ts`), so there's no CORS
setup to worry about locally.

For production, either keep that same reverse-proxy setup, or serve this app
behind the same domain as the API — `src/api/client.ts` uses relative
`/api/...` paths, so it just needs `/api` to resolve to wherever the API
actually lives.

## Admin login

Seeded by the API's `npm run prisma:seed`: `admin@flowsurvey.test` / `ChangeMe123!`

## Pages

- `/` — Available Surveys (public)
- `/surveys/:surveyId` — survey details before starting
- `/surveys/:surveyId/form` — the stepped survey form
- `/login` — admin sign in
- `/admin/surveys` — Survey Management
- `/admin/surveys/:surveyId/questions` — Question Management
- `/admin/surveys/:surveyId/responses` — Survey Responses (paginated, filterable, certificate downloads)

## Technologies used

- React + TypeScript + Vite
- React Router
- Tailwind CSS v4
- fast-xml-parser — the API speaks XML, so this parses responses into
  regular JS objects. Building the outgoing XML is done by hand in
  `src/api/client.ts` instead of pulling in a library for it (see below).

## A few decisions worth explaining

- I originally used `xmlbuilder2` to build outgoing XML requests, but it
  depends on Node-only internals (`events`, `url`) that don't exist in a
  browser — it crashed the whole app on load. `src/api/client.ts` now has a
  small hand-written XML builder instead, following the same `@attr` / `#text`
  convention fast-xml-parser already uses for parsing, so both directions
  stay consistent.
- Admin routes are only gated client-side by checking for a stored token —
  the actual enforcement happens on the API side, which rejects
  unauthenticated requests regardless of what the frontend does. The token
  lives in `sessionStorage` so it clears when the tab closes.
- Multiple-choice answers get sent as a single comma-separated field
  (`programming_stack=REACT,VUE`), matching what the API expects.
- Certificate downloads fetch the file manually and trigger the download in
  code, rather than using a plain link — the download endpoint needs an
  auth header, which a plain `<a href>` can't send.
