# API Reference — PTIT Physics LMS

> Nguồn chuẩn: controller, DTO và enum trong `src/main/java`. Base URL: `/api/v1`.

## Quy ước

- API bảo vệ dùng `Authorization: Bearer <accessToken>`.
- Response: `{ "status": 200, "message": "Success", "data": {} }`.
- `UUID` là định danh chuẩn; `Instant` dùng ISO UTC; `LocalDate=YYYY-MM-DD`; `LocalTime=HH:mm:ss`.
- Upload/import là `multipart/form-data`, không tự đặt `Content-Type`.
- Phân trang dùng `page` (từ 0) và `size`.

## Role và enum

| Nhóm | Giá trị hợp lệ |
|---|---|
| Role | `STUDENT`, `INSTRUCTOR`, `TA`, `ADMIN` |
| User status | `ACTIVE`, `LOCKED` |
| Class status | `DRAFT`, `ACTIVE`, `COMPLETED`, `ARCHIVED` |
| Enrollment | `ACTIVE`, `DROPPED`, `COMPLETED` |
| Staff lớp | `INSTRUCTOR`, `TA` |
| Lesson | `THEORY`, `LAB`, `EXERCISE`, `EXAM` |
| Material | `PDF`, `VIDEO`, `SLIDE`, `TEXT`, `OTHER`, `MARKDOWN` |
| Question | `MCQ_SINGLE`, `MCQ_MULTI`, `TRUE_FALSE`, `SHORT_ANSWER` |
| Difficulty | `EASY`, `MEDIUM`, `HARD` |
| Exam | `PRACTICE`, `QUIZ`, `MIDTERM`, `FINAL` |
| Attempt | `IN_PROGRESS`, `SUBMITTED`, `GRADED` |
| AI mode | `TEXT`, `VOICE` |

> Không gửi `DOCUMENT`, `TEXTBOOK`, `READING` cho `MaterialType`.

## Endpoint

### Xác thực và user

| Method | Path | Quyền | Request/rule |
|---|---|---|---|
| POST | `/users/signin` | Public | `{username,password}` bắt buộc. |
| POST | `/users/signup` | Public | Đăng ký theo DTO backend. |
| POST | `/users/forgot-password` | Public | `{email}` bắt buộc, đúng định dạng. |
| POST | `/users/reset-password` | Public | `{token,newPassword}`; password ≥ 6. |
| POST | `/users/refresh` | Public | `{refreshToken}` bắt buộc. |
| POST | `/users/logout` | Auth | `{refreshToken}`. |
| GET/PUT | `/users/me` | Auth | PUT `{username?,email?}`; username 4–255, email hợp lệ. |
| PUT | `/users/me/password` | Auth | `{oldPassword,newPassword}`; password mới ≥ 8. |
| GET/PUT | `/users/me/profile` | Auth | `fullName?`, `avatarUrl?`, `dateOfBirth?`, `gender?`, `phone?`, `studentCode?`, `bio?`. |
| POST | `/users/admin/create-user` | ADMIN | `{username,email,password,role}`; username 4–255, email hợp lệ, password ≥ 8. |
| GET/DELETE | `/users/{username}` | ADMIN | Xem/xóa user. |
| GET | `/users/admin/users` | ADMIN | Phân trang user. |
| GET | `/users/admin/users/{id}/profile` | ADMIN | Hồ sơ user. |
| PUT | `/users/admin/users/{id}` | ADMIN | `{role?,email?}`. |
| PUT | `/users/admin/users/{id}/status` | ADMIN | `{status}` bắt buộc. |
| GET/POST | `/users/import-excel/template`, `/users/import-excel` | ADMIN, INSTRUCTOR | POST multipart `file`. |

### Học kỳ, học phần, chủ đề

