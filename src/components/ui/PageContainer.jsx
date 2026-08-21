export default function PageContainer({ maxWidth = 'max-w-2xl', className = '', children }) {
  return (
    <div className={`w-full ${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-24 space-y-10 animate-fade-up ${className}`}>
      {children}
    </div>
  )
}
