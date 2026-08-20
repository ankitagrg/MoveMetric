const variants = {
  primary:
    'bg-stone-900 text-white shadow-[0_1px_2px_rgba(23,23,23,0.15)] hover:bg-stone-800 hover:shadow-[0_2px_8px_rgba(23,23,23,0.2)] active:bg-stone-950 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none',
  secondary:
    'bg-white text-stone-900 border border-stone-300 hover:border-stone-900 hover:shadow-[0_1px_4px_rgba(23,23,23,0.08)] disabled:opacity-40 disabled:pointer-events-none',
  ghost:
    'text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none',
  link:
    'text-stone-900 hover:text-stone-500 underline underline-offset-4 decoration-stone-300 disabled:opacity-40 disabled:pointer-events-none',
}

// Rounded-corner box, not a full pill — matches the rounded-xl already used
// on Field's inputs, so buttons and the form fields they sit next to read
// as one consistent shape language instead of two (capsule buttons next to
// square-cornered inputs).
const sizes = {
  icon: 'w-10 h-10 rounded-xl shrink-0',
  sm: 'px-4.5 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-[15px] rounded-xl',
  lg: 'px-10 py-4.5 text-base rounded-xl',
}

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30 focus-visible:ring-offset-2 ${variants[variant]} ${variant === 'link' ? '' : sizes[size]} ${className}`}
      {...props}
    />
  )
}
