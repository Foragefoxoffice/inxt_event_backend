// Input: answers [{ questionId, inputText }], questions
// Output: { score, result, answersWithMeta }
export function handleCrossword(answers, questions) {
  let correctWords = 0
  const answersWithMeta = []
  const reveals = []

  for (const question of questions) {
    const playerAnswer = answers.find(a => String(a.questionId) === String(question._id))
    const playerText = (playerAnswer?.inputText ?? '').trim().toLowerCase()
    const rawPlayerText = (playerAnswer?.inputText ?? '').trim()
    const correctText = (question.answer ?? '').trim().toLowerCase()
    const rawCorrectText = (question.answer ?? '').trim()
    
    const isCorrect = playerText.length > 0 && playerText === correctText
    if (isCorrect) correctWords++

    reveals.push({
      questionId: question._id,
      questionText: question.text,
      playerAnswer: rawPlayerText || 'No answer',
      correctAnswer: rawCorrectText,
      isCorrect
    })

    answersWithMeta.push({
      questionId: question._id,
      selectedOptionId: null,
      inputText: rawPlayerText || null,
      isCorrect,
      aiMatched: false
    })
  }

  const totalWords = questions.length
  const score = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0
  const isComplete = correctWords === totalWords && totalWords > 0

  return {
    score,
    result: { score, correctWords, totalWords, isComplete, reveals },
    answersWithMeta
  }
}