| Method | Path | Quyền | Request/rule |
|---|---|---|---|
| GET | `/semesters`, `/semesters/{id}` | Public/Auth | Danh sách, chi tiết. |
| POST | `/semesters` | ADMIN | `{semesterCode,semesterName,academicYear,startDate?,endDate?}`; 3 field đầu bắt buộc. |
| PUT | `/semesters/{id}` | ADMIN | `{semesterName,academicYear,startDate?,endDate?}`; name/year bắt buộc. |
| PUT | `/semesters/{id}/set-current` | ADMIN | Không body. |
| GET | `/subjects`, `/subjects/{id}` | Public/Auth | Danh sách, chi tiết. |
| POST | `/subjects` | ADMIN | `{subjectCode,subjectName,description?}`; code/name bắt buộc. |
| PUT | `/subjects/{id}` | ADMIN | `{subjectName,description?}`; name bắt buộc. |
| PUT | `/subjects/{id}/toggle-status` | ADMIN | Không body. |
| GET | `/subjects/{subjectId}/topics[/{topicId}]` | Auth | Chủ đề. |
| POST/PUT | `/subjects/{subjectId}/topics[/{topicId}]` | ADMIN, INSTRUCTOR | `{topicName,orderIndex?,description?}`; topicName bắt buộc. |
| DELETE | `/subjects/{subjectId}/topics/{topicId}` | ADMIN | Xóa chủ đề. |

### Lớp, ghi danh, thời khóa biểu

| Method | Path | Quyền | Request/rule |
|---|---|---|---|
| GET | `/classes`, `/classes/{id}` | ADMIN, INSTRUCTOR, TA | List/detail trong phạm vi quyền. |
| POST | `/classes` | ADMIN, INSTRUCTOR | `{subjectId,semesterId,classCode,maxStudents?}`; 3 field đầu bắt buộc. |
| PUT | `/classes/{id}` | ADMIN, INSTRUCTOR | `{classCode,maxStudents?}`; classCode bắt buộc. |
| PUT | `/classes/{id}/status` | ADMIN, INSTRUCTOR | `{status}` theo `ClassStatus`. |
| GET/POST/DELETE | `/classes/{id}/staff[/{userId}]` | GET: ADMIN/INSTRUCTOR/TA; mutation: ADMIN/INSTRUCTOR | POST `{userId,roleInClass}` bắt buộc. |
| GET | `/classes/{id}/students` | ADMIN, INSTRUCTOR, TA | Danh sách ghi danh. |
| POST | `/classes/{id}/enroll-single` | ADMIN, INSTRUCTOR | `{studentId}` bắt buộc. |
| POST | `/classes/{id}/enroll-bulk` | ADMIN, INSTRUCTOR | `{studentIds}` UUID array không rỗng. |
| PUT/DELETE | `/classes/{id}/students/{studentId}[/status]` | ADMIN, INSTRUCTOR | PUT `{status}` theo `EnrollmentStatus`. |
| GET | `/classes/{id}/activity-logs`, `/classes/{id}/progress`, `/classes/{id}/evidence` | Theo controller | Log/tiến độ/minh chứng. |
| GET | `/classes/{classId}/schedules` | ADMIN, INSTRUCTOR, TA, STUDENT | Lịch lớp thật. |
| POST | `/classes/{classId}/schedules` | ADMIN, INSTRUCTOR | Body lịch dưới đây. |
| PUT/DELETE | `/classes/schedules/{scheduleId}` | ADMIN, INSTRUCTOR | Cập nhật/xóa lịch. |

```json
{"dayOfWeek":2,"startPeriod":1,"endPeriod":3,"startTime":"07:00:00","endTime":"09:30:00","room":"A1-203","building":"Nhà A1","lessonType":"THEORY","notes":"..."}
```

`dayOfWeek` bắt buộc khi tạo, từ 2 đến 8. Các field còn lại tùy chọn.

### Cổng student

| Method | Path | Quyền | Query/rule |
|---|---|---|---|
| GET | `/students/me/classes` | STUDENT, ADMIN | `page?`, `size?`. |
| GET | `/students/me/schedule` | STUDENT, ADMIN | `semesterId?`; ADMIN có `studentId?`. |
| GET/PUT | `/students/me/progress` | STUDENT, ADMIN | PUT `{topicId,classId,progressPercent}`; bắt buộc, percent 0–100. |
| GET | `/students/me/evidence`, `/students/me/activity-logs` | STUDENT, ADMIN | Dữ liệu cá nhân. |
| GET | `/students/me/experiment-assignments` | STUDENT, ADMIN | Bài thí nghiệm được giao. |
| GET | `/students/me/agenda` | STUDENT, ADMIN | Lịch học, thi, hạn nộp gộp. |
| GET | `/students/me/materials` | STUDENT, ADMIN | Query `classId?`, `topicId?`, `type?`; chỉ tài liệu APPROVED. |
| GET | `/students/me/upcoming-tasks` | STUDENT, ADMIN | Nhiệm vụ sắp hạn. |

