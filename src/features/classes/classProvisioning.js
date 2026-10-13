// Keep the created class across enrollment/import retries. Never replay POST /classes.
export async function provisionClass(request, draft, existingId, onCreated) {
  let classId = existingId;
  if (!classId) {
    const created = await request('/api/v1/classes', { method:'POST', body:{classCode:draft.classCode,semesterId:draft.semesterId,subjectId:draft.subjectId,instructorId:draft.instructorId} });
    classId = created?.classId;
    if (!classId) throw new Error('Không nhận được mã định danh lớp. Kiểm tra danh sách lớp trước khi thử lại.');
    onCreated(classId);
  }
  if (draft.studentIds?.length) await request(`/api/v1/classes/${classId}/enroll-bulk`, {method:'POST',body:{studentIds:draft.studentIds}});
  let result;
  if (draft.file) {
    const formData=new FormData();formData.set('file',draft.file);
    result=await request(`/api/v1/classes/${classId}/students/import-excel`,{method:'POST',formData});
  }
  return {classId,result};
}
export function generatedClassCode(subject,semester,suffix) {
  return `${subject.subjectCode}-${semester.semesterCode}-${suffix}`;
}
