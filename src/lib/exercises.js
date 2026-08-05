import {
  LEFT_SHOULDER, RIGHT_SHOULDER,
  LEFT_ELBOW, RIGHT_ELBOW,
  LEFT_WRIST, RIGHT_WRIST,
  LEFT_HIP, RIGHT_HIP,
  LEFT_KNEE, RIGHT_KNEE,
  LEFT_ANKLE, RIGHT_ANKLE,
} from './landmarks'

// Every exercise is tracked as several simultaneous angles (not just one),
// the way a coach would actually look at a rep: e.g. knee angle AND hip
// angle AND spine lean, all at once. `angles[].type` is 'joint' (angle at
// the middle of a 3-point triplet) or 'lean' (tilt of a 2-point segment
// from vertical) — see computeAngleDef in lib/angles.js. Exactly one angle
// has `primary: true`; that's the one tracked for its rep extreme and saved
// as the metric. The rest are shown live alongside it for context, same as
// the app never outputs a verdict — just the numbers a coach reads.
//
// `referenceLine` is a second landmark pair drawn as a highlighted line
// across the frame, distinct from the angle overlay, for whatever
// alignment the coach is actually eyeballing (e.g. a shoulder-to-ankle
// plumb line to check the torso stays over the base).
//
// `calibration`, when present, lets the trainer record the client's own
// neutral posture before the set, so one of the angles is shown next to a
// personal baseline instead of a generic number.
//
// `range`, when present on an angle, is a general "typical working range"
// pulled from widely-cited coaching conventions (e.g. a squat around
// parallel depth, an elbow near full lockout) — NOT a personalized or
// clinical threshold, and not present on every angle: it's only set where
// a broadly-agreed convention actually exists (skipped e.g. for deadlift
// hip hinge, which varies too much by stance/torso length to give one
// number). Falling outside it is shown as a soft "outside typical range"
// flag, never as a correct/incorrect verdict — the trainer still makes
// the call.
export const EXERCISES = [
  {
    id: 'squat',
    label: 'Squat',
    metricName: 'Squat depth (knee angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower knee angle = deeper squat. Do a rep, then save the deepest reading.',
    angles: [
      {
        // Range covers ~parallel (60-70°) through half-squat (80-100°)
        // depth — a generically-cited "reached working depth" band, not a
        // claim about any individual's ideal depth or joint safety.
        id: 'knee', label: 'Knee angle', type: 'joint', primary: true, range: [55, 100],
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
      {
        id: 'hip', label: 'Hip angle', type: 'joint',
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
      {
        id: 'spine', label: 'Spine angle', type: 'lean',
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_ANKLE], right: [RIGHT_SHOULDER, RIGHT_ANKLE] },
    calibration: {
      checkId: 'spine',
      instructions: 'Stand tall, feet shoulder-width apart, and hold still.',
      stabilityTolerance: 4,
    },
  },
  {
    id: 'lunge',
    label: 'Lunge',
    metricName: 'Lunge depth (front knee angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower knee angle = deeper lunge. Do a rep on your front leg, then save the deepest reading.',
    angles: [
      {
        // ~90° front knee is the standard generic lunge coaching cue.
        id: 'knee', label: 'Front knee angle', type: 'joint', primary: true, range: [80, 100],
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
      {
        id: 'hip', label: 'Hip angle', type: 'joint',
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
      {
        id: 'spine', label: 'Spine angle', type: 'lean',
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_ANKLE], right: [RIGHT_SHOULDER, RIGHT_ANKLE] },
    calibration: null,
  },
  {
    id: 'deadlift',
    label: 'Deadlift',
    metricName: 'Deadlift hip hinge angle',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower hip angle = deeper hip hinge. Do a rep, then save the deepest reading.',
    angles: [
      {
        id: 'hip', label: 'Hip hinge angle', type: 'joint', primary: true,
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
      {
        id: 'knee', label: 'Knee angle', type: 'joint',
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
      {
        id: 'spine', label: 'Spine angle', type: 'lean',
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_ANKLE], right: [RIGHT_SHOULDER, RIGHT_ANKLE] },
    calibration: {
      checkId: 'hip',
      instructions: 'Stand tall and hold still — this records your standing hip angle as a baseline.',
      stabilityTolerance: 4,
    },
  },
  {
    id: 'pushup',
    label: 'Push-up',
    metricName: 'Push-up depth (elbow angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower elbow angle = deeper push-up. Do a rep, then save the deepest reading.',
    angles: [
      {
        // ~90° elbow bend at the bottom is the standard generic push-up
        // depth cue (upper arm roughly parallel to the floor).
        id: 'elbow', label: 'Elbow angle', type: 'joint', primary: true, range: [80, 100],
        left: [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST],
      },
      {
        id: 'shoulder', label: 'Shoulder angle', type: 'joint',
        left: [LEFT_ELBOW, LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_ELBOW, RIGHT_SHOULDER, RIGHT_HIP],
      },
      {
        id: 'hip', label: 'Hip angle', type: 'joint',
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_ANKLE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_ANKLE],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_ANKLE], right: [RIGHT_SHOULDER, RIGHT_ANKLE] },
    calibration: {
      checkId: 'hip',
      instructions: 'Hold the top of a push-up (plank position) and hold still — this records your plank line as a baseline.',
      stabilityTolerance: 4,
    },
  },
  {
    id: 'overhead-press',
    label: 'Overhead press',
    metricName: 'Overhead press lockout (elbow angle)',
    unit: '°',
    extreme: 'max',
    instructions: 'Higher elbow angle = fuller lockout. Do a rep, then save the highest reading.',
    angles: [
      {
        // Full lockout means near-complete elbow extension; some margin
        // below 180° is normal camera/landmark noise, not a bent elbow.
        id: 'elbow', label: 'Elbow angle', type: 'joint', primary: true, range: [165, 180],
        left: [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST],
      },
      {
        id: 'shoulder', label: 'Shoulder angle', type: 'joint',
        left: [LEFT_HIP, LEFT_SHOULDER, LEFT_ELBOW], right: [RIGHT_HIP, RIGHT_SHOULDER, RIGHT_ELBOW],
      },
      {
        id: 'spine', label: 'Spine angle', type: 'lean',
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_HIP, LEFT_WRIST], right: [RIGHT_HIP, RIGHT_WRIST] },
    calibration: null,
  },
]