### Học liệu và tệp

| Method | Path | Quyền | Request/rule |
|---|---|---|---|
| GET | `/topics/{topicId}/materials[/{materialId}]` | Auth | Student chỉ xem tài liệu APPROVED. |
| POST/PUT | `/topics/{topicId}/materials[/{materialId}]` | ADMIN, INSTRUCTOR | multipart: `title`, `type` bắt buộc; `contentText?`, `sourceCitation?`, `file?`. |
| PUT | `/topics/{topicId}/materials/{materialId}/approve` | ADMIN, INSTRUCTOR | Không body. |
| DELETE | `/topics/{topicId}/materials/{materialId}` | ADMIN, INSTRUCTOR | Xóa. |
| POST | `/materials/migrate-legacy-types` | ADMIN | Sửa enum dữ liệu cũ sang `PDF`. |
| POST | `/files/upload` | Auth | multipart `file` bắt buộc, `folder?`. |
| POST | `/files/{fileId}/download-url` | Auth | Link tải ký số 15 phút. |
| GET | `/files/{fileId}/download?token=&expires=` | Signed public | Tải tệp. |

### Ngân hàng câu hỏi

| Method | Path | Quyền | Request/rule |
|---|---|---|---|
| GET | `/questions` | ADMIN, INSTRUCTOR | `subjectId` **bắt buộc**; `topicId?`, `difficultyLevel?`, `page=0`, `size=10`. FE chọn học phần trước. |
| GET | `/questions/{questionId}` | ADMIN, INSTRUCTOR | Chi tiết. |
| POST/PUT | `/questions[/{questionId}]` | ADMIN, INSTRUCTOR | Body dưới đây. |
| PUT | `/questions/{questionId}/approve` | ADMIN | Phê duyệt. |
| DELETE | `/questions/{questionId}` | ADMIN, INSTRUCTOR | Xóa. |
| GET/POST | `/questions/import-excel/template`, `/questions/import-excel` | ADMIN, INSTRUCTOR | POST multipart `file`, `subjectId`, `topicId` bắt buộc. |

```json
{"subjectId":"uuid","topicId":"uuid","questionType":"MCQ_SINGLE","content":"...","mediaUrl":null,"difficultyLevel":"EASY","cognitiveLevel":"UNDERSTAND","options":[{"content":"...","isCorrect":true,"orderIndex":1,"explanation":"..."}]}
```

`subjectId`, `topicId`, `questionType`, `content`, `difficultyLevel` bắt buộc; option nếu có bắt buộc `content`, `isCorrect`.

### Kỳ thi và attempt

| Method | Path | Quyền | Request/rule |
|---|---|---|---|
| POST | `/exams` | ADMIN, INSTRUCTOR | `{classId,matrixId?,title,examType,durationMinutes,startTime?,endTime?}`; class/title/type/duration bắt buộc. |
| GET | `/exams/class/{classId}`, `/exams/{examId}` | Scoped roles | Danh sách/chi tiết đề. |
| PUT/DELETE | `/exams/{examId}` | ADMIN, INSTRUCTOR | PUT: `title?`, `examType?`, `durationMinutes?`, `maxAttempts?`, `startTime?`, `endTime?`, `matrixId?`, `shuffleQuestions?`, `shuffleOptions?`, `isPublished?`. |
| POST/GET/DELETE | `/exams/{examId}/questions[/{questionId}]` | Scoped | POST `{questionId,scoreWeight?,orderIndex?}`; questionId bắt buộc. |
| POST | `/exams/{examId}/generate-questions` | ADMIN, INSTRUCTOR | Không body. |
| POST | `/exams/{examId}/attempts` | STUDENT, ADMIN | Tạo lượt, kiểm tra quyền/thời gian/số lượt. |
| GET | `/exams/{examId}/my-attempt`, `/exams/{examId}/my-attempts` | STUDENT, ADMIN | Lượt hiện tại/lịch sử. |
| GET | `/exams/attempts/{attemptId}` | Scoped roles | Chi tiết lượt. |
| GET | `/exams/attempts/{attemptId}/questions` | Scoped roles | Câu hỏi theo attempt, ẩn đáp án đúng cho student. |
| GET | `/exams/attempts/{attemptId}/progress` | Scoped roles | Tiến độ, thời gian còn lại. |
| POST | `/exams/attempts/{attemptId}/answers` | STUDENT, ADMIN | `{questionId,selectedOptionIds?,answerText?}`; questionId bắt buộc. |
| POST | `/exams/attempts/{attemptId}/autosave` | STUDENT, ADMIN | `BatchSubmitAnswerDTO` lưu nháp hàng loạt. |
| PUT/POST | `/exams/attempts/{attemptId}/submit` | STUDENT, ADMIN | Không body. |
| GET | `/exams/{examId}/attempt-policy` | Scoped roles | Chính sách số lượt/lượt dở dang. |
| GET | `/exams/{examId}/attempts`, `/exams/{examId}/roster` | ADMIN, INSTRUCTOR, TA | Lượt làm/danh sách thí sinh. |
| PUT | `/exams/attempts/{attemptId}/grade` | ADMIN, INSTRUCTOR | `{totalScore,feedback?}`; score bắt buộc, ≥ 0. |
| POST/DELETE | `/exams/{examId}/transfers[/{studentId}]` | ADMIN, INSTRUCTOR | POST `{studentId,originalClassId?,reason?}`. |
| GET | `/exams/my-transferred-exams` | STUDENT, ADMIN | Ca thi ghép. |

