const variants = {
  primary:
    'bg-stone-900 text-white shadow-sm hover:bg-stone-800 active:bg-stone-950 disabled:opacity-50 disabled:pointer-events-none',
  secondary:
    'bg-white text-stone-900 border border-stone-200 shadow-sm hover:bg-stone-50 disabled:opacity-50 disabled:pointer-events-none',
  ghost:
    'text-stone-500 hover:text-stone-900 disabled:opacity-50 disabled:pointer-events-none',
  link:
    'text-stone-500 hover:text-stone-900 underline underline-offset-2 disabled:opacity-50 disabled:pointer-events-none',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
