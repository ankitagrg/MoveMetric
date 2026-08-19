import Card from './Card'

export default function EmptyState({ icon, title, message, action }) {
  return (
    <Card className="px-6 py-16 text-center flex flex-col items-center gap-4 border-dashed">
      {icon && (
        <span className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center">
          {icon}
        </span>
      )}
      {title && <p className="text-lg font-medium text-stone-900">{title}</p>}
      {message && <p className="text-sm text-stone-500 max-w-xs">{message}</p>}
      {action && <div className="mt-1.5">{action}</div>}
    </Card>
  )
}