### Ma trận, thí nghiệm, AI, analytics

| Method | Path | Quyền | Request/rule |
|---|---|---|---|
| GET/POST | `/exam-matrices` | GET: ADMIN/INSTRUCTOR/TA; POST: ADMIN/INSTRUCTOR | POST `{subjectId,matrixName,examType?,description?,totalPoints?,details}`; subject/name/details bắt buộc. |
| GET/PUT/DELETE | `/exam-matrices/{matrixId}` | GET: ADMIN/INSTRUCTOR/TA; mutation: ADMIN/INSTRUCTOR | Detail `{topicId,difficultyLevel,numQuestions,weightPercent?}`; numQuestions ≥ 1. |
| POST | `/exam-matrices/{matrixId}/validate` | ADMIN, INSTRUCTOR | Không body. |
| GET/POST | `/experiments[/{experimentId}]` | Auth/mutation ADMIN, INSTRUCTOR | Create `{subjectId,title,description?,sceneAssetUrl?,sceneAssetsJson?,instructions?,orderIndex?}`; subject/title bắt buộc. |
| POST | `/experiments/{experimentId}/assign` | ADMIN, INSTRUCTOR | `{classId,dueDate?,instructionsOverride?}`; classId bắt buộc. |
| POST | `/experiments/assignments/{assignmentId}/submit` | STUDENT, ADMIN | multipart `evidenceUrl?`, `file?`, `rawDataJson?`. |
| POST | `/experiments/submissions/{submissionId}/scores` | ADMIN, INSTRUCTOR, TA | `{rubricId?,score?,feedback?,comment?}`. |
| GET | `/experiments/submissions` | ADMIN, INSTRUCTOR, TA, STUDENT | Lịch sử bài nộp; hỗ trợ `assignmentId`, `experimentId`, `classId`, `status`. Với STUDENT, backend bắt buộc lọc theo tài khoản đăng nhập, bao gồm mọi lần nộp. |
| GET | `/experiments/submissions/{submissionId}` | ADMIN, INSTRUCTOR, TA, STUDENT | Chi tiết báo cáo, số liệu, tệp, điểm và thông tin xác nhận. STUDENT chỉ được đọc bài của mình. |
| GET | `/experiments/submissions/{submissionId}/rubric-summary` | ADMIN, INSTRUCTOR, TA, STUDENT | Tổng điểm, điểm tối đa, điểm/nhận xét từng tiêu chí. STUDENT chỉ được đọc bài của mình. |
| GET | `/experiments/submissions` | ADMIN, INSTRUCTOR, TA, STUDENT | Lịch sử bài nộp; hỗ trợ `assignmentId`, `experimentId`, `classId`, `status`. Với STUDENT, backend bắt buộc lọc theo tài khoản đăng nhập, bao gồm mọi lần nộp. |
| GET | `/experiments/submissions/{submissionId}` | ADMIN, INSTRUCTOR, TA, STUDENT | Chi tiết báo cáo, số liệu, tệp, điểm và thông tin xác nhận. STUDENT chỉ được đọc bài của mình. |
| GET | `/experiments/submissions/{submissionId}/rubric-summary` | ADMIN, INSTRUCTOR, TA, STUDENT | Tổng điểm, điểm tối đa, điểm/nhận xét từng tiêu chí. STUDENT chỉ được đọc bài của mình. |
| POST | `/experiments/submissions/{submissionId}/confirmation` | ADMIN, INSTRUCTOR | `{note?}`. |
| POST | `/ai-tutor/conversations` | STUDENT, ADMIN | `{classId,topicId?,mode?}`; classId bắt buộc. |
| GET | `/ai-tutor/conversations/my` | STUDENT, ADMIN | Hội thoại của tôi. |
| GET/POST | `/ai-tutor/conversations/{conversationId}/messages` | STUDENT, ADMIN | POST `{content}` không rỗng. |
| PUT | `/ai-tutor/conversations/{conversationId}/end` | STUDENT, ADMIN | Kết thúc hội thoại. |
| POST | `/ai-tutor/messages/{messageId}/feedback` | STUDENT, ADMIN | Body feedback theo controller. |
| GET | `/analytics/topic-difficulty`, `/question-quality`, `/ai-gaps`, `/material-effectiveness` | INSTRUCTOR, ADMIN | Query filter theo controller. |
| POST | `/analytics/trigger` | ADMIN | `{period?}`. |

