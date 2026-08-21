// @vitest-environment jsdom
//
// Needs a real DOM (createRoot, not renderToStaticMarkup) — React's SSR
// APIs don't catch error-boundary errors the same way client rendering
// does, so testing this with a DOM is what actually matches how the app
// runs in main.jsx (createRoot(...).render(...)), not an approximation of it.
import { describe, it, expect, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import ErrorBoundary from './ErrorBoundary'

function Throws() {
  throw new Error('deliberate test error')
}

function renderIntoDom(element) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(element)
  })
  return container
}

describe('ErrorBoundary', () => {
  it('renders children normally when nothing throws', () => {
    const container = renderIntoDom(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    )
    expect(container.textContent).toContain('all good')
  })

  it('catches a thrown render error and shows the fallback instead of crashing', () => {
    // componentDidCatch intentionally logs — silence it so this test's
    // output isn't a wall of expected stack trace noise.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = renderIntoDom(
      <ErrorBoundary>
        <Throws />
      </ErrorBoundary>
    )
    spy.mockRestore()

    expect(container.textContent).toContain('Something went wrong')
    expect(container.textContent).toContain('Reload')
    expect(container.textContent).not.toContain('all good')
  })
})
