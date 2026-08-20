export default function Card({ className = '', interactive = false, ...props }) {
  return (
    <div
      className={`bg-white border border-stone-200 rounded-2xl transition-all duration-200 ${
        interactive ? 'cursor-pointer hover:border-stone-300 hover:shadow-[var(--shadow-soft)] hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    />
  )
}
