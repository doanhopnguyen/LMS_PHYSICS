import { localDateTimeInput } from './lecturerUtils.js';

// Updates do not depend on the class picker or resend unchanged exam structure.
export function examUpdatePayload(exam, values) {
  const patch = {};
  const current = {
    title: values.title.trim(),
    examType: values.examType || exam.examType,
    durationMinutes: Number(values.durationMinutes),
    maxAttempts: Number(values.maxAttempts),
    shuffleQuestions: values.shuffleQuestions === 'on',
    shuffleOptions: values.shuffleOptions === 'on',
    isPublished: values.isPublished === 'on',
  };
  for (const [key, value] of Object.entries(current)) {
    const previous = exam[key] ?? (key === 'maxAttempts' ? 1 : typeof value === 'boolean' ? false : '');
    if (value !== (typeof value === 'number' ? Number(previous) : previous)) patch[key] = value;
  }
  for (const key of ['startTime', 'endTime']) {
    if (values[key] !== localDateTimeInput(exam[key]) && Date.parse(values[key]) !== Date.parse(exam[key]))
      patch[key] = new Date(values[key]).toISOString();
  }
  if (values.matrixId !== undefined && (values.matrixId || null) !== (exam.matrixId || null))
    patch.matrixId = values.matrixId || null;
  return patch;
}
