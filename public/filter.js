// Progressive enhancement for the landing page's category pills — without
// this, the pills are just labels (all cards stay visible, which is still
// a correct and complete view of the data).
const grid = document.querySelector('[data-project-grid]')
const pills = document.querySelectorAll('[data-filter]')

if (grid && pills.length) {
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const value = pill.dataset.filter
      pills.forEach((p) => p.classList.toggle('is-active', p === pill))
      grid.querySelectorAll('.card').forEach((card) => {
        const show = !value || card.dataset.category === value
        card.style.display = show ? '' : 'none'
      })
    })
  })
}
