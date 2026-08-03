import Button from './ui/Button'
import Card from './ui/Card'

const steps = [
  {
    title: 'Add a client',
    body: 'Keep a simple roster of everyone you train, with notes and contact info in one place.',
  },
  {
    title: 'Capture a squat',
    body: 'Point a webcam at your client. MoveMetric tracks their pose and measures joint angles automatically as they move.',
  },
  {
    title: 'Track what changes',
    body: 'Every capture is logged against that client, so you can see trends across sessions instead of relying on memory.',
  },
]

const audiences = [
  {
    title: 'Physical therapists',
    body: 'Turn an assessment into a dated, objective record instead of a paragraph you have to remember.',
  },
  {
    title: 'Personal trainers',
    body: 'Show clients real numbers instead of just telling them they’re improving.',
  },
  {
    title: 'Coaches',
    body: 'Compare angle data session to session to catch form breakdown before it becomes a habit.',
  },
  {
    title: 'Chiropractors',
    body: 'Keep documented movement data on hand to guide every follow-up visit.',
  },
  {
    title: 'Educators & creators',
    body: 'Turn real capture data into clear, shareable examples for the people you teach.',
  },
]

export default function Landing({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <span className="text-lg font-semibold text-stone-900 tracking-tight">MoveMetric</span>
        <Button variant="secondary" size="sm" onClick={onGetStarted}>
          Sign in
        </Button>
      </nav>

      <header className="px-6 pt-16 pb-20 max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold text-stone-900 tracking-tight text-balance">
          Better tools for tracking movement.
        </h1>
        <p className="mt-5 text-lg text-stone-500 text-balance">
          Capture squat form, measure joint angles automatically, and track how your
          clients move over time &mdash; in one focused tool built for the people who
          train, treat, and coach movement.
        </p>
        <Button size="lg" onClick={onGetStarted} className="mt-8">
          Get started
        </Button>
      </header>

      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 text-center">
          How it works
        </h2>
        <div className="mt-8 grid sm:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <Card key={step.title} className="p-6">
              <div className="text-sm font-medium text-accent-500">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="mt-2 text-lg font-semibold text-stone-900">{step.title}</h3>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 text-center">
          Who it&apos;s for
        </h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {audiences.map((a) => (
            <Card key={a.title} className="p-6">
              <h3 className="font-semibold text-stone-900">{a.title}</h3>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed">{a.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto text-center rounded-3xl bg-stone-900 px-8 py-14">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight text-balance">
            We measure. You interpret.
          </h2>
          <p className="mt-4 text-stone-300 leading-relaxed text-balance">
            MoveMetric tracks joint angles in real time, on video &mdash; it never scores
            a rep, grades your client&apos;s form, or hands you an AI-generated verdict.
            That call stays yours. Just objective numbers, attached to the client and
            session they came from, whenever you need them.
          </p>
          <p className="mt-6 text-sm font-medium text-stone-500 uppercase tracking-wide">
            No AI verdicts &middot; No pass/fail scores &middot; No automated grading
          </p>
        </div>
      </section>

      <footer className="px-6 py-10 flex items-center justify-between text-sm text-stone-400 max-w-4xl mx-auto">
        <span>&copy; {new Date().getFullYear()} MoveMetric</span>
        <button onClick={onGetStarted} className="hover:text-stone-900 transition-colors underline underline-offset-2">
          Sign in
        </button>
      </footer>
    </div>
  )
}
