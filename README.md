# MoveMetric

## Introduction
MoveMetric is a web application built for movement professionals — physical therapists, personal trainers, coaches, chiropractors, and fitness educators — who need to track how a client's exercise form changes over time. Instead of relying on memory or handwritten notes after a session, MoveMetric uses a webcam and real-time computer vision to measure a client's joint angles during an exercise rep, and logs those numbers against that specific client so trends can be reviewed session to session.

## Implication (Significance / Problem it Solves)
Movement assessment is traditionally subjective — a trainer eyeballs a squat and writes "depth improving" in a notebook, or a PT recalls "range of motion seemed better" from memory. This makes it hard to:
- Objectively prove progress (or regression) to a client
- Compare form across sessions with any precision
- Maintain a defensible, dated record of assessments (important for PTs/chiropractors)

MoveMetric replaces that subjectivity with **objective, timestamped numeric data** (joint angles in degrees). On top of the raw measurements, each set also gets a heuristic **letter grade (A–F) with a sub-metric breakdown** (depth, posture, rep-to-rep consistency) plus plain-English insights (fatigue trend, depth spread, etc.) — a quick read on the set, not a clinical or diagnostic verdict, and it's always shown alongside the raw numbers so the professional's own judgment stays the final word.

## Objective
- Let a trainer/therapist maintain a simple client roster (name, contact info, notes)
- Capture an exercise rep via webcam and automatically track body landmarks in real time
- Compute clinically/coaching-relevant angles (knee, hip, elbow, shoulder, spine lean) simultaneously per exercise, the way a coach would actually assess a rep — not just one number
- Automatically detect individual reps from the live angle stream (eccentric/bottom-pause/concentric/top-pause phases) and save each rep's extreme value (e.g., deepest squat knee angle) as a dated metric tied to a specific client
- Visualize metric history over time per client (trend charts) to show real progress
- Optionally calibrate against a client's own personal neutral posture baseline, rather than a generic standard
- Flag readings outside a generic "typical range" as a soft, informational cue on the live readout
- Give each completed set a heuristic letter grade (A–F) with a depth/posture/consistency breakdown and generated insights, logged alongside the raw measurements
- Record the set with the skeleton/angle overlay burned in and offer it as a downloadable, shareable clip

## Core Features
1. **Landing + Auth** — public marketing landing page for signed-out visitors, Supabase-backed sign-up/sign-in with a "remember me" option that switches session storage between `localStorage` and `sessionStorage` (`Landing.jsx`, `AuthForm.jsx`, `useAuth.js`, `supabaseClient.js`)
2. **Client management** — CRUD roster of clients per trainer, with row-level security so trainers only see their own data (`ClientsPage.jsx`, `ClientDetailPage.jsx`, `useClients.js`, `schema.sql`)
3. **Real-time pose capture** — webcam-based pose landmark detection via MediaPipe Tasks Vision, with orientation-aware capture resolution (portrait for standing exercises, landscape for exercises performed lying down) (`poseLandmarker.js`, `ExerciseCapture.jsx`)
4. **Exercise library** — 17 built-in exercises, each defined declaratively with multiple simultaneously-tracked angles, one primary (rep-tracked) angle, a visual reference line, and optional posture calibration:
   - Squat, Leg press, Lunge, Bulgarian split squat, Step-up, Pistol squat (knee depth/lockout)
   - Deadlift (hip hinge)
   - Hip thrust, Glute bridge (hip lockout)
   - Push-up, Dip, Bench press (elbow depth)
   - Overhead press (elbow lockout)
   - Barbell row, Lat pulldown, Chin-up, Bicep curl (elbow depth/pull)
   (`exercises.js`, `angles.js`, `landmarks.js`)
5. **Skeleton + angle overlay** — live canvas drawing of the tracked skeleton, color-coded angle arcs matching the readout labels, and the exercise's reference line (`poseOverlay.js`)
6. **Automatic rep detection** — the live angle stream is segmented into individual reps (eccentric → bottom pause → concentric → top pause), each with its own extreme value and phase timing, without the user manually marking rep boundaries (`reps.js`)
7. **Metric logging & trends** — saved reps become rows in a `metrics` table, visualized via `MetricTrendChart.jsx`
8. **Form grading & insights** — a heuristic per-set letter grade (A–F) built from whichever sub-metrics apply to that exercise (depth vs. its typical range, posture/lean control, rep-to-rep consistency), plus plain-English takeaways (e.g. fatigue trend across the set, depth spread across reps) — each rule only fires when the underlying data actually supports the claim (`grading.js`, `CaptureResults.jsx`)
9. **Annotated video export** — the set is recorded with the skeleton/angle overlay burned in, uploaded to a private Supabase Storage bucket, and offered as a downloadable/shareable clip on the results screen; a failed upload never blocks saving the numeric metric itself
10. **Resilience** — a top-level error boundary keeps a crash in one part of the UI (e.g. an exercise capture session) from taking down the whole app (`ErrorBoundary.jsx`)

## Required Tools / Tech Stack
| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite 8, React Router 7 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/postcss`) + Autoprefixer |
| Pose detection / computer vision | `@mediapipe/tasks-vision` (Google MediaPipe Pose Landmarker, GPU-delegated, loaded from CDN) |
| Backend / database / auth / storage | Supabase (`@supabase/supabase-js`) — Postgres with Row Level Security + private Storage bucket for capture videos |
| Testing | Vitest + jsdom |
| Linting | oxlint |
| Language | JavaScript (JSX), ES modules |
| Runtime requirement | Browser with webcam access + WebGL/GPU support for MediaPipe |

## Data Model (Supabase/Postgres)
- **`clients`** — `id`, `trainer_id` (FK to `auth.users`), `name`, `email`, `phone`, `notes`, `created_at`
- **`metrics`** — `id`, `client_id` (FK to `clients`), `trainer_id`, `metric_name`, `value`, `unit`, `recorded_at`, `notes`, `video_path`

Both tables have RLS policies restricting all access to `auth.uid() = trainer_id`, so each trainer's data is isolated. The `capture-videos` Storage bucket is private, with insert/select/delete policies keyed off the uploader's own `auth.uid()` in the object path (`{trainer_id}/{client_id}/{uuid}.webm`), giving videos the same per-trainer isolation as the tables. See `supabase/schema.sql`.

## Target Audience
Physical therapists, personal trainers, coaches, chiropractors, and fitness educators/content creators who need objective, longitudinal movement data per client.

## Getting Started
```bash
npm install
npm run dev        # start local dev server
npm run build       # production build
npm run preview     # preview production build
npm run lint        # run oxlint
npm run test        # run test suite once
npm run test:watch  # run test suite in watch mode
```

You'll need a Supabase project configured (see `src/lib/supabaseClient.js` and `supabase/schema.sql` for the required tables, RLS policies, and storage bucket) with its URL and anon key supplied via a `.env.local` file:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```