### Thông báo, dashboard, admin

| Method | Path | Quyền | Request/rule |
|---|---|---|---|
| GET | `/notifications`, `/notifications/summary` | Auth | Danh sách/tổng hợp. |
| PUT | `/notifications/{id}/read`, `/notifications/read-all` | Auth | Đánh dấu đọc. |
| DELETE | `/notifications/{id}` | Auth | Xóa. |
| POST | `/notifications/classes/{classId}` | ADMIN, INSTRUCTOR | `{title,content,type?,referenceId?,referenceType?}`; title/content bắt buộc. |
| POST | `/notifications/reminders/generate` | Auth | Sinh reminder. |
| GET | `/dashboard/me` | STUDENT, ADMIN | Dashboard cá nhân. |
| GET | `/dashboard/class/{id}`, `/dashboard/class/{id}/student/{studentId}` | INSTRUCTOR, ADMIN | Dashboard lớp/sinh viên. |
| POST | `/dashboard/class/{id}/regenerate` | ADMIN | Regenerate snapshot. |
| GET | `/admin/activity-logs`, `/admin/audit-logs` | ADMIN | Log quản trị. |
| GET/PUT | `/admin/settings[/{key}]` | ADMIN | PUT `{settingValue?,description?}`. |
| POST | `/admin/settings/bulk` | ADMIN | `{settings:{"key":"value"}}`. |

## Xử lý lỗi FE

| HTTP | Hành vi |
|---|---|
| 400/422 | Hiển thị `message` ở form và toast góc phải trên. |
| 401 | Refresh token một lần; thất bại thì đăng xuất. |
| 403 | Toast quyền truy cập; không retry. |
| 404 | Toast, quay về danh sách khi phù hợp. |
| 409 | Với attempt đang dở, mở `attemptId` hiện tại thay vì tạo attempt mới. |
| 500 | Hiển thị lỗi chung; không lộ stack trace/enum Java. |

## Contract JSON chi tiết cho FE

### Envelope, phân trang và lỗi

Mọi API JSON trả envelope sau:

```json
{ "status": 200, "message": "Success", "data": {} }
```

List phân trang trả `data` dạng:

```json
{
  "content": [],
  "totalElements": 50,
  "totalPages": 3,
  "number": 0,
  "size": 20,
  "first": true,
  "last": false
}
```

Lỗi trả:

```json
{ "status": 400, "message": "Tên field hoặc rule lỗi", "data": null }
```

### Schema response dùng chung

