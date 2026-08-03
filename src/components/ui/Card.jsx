export default function Card({ className = '', ...props }) {
  return (
    <div
      className={`bg-white border border-stone-200/80 rounded-2xl shadow-sm ${className}`}
      {...props}
    />
  )
}
