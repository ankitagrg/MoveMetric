const tones = {
  error: 'bg-red-50 text-red-700 border-red-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
}

export default function Alert({ tone = 'error', children }) {
  return (
    <p className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>{children}</p>
  )
}