```json
// UserDTO / dữ liệu user
{ "userId":"uuid", "username":"sv_an", "email":"sv_an@email.com", "role":"STUDENT", "status":"ACTIVE" }

// UserProfileDTO
{ "userId":"uuid", "fullName":"Lê Văn An", "studentCode":"B21DCCN001", "avatarUrl":null, "dateOfBirth":"2003-01-01", "gender":"MALE", "phone":"", "bio":"" }

// SubjectDTO
{ "subjectId":"uuid", "subjectCode":"PHY101", "subjectName":"Vật lý 1", "description":"", "isActive":true }

// TopicDTO
{ "topicId":"uuid", "subjectId":"uuid", "topicName":"Động học", "orderIndex":1, "description":"" }

// ClassDTO
{ "classId":"uuid", "subjectId":"uuid", "semesterId":"uuid", "classCode":"PHY101-01", "subjectName":"Vật lý 1", "semesterName":"Học kỳ 1", "instructorId":"uuid", "maxStudents":50, "status":"ACTIVE" }

// ClassScheduleDTO
{ "scheduleId":"uuid", "classId":"uuid", "classCode":"PHY101-01", "subjectId":"uuid", "subjectName":"Vật lý 1", "semesterId":"uuid", "instructorId":"uuid", "instructorName":"Nguyễn Văn A", "dayOfWeek":2, "dayOfWeekText":"Thứ Hai", "startPeriod":1, "endPeriod":3, "startTime":"07:00:00", "endTime":"09:30:00", "room":"A1-203", "building":"Nhà A1", "lessonType":"THEORY", "notes":"" }
```

### Request/response xác thực

```json
// POST /users/signin — request
{ "username":"sv_an", "password":"mat-khau" }

// POST /users/signin hoặc /users/refresh — data response
{ "accessToken":"jwt", "refreshToken":"jwt", "user":{ "userId":"uuid", "username":"sv_an", "email":"sv_an@email.com", "role":"STUDENT" } }

// POST /users/forgot-password
{ "email":"sv_an@email.com" }

// POST /users/reset-password
{ "token":"reset-token", "newPassword":"NewPassword123" }

// PUT /users/me/profile
{ "fullName":"Lê Văn An", "avatarUrl":"https://...", "dateOfBirth":"2003-01-01", "gender":"MALE", "phone":"0900000000", "studentCode":"B21DCCN001", "bio":"" }
```

### Request/response lớp và lịch

```json
// POST /classes
{ "subjectId":"uuid", "semesterId":"uuid", "classCode":"PHY101-01", "maxStudents":50 }

// POST /classes/{classId}/staff
{ "userId":"uuid", "roleInClass":"TA" }

// POST /classes/{classId}/enroll-single
{ "studentId":"uuid" }

// POST /classes/{classId}/enroll-bulk
{ "studentIds":["uuid-1","uuid-2"] }

// PUT /classes/{classId}/students/{studentId}/status
{ "status":"ACTIVE" }

// GET /students/me/schedule — data response
[
  { "scheduleId":"uuid", "classCode":"PHY101-01", "subjectName":"Vật lý 1", "dayOfWeek":2, "dayOfWeekText":"Thứ Hai", "startTime":"07:00:00", "endTime":"09:30:00", "building":"Nhà A1", "room":"A1-203", "lessonType":"THEORY" }
]
```

### Học liệu và file

```json
// multipart POST /topics/{topicId}/materials
// fields: title, type, contentText?, sourceCitation?, file?
// type phải là PDF|VIDEO|SLIDE|TEXT|OTHER|MARKDOWN

// LearningMaterialDTO response
{ "materialId":"uuid", "topicId":"uuid", "fileId":"uuid", "title":"Slide chương 1", "type":"SLIDE", "fileUrl":"/api/v1/files/...", "contentText":null, "version":1, "approvalStatus":"APPROVED", "sourceCitation":"Bộ môn Vật lý", "createdBy":"uuid", "createdAt":"2026-10-01T01:00:00Z", "updatedAt":"2026-10-01T01:00:00Z" }

// POST /files/upload multipart response data
{ "url":"/api/v1/files/materials/file.pdf", "storage":"MinIO Object Storage", "size":12345, "contentType":"application/pdf" }

// POST /files/{fileId}/download-url response data
{ "fileId":"uuid", "fileName":"file.pdf", "mimeType":"application/pdf", "fileSizeBytes":12345, "downloadUrl":"/api/v1/files/uuid/download?token=...&expires=...", "expiresAt":"2026-10-01T01:15:00Z" }
```

### Ngân hàng câu hỏi

