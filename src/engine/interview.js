// Input: answers [{ questionId, answer }], questions
// Output: { score, result, answersWithMeta }
export function handleInterview(answers, questions) {
  const answersWithMeta = []
  const reveals = []

  // Interview is about content capture, not scoring.
  // We just return the captured answers.
  for (const question of questions) {
    const playerAnswer = answers.find(a => String(a.questionId) === String(question._id))
    const response = (playerAnswer?.answer ?? '').trim()
    
    reveals.push({
      questionId: question._id,
      questionText: question.text,
      response
    })

    answersWithMeta.push({
      questionId: question._id,
      inputText: response || null,
      isCorrect: true, // Always true for valid interviews
      aiMatched: false
    })
  }

  return {
    score: 100, // Fixed score as it's a completion-based task
    result: { score: 100, isComplete: true, reveals },
    answersWithMeta
  }
}
