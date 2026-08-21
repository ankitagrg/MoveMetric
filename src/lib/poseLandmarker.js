import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

let landmarkerPromise = null

export function getPoseLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.0/wasm'
      )
      try {
        return await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.3,
          minPosePresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
        })
      } catch (gpuError) {
        // Some devices (older phones, some in-app browsers, WebGL disabled
        // by policy) can't create a GPU delegate at all. Fall back to CPU
        // once before giving up entirely — slower per-frame, but it means
        // "no capable GPU" degrades to "works, just slower" instead of
        // "capture is broken on this device."
        try {
          return await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.3,
            minPosePresenceConfidence: 0.3,
            minTrackingConfidence: 0.3,
          })
        } catch {
          // Neither delegate worked — surface the original (usually more
          // informative) GPU error rather than the CPU fallback's.
          throw gpuError
        }
      }
    })().catch((err) => {
      // Without this, a failed first attempt (transient network blip, CDN
      // hiccup) poisons this module-level singleton forever: the rejected
      // promise stays cached, so every later call just re-awaits the same
      // dead promise and "Start camera" can never succeed again without a
      // full page reload. Resetting to null lets the next call retry clean.
      landmarkerPromise = null
      throw err
    })
  }
  return landmarkerPromise
}
