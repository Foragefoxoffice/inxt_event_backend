// Input: answers, questions
// Output: { score, result, answersWithMeta }
export function handleMyth(answers, questions) {
  let correctCount = 0
  const answersWithMeta = []
  const reveals = []

  // Only score questions the player was actually served (random one-per-scenario subset)
  const playedIds = new Set(answers.map(a => String(a.questionId)))
  const playedQuestions = questions.filter(q => playedIds.has(String(q._id)))

  for (const question of playedQuestions) {
    const playerAnswer = answers.find(a => String(a.questionId) === String(question._id))
    const selectedOptionId = playerAnswer?.selectedOptionId
    const selectedOption = question.options.find(
      o => String(o._id) === String(selectedOptionId)
    )
    const correctOption = question.options.find(o => o.isCorrect)
    const isCorrect = !!(selectedOptionId && String(selectedOptionId) === String(correctOption?._id))
    
    if (isCorrect) correctCount++

    reveals.push({
      questionId: question._id,
      questionText: question.text,
      scenarioTitle: question.answer || null,
      sectionLabel: question.sectionLabel || null,
      aiRationale: question.aiRationale || null,
      playerChoiceLabel: selectedOption?.label || 'No answer',
      playerChoiceShortLabel: selectedOption?.shortLabel || null,
      playerChoiceSubtitle: selectedOption?.subtitle || null,
      playerChoiceRationale: selectedOption?.badge || null,
      correctLabel: correctOption?.label || 'Unknown',
      correctChoiceShortLabel: correctOption?.shortLabel || null,
      correctChoiceSubtitle: correctOption?.subtitle || null,
      correctChoiceRationale: correctOption?.badge || null,
      isCorrect,
      isMyth: false
    })

    answersWithMeta.push({
      questionId: question._id,
      selectedOptionId: selectedOptionId || null,
      inputText: null,
      isCorrect,
      aiMatched: isCorrect
    })
  }

  const totalQuestions = playedQuestions.length
  const score = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0

  return {
    score,
    result: { score, correctCount, totalQuestions, reveals },
    answersWithMeta
  }
}
