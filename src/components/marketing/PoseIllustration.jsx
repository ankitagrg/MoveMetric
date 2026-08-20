// Hero art for the marketing surface. Deliberately reuses the exact visual
// language of the live capture overlay in ExerciseCapture — gray skeleton,
// colored angle arcs with a vertex dot, a dashed reference line, and the
// same dark readout panel — so what a visitor sees on the landing page is
// literally what the product looks like once they're in it.
const BONES = [
  [[120, 51], [130, 148]], // torso
  [[122, 70], [82, 104]], // upper arm
  [[82, 104], [66, 142]], // forearm
  [[130, 148], [98, 214]], // thigh
  [[98, 214], [132, 286]], // shin
  [[132, 286], [160, 292]], // foot
]

const JOINTS = [
  [120, 51], [130, 148], [122, 70], [82, 104], [66, 142], [98, 214], [132, 286], [160, 292],
]

export default function PoseIllustration({ className = '' }) {
  return (
    <div className={`relative bg-stone-900 overflow-hidden ${className}`}>
      <svg viewBox="0 0 240 320" className="w-full h-full">
        <line x1="20" y1="300" x2="220" y2="300" stroke="#404040" strokeWidth="1" />

        <line
          x1="122" y1="51" x2="122" y2="300"
          stroke="var(--color-measure-ref)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8"
        />

        <circle cx="120" cy="38" r="13" fill="none" stroke="#a3a3a3" strokeWidth="2" />

        {BONES.map(([[x1, y1], [x2, y2]], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#737373" strokeWidth="2.5" strokeLinecap="round" />
        ))}
        {JOINTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#a3a3a3" />
        ))}

        {/* Hip angle: shoulder–hip–knee */}
        <polyline
          points="122,70 130,148 98,214"
          fill="none" stroke="var(--color-measure-2)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <circle cx="130" cy="148" r="6" fill="var(--color-measure-2)" />

        {/* Knee angle: hip–knee–ankle */}
        <polyline
          points="130,148 98,214 132,286"
          fill="none" stroke="var(--color-measure-1)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <circle cx="98" cy="214" r="6" fill="var(--color-measure-1)" />
      </svg>

      <div className="absolute top-3 left-3 rounded-lg bg-black/55 backdrop-blur-sm px-3 py-2 space-y-1">
        <div className="flex items-center gap-2 text-xs text-white">
          <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-measure-1)' }} />
          <span className="text-white/70">Knee angle:</span>
          <span className="font-semibold tabular-nums">91°</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white">
          <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-measure-2)' }} />
          <span className="text-white/70">Hip angle:</span>
          <span className="font-semibold tabular-nums">162°</span>
        </div>
      </div>
    </div>
  )
}
