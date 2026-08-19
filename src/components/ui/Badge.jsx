const tones = {
  neutral: 'bg-stone-100 text-stone-600',
  dark: 'bg-stone-900 text-white',
  outline: 'border border-stone-200 text-stone-500',
}

export default function Badge({ tone = 'neutral', className = '', ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${tones[tone]} ${className}`}
      {...props}
    />
  )
}
