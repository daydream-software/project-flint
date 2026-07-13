import { MoonMark, SunMark } from './Marks.js'

export function ThemeToggle() {
  return (
    <button id="theme-toggle" class="icon-btn" type="button" aria-label="Toggle theme">
      <SunMark class="i-sun" />
      <MoonMark class="i-moon" />
    </button>
  )
}
