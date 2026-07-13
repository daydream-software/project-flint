// Hono's built-in IntrinsicElements type doesn't cover SVG tags (only
// regular HTML) — <svg>/<g>/<path> etc. still work fine at the JSX-factory
// level, just typed loosely here for the wrapper components' own props.
interface MarkProps {
  class?: string
  style?: string
}

/** Daydream Software corporate mark — sun with a nested crescent moon.
 * Uses `currentColor`; recolor the parent and the mark follows. */
export function DaydreamMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <g stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <circle cx="32" cy="32" r="14" />
        <line x1="32" y1="6" x2="32" y2="11" />
        <line x1="32" y1="53" x2="32" y2="58" />
        <line x1="6" y1="32" x2="11" y2="32" />
        <line x1="53" y1="32" x2="58" y2="32" />
        <line x1="14.2" y1="14.2" x2="17.7" y2="17.7" />
        <line x1="46.3" y1="46.3" x2="49.8" y2="49.8" />
        <line x1="14.2" y1="49.8" x2="17.7" y2="46.3" />
        <line x1="46.3" y1="17.7" x2="49.8" y2="14.2" />
      </g>
      <path
        d="M 32 23 A 9 9 0 0 1 32 41 A 4.5 9 0 0 0 32 23 Z"
        fill="currentColor"
        fill-opacity="0.95"
        stroke="currentColor"
        stroke-width="1.1"
        stroke-linejoin="round"
      />
    </svg>
  )
}

/** GitHub octocat mark, used on repo links. */
export function GitHubMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-1.95c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.94 10.94 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.63 1.58.24 2.75.12 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.7 5.37-5.26 5.65.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56C20.21 21.38 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z"
      />
    </svg>
  )
}

export function SunMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </g>
    </svg>
  )
}

export function MoonMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M20.5 14.7A8.5 8.5 0 0 1 9.3 3.5a.6.6 0 0 0-.7-.9A10 10 0 1 0 21.4 15.4a.6.6 0 0 0-.9-.7Z"
      />
    </svg>
  )
}
