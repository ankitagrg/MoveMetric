const tones = {
  error: 'bg-stone-900 text-white border-stone-900',
  success: 'bg-white text-stone-700 border-stone-200',
}

const icons = {
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0v-4ZM10 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.53-9.03a.75.75 0 0 0-1.06-1.06L9 11.44l-1.47-1.47a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4-4Z" clipRule="evenodd" />
    </svg>
  ),
}

export default function Alert({ tone = 'error', children }) {
  return (
    <p className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>
      {icons[tone]}
      <span>{children}</span>
    </p>
  )
}
