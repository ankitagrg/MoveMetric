import Logo from '../ui/Logo'
import Button from '../ui/Button'
import PoseIllustration from './PoseIllustration'

const rosterIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <circle cx="12" cy="8.5" r="3.25" />
    <path strokeLinecap="round" d="M5 20c0-3.6 3.13-6 7-6s7 2.4 7 6" />
  </svg>
)

const cameraIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.4l.9-1.5a1.5 1.5 0 0 1 1.28-.75h3.84c.52 0 1.01.28 1.28.75l.9 1.5h2.4A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
    <circle cx="12" cy="13" r="3.25" />
  </svg>
)

const gradeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <circle cx="12" cy="12" r="8.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 12.5 2.3 2.3 4.7-5.1" />
  </svg>
)

const steps = [
  {
    icon: rosterIcon,
    title: 'Add a client',
    body: 'Keep a simple roster of everyone you train, with notes and contact info in one place.',
  },
  {
    icon: cameraIcon,
    title: 'Capture a set',
    body: 'Point a webcam at your client during any tracked movement. MoveMetric follows their pose, counts reps, and measures joint angles automatically as they move.',
  },
  {
    icon: gradeIcon,
    title: 'Get a form grade',
    body: 'Each set gets a letter grade (A–F) with a depth, posture, and consistency breakdown, logged against that client alongside the raw numbers.',
  },
]

const audiences = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4.5h8a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" />
        <path strokeLinecap="round" d="M9.5 3.5h5v2h-5zM9 9h6M9 12.5h6M9 16h3.5" />
      </svg>
    ),
    title: 'Physical therapists',
    body: 'Turn every assessment into a dated, objective record — not a paragraph you have to remember.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 14h16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15.5 11 11l3 2.5 4.5-5.5" />
      </svg>
    ),
    title: 'Personal trainers',
    body: 'Show clients the numbers behind their progress, not just your word for it.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
    title: 'Coaches',
    body: 'Compare angle data across sessions to catch form breakdown before it becomes a habit.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <circle cx="12" cy="5.5" r="2" />
        <path strokeLinecap="round" d="M12 7.5v5c0 2 .5 3 2 5l2.5 3.5M12 12.5c0 2-.5 3-2 5l-2.5 3.5" />
      </svg>
    ),
    title: 'Chiropractors',
    body: 'Keep documented movement data on hand to guide every follow-up visit — no guesswork.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3.5" y="5.5" width="17" height="12" rx="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m10 9 4 3-4 3Z" />
      </svg>
    ),
    title: 'Educators & creators',
    body: 'Turn real capture data into clear, shareable examples your students can actually see.',
  },
]

export default function Landing({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex flex-wrap items-center justify-between gap-y-2 px-4 sm:px-6 py-5 max-w-5xl mx-auto border-b border-stone-100">
        <span className="flex items-center gap-2.5">
          <Logo size="sm" />
          <span className="text-lg font-semibold text-stone-900 tracking-tight">MoveMetric</span>
        </span>
        <span className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" onClick={onGetStarted}>
            Sign in
          </Button>
          <Button size="sm" onClick={onGetStarted}>
            Get started
          </Button>
        </span>
      </nav>

      <header className="px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-10 items-center">
          <div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-balance">
              <span className="text-stone-900">Better tools for</span>
              <br />
              <span className="text-stone-300">tracking movement.</span>
            </h1>
            <p className="mt-6 text-lg text-stone-500 text-balance max-w-lg leading-relaxed">
              Capture compound movements, measure joint angles automatically, and track
              how your clients move over time &mdash; in one focused tool built for the
              people who train, treat, and coach movement.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button onClick={onGetStarted}>
                Get started &rarr;
              </Button>
              <a href="#how-it-works" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
                See how it works &rarr;
              </a>
            </div>
            <p className="mt-10 text-sm text-stone-400">
              Built for physical therapists, trainers, and coaches.
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 overflow-hidden max-w-xs mx-auto lg:max-w-none w-full">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-stone-100 bg-stone-50">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-200" />
              <span className="ml-2.5 text-xs text-stone-400 font-mono truncate">movemetric.app/capture</span>
            </div>
            <PoseIllustration className="aspect-3/4 w-full" />
          </div>
        </div>
      </header>

      <section id="who-its-for" className="px-4 sm:px-6 py-16 max-w-4xl mx-auto scroll-mt-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
          Who it&apos;s for
        </h2>
        <p className="mt-3 text-stone-500 text-base leading-relaxed max-w-xl">
          Built for anyone who needs proof of how someone moves, not just an opinion.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-5">
          {audiences.map((a) => (
            <div
              key={a.title}
              className="w-full sm:w-[calc(50%-10px)] lg:w-[calc((100%-40px)/3)] rounded-2xl border border-stone-200 bg-white p-6 transition-all duration-200 hover:border-stone-300 hover:shadow-(--shadow-soft)"
            >
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-stone-900 text-white">
                {a.icon}
              </span>
              <h3 className="mt-5 font-semibold text-stone-900">{a.title}</h3>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="px-4 sm:px-6 py-16 max-w-4xl mx-auto scroll-mt-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
          How it works
        </h2>
        <div className="mt-10 grid sm:grid-cols-3 gap-10 sm:gap-8">
          {steps.map((step, i) => (
            <div key={step.title}>
              <p className="text-6xl font-bold text-stone-200 leading-none select-none tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-4 text-lg font-semibold text-stone-900">{step.title}</h3>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-stone-800 bg-black px-6 py-8 sm:px-10 sm:py-9 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white text-balance">
              A grade for every set, backed by the numbers.
            </h2>
            <p className="mt-3 text-m leading-relaxed text-stone-300 text-balance">
              MoveMetric tracks joint angles in real time, counting reps and
              grading each set A&ndash;F on depth, posture, and consistency.
            </p>
            <p className="mt-3 text-s font-medium text-stone-500 uppercase tracking-wide">
              Rep counting &middot; Tempo tracking &middot; Form grading
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Button variant="secondary" onClick={onGetStarted}>
                Get started &rarr;
              </Button>
              {/* Not the shared Button component — this sits on the black
                  card above, and every Button variant assumes a light
                  surface (dark text, or a bordered white pill); none reads
                  correctly as a plain link on a dark background. */}
              <button
                onClick={onGetStarted}
                className="text-sm font-medium text-stone-300 hover:text-white transition-colors"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-100 bg-stone-50">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-14 flex flex-col items-center text-center gap-6">
          <div>
            <span className="flex items-center justify-center gap-2.5">
              <Logo size="sm" />
              <span className="text-lg font-semibold text-stone-900 tracking-tight">MoveMetric</span>
            </span>
            <p className="mt-3 text-sm text-stone-400 leading-relaxed sm:whitespace-nowrap">
              Objective movement data for the people who train, treat, and coach it.
            </p>
          </div>
          <p className="text-sm text-stone-400">&copy; {new Date().getFullYear()} MoveMetric</p>
        </div>
      </footer>
    </div>
  )
}
