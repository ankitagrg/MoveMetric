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
// has `primary: true`; that's the one rep-tracked (see lib/reps.js) and
// scored. The rest are shown live alongside it for context — a secondary
// angle reading outside its own `range` is just a soft flag, never a
// verdict on its own; only the primary angle's `range` drives an actual
// pass/fail per rep.
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
// number — deadlift reps are counted, timed, and scored for consistency
// like any other exercise, they just never get a pass/fail badge).
//
// `orientation` is which way the camera frame should be requested for this
// exercise's body position — 'portrait' (tall) for anything standing, where
// the body's long axis runs head-to-feet; 'landscape' (wide) for anything
// performed lying down (bench press, hip thrust, glute bridge, push-up),
// where the body's long axis runs across the frame instead. A portrait
// frame around a horizontal body wastes most of its height and leaves the
// person cropped left-right; this just points ExerciseCapture at the right
// shape to request from the camera per exercise (see CAPTURE_RESOLUTIONS).
export const EXERCISES = [
  {
    id: 'squat',
    label: 'Squat',
    orientation: 'portrait',
    metricName: 'Squat depth (knee angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower knee angle = deeper squat. Do a rep, then save the deepest reading.',
    angles: [
      {
        // Range covers ~parallel (60-70°) through half-squat (80-100°)
        // depth — a generically-cited "reached working depth" band, not a
        // claim about any individual's ideal depth or joint safety.
        id: 'knee', label: 'Knee', type: 'joint', primary: true, range: [55, 100],
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
      {
        id: 'hip', label: 'Hip', type: 'joint',
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
      {
        id: 'spine', label: 'Spine', type: 'lean',
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
    id: 'leg-press',
    label: 'Leg press',
    orientation: 'portrait',
    metricName: 'Leg press depth (knee angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower knee angle = deeper leg press. Do a rep, then save the deepest reading.',
    angles: [
      {
        // The machine's fixed backrest limits depth well short of a
        // freestanding squat, so this range sits shallower than squat's.
        id: 'knee', label: 'Knee', type: 'joint', primary: true, range: [70, 110],
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
      {
        id: 'hip', label: 'Hip', type: 'joint',
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
    ],
    referenceLine: { left: [LEFT_HIP, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_ANKLE] },
    calibration: null,
  },
  {
    id: 'lunge',
    label: 'Lunge',
    orientation: 'portrait',
    metricName: 'Lunge depth (front knee angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower knee angle = deeper lunge. Do a rep on your front leg, then save the deepest reading.',
    angles: [
      {
        // ~90° front knee is the standard generic lunge coaching cue.
        id: 'knee', label: 'Front knee', type: 'joint', primary: true, range: [80, 100],
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
      {
        id: 'hip', label: 'Hip', type: 'joint',
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
      {
        id: 'spine', label: 'Spine', type: 'lean',
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_ANKLE], right: [RIGHT_SHOULDER, RIGHT_ANKLE] },
    calibration: null,
  },
  {
    id: 'bulgarian-split-squat',
    label: 'Bulgarian split squat',
    orientation: 'portrait',
    metricName: 'Bulgarian split squat depth (front knee angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower front knee angle = deeper split squat. Do a rep on your front leg, then save the deepest reading.',
    angles: [
      {
        id: 'knee', label: 'Front knee', type: 'joint', primary: true, range: [80, 100],
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
      {
        id: 'hip', label: 'Hip', type: 'joint',
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
      {
        id: 'spine', label: 'Spine', type: 'lean',
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_ANKLE], right: [RIGHT_SHOULDER, RIGHT_ANKLE] },
    calibration: null,
  },
  {
    id: 'step-up',
    label: 'Step-up',
    orientation: 'portrait',
    metricName: 'Step-up lockout (front knee angle)',
    unit: '°',
    extreme: 'max',
    instructions: 'Higher front knee angle = fuller lockout at the top. Do a rep, then save the highest reading.',
    angles: [
      {
        // Unlike squat/lunge, a step-up rep drives from a bent start up to
        // a locked-out top — same "rests bent, tracks toward extension"
        // shape as overhead press, so extreme is 'max' here.
        id: 'knee', label: 'Front knee', type: 'joint', primary: true, range: [165, 180],
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
      {
        id: 'hip', label: 'Hip', type: 'joint',
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
      {
        // Leaning forward to sling the body up onto the box with momentum
        // instead of driving through the front leg is the classic step-up
        // fault, so upright posture is a genuine coaching cue here.
        id: 'spine', label: 'Spine', type: 'lean', postureTolerance: 15,
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_ANKLE], right: [RIGHT_SHOULDER, RIGHT_ANKLE] },
    calibration: null,
  },
  {
    id: 'pistol-squat',
    label: 'Pistol squat',
    orientation: 'portrait',
    metricName: 'Pistol squat depth (knee angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower knee angle = deeper single-leg squat. Do a rep, then save the deepest reading.',
    angles: [
      {
        // A pistol squat's working depth is well past a two-leg squat's —
        // full depth on one leg is the standard generic target.
        id: 'knee', label: 'Knee', type: 'joint', primary: true, range: [30, 60],
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
      {
        id: 'hip', label: 'Hip', type: 'joint',
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
      {
        id: 'spine', label: 'Spine', type: 'lean',
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_ANKLE], right: [RIGHT_SHOULDER, RIGHT_ANKLE] },
    calibration: null,
  },
  {
    id: 'deadlift',
    label: 'Deadlift',
    orientation: 'portrait',
    metricName: 'Deadlift hip hinge angle',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower hip angle = deeper hip hinge. Do a rep, then save the deepest reading.',
    angles: [
      {
        id: 'hip', label: 'Hip hinge', type: 'joint', primary: true,
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
      {
        id: 'knee', label: 'Knee', type: 'joint',
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
      {
        id: 'spine', label: 'Spine', type: 'lean',
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
    id: 'hip-thrust',
    label: 'Hip thrust',
    orientation: 'landscape',
    metricName: 'Hip thrust lockout (hip angle)',
    unit: '°',
    extreme: 'max',
    instructions: 'Higher hip angle = fuller lockout. Do a rep, then save the highest reading.',
    angles: [
      {
        // Rests at the bottom (hips flexed) between reps and drives toward
        // full extension at the top — near-straight shoulder-hip-knee is
        // the standard generic lockout cue, same convention as overhead
        // press's elbow lockout.
        id: 'hip', label: 'Hip', type: 'joint', primary: true, range: [160, 180],
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
      {
        id: 'knee', label: 'Knee', type: 'joint',
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_KNEE] },
    calibration: null,
  },
  {
    id: 'glute-bridge',
    label: 'Glute bridge',
    orientation: 'landscape',
    metricName: 'Glute bridge lockout (hip angle)',
    unit: '°',
    extreme: 'max',
    instructions: 'Higher hip angle = fuller lockout. Do a rep, then save the highest reading.',
    angles: [
      {
        // Same hip-extension pattern as hip thrust, but starting flat on
        // the floor rather than shoulders-elevated on a bench — the
        // bodyweight, no-equipment version of the same movement.
        id: 'hip', label: 'Hip', type: 'joint', primary: true, range: [160, 180],
        left: [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE],
      },
      {
        id: 'knee', label: 'Knee', type: 'joint',
        left: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], right: [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_KNEE], right: [RIGHT_SHOULDER, RIGHT_KNEE] },
    calibration: null,
  },
  {
    id: 'pushup',
    label: 'Push-up',
    orientation: 'landscape',
    metricName: 'Push-up depth (elbow angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower elbow angle = deeper push-up. Do a rep, then save the deepest reading.',
    angles: [
      {
        // ~90° elbow bend at the bottom is the standard generic push-up
        // depth cue (upper arm roughly parallel to the floor).
        id: 'elbow', label: 'Elbow', type: 'joint', primary: true, range: [80, 100],
        left: [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST],
      },
      {
        id: 'shoulder', label: 'Shoulder', type: 'joint',
        left: [LEFT_ELBOW, LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_ELBOW, RIGHT_SHOULDER, RIGHT_HIP],
      },
      {
        id: 'hip', label: 'Hip', type: 'joint',
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
    id: 'dip',
    label: 'Dip',
    orientation: 'portrait',
    metricName: 'Dip depth (elbow angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower elbow angle = deeper dip. Do a rep, then save the deepest reading.',
    angles: [
      {
        // Upper arm roughly parallel to the floor at the bottom is the
        // same generic depth cue as push-up, whether it's a dip station,
        // parallel bars, or two chairs at home.
        id: 'elbow', label: 'Elbow', type: 'joint', primary: true, range: [70, 100],
        left: [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST],
      },
      {
        id: 'shoulder', label: 'Shoulder', type: 'joint',
        left: [LEFT_ELBOW, LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_ELBOW, RIGHT_SHOULDER, RIGHT_HIP],
      },
      {
        id: 'spine', label: 'Spine', type: 'lean',
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_ANKLE], right: [RIGHT_SHOULDER, RIGHT_ANKLE] },
    calibration: null,
  },
  {
    id: 'bench-press',
    label: 'Bench press',
    orientation: 'landscape',
    metricName: 'Bench press depth (elbow angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower elbow angle = deeper press. Do a rep, then save the deepest reading.',
    angles: [
      {
        id: 'elbow', label: 'Elbow', type: 'joint', primary: true, range: [70, 100],
        left: [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST],
      },
      {
        id: 'shoulder', label: 'Shoulder', type: 'joint',
        left: [LEFT_ELBOW, LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_ELBOW, RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    // Lying down, torso lean from vertical stays pinned near 90° the whole
    // set and tells a coach nothing — unlike every standing press/pull
    // exercise, there's no meaningful spine angle to track here.
    referenceLine: { left: [LEFT_SHOULDER, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_WRIST] },
    calibration: null,
  },
  {
    id: 'overhead-press',
    label: 'Overhead press',
    orientation: 'portrait',
    metricName: 'Overhead press lockout (elbow angle)',
    unit: '°',
    extreme: 'max',
    instructions: 'Higher elbow angle = fuller lockout. Do a rep, then save the highest reading.',
    angles: [
      {
        // Full lockout means near-complete elbow extension; some margin
        // below 180° is normal camera/landmark noise, not a bent elbow.
        id: 'elbow', label: 'Elbow', type: 'joint', primary: true, range: [165, 180],
        left: [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST],
      },
      {
        id: 'shoulder', label: 'Shoulder', type: 'joint',
        left: [LEFT_HIP, LEFT_SHOULDER, LEFT_ELBOW], right: [RIGHT_HIP, RIGHT_SHOULDER, RIGHT_ELBOW],
      },
      {
        // Unlike squat/lunge/deadlift's spine angle (where forward lean is
        // the point of the exercise), an overhead press torso is supposed to
        // stay close to upright — leaning back is usually the lower back
        // compensating for shoulder mobility, so "closer to vertical" is an
        // actual coaching cue here. `postureTolerance` opts this angle into
        // the posture sub-grade (see grading.js); it's deliberately absent
        // on every other exercise's spine angle for the same reason
        // deadlift's hip hinge has no `range` — there's no one number that
        // fits everyone's build.
        id: 'spine', label: 'Spine', type: 'lean', postureTolerance: 15,
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_HIP, LEFT_WRIST], right: [RIGHT_HIP, RIGHT_WRIST] },
    calibration: null,
  },
  {
    id: 'row',
    label: 'Barbell row',
    orientation: 'portrait',
    metricName: 'Barbell row pull depth (elbow angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower elbow angle = deeper pull. Do a rep, then save the deepest reading.',
    angles: [
      {
        // Elbows drawn back past the torso is the standard generic row
        // depth cue.
        id: 'elbow', label: 'Elbow', type: 'joint', primary: true, range: [60, 90],
        left: [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST],
      },
      {
        id: 'shoulder', label: 'Shoulder', type: 'joint',
        left: [LEFT_ELBOW, LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_ELBOW, RIGHT_SHOULDER, RIGHT_HIP],
      },
      {
        // A bent-over row's torso is braced at a fixed forward lean, not
        // supposed to swing back to vertical — same reasoning as
        // deadlift's spine angle, so no `postureTolerance` here either.
        id: 'spine', label: 'Spine', type: 'lean',
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP] },
    calibration: null,
  },
  {
    id: 'lat-pulldown',
    label: 'Lat pulldown',
    orientation: 'portrait',
    metricName: 'Lat pulldown depth (elbow angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower elbow angle = deeper pulldown. Do a rep, then save the deepest reading.',
    angles: [
      {
        id: 'elbow', label: 'Elbow', type: 'joint', primary: true, range: [45, 75],
        left: [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST],
      },
      {
        id: 'shoulder', label: 'Shoulder', type: 'joint',
        left: [LEFT_ELBOW, LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_ELBOW, RIGHT_SHOULDER, RIGHT_HIP],
      },
      {
        // A seated pulldown should stay upright — leaning back to "help"
        // the pull with body english is a real, common fault, so unlike a
        // row/deadlift's forward lean, this one has a genuine "stay
        // vertical" convention (same reasoning as overhead press above).
        id: 'spine', label: 'Spine', type: 'lean', postureTolerance: 15,
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_WRIST] },
    calibration: null,
  },
  {
    id: 'chinup',
    label: 'Chin-up',
    orientation: 'portrait',
    metricName: 'Chin-up pull height (elbow angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower elbow angle = higher pull. Do a rep, then save the deepest reading.',
    angles: [
      {
        // Chin clearing the bar is the standard generic depth cue; no
        // spine angle here — hanging from a bar, torso barely moves, so
        // there's nothing meaningful for a lean angle to track.
        id: 'elbow', label: 'Elbow', type: 'joint', primary: true, range: [40, 70],
        left: [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST],
      },
      {
        id: 'shoulder', label: 'Shoulder', type: 'joint',
        left: [LEFT_ELBOW, LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_ELBOW, RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_SHOULDER, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_WRIST] },
    calibration: null,
  },
  {
    id: 'curl',
    label: 'Bicep curl',
    orientation: 'portrait',
    metricName: 'Bicep curl depth (elbow angle)',
    unit: '°',
    extreme: 'min',
    instructions: 'Lower elbow angle = fuller curl. Do a rep, then save the deepest reading.',
    angles: [
      {
        id: 'elbow', label: 'Elbow', type: 'joint', primary: true, range: [30, 50],
        left: [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST], right: [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST],
      },
      {
        // The classic curl fault is swinging the upper arm forward to
        // help the lift ("cheat curl") instead of keeping the elbow
        // pinned at the side — unlike a row or press, this angle is
        // supposed to barely move rep to rep.
        id: 'shoulder', label: 'Shoulder', type: 'joint',
        left: [LEFT_ELBOW, LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_ELBOW, RIGHT_SHOULDER, RIGHT_HIP],
      },
      {
        // Swinging the torso to sling the weight up ("body English") is
        // the other classic curl fault, so upright posture is a real cue
        // here too.
        id: 'spine', label: 'Spine', type: 'lean', postureTolerance: 15,
        left: [LEFT_SHOULDER, LEFT_HIP], right: [RIGHT_SHOULDER, RIGHT_HIP],
      },
    ],
    referenceLine: { left: [LEFT_HIP, LEFT_SHOULDER], right: [RIGHT_HIP, RIGHT_SHOULDER] },
    calibration: null,
  },
]

// Whether a rising value for this metric name means genuine improvement —
// the trend chart needs this to color a delta green/red correctly. Most
// exercises here track a 'min' extreme (depth: a *lower* angle is deeper,
// i.e. better), so naively coloring "value went up" as green would show
// improving depth as a regression. Falls back to true (higher is better)
// for anything that isn't a raw exercise angle metric — e.g. the "<label>
// form grade" metric saved alongside it, which is a 0-100 score where
// higher is always better regardless of the exercise's own extreme.
export function higherIsBetterForMetric(metricName) {
  const exercise = EXERCISES.find((e) => e.metricName === metricName)
  return exercise ? exercise.extreme === 'max' : true
}
