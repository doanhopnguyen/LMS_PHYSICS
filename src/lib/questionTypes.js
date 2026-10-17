export const questionTypes = [
  ['MCQ_SINGLE', 'Một đáp án'],
  ['MCQ_MULTI', 'Nhiều đáp án'],
  ['SHORT_ANSWER', 'Trả lời ngắn'],
  ['TRUE_FALSE', 'Đúng / Sai'],
];

export const isTextQuestion = (type) => ['SHORT_ANSWER', 'FILL_BLANK'].includes(type);
export const questionTypeLabel = (type) =>
  type === 'FILL_BLANK'
    ? 'Trả lời ngắn'
    : questionTypes.find(([value]) => value === type)?.[1] || 'Loại câu hỏi chưa hỗ trợ';
export const questionInstruction = (type) =>
  ({
    MCQ_SINGLE: 'Chọn một đáp án phù hợp nhất.',
    MCQ_MULTI: 'Chọn tất cả đáp án đúng. Cần chọn đủ và không chọn thừa.',
    TRUE_FALSE: 'Xác định mệnh đề trên là đúng hay sai.',
    SHORT_ANSWER: 'Nhập câu trả lời ngắn. Ghi đơn vị nếu đề bài yêu cầu.',
    FILL_BLANK: 'Nhập đáp án vào ô bên dưới. Ghi đơn vị nếu đề bài yêu cầu.',
  })[type] || 'Loại câu hỏi này chưa được hỗ trợ.';

export function initialAnswerOptions(initial = {}, type = initial.questionType || 'MCQ_SINGLE') {
  if (isTextQuestion(type)) return [];
  if (type === 'TRUE_FALSE') {
    return ['Đúng', 'Sai'].map((content) => {
      const existing = initial.options?.find(
        (row) => row.content?.trim().toLocaleLowerCase('vi') === content.toLocaleLowerCase('vi')
      );
      return { content, isCorrect: Boolean(existing?.isCorrect), explanation: existing?.explanation || '' };
    });
  }
  return initial.options?.length
    ? initial.options.map((row) => ({
        content: row.content || '',
        isCorrect: Boolean(row.isCorrect),
        explanation: row.explanation || '',
      }))
    : Array.from({ length: 4 }, () => ({ content: '', isCorrect: false, explanation: '' }));
}

export function validateQuestionAnswers(type, options, acceptedAnswers = '') {
  if (!questionTypes.some(([value]) => value === type) && type !== 'FILL_BLANK') return 'Loại câu hỏi không hợp lệ.';
  if (isTextQuestion(type))
    return acceptedAnswers.split('\n').some((value) => value.trim()) ? '' : 'Nhập ít nhất một đáp án được chấp nhận.';
  if (options.length < 2 || options.some((row) => !row.content.trim())) return 'Cần ít nhất hai lựa chọn có nội dung.';
  if (new Set(options.map((row) => row.content.trim().toLocaleLowerCase('vi'))).size !== options.length)
    return 'Nội dung các lựa chọn không được trùng nhau.';
  const correct = options.filter((row) => row.isCorrect).length;
  if (type === 'MCQ_MULTI' && correct < 2) return 'Câu nhiều đáp án cần ít nhất hai đáp án đúng.';
  if (type !== 'MCQ_MULTI' && correct !== 1) return 'Chọn đúng một đáp án đúng.';
  if (type === 'TRUE_FALSE' && (options.length !== 2 || options[0].content !== 'Đúng' || options[1].content !== 'Sai'))
    return 'Câu đúng/sai phải có hai lựa chọn Đúng và Sai.';
  return '';
}

export function questionAnswerPayload(type, options, acceptedAnswers) {
  return isTextQuestion(type)
    ? {
        options: [],
        acceptedAnswers: [
          ...new Set(
            acceptedAnswers
              .split('\n')
              .map((value) => value.trim())
              .filter(Boolean)
          ),
        ],
      }
    : {
        options: options.map((row, orderIndex) => ({
          ...row,
          content: row.content.trim(),
          explanation: row.explanation?.trim() || '',
          orderIndex,
        })),
        acceptedAnswers: [],
      };
}

export function answerPayload(question, patch = question) {
  return {
    questionId: question.questionId,
    selectedOptionIds: isTextQuestion(question.questionType) ? [] : [...new Set(patch.selectedOptionIds || [])],
    answerText: isTextQuestion(question.questionType) ? patch.answerText || null : null,
  };
}
