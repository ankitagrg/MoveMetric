const sizes = {
  sm: { box: 'w-7 h-7 rounded-lg', dot: 3 },
  md: { box: 'w-9 h-9 rounded-xl', dot: 3.5 },
  lg: { box: 'w-14 h-14 rounded-2xl', dot: 5 },
}

// The brand mark: a bent joint with its vertex picked out in the accent
// color, echoing the angle overlay drawn live over a client's video in
// ExerciseCapture — the same visual language, everywhere in the product.
export default function Logo({ size = 'md', className = '' }) {
  const { box, dot } = sizes[size]
  return (
    <span className={`inline-flex items-center justify-center shrink-0 bg-stone-900 ${box} ${className}`}>
      <svg viewBox="0 0 24 24" className="w-[60%] h-[60%]" fill="none">
        <path
          d="M7 17.5 L10.5 10 L18 6.5"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10.5" cy="10" r={dot} fill="white" />
      </svg>
    </span>
  )
}
