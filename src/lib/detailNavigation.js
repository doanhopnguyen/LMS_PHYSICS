// Explicit destinations work even when a detail page is opened in a new tab.
export function lecturerBackLink(page, search = '') {
  const parents = {
    'lecturer_course_detail.html': ['lecturer_courses.html', 'Về học phần & lớp học'],
    'lecturer_student_detail.html': ['lecturer_students.html', 'Về danh sách sinh viên'],
    'lecturer_assessment_results.html': ['lecturer_assessments.html', 'Về bài tập & kiểm tra'],
    'lecturer_attempt_detail.html': ['lecturer_assessments.html', 'Về bài tập & kiểm tra'],
    'lecturer_lab_assignment_detail.html': ['lecturer_labs.html', 'Về danh sách thí nghiệm'],
    'lecturer_lab_submission_detail.html': ['lecturer_labs.html', 'Về danh sách thí nghiệm'],
    'lecturer_lab_grading.html': ['lecturer_labs.html', 'Về danh sách thí nghiệm'],
  };
  const parent = parents[page];
  if (!parent) return null;
  const params = new URLSearchParams(search);
  if (page === 'lecturer_attempt_detail.html' && params.get('assessment')) {
    return { href: `lecturer_assessment_results.html?assessment=${encodeURIComponent(params.get('assessment'))}`, label: 'Về kết quả bài kiểm tra' };
  }
  return { href: parent[0], label: parent[1] };
}
