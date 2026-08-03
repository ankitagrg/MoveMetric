export default function Field({ label, id, as = 'input', className = '', children, ...props }) {
  const Tag = as
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1.5">
          {label}
        </label>
      )}
      <Tag
        id={id}
        className={`w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 shadow-sm transition-colors focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 ${className}`}
        {...props}
      >
        {children}
      </Tag>
    </div>
  )
}
