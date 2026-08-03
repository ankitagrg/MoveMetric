export function angleAtPoint(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const dot = ab.x * cb.x + ab.y * cb.y
  const magAb = Math.hypot(ab.x, ab.y)
  const magCb = Math.hypot(cb.x, cb.y)
  if (magAb === 0 || magCb === 0) return null

  const cos = Math.min(1, Math.max(-1, dot / (magAb * magCb)))
  return (Math.acos(cos) * 180) / Math.PI
}

export const MIN_VISIBILITY = 0.5

// True only if every given landmark index is present with visibility at or
// above the threshold. Each measurement gates on the specific landmarks it
// uses, independent of whatever a different measurement's vertex happened
// to require.
export function allVisible(landmarks, indices, min = MIN_VISIBILITY) {
  return indices.every((idx) => (landmarks[idx]?.visibility ?? 0) >= min)
}

// Angle between the top->bottom vector and straight down, in degrees.
// Landmarks are normalized with y increasing downward, so "straight down"
// is (0, 1): 0deg = top directly above bottom (upright), 90deg = level.
export function angleFromVertical(top, bottom) {
  if (!top || !bottom) return null
  const v = { x: bottom.x - top.x, y: bottom.y - top.y }
  const mag = Math.hypot(v.x, v.y)
  if (mag === 0) return null
  const cos = Math.min(1, Math.max(-1, v.y / mag))
  return (Math.acos(cos) * 180) / Math.PI
}

// Picks whichever side (left/right) of the body is more visible to the
// camera, once per frame, using the given landmark pair (typically the
// hips) as a stable proxy. Every angle tracked that frame is measured on
// this same side, so a knee/hip/spine reading never mixes limbs.
export function pickSide(landmarks, leftIdx, rightIdx) {
  const leftVis = landmarks[leftIdx]?.visibility ?? 0
  const rightVis = landmarks[rightIdx]?.visibility ?? 0
  if (leftVis < MIN_VISIBILITY && rightVis < MIN_VISIBILITY) return null
  return rightVis > leftVis ? 'right' : 'left'
}

// Computes one angle definition's value for the given side. `def.type`
// 'joint' measures the angle at the middle of a 3-point triplet (e.g.
// hip-knee-ankle); 'lean' measures the top->bottom pair's tilt from
// vertical (e.g. shoulder-hip torso lean). `def.left`/`def.right` hold the
// landmark indices for each side, in vertex-order for 'joint' definitions.
export function computeAngleDef(landmarks, side, def) {
  if (!side) return null
  const pts = side === 'right' ? def.right : def.left
  if (!allVisible(landmarks, pts)) return null

  if (def.type === 'lean') {
    return angleFromVertical(landmarks[pts[0]], landmarks[pts[1]])
  }
  return angleAtPoint(landmarks[pts[0]], landmarks[pts[1]], landmarks[pts[2]])
}