```json
// GET /questions?subjectId={uuid}&topicId={uuid?}&difficultyLevel={EASY?}&page=0&size=10
// subjectId là bắt buộc.

// QuestionBankDTO response data/content item
{
  "questionId":"uuid", "subjectId":"uuid", "topicId":"uuid", "questionType":"MCQ_SINGLE",
  "content":"Vật 2 kg chịu lực 10 N. Gia tốc là?", "mediaUrl":null,
  "difficultyLevel":"EASY", "cognitiveLevel":"UNDERSTAND", "approvalStatus":"APPROVED",
  "options":[{"optionId":"uuid", "content":"5 m/s²", "isCorrect":true, "orderIndex":1, "explanation":"a=F/m"}]
}

// POST /questions, PUT /questions/{questionId}
{ "subjectId":"uuid", "topicId":"uuid", "questionType":"MCQ_SINGLE", "content":"...", "mediaUrl":null, "difficultyLevel":"EASY", "cognitiveLevel":"UNDERSTAND", "options":[{"content":"A", "isCorrect":true, "orderIndex":1, "explanation":""}] }
```

### Kỳ thi và làm bài

```json
// POST /exams
{ "classId":"uuid", "matrixId":"uuid", "title":"Kiểm tra chương 1", "examType":"PRACTICE", "durationMinutes":45, "startTime":"2026-10-01T01:00:00Z", "endTime":"2026-10-01T02:00:00Z" }

// ExamDTO response
{ "examId":"uuid", "classId":"uuid", "matrixId":"uuid", "title":"Kiểm tra chương 1", "examType":"PRACTICE", "durationMinutes":45, "maxAttempts":3, "startTime":"2026-10-01T01:00:00Z", "endTime":"2026-10-01T02:00:00Z", "shuffleQuestions":false, "shuffleOptions":false, "isPublished":true, "totalQuestions":20 }

// POST /exams/{examId}/questions
{ "questionId":"uuid", "scoreWeight":0.5, "orderIndex":1 }

// ExamAttemptDTO response: start, detail, submit
{ "attemptId":"uuid", "examId":"uuid", "studentId":"uuid", "attemptNumber":1, "startedAt":"2026-10-01T01:00:00Z", "submittedAt":null, "status":"IN_PROGRESS", "totalScore":0 }

// POST /exams/attempts/{attemptId}/answers
{ "questionId":"uuid", "selectedOptionIds":["uuid-option"], "answerText":null }

// POST /exams/attempts/{attemptId}/autosave
{ "answers":[{ "questionId":"uuid", "selectedOptionIds":["uuid-option"], "answerText":null }] }

// GET /exams/attempts/{attemptId}/progress — data
{ "attemptId":"uuid", "totalQuestions":20, "answeredQuestions":8, "remainingSeconds":1820, "status":"IN_PROGRESS" }

// GET /exams/attempts/{attemptId}/questions — data
[
  { "questionId":"uuid", "orderIndex":1, "questionType":"MCQ_SINGLE", "content":"...", "mediaUrl":null, "selectedOptionIds":["uuid-option"], "answerText":null, "options":[{"optionId":"uuid-option", "content":"A", "orderIndex":1}] }
]

// GET /exams/{examId}/attempt-policy — data
{ "examId":"uuid", "maxAttempts":3, "usedAttempts":1, "hasInProgressAttempt":true, "inProgressAttemptId":"uuid", "canStart":false, "reason":"..." }
```

### Thí nghiệm, AI, notification và dashboard

```json
// POST /experiments
{ "subjectId":"uuid", "title":"Rơi tự do", "description":"", "sceneAssetUrl":"https://...", "sceneAssetsJson":{}, "instructions":"", "orderIndex":1 }

// POST /experiments/{experimentId}/assign
{ "classId":"uuid", "dueDate":"2026-10-10T16:59:59Z", "instructionsOverride":"" }

// multipart POST /experiments/assignments/{assignmentId}/submit
// fields: evidenceUrl?, file?, rawDataJson?

// POST /ai-tutor/conversations
{ "classId":"uuid", "topicId":"uuid", "mode":"TEXT" }

// POST /ai-tutor/conversations/{conversationId}/messages
{ "content":"Giải thích định luật II Newton" }

// POST /notifications/classes/{classId}
{ "title":"Nhắc kiểm tra", "content":"Kiểm tra vào thứ Năm", "type":"ANNOUNCEMENT", "referenceId":"uuid", "referenceType":"EXAM" }

// PUT /students/me/progress
{ "topicId":"uuid", "classId":"uuid", "progressPercent":75 }
```
