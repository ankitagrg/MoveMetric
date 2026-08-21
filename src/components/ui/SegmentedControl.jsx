import { useEffect, useRef, useState } from 'react'

// Shared pill-style toggle/tab control — used for both the HUD mode switch
// in ExerciseCapture and the section tabs on the client detail page, so the
// two get the same interaction language instead of two bespoke widgets.
const sizes = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2 text-sm',
}

export default function SegmentedControl({ options, value, onChange, size = 'sm', className = '' }) {
  const buttonRefs = useRef({})
  // The selected pill slides between options instead of just recoloring —
  // measured off the actual button DOM (labels vary in width) rather than
  // assumed equal-width columns, so it lands exactly under whichever option
  // is active. Null until the first measurement so nothing renders (and
  // therefore nothing animates in from a wrong position) before that.
  const [indicator, setIndicator] = useState(null)

  useEffect(() => {
    function measure() {
      const btn = buttonRefs.current[value]
      if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [value, options])

  return (
    <div className={`relative inline-flex items-center rounded-full bg-stone-100 p-1.5 ${className}`}>
      {indicator && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 rounded-full bg-stone-900 shadow-sm"
          style={{
            left: indicator.left,
            width: indicator.width,
            transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}
      {options.map((opt) => (
        <button
          key={opt.value}
          ref={(el) => { buttonRefs.current[opt.value] = el }}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`relative z-10 rounded-full font-medium transition-colors duration-200 active:scale-95 ${sizes[size]} ${
            value === opt.value ? 'text-white' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
