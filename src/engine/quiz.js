// Input: answers [{ questionId, selectedOptionId }], questions (from cache)
// Output: { score, result, answersWithMeta }
export function handleQuiz(answers, questions) {
  let aiMatchedCount = 0
  const answersWithMeta = []
  const reveals = []

  for (const question of questions) {
    const playerAnswer = answers.find(a => String(a.questionId) === String(question._id))
    const selectedId = playerAnswer?.selectedOptionId
    const aiMatched = !!(selectedId && String(selectedId) === String(question.aiRecommended))

    if (aiMatched) aiMatchedCount++

    const playerOption = question.options.find(o => String(o._id) === String(selectedId))
    const aiOption = question.options.find(o => String(o._id) === String(question.aiRecommended))

    reveals.push({
      questionId: question._id,
      questionText: question.text,
      playerChoiceLabel: playerOption?.label || null,
      aiChoiceLabel: aiOption?.label || null,
      aiRationale: question.aiRationale || null,
      matched: aiMatched
    })

    answersWithMeta.push({
      questionId: question._id,
      selectedOptionId: selectedId || null,
      inputText: null,
      isCorrect: aiMatched,
      aiMatched
    })
  }

  const totalQuestions = questions.length
  const aiMatchPercent = totalQuestions > 0
    ? Math.round((aiMatchedCount / totalQuestions) * 100)
    : 0

  return {
    score: aiMatchPercent,
    result: { score: aiMatchPercent, aiMatchedCount, totalQuestions, aiMatchPercent, reveals },
    answersWithMeta
  }
}
