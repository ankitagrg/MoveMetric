export default function Field({ label, id, as = 'input', className = '', children, ...props }) {
  const Tag = as
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-stone-800 mb-2">
          {label}
        </label>
      )}
      <Tag
        id={id}
        className={`w-full rounded-xl border border-stone-300 bg-white px-4 py-3.5 text-[15px] text-stone-900 placeholder:text-stone-400 transition-all duration-150 hover:border-stone-400 focus:outline-none focus:border-stone-900 focus:ring-4 focus:ring-stone-900/8 ${className}`}
        {...props}
      >
        {children}
      </Tag>
    </div>
  )
}
