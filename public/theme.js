// Wires up #theme-toggle. The pre-paint bootstrap that sets the initial
// data-theme attribute lives inline in each page's <head> (see Layout.tsx)
// so it runs before first paint — this file only handles the click.
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'
  if (next === 'light') document.documentElement.setAttribute('data-theme', 'light')
  else document.documentElement.removeAttribute('data-theme')
  try {
    localStorage.setItem('flint-theme', next)
  } catch {}
})
