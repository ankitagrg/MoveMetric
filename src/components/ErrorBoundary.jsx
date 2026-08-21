import { Component } from 'react'
import Button from './ui/Button'
import Logo from './ui/Logo'

// Class component because React error boundaries have no hook equivalent —
// getDerivedStateFromError/componentDidCatch only exist on classes. Without
// this wrapping the app root, any thrown render error (a bad metric value,
// a null landmark the capture math didn't expect, anything) is a blank
// white screen with no way back except the user guessing to hit reload.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error in app tree:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="w-full max-w-sm text-center">
          <Logo className="mx-auto" />
          <h1 className="mt-6 text-xl font-medium text-stone-900 tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm text-stone-500 leading-relaxed">
            MoveMetric hit an unexpected error and couldn&apos;t continue. Reloading usually fixes it —
            nothing you were working on should be lost, since sets are saved as soon as you finish them.
          </p>
          <Button onClick={() => window.location.reload()} className="mt-6">
            Reload
          </Button>
        </div>
      </div>
    )
  }
}
