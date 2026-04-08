export function generateLayout(questions) {
  if (!questions || questions.length === 0) return []

  const words = questions.map(q => {
    const raw = q._doc || q
    return {
      id: raw._id || raw.questionId,
      text: (raw.answer || '').toUpperCase(),
      clue: raw.text,
      original: raw
    }
  })

  // Sort by length descending
  words.sort((a, b) => b.text.length - a.text.length)

  const grid = new Map() // { 'r,c': char }
  const placements = [] // { id, row, col, dir }

  function canPlace(word, r, c, dir) {
    for (let i = 0; i < word.length; i++) {
      const currR = dir === 'across' ? r : r + i
      const currC = dir === 'across' ? c + i : c
      const char = word[i]
      
      const existing = grid.get(`${currR},${currC}`)
      if (existing && existing !== char) return false

      // Check neighbors (must not touch other words except at intersections)
      const neighbors = [
        [currR - 1, currC], [currR + 1, currC],
        [currR, currC - 1], [currR, currC + 1]
      ]
      for (const [nr, nc] of neighbors) {
        const nChar = grid.get(`${nr},${nc}`)
        if (nChar && !isIntersection(word, r, c, dir, nr, nc)) return false
      }
    }
    
    // Check start and end boundaries
    const beforeR = dir === 'across' ? r : r - 1
    const beforeC = dir === 'across' ? c - 1 : c
    if (grid.get(`${beforeR},${beforeC}`)) return false

    const afterR = dir === 'across' ? r : r + word.length
    const afterC = dir === 'across' ? c + word.length : c
    if (grid.get(`${afterR},${afterC}`)) return false

    return true
  }

  function isIntersection(word, r, c, dir, nr, nc) {
    for (let i = 0; i < word.length; i++) {
        const currR = dir === 'across' ? r : r + i
        const currC = dir === 'across' ? c + i : c
        if (currR === nr && currC === nc) return true
    }
    return false
  }

  function place(wordObj, r, c, dir) {
    const text = wordObj.text
    for (let i = 0; i < text.length; i++) {
      const currR = dir === 'across' ? r : r + i
      const currC = dir === 'across' ? c + i : c
      grid.set(`${currR},${currC}`, text[i])
    }
    placements.push({ id: wordObj.id, row: r, col: c, dir })
    wordObj.placed = true
  }

  // Place first word
  place(words[0], 0, 0, 'across')

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    let best = null

    for (const placed of placements) {
      const placedWordObj = words.find(w => w.id === placed.id)
      if (!placedWordObj) continue
      const placedWordText = placedWordObj.text

      for (let j = 0; j < placedWordText.length; j++) {
        for (let k = 0; k < word.text.length; k++) {
          if (placedWordText[j] === word.text[k]) {
            const r = placed.dir === 'across' ? placed.row - k : placed.row + j
            const c = placed.dir === 'across' ? placed.col + j : placed.col - k
            const dir = placed.dir === 'across' ? 'down' : 'across'

            if (canPlace(word.text, r, c, dir)) {
              best = { r, c, dir }
              break
            }
          }
        }
        if (best) break
      }
      if (best) break
    }

    if (best) {
      place(word, best.r, best.c, best.dir)
    }
  }

  // Normalize grid (shift to 1,1)
  if (placements.length === 0) return []
  const minR = Math.min(...placements.map(p => p.row))
  const minC = Math.min(...placements.map(p => p.col))

  return questions.map(q => {
    const p = placements.find(x => x.id === (q._id || q.questionId))
    const raw = q._doc || q
    if (!p) return { ...raw, gridRow: 0, gridCol: 0, gridDir: 'across', gridNum: 0 }
    
    return {
      ...raw,
      gridRow: p.row - minR + 1,
      gridCol: p.col - minC + 1,
      gridDir: p.dir,
      gridNum: 0 // Will assign numbers below
    }
  }).filter(q => q.gridRow > 0).sort((a,b) => (a.gridRow * 100 + a.gridCol) - (b.gridRow * 100 + b.gridCol))
  .map((q, idx, arr) => {
     // Assign grid numbers
     const prev = arr.slice(0, idx).find(x => x.gridRow === q.gridRow && x.gridCol === q.gridCol)
     if (prev) {
        q.gridNum = prev.gridNum
     } else {
        q.gridNum = Math.max(0, ...arr.slice(0, idx).map(x => x.gridNum)) + 1
     }
     return q
  })
}
