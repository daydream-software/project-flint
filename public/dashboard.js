// Progressive enhancement for /dashboard: save a row without a full page
// reload. Every form still works as a plain POST if this fails to load or
// the fetch itself fails — see the catch block below.
document.querySelectorAll('[data-curate-row]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const button = form.querySelector('[data-save-button]')
    const originalLabel = button.textContent

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      const result = await res.json()

      form.classList.toggle('is-featured', result.featured)
      const count = document.querySelectorAll('[data-curate-row].is-featured').length
      const badge = document.querySelector('[data-featured-count]')
      if (badge) badge.textContent = `${count} featured`

      button.textContent = 'Saved'
      button.disabled = true
      setTimeout(() => {
        button.textContent = originalLabel
        button.disabled = false
      }, 1200)
    } catch {
      // Network hiccup or JS/server mismatch — do a real submit as a fallback.
      form.submit()
    }
  })
})
