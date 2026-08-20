# MoveMetric

## Introduction
MoveMetric is a web application built for movement professionals — physical therapists, personal trainers, coaches, chiropractors, and fitness educators — who need to track how a client's exercise form changes over time. Instead of relying on memory or handwritten notes after a session, MoveMetric uses a webcam and real-time computer vision to measure a client's joint angles during an exercise rep, and logs those numbers against that specific client so trends can be reviewed session to session.

## Implication (Significance / Problem it Solves)
Movement assessment is traditionally subjective — a trainer eyeballs a squat and writes "depth improving" in a notebook, or a PT recalls "range of motion seemed better" from memory. This makes it hard to:
- Objectively prove progress (or regression) to a client
- Compare form across sessions with any precision
- Maintain a defensible, dated record of assessments (important for PTs/chiropractors)

MoveMetric replaces that subjectivity with **objective, timestamped numeric data** (joint angles in degrees). On top of the raw measurements, each set also gets a heuristic **letter grade (A–F) with a sub-metric breakdown** (depth, posture, rep-to-rep consistency) — a quick read on the set, not a clinical or diagnostic verdict, and it's always shown alongside the raw numbers so the professional's own judgment stays the final word.

## Objective
- Let a trainer/therapist maintain a simple client roster (name, contact info, notes)
- Capture an exercise rep via webcam and automatically track body landmarks in real time
- Compute clinically/coaching-relevant angles (knee, hip, elbow, shoulder, spine lean) simultaneously per exercise, the way a coach would actually assess a rep — not just one number
- Let the user save the rep's extreme value (e.g., deepest squat knee angle) as a dated metric tied to a specific client
- Visualize metric history over time per client (trend charts) to show real progress
- Optionally calibrate against a client's own personal neutral posture baseline, rather than a generic standard
- Flag readings outside a generic "typical range" as a soft, informational cue on the live readout
- Give each completed set a heuristic letter grade (A–F) with a depth/posture/consistency breakdown, logged alongside the raw measurements

## Core Features
1. **Auth** — Supabase-backed sign-up/sign-in (`AuthForm.jsx`, `useAuth.js`)
2. **Client management** — CRUD roster of clients per trainer, with row-level security so trainers only see their own data (`Clients.jsx`, `ClientDetail.jsx`, `useClients.js`, `schema.sql`)
3. **Real-time pose capture** — webcam-based pose landmark detection via MediaPipe Tasks Vision (`poseLandmarker.js`, `ExerciseCapture.jsx`)
4. **Exercise library** — 9 built-in exercises, each defined declaratively with multiple tracked angles, a primary metric, a visual reference line, and optional calibration:
   - Squat (knee depth)
   - Lunge (front knee depth)
   - Deadlift (hip hinge)
   - Push-up (elbow depth)
   - Overhead press (elbow lockout)
   - Barbell row (pull depth)
   - Lat pulldown (pull depth)
   - Chin-up (pull height)
   - Bicep curl (curl depth)
   (`exercises.js`, `angles.js`, `landmarks.js`)
5. **Skeleton + angle overlay** — live canvas drawing of the tracked skeleton and color-coded angle arcs matching the readout labels
6. **Metric logging & trends** — saved reps become rows in a `metrics` table, visualized via `MetricTrendChart.jsx`
7. **Form grading** — a heuristic per-set letter grade (A–F) built from whichever sub-metrics apply to that exercise (depth vs. its typical range, posture/lean control, rep-to-rep consistency), saved as its own metric alongside the raw measurement (`grading.js`)
8. **Annotated video export** — the set is recorded with the skeleton/angle overlay burned in and offered as a downloadable clip on the results screen, for sharing with a client

## Required Tools / Tech Stack
| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite 8 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/postcss`) + Autoprefixer |
| Pose detection / computer vision | `@mediapipe/tasks-vision` (Google MediaPipe Pose Landmarker, GPU-delegated, loaded from CDN) |
| Backend / database / auth | Supabase (`@supabase/supabase-js`) — Postgres with Row Level Security |
| Linting | oxlint |
| Language | JavaScript (JSX), ES modules |
| Runtime requirement | Browser with webcam access + WebGL/GPU support for MediaPipe |

## Data Model (Supabase/Postgres)
- **`clients`** — `id`, `trainer_id` (FK to `auth.users`), `name`, `email`, `phone`, `notes`, `created_at`
- **`metrics`** — `id`, `client_id` (FK to `clients`), `trainer_id`, `metric_name`, `value`, `unit`, `recorded_at`, `notes`

Both tables have RLS policies restricting all access to `auth.uid() = trainer_id`, so each trainer's data is isolated.

## Target Audience
Physical therapists, personal trainers, coaches, chiropractors, and fitness educators/content creators who need objective, longitudinal movement data per client.

## Getting Started
```bash
npm install
npm run dev      # start local dev server
npm run build    # production build
npm run preview  # preview production build
npm run lint      # run oxlint
```

You'll need a Supabase project configured (see `src/lib/supabaseClient.js` and `supabase/schema.sql` for the required tables and policies) and its URL/anon key supplied via environment variables.
