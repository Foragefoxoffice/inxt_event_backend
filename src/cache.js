import Question from './models/Question.js'

// cache: { [gameId]: Question[] }
const cache = new Map()

export async function getQuestions(gameId) {
  const key = String(gameId)
  if (cache.has(key)) return cache.get(key)
  const questions = await Question.find({ gameId }).sort({ order: 1 }).lean()
  cache.set(key, questions)
  return questions
}

export function invalidateGame(gameId) {
  cache.delete(String(gameId))
}

export function invalidateAll() {
  cache.clear()
}
