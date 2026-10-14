import { api } from './apiClient.js';

// Only called for questions just created/imported by Admin.
export async function approveAdminQuestion(question, client = api.questions) {
  if (!question?.questionId) throw new Error('API chưa trả về mã câu hỏi để phê duyệt.');
  let current = await client.get(question.questionId);
  if (current.approvalStatus === 'APPROVED') return current;
  if (['DRAFT', 'REJECTED'].includes(current.approvalStatus)) {
    current = await client.submitReview(question.questionId);
  }
  if (current.approvalStatus !== 'PENDING') throw new Error('Câu hỏi chưa ở trạng thái chờ duyệt.');
  const approved = (await client.approve(question.questionId)) || { ...current, approvalStatus: 'APPROVED' };
  if (approved.approvalStatus !== 'APPROVED') throw new Error('API chưa xác nhận câu hỏi đã được duyệt.');
  return approved;
}

export async function approveAdminImport(result, client = api.questions) {
  const questions = [...(result.questions || [])];
  const approvalFailures = [];
  for (let index = 0; index < questions.length; index += 3) {
    const batch = await Promise.allSettled(
      questions
        .slice(index, index + 3)
        .map((question) => (question.approvalStatus === 'APPROVED' ? question : approveAdminQuestion(question, client)))
    );
    batch.forEach((entry, offset) => {
      if (entry.status === 'fulfilled') questions[index + offset] = entry.value;
      else approvalFailures.push({ question: questions[index + offset], message: entry.reason.message });
    });
  }
  const totalApproved = questions.filter((question) => question.approvalStatus === 'APPROVED').length;
  const missingQuestions = Math.max(0, Number(result.totalImported || 0) - questions.length);
  return { ...result, questions, totalApproved, approvalFailures, missingQuestions };
}
