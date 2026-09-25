# API Reference – Vật lý 1

Tài liệu này được tạo tự động từ OpenAPI đang chạy tại `http://localhost:8080/v3/api-docs`. Gồm **87 đường dẫn** và **110 thao tác API**.

## Cách gọi chung

- Base URL: `http://localhost:8080`; mọi endpoint bên dưới đã gồm tiền tố `/api/v1`.
- API cần đăng nhập gửi header `Authorization: Bearer <accessToken>` và thường dùng `Content-Type: application/json`.
- API upload hoặc nộp tệp dùng `multipart/form-data`; gửi từng trường theo tên hiển thị trong phần Input.
- Response JSON được tạo từ schema OpenAPI. Giá trị `<string>`, `<…>` chỉ là placeholder, không phải giá trị server trả về.
- API công khai: đăng ký/đăng nhập/làm mới token/quên-đặt lại mật khẩu và đọc tệp. Các API khác yêu cầu Bearer token.

## `GET /api/v1/admin/activity-logs`

**Mô tả:** Truy vấn nhật ký hoạt động hệ thống (Chỉ Admin)

Lọc nhật ký hoạt động theo người dùng, loại hành động và khoảng thời gian.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `userId` | query | Không | string (uuid) | - |
| `actionType` | query | Không | string | - |
| `startDate` | query | Không | string (date-time) | - |
| `endDate` | query | Không | string (date-time) | - |
| `page` | query | Không | integer | Zero-based page index (0..N) |
| `size` | query | Không | integer | The size of the page to be returned |
| `sort` | query | Không | array | Sorting criteria in the format: property,(asc\\|desc). Default sort order is ascending. Multiple sort criteria are supported. |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponsePageActivityLog` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "totalPages":  0,
                 "totalElements":  0,
                 "size":  0,
                 "content":  {
                                 "userId":  "<…>",
                                 "username":  "<…>",
                                 "email":  "<…>",
                                 "role":  "<…>",
                                 "status":  "<…>"
                             },
                 "number":  0,
                 "first":  false,
                 "last":  false,
                 "numberOfElements":  0,
                 "sort":  {
                              "empty":  false,
                              "sorted":  false,
                              "unsorted":  false
                          },
                 "pageable":  {
                                  "offset":  0,
                                  "sort":  {
                                               "empty":  "<…>",
                                               "sorted":  "<…>",
                                               "unsorted":  "<…>"
                                           },
                                  "pageNumber":  0,
                                  "pageSize":  0,
                                  "paged":  false,
                                  "unpaged":  false
                              },
                 "empty":  false
             }
}
```

## `GET /api/v1/admin/audit-logs`

**Mô tả:** Truy vấn nhật ký kiểm toán bảo mật (Chỉ Admin)

Lọc nhật ký kiểm toán thay đổi dữ liệu theo thực thể và người dùng.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `entity` | query | Không | string | - |
| `userId` | query | Không | string (uuid) | - |
| `page` | query | Không | integer | Zero-based page index (0..N) |
| `size` | query | Không | integer | The size of the page to be returned |
| `sort` | query | Không | array | Sorting criteria in the format: property,(asc\\|desc). Default sort order is ascending. Multiple sort criteria are supported. |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponsePageAuditLog` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "totalPages":  0,
                 "totalElements":  0,
                 "size":  0,
                 "content":  {
                                 "userId":  "<…>",
                                 "username":  "<…>",
                                 "email":  "<…>",
                                 "role":  "<…>",
                                 "status":  "<…>"
                             },
                 "number":  0,
                 "first":  false,
                 "last":  false,
                 "numberOfElements":  0,
                 "sort":  {
                              "empty":  false,
                              "sorted":  false,
                              "unsorted":  false
                          },
                 "pageable":  {
                                  "offset":  0,
                                  "sort":  {
                                               "empty":  "<…>",
                                               "sorted":  "<…>",
                                               "unsorted":  "<…>"
                                           },
                                  "pageNumber":  0,
                                  "pageSize":  0,
                                  "paged":  false,
                                  "unpaged":  false
                              },
                 "empty":  false
             }
}
```

## `GET /api/v1/admin/settings`

**Mô tả:** Lấy toàn bộ cấu hình hệ thống

Chỉ Admin được quyền truy cập.

**Xác thực:** Bearer JWT

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListSystemSetting` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "settingKey":  "<string>",
                 "settingValue":  "<string>",
                 "description":  "<string>",
                 "updatedBy":  "00000000-0000-0000-0000-000000000000",
                 "updatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/admin/settings/{key}`

**Mô tả:** Lấy một cấu hình theo key

Chỉ Admin được quyền truy cập.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `key` | path | Có | string | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseSystemSetting` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "settingKey":  "<string>",
                 "settingValue":  "<string>",
                 "description":  "<string>",
                 "updatedBy":  "00000000-0000-0000-0000-000000000000",
                 "updatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `PUT /api/v1/admin/settings/{key}`

**Mô tả:** Cập nhật một cấu hình

Chỉ Admin được quyền truy cập.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `key` | path | Có | string | - |


### Input: request body (application/json, bắt buộc)

Schema: `UpdateSettingRequest`

```json
{
    "settingValue":  "<string>",
    "description":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseSystemSetting` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "settingKey":  "<string>",
                 "settingValue":  "<string>",
                 "description":  "<string>",
                 "updatedBy":  "00000000-0000-0000-0000-000000000000",
                 "updatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `POST /api/v1/admin/settings/bulk`

**Mô tả:** Cập nhật nhiều cấu hình cùng lúc

Chỉ Admin được quyền truy cập.

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `BulkUpdateSettingsRequest`

```json
{
    "settings":  {
                     "key":  "<string>"
                 }
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListSystemSetting` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "settingKey":  "<string>",
                 "settingValue":  "<string>",
                 "description":  "<string>",
                 "updatedBy":  "00000000-0000-0000-0000-000000000000",
                 "updatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `POST /api/v1/ai-tutor/conversations`

**Mô tả:** Khởi tạo phiên hội thoại mới với trợ giảng AI Socratic

Mở phiên thảo luận bài tập, giải đáp khái niệm vật lý theo phương pháp Socratic.

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `StartAiConversationDTO`

```json
{
    "classId":  "00000000-0000-0000-0000-000000000000",
    "topicId":  "00000000-0000-0000-0000-000000000000",
    "mode":  "TEXT"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseAiConversationDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "conversationId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "mode":  "TEXT",
                 "startedAt":  "2026-09-24T10:00:00Z",
                 "endedAt":  "2026-09-24T10:00:00Z",
                 "messageCount":  0
             }
}
```

## `PUT /api/v1/ai-tutor/conversations/{conversationId}/end`

**Mô tả:** Kết thúc phiên hội thoại AI

Đóng phiên thảo luận sau khi sinh viên đã giải quyết xong thắc mắc.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `conversationId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseAiConversationDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "conversationId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "mode":  "TEXT",
                 "startedAt":  "2026-09-24T10:00:00Z",
                 "endedAt":  "2026-09-24T10:00:00Z",
                 "messageCount":  0
             }
}
```

## `GET /api/v1/ai-tutor/conversations/{conversationId}/messages`

**Mô tả:** Lấy lịch sử tin nhắn trong phiên hội thoại AI

Xem lại toàn bộ trao đổi giữa sinh viên và trợ giảng AI.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `conversationId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListAiMessageDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "messageId":  "00000000-0000-0000-0000-000000000000",
                 "conversationId":  "00000000-0000-0000-0000-000000000000",
                 "sender":  "USER",
                 "contentText":  "<string>",
                 "audioUrl":  "<string>",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `POST /api/v1/ai-tutor/conversations/{conversationId}/messages`

**Mô tả:** Gửi câu hỏi / tin nhắn cho trợ giảng AI

Nhận phản hồi gợi mở, gợi ý tư duy kèm trích dẫn tài liệu học tập chính thức.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `conversationId` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `SendAiMessageDTO`

```json
{
    "content":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseAiMessageDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "messageId":  "00000000-0000-0000-0000-000000000000",
                 "conversationId":  "00000000-0000-0000-0000-000000000000",
                 "sender":  "USER",
                 "contentText":  "<string>",
                 "audioUrl":  "<string>",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/ai-tutor/conversations/my`

**Mô tả:** Lấy danh sách các phiên hội thoại AI của sinh viên

Xem danh sách các phiên thảo luận trợ giảng AI của sinh viên đang đăng nhập.

**Xác thực:** Bearer JWT

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListAiConversationDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "conversationId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "mode":  "TEXT",
                 "startedAt":  "2026-09-24T10:00:00Z",
                 "endedAt":  "2026-09-24T10:00:00Z",
                 "messageCount":  0
             }
}
```

## `POST /api/v1/ai-tutor/messages/{messageId}/feedback`

**Mô tả:** Gửi phản hồi / đánh giá câu trả lời của AI

Đánh giá chất lượng trợ giảng (hữu ích, chưa rõ ràng, từ chối đúng/sai).

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `messageId` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `AiFeedbackDTO`

```json
{
    "rating":  0,
    "comment":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `GET /api/v1/analytics/ai-gaps`

**Mô tả:** Thống kê lỗ hổng kiến thức & từ chối của AI Socratic

Tổng hợp các chủ đề sinh viên hay bị AI từ chối giải đáp hoặc hỏi nhiều nhất.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | query | Không | string (uuid) | - |
| `period` | query | Không | string | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListAiTopicGapDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "gapId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "topicName":  "<string>",
                 "refusalCount":  0,
                 "frequentQuerySample":  "<string>",
                 "period":  "<string>",
                 "generatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/analytics/material-effectiveness`

**Mô tả:** Đánh giá hiệu quả học liệu số

Đo lường thời gian đọc, lượt xem và mức độ cải thiện điểm số tương quan.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | query | Không | string (uuid) | - |
| `topicId` | query | Không | string (uuid) | - |
| `period` | query | Không | string | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListMaterialEffectivenessDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "materialId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "topicName":  "<string>",
                 "period":  "<string>",
                 "viewCount":  0,
                 "avgTimeSpentSeconds":  0,
                 "correlatedScoreImprovement":  0
             }
}
```

## `GET /api/v1/analytics/question-quality`

**Mô tả:** Đánh giá chất lượng câu hỏi & chỉ số phân biệt (DI)

Tính tỉ lệ đúng, chỉ số phân biệt Discrimination Index và nhãn chất lượng câu hỏi.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | query | Không | string (uuid) | - |
| `topicId` | query | Không | string (uuid) | - |
| `minUsed` | query | Không | integer (int32) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListQuestionQualityDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "questionId":  "00000000-0000-0000-0000-000000000000",
                 "questionText":  "<string>",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "topicName":  "<string>",
                 "timesUsed":  0,
                 "correctRate":  0,
                 "discriminationIndex":  0,
                 "avgTimeSeconds":  0,
                 "qualityLabel":  "<string>",
                 "updatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/analytics/topic-difficulty`

**Mô tả:** Phân tích độ khó chương mục kiến thức

Tính toán điểm trung bình, tỉ lệ sai sót và các phương án nhiễu phổ biến theo lý thuyết CTT.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `classId` | query | Không | string (uuid) | - |
| `subjectId` | query | Không | string (uuid) | - |
| `period` | query | Không | string | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListTopicDifficultyDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "statId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "topicName":  "<string>",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "avgScore":  0,
                 "errorRate":  0,
                 "commonWrongOptionsJson":  "<string>",
                 "period":  "<string>",
                 "generatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `POST /api/v1/analytics/trigger`

**Mô tả:** Kích hoạt thủ công tiến trình tổng hợp số liệu CTT (Chỉ Admin)

Chạy tác vụ tính toán lại toàn bộ chỉ số phân tích học thuật.

**Xác thực:** Bearer JWT

### Input: request body (application/json, không bắt buộc)

Schema: `TriggerAggregationRequestDTO`

```json
{
    "period":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `-` |

## `GET /api/v1/classes`

**Mô tả:** Lấy danh sách lớp học

Lấy danh sách lớp học. Trả về theo phân quyền của người gọi (Admin thấy hết, GV thấy lớp của mình).

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | query | Không | string (uuid) | - |
| `semesterId` | query | Không | string (uuid) | - |
| `status` | query | Không | string: DRAFT, ACTIVE, COMPLETED, ARCHIVED | - |
| `page` | query | Không | integer (int32) | - |
| `size` | query | Không | integer (int32) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponsePageClassDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "totalPages":  0,
                 "totalElements":  0,
                 "size":  0,
                 "content":  {
                                 "userId":  "<…>",
                                 "username":  "<…>",
                                 "email":  "<…>",
                                 "role":  "<…>",
                                 "status":  "<…>"
                             },
                 "number":  0,
                 "first":  false,
                 "last":  false,
                 "numberOfElements":  0,
                 "sort":  {
                              "empty":  false,
                              "sorted":  false,
                              "unsorted":  false
                          },
                 "pageable":  {
                                  "offset":  0,
                                  "sort":  {
                                               "empty":  "<…>",
                                               "sorted":  "<…>",
                                               "unsorted":  "<…>"
                                           },
                                  "pageNumber":  0,
                                  "pageSize":  0,
                                  "paged":  false,
                                  "unpaged":  false
                              },
                 "empty":  false
             }
}
```

## `POST /api/v1/classes`

**Mô tả:** Tạo lớp học mới

Tạo lớp học mới. Nếu là INSTRUCTOR tạo, họ tự động làm chủ lớp.

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `CreateClassDTO`

```json
{
    "subjectId":  "00000000-0000-0000-0000-000000000000",
    "semesterId":  "00000000-0000-0000-0000-000000000000",
    "classCode":  "<string>",
    "maxStudents":  0
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseClassDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "semesterId":  "00000000-0000-0000-0000-000000000000",
                 "classCode":  "<string>",
                 "instructorId":  "00000000-0000-0000-0000-000000000000",
                 "maxStudents":  0,
                 "status":  "DRAFT",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/classes/{classId}/progress`

**Mô tả:** Lấy tiến độ hoàn thành học liệu của cả lớp

Giảng viên theo dõi tỉ lệ xem video, đọc tài liệu của từng sinh viên trong lớp.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `classId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListLearningProgressDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "progressId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "status":  "NOT_STARTED",
                 "progressPercent":  0,
                 "lastAccessedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/classes/{id}`

**Mô tả:** Lấy chi tiết lớp học

Xem chi tiết một lớp học (Có kiểm tra quyền sở hữu).

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseClassDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "semesterId":  "00000000-0000-0000-0000-000000000000",
                 "classCode":  "<string>",
                 "instructorId":  "00000000-0000-0000-0000-000000000000",
                 "maxStudents":  0,
                 "status":  "DRAFT",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `PUT /api/v1/classes/{id}`

**Mô tả:** Cập nhật lớp học

Sửa mã lớp, số lượng SV tối đa. (Chỉ Admin hoặc chủ lớp)

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `UpdateClassDTO`

```json
{
    "classCode":  "<string>",
    "maxStudents":  0
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseClassDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "semesterId":  "00000000-0000-0000-0000-000000000000",
                 "classCode":  "<string>",
                 "instructorId":  "00000000-0000-0000-0000-000000000000",
                 "maxStudents":  0,
                 "status":  "DRAFT",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/classes/{id}/activity-logs`

**Mô tả:** Xem nhật ký hoạt động của lớp

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListActivityLog` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "logId":  "00000000-0000-0000-0000-000000000000",
                 "userId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "actionType":  "<string>",
                 "objectType":  "<string>",
                 "objectId":  "00000000-0000-0000-0000-000000000000",
                 "metadataJson":  "<string>",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `POST /api/v1/classes/{id}/enroll-bulk`

**Mô tả:** Ghi danh hàng loạt

Thêm danh sách sinh viên vào lớp. Tối đa 500 sinh viên. (Chỉ Admin hoặc chủ lớp)

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `BulkEnrollmentDTO`

```json
{
    "studentIds":  "00000000-0000-0000-0000-000000000000"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `POST /api/v1/classes/{id}/enroll-single`

**Mô tả:** Ghi danh một sinh viên

Thêm 1 sinh viên vào lớp. (Chỉ Admin hoặc chủ lớp)

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `SingleEnrollmentDTO`

```json
{
    "studentId":  "00000000-0000-0000-0000-000000000000"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `GET /api/v1/classes/{id}/evidence`

**Mô tả:** Lấy tổng hợp kho minh chứng thí nghiệm của cả lớp

Giảng viên / Quản trị viên xem toàn bộ minh chứng thực hành thí nghiệm ảo của lớp học.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListEvidenceDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "evidenceId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "sourceType":  "EXPERIMENT",
                 "sourceId":  "00000000-0000-0000-0000-000000000000",
                 "fileId":  "00000000-0000-0000-0000-000000000000",
                 "fileUrl":  "<string>",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/classes/{id}/staff`

**Mô tả:** Danh sách nhân sự của lớp

Lấy danh sách Giảng viên/Trợ giảng được phân công vào lớp.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListClassStaffDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "userId":  "00000000-0000-0000-0000-000000000000",
                 "username":  "<string>",
                 "fullName":  "<string>",
                 "email":  "<string>",
                 "roleInClass":  "INSTRUCTOR"
             }
}
```

## `POST /api/v1/classes/{id}/staff`

**Mô tả:** Phân công nhân sự

Thêm một Giảng viên/Trợ giảng vào lớp. (Chỉ Admin hoặc chủ lớp)

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `AssignStaffDTO`

```json
{
    "userId":  "00000000-0000-0000-0000-000000000000",
    "roleInClass":  "INSTRUCTOR"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `DELETE /api/v1/classes/{id}/staff/{userId}`

**Mô tả:** Xóa nhân sự khỏi lớp

Xóa Giảng viên/Trợ giảng khỏi lớp. (Chỉ Admin hoặc chủ lớp)

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |
| `userId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `PUT /api/v1/classes/{id}/status`

**Mô tả:** Đổi trạng thái lớp học

Chuyển trạng thái lớp: DRAFT -> ACTIVE -> COMPLETED -> ARCHIVED.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `UpdateClassStatusDTO`

```json
{
    "status":  "DRAFT"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseClassDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "semesterId":  "00000000-0000-0000-0000-000000000000",
                 "classCode":  "<string>",
                 "instructorId":  "00000000-0000-0000-0000-000000000000",
                 "maxStudents":  0,
                 "status":  "DRAFT",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/classes/{id}/students`

**Mô tả:** Danh sách sinh viên của lớp

Lấy danh sách sinh viên đã ghi danh vào lớp.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |
| `status` | query | Không | string: ACTIVE, DROPPED, COMPLETED | - |
| `page` | query | Không | integer (int32) | - |
| `size` | query | Không | integer (int32) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponsePageEnrollmentDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "totalPages":  0,
                 "totalElements":  0,
                 "size":  0,
                 "content":  {
                                 "userId":  "<…>",
                                 "username":  "<…>",
                                 "email":  "<…>",
                                 "role":  "<…>",
                                 "status":  "<…>"
                             },
                 "number":  0,
                 "first":  false,
                 "last":  false,
                 "numberOfElements":  0,
                 "sort":  {
                              "empty":  false,
                              "sorted":  false,
                              "unsorted":  false
                          },
                 "pageable":  {
                                  "offset":  0,
                                  "sort":  {
                                               "empty":  "<…>",
                                               "sorted":  "<…>",
                                               "unsorted":  "<…>"
                                           },
                                  "pageNumber":  0,
                                  "pageSize":  0,
                                  "paged":  false,
                                  "unpaged":  false
                              },
                 "empty":  false
             }
}
```

## `DELETE /api/v1/classes/{id}/students/{studentId}`

**Mô tả:** Xóa sinh viên khỏi lớp

Xóa sinh viên khỏi lớp hoàn toàn (Xóa cứng).

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |
| `studentId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `PUT /api/v1/classes/{id}/students/{studentId}/status`

**Mô tả:** Đổi trạng thái ghi danh

Thay đổi trạng thái ghi danh (ACTIVE, DROPPED, COMPLETED).

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |
| `studentId` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `UpdateEnrollmentStatusDTO`

```json
{
    "status":  "ACTIVE"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `GET /api/v1/dashboard/class/{id}`

**Mô tả:** Lấy dữ liệu bảng điều khiển tổng hợp của lớp

Xem biểu đồ phân bố điểm, tỉ lệ hoàn thành học phần và các chỉ số then chốt.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseDashboardSnapshotDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "snapshotId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "period":  "<string>",
                 "data":  {
                              "avgScore":  0,
                              "completedTopics":  0,
                              "totalTopics":  0,
                              "labsConfirmed":  0,
                              "aiSessionsCount":  0,
                              "totalExamsTaken":  0,
                              "lastUpdated":  "2026-09-24T10:00:00Z"
                          },
                 "generatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `POST /api/v1/dashboard/class/{id}/regenerate`

**Mô tả:** Tạo lại dữ liệu bảng điều khiển cho lớp học (Chỉ Admin)

Tính toán và cập nhật lại dữ liệu snapshot bảng điều khiển tức thời.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseDashboardSnapshotDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "snapshotId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "period":  "<string>",
                 "data":  {
                              "avgScore":  0,
                              "completedTopics":  0,
                              "totalTopics":  0,
                              "labsConfirmed":  0,
                              "aiSessionsCount":  0,
                              "totalExamsTaken":  0,
                              "lastUpdated":  "2026-09-24T10:00:00Z"
                          },
                 "generatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/dashboard/class/{id}/student/{studentId}`

**Mô tả:** Lấy dữ liệu bảng điều khiển của một sinh viên trong lớp

Giảng viên xem chi tiết quá trình học tập của một sinh viên trong lớp.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |
| `studentId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseDashboardSnapshotDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "snapshotId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "period":  "<string>",
                 "data":  {
                              "avgScore":  0,
                              "completedTopics":  0,
                              "totalTopics":  0,
                              "labsConfirmed":  0,
                              "aiSessionsCount":  0,
                              "totalExamsTaken":  0,
                              "lastUpdated":  "2026-09-24T10:00:00Z"
                          },
                 "generatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/dashboard/me`

**Mô tả:** Lấy bảng điều khiển học tập cá nhân của tôi

Sinh viên theo dõi điểm số, xếp hạng và lộ trình hoàn thành của bản thân.

**Xác thực:** Bearer JWT

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseDashboardSnapshotDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "snapshotId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "period":  "<string>",
                 "data":  {
                              "avgScore":  0,
                              "completedTopics":  0,
                              "totalTopics":  0,
                              "labsConfirmed":  0,
                              "aiSessionsCount":  0,
                              "totalExamsTaken":  0,
                              "lastUpdated":  "2026-09-24T10:00:00Z"
                          },
                 "generatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `POST /api/v1/exams`

**Mô tả:** Tạo kỳ thi mới

Tạo kỳ thi với cấu hình thời gian, số câu, ma trận đề và hình thức thi.

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `CreateExamDTO`

```json
{
    "classId":  "00000000-0000-0000-0000-000000000000",
    "matrixId":  "00000000-0000-0000-0000-000000000000",
    "title":  "<string>",
    "examType":  "PRACTICE",
    "durationMinutes":  0,
    "startTime":  "2026-09-24T10:00:00Z",
    "endTime":  "2026-09-24T10:00:00Z"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseExamDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "examId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "matrixId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "examType":  "PRACTICE",
                 "durationMinutes":  0,
                 "startTime":  "2026-09-24T10:00:00Z",
                 "endTime":  "2026-09-24T10:00:00Z",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "totalQuestions":  0
             }
}
```

## `GET /api/v1/exams/{examId}`

**Mô tả:** Lấy chi tiết kỳ thi theo ID

Xem cấu hình chi tiết, thời gian và thông tin kỳ thi.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `examId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseExamDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "examId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "matrixId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "examType":  "PRACTICE",
                 "durationMinutes":  0,
                 "startTime":  "2026-09-24T10:00:00Z",
                 "endTime":  "2026-09-24T10:00:00Z",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "totalQuestions":  0
             }
}
```

## `POST /api/v1/exams/{examId}/attempts`

**Mô tả:** Sinh viên bắt đầu làm bài thi (Tạo lượt thi)

Khởi tạo lượt làm bài mới, hỗ trợ multi-attempt cho đề luyện tập.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `examId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseExamAttemptDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "attemptId":  "00000000-0000-0000-0000-000000000000",
                 "examId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "attemptNumber":  0,
                 "startedAt":  "2026-09-24T10:00:00Z",
                 "submittedAt":  "2026-09-24T10:00:00Z",
                 "status":  "IN_PROGRESS",
                 "totalScore":  0
             }
}
```

## `POST /api/v1/exams/{examId}/generate-questions`

**Mô tả:** Tự động sinh đề thi ngẫu nhiên theo ma trận

Lấy câu hỏi ngẫu nhiên từ ngân hàng theo tỉ lệ chương mục và mức độ Bloom.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `examId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseMapStringObject` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "key":  "<string>"
             }
}
```

## `GET /api/v1/exams/{examId}/my-attempt`

**Mô tả:** Lấy lượt làm bài gần nhất của sinh viên hiện tại

Xem thông tin hoặc tiếp tục bài thi đang làm dở.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `examId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseExamAttemptDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "attemptId":  "00000000-0000-0000-0000-000000000000",
                 "examId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "attemptNumber":  0,
                 "startedAt":  "2026-09-24T10:00:00Z",
                 "submittedAt":  "2026-09-24T10:00:00Z",
                 "status":  "IN_PROGRESS",
                 "totalScore":  0
             }
}
```

## `GET /api/v1/exams/{examId}/my-attempts`

**Mô tả:** Lấy toàn bộ lịch sử các lượt làm bài của sinh viên cho kỳ thi

Xem danh sách và điểm số tất cả các lần thi (đặc biệt cho đề thi luyện tập PRACTICE).

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `examId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListExamAttemptDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "attemptId":  "00000000-0000-0000-0000-000000000000",
                 "examId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "attemptNumber":  0,
                 "startedAt":  "2026-09-24T10:00:00Z",
                 "submittedAt":  "2026-09-24T10:00:00Z",
                 "status":  "IN_PROGRESS",
                 "totalScore":  0
             }
}
```

## `POST /api/v1/exams/{examId}/questions`

**Mô tả:** Thêm câu hỏi thủ công vào đề thi

Chỉ định trực tiếp câu hỏi từ ngân hàng vào kỳ thi.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `examId` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `AddExamQuestionDTO`

```json
{
    "questionId":  "00000000-0000-0000-0000-000000000000",
    "scoreWeight":  0,
    "orderIndex":  0
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `GET /api/v1/exams/attempts/{attemptId}`

**Mô tả:** Xem chi tiết kết quả lượt thi

Xem bảng điểm, số câu đúng/sai và phân tích chi tiết bài thi đã nộp.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `attemptId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseExamAttemptDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "attemptId":  "00000000-0000-0000-0000-000000000000",
                 "examId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "attemptNumber":  0,
                 "startedAt":  "2026-09-24T10:00:00Z",
                 "submittedAt":  "2026-09-24T10:00:00Z",
                 "status":  "IN_PROGRESS",
                 "totalScore":  0
             }
}
```

## `POST /api/v1/exams/attempts/{attemptId}/answers`

**Mô tả:** Lưu câu trả lời tạm thời của sinh viên

Ghi nhận phương án chọn cho từng câu hỏi trong quá trình làm bài.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `attemptId` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `SubmitAnswerDTO`

```json
{
    "questionId":  "00000000-0000-0000-0000-000000000000",
    "selectedOptionIds":  "00000000-0000-0000-0000-000000000000",
    "answerText":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `PUT /api/v1/exams/attempts/{attemptId}/submit`

**Mô tả:** Nộp bài thi và chấm điểm tự động

Khóa bài thi bằng khóa bi quan (SELECT FOR UPDATE) chống race condition và tính điểm.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `attemptId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseExamAttemptDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "attemptId":  "00000000-0000-0000-0000-000000000000",
                 "examId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "attemptNumber":  0,
                 "startedAt":  "2026-09-24T10:00:00Z",
                 "submittedAt":  "2026-09-24T10:00:00Z",
                 "status":  "IN_PROGRESS",
                 "totalScore":  0
             }
}
```

## `GET /api/v1/exams/class/{classId}`

**Mô tả:** Lấy danh sách kỳ thi của lớp học

Trả về tất cả kỳ thi trắc nghiệm thuộc một lớp học.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `classId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListExamDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "examId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "matrixId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "examType":  "PRACTICE",
                 "durationMinutes":  0,
                 "startTime":  "2026-09-24T10:00:00Z",
                 "endTime":  "2026-09-24T10:00:00Z",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "totalQuestions":  0
             }
}
```

## `GET /api/v1/experiments`

**Mô tả:** Lấy danh sách bài thí nghiệm theo môn học

Trả về danh sách các bài thí nghiệm ảo 3D thuộc môn học.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | query | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListExperimentDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "experimentId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "description":  "<string>",
                 "sceneAssetUrl":  "<string>",
                 "sceneAssetsJson":  "<string>",
                 "instructions":  "<string>",
                 "orderIndex":  0
             }
}
```

## `POST /api/v1/experiments`

**Mô tả:** Tạo bài thí nghiệm ảo mới

Thêm bài thí nghiệm ảo mới vào hệ thống.

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `CreateExperimentDTO`

```json
{
    "subjectId":  "00000000-0000-0000-0000-000000000000",
    "title":  "<string>",
    "description":  "<string>",
    "sceneAssetUrl":  "<string>",
    "sceneAssetsJson":  "<string>",
    "instructions":  "<string>",
    "orderIndex":  0
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseExperimentDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "experimentId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "description":  "<string>",
                 "sceneAssetUrl":  "<string>",
                 "sceneAssetsJson":  "<string>",
                 "instructions":  "<string>",
                 "orderIndex":  0
             }
}
```

## `GET /api/v1/experiments/{experimentId}`

**Mô tả:** Lấy chi tiết bài thí nghiệm theo ID

Xem cấu hình, tiêu chí đánh giá và thông số của bài thí nghiệm.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `experimentId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseExperimentDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "experimentId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "description":  "<string>",
                 "sceneAssetUrl":  "<string>",
                 "sceneAssetsJson":  "<string>",
                 "instructions":  "<string>",
                 "orderIndex":  0
             }
}
```

## `POST /api/v1/experiments/{experimentId}/assign`

**Mô tả:** Giao bài thí nghiệm cho lớp học

Tạo đợt thực hành thí nghiệm ảo cho lớp với hạn nộp.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `experimentId` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `CreateExperimentAssignmentDTO`

```json
{
    "classId":  "00000000-0000-0000-0000-000000000000",
    "dueDate":  "2026-09-24T10:00:00Z",
    "instructionsOverride":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseExperimentAssignmentDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "assignmentId":  "00000000-0000-0000-0000-000000000000",
                 "experimentId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "assignedBy":  "00000000-0000-0000-0000-000000000000",
                 "dueDate":  "2026-09-24T10:00:00Z",
                 "instructionsOverride":  "<string>",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `POST /api/v1/experiments/assignments/{assignmentId}/submit`

**Mô tả:** Sinh viên nộp kết quả thí nghiệm ảo

Tải lên file số liệu đo đạc, đồ thị và hình ảnh minh chứng.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `assignmentId` | path | Có | string (uuid) | - |


### Input: request body (multipart/form-data, không bắt buộc)

Schema: `SubmitExperimentDTO`

```json
{
    "evidenceUrl":  "<string>",
    "file":  "<string>",
    "rawDataJson":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `POST /api/v1/experiments/submissions/{submissionId}/confirmation`

**Mô tả:** Xác nhận kết quả thí nghiệm cuối cùng

Giảng viên phê duyệt và chốt điểm chính thức cho sinh viên.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `submissionId` | path | Có | string (uuid) | - |


### Input: request body (application/json, không bắt buộc)

Schema: `ConfirmSubmissionDTO`

```json
{
    "note":  "Xác nhận điểm số chung cuộc"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `POST /api/v1/experiments/submissions/{submissionId}/scores`

**Mô tả:** Chấm điểm bài thí nghiệm theo tiêu chí Rubric

Giảng viên / Trợ giảng chấm điểm từng tiêu chí Rubric cho bài nộp.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `submissionId` | path | Có | string (uuid) | - |


### Input: request body (application/json, không bắt buộc)

Schema: `GradeSubmissionDTO`

```json
{
    "rubricId":  "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "score":  8.5,
    "feedback":  "Báo cáo thực hành tốt",
    "comment":  "Đã kiểm tra số liệu đo đạc"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `GET /api/v1/files/**`

**Mô tả:** Truy xuất tệp hoặc hình ảnh

Stream tệp/ảnh từ MinIO với đúng MediaType để hiển thị trực tiếp trên trình duyệt.

**Xác thực:** Không cần token

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `string` |

Ví dụ response thành công (200):

```json
"<string>"
```

## `POST /api/v1/files/upload`

**Mô tả:** Tải lên tệp hoặc hình ảnh (MinIO)

Lưu trữ tệp, hình ảnh câu hỏi, minh chứng hoặc avatar vào MinIO bucket.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `folder` | query | Không | string | - |


### Input: request body (multipart/form-data, không bắt buộc)

Schema: `object`

```json
{
    "file":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseMapStringObject` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "key":  "<string>"
             }
}
```

## `GET /api/v1/questions`

**Mô tả:** Lấy danh sách câu hỏi theo bộ lọc

Tìm kiếm câu hỏi theo môn học, chương mục và độ khó Bloom.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | query | Có | string (uuid) | - |
| `topicId` | query | Không | string (uuid) | - |
| `difficultyLevel` | query | Không | string: EASY, MEDIUM, HARD | - |
| `page` | query | Không | integer (int32) | - |
| `size` | query | Không | integer (int32) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponsePageQuestionBankDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "totalPages":  0,
                 "totalElements":  0,
                 "size":  0,
                 "content":  {
                                 "userId":  "<…>",
                                 "username":  "<…>",
                                 "email":  "<…>",
                                 "role":  "<…>",
                                 "status":  "<…>"
                             },
                 "number":  0,
                 "first":  false,
                 "last":  false,
                 "numberOfElements":  0,
                 "sort":  {
                              "empty":  false,
                              "sorted":  false,
                              "unsorted":  false
                          },
                 "pageable":  {
                                  "offset":  0,
                                  "sort":  {
                                               "empty":  "<…>",
                                               "sorted":  "<…>",
                                               "unsorted":  "<…>"
                                           },
                                  "pageNumber":  0,
                                  "pageSize":  0,
                                  "paged":  false,
                                  "unpaged":  false
                              },
                 "empty":  false
             }
}
```

## `POST /api/v1/questions`

**Mô tả:** Tạo câu hỏi trắc nghiệm mới

Thêm câu hỏi mới vào ngân hàng (cần phê duyệt trước khi đưa vào đề thi).

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `CreateQuestionDTO`

```json
{
    "subjectId":  "00000000-0000-0000-0000-000000000000",
    "topicId":  "00000000-0000-0000-0000-000000000000",
    "questionType":  "MCQ_SINGLE",
    "content":  "<string>",
    "mediaUrl":  "<string>",
    "difficultyLevel":  "EASY",
    "cognitiveLevel":  "<string>",
    "options":  {
                    "content":  "<string>",
                    "isCorrect":  false,
                    "orderIndex":  0,
                    "explanation":  "<string>"
                }
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseQuestionBankDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "questionId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "questionType":  "MCQ_SINGLE",
                 "content":  "<string>",
                 "mediaUrl":  "<string>",
                 "difficultyLevel":  "EASY",
                 "cognitiveLevel":  "<string>",
                 "approvalStatus":  "DRAFT",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "options":  {
                                 "optionId":  "<…>",
                                 "questionId":  "<…>",
                                 "content":  "<…>",
                                 "isCorrect":  "<…>",
                                 "orderIndex":  "<…>",
                                 "explanation":  "<…>"
                             }
             }
}
```

## `GET /api/v1/questions/{questionId}`

**Mô tả:** Lấy chi tiết câu hỏi theo ID

Xem nội dung câu hỏi, danh sách đáp án A/B/C/D và giải thích chi tiết.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `questionId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseQuestionBankDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "questionId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "questionType":  "MCQ_SINGLE",
                 "content":  "<string>",
                 "mediaUrl":  "<string>",
                 "difficultyLevel":  "EASY",
                 "cognitiveLevel":  "<string>",
                 "approvalStatus":  "DRAFT",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "options":  {
                                 "optionId":  "<…>",
                                 "questionId":  "<…>",
                                 "content":  "<…>",
                                 "isCorrect":  "<…>",
                                 "orderIndex":  "<…>",
                                 "explanation":  "<…>"
                             }
             }
}
```

## `PUT /api/v1/questions/{questionId}`

**Mô tả:** Cập nhật nội dung câu hỏi

Chỉnh sửa câu hỏi, đáp án hoặc giải thích chi tiết.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `questionId` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `CreateQuestionDTO`

```json
{
    "subjectId":  "00000000-0000-0000-0000-000000000000",
    "topicId":  "00000000-0000-0000-0000-000000000000",
    "questionType":  "MCQ_SINGLE",
    "content":  "<string>",
    "mediaUrl":  "<string>",
    "difficultyLevel":  "EASY",
    "cognitiveLevel":  "<string>",
    "options":  {
                    "content":  "<string>",
                    "isCorrect":  false,
                    "orderIndex":  0,
                    "explanation":  "<string>"
                }
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseQuestionBankDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "questionId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "questionType":  "MCQ_SINGLE",
                 "content":  "<string>",
                 "mediaUrl":  "<string>",
                 "difficultyLevel":  "EASY",
                 "cognitiveLevel":  "<string>",
                 "approvalStatus":  "DRAFT",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "options":  {
                                 "optionId":  "<…>",
                                 "questionId":  "<…>",
                                 "content":  "<…>",
                                 "isCorrect":  "<…>",
                                 "orderIndex":  "<…>",
                                 "explanation":  "<…>"
                             }
             }
}
```

## `DELETE /api/v1/questions/{questionId}`

**Mô tả:** Xóa câu hỏi khỏi ngân hàng

Xóa câu hỏi khỏi ngân hàng câu hỏi.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `questionId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `PUT /api/v1/questions/{questionId}/approve`

**Mô tả:** Phê duyệt câu hỏi vào ngân hàng chính thức

Chuyển trạng thái câu hỏi thành APPROVED để sẵn sàng sinh đề.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `questionId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseQuestionBankDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "questionId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "questionType":  "MCQ_SINGLE",
                 "content":  "<string>",
                 "mediaUrl":  "<string>",
                 "difficultyLevel":  "EASY",
                 "cognitiveLevel":  "<string>",
                 "approvalStatus":  "DRAFT",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "options":  {
                                 "optionId":  "<…>",
                                 "questionId":  "<…>",
                                 "content":  "<…>",
                                 "isCorrect":  "<…>",
                                 "orderIndex":  "<…>",
                                 "explanation":  "<…>"
                             }
             }
}
```

## `POST /api/v1/questions/import-excel`

**Mô tả:** Tạo câu hỏi tự động từ file Excel

Bóc tách tệp bảng tính Excel (.xlsx, .xls) và nhập hàng loạt câu hỏi trắc nghiệm vào ngân hàng.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | query | Có | string (uuid) | - |
| `topicId` | query | Có | string (uuid) | - |


### Input: request body (multipart/form-data, không bắt buộc)

Schema: `object`

```json
{
    "file":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseQuestionImportResultDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "totalParsed":  0,
                 "totalImported":  0,
                 "questions":  {
                                   "questionId":  "<…>",
                                   "subjectId":  "<…>",
                                   "topicId":  "<…>",
                                   "questionType":  "<…>",
                                   "content":  "<…>",
                                   "mediaUrl":  "<…>",
                                   "difficultyLevel":  "<…>",
                                   "cognitiveLevel":  "<…>",
                                   "approvalStatus":  "<…>",
                                   "createdBy":  "<…>",
                                   "createdAt":  "<…>",
                                   "options":  "<…>"
                               },
                 "warnings":  "<string>"
             }
}
```

## `GET /api/v1/questions/import-excel/template`

**Mô tả:** Tải file mẫu Excel nhập câu hỏi

Tải xuống file Excel (.xlsx) chuẩn hóa để giáo viên điền danh sách câu hỏi.

**Xác thực:** Bearer JWT

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `string` |

Ví dụ response thành công (200):

```json
"<string>"
```

## `GET /api/v1/semesters`

**Mô tả:** Lấy danh sách học kỳ

Lấy danh sách tất cả học kỳ, được sắp xếp mới nhất lên đầu.

**Xác thực:** Bearer JWT

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListSemesterDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "semesterId":  "00000000-0000-0000-0000-000000000000",
                 "semesterCode":  "<string>",
                 "semesterName":  "<string>",
                 "academicYear":  "<string>",
                 "startDate":  "2026-09-24",
                 "endDate":  "2026-09-24",
                 "isCurrent":  false,
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `POST /api/v1/semesters`

**Mô tả:** Tạo học kỳ mới (Chỉ Admin)

Tạo một học kỳ mới. Mặc định isCurrent = false.

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `CreateSemesterDTO`

```json
{
    "semesterCode":  "<string>",
    "semesterName":  "<string>",
    "academicYear":  "<string>",
    "startDate":  "2026-09-24",
    "endDate":  "2026-09-24"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseSemesterDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "semesterId":  "00000000-0000-0000-0000-000000000000",
                 "semesterCode":  "<string>",
                 "semesterName":  "<string>",
                 "academicYear":  "<string>",
                 "startDate":  "2026-09-24",
                 "endDate":  "2026-09-24",
                 "isCurrent":  false,
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/semesters/{id}`

**Mô tả:** Lấy chi tiết học kỳ

Lấy thông tin chi tiết của 1 học kỳ bằng ID.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseSemesterDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "semesterId":  "00000000-0000-0000-0000-000000000000",
                 "semesterCode":  "<string>",
                 "semesterName":  "<string>",
                 "academicYear":  "<string>",
                 "startDate":  "2026-09-24",
                 "endDate":  "2026-09-24",
                 "isCurrent":  false,
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `PUT /api/v1/semesters/{id}`

**Mô tả:** Cập nhật học kỳ (Chỉ Admin)

Cập nhật thông tin học kỳ. Không cho phép trùng tên học kỳ trong cùng năm học.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `UpdateSemesterDTO`

```json
{
    "semesterName":  "<string>",
    "academicYear":  "<string>",
    "startDate":  "2026-09-24",
    "endDate":  "2026-09-24"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseSemesterDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "semesterId":  "00000000-0000-0000-0000-000000000000",
                 "semesterCode":  "<string>",
                 "semesterName":  "<string>",
                 "academicYear":  "<string>",
                 "startDate":  "2026-09-24",
                 "endDate":  "2026-09-24",
                 "isCurrent":  false,
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `PUT /api/v1/semesters/{id}/set-current`

**Mô tả:** Đánh dấu học kỳ hiện tại (Chỉ Admin)

Đánh dấu học kỳ này là học kỳ hiện tại. Các học kỳ khác sẽ tự động chuyển về false.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseSemesterDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "semesterId":  "00000000-0000-0000-0000-000000000000",
                 "semesterCode":  "<string>",
                 "semesterName":  "<string>",
                 "academicYear":  "<string>",
                 "startDate":  "2026-09-24",
                 "endDate":  "2026-09-24",
                 "isCurrent":  false,
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/students/{id}/evidence`

**Mô tả:** Lấy kho minh chứng của một sinh viên (Có kiểm tra bảo mật IDOR)

Giảng viên xem minh chứng của sinh viên trong lớp hoặc sinh viên tự xem của mình.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListEvidenceDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "evidenceId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "sourceType":  "EXPERIMENT",
                 "sourceId":  "00000000-0000-0000-0000-000000000000",
                 "fileId":  "00000000-0000-0000-0000-000000000000",
                 "fileUrl":  "<string>",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/students/me/activity-logs`

**Mô tả:** Lấy nhật ký hoạt động cá nhân của sinh viên

Xem lịch sử các thao tác học tập, nộp bài và tương tác của sinh viên đang đăng nhập.

**Xác thực:** Bearer JWT

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListActivityLog` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "logId":  "00000000-0000-0000-0000-000000000000",
                 "userId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "actionType":  "<string>",
                 "objectType":  "<string>",
                 "objectId":  "00000000-0000-0000-0000-000000000000",
                 "metadataJson":  "<string>",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/students/me/classes`

**Mô tả:** Lấy danh sách lớp học của tôi

Lấy danh sách các lớp học mà sinh viên đang ghi danh.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `page` | query | Không | integer (int32) | - |
| `size` | query | Không | integer (int32) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponsePageClassDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "totalPages":  0,
                 "totalElements":  0,
                 "size":  0,
                 "content":  {
                                 "userId":  "<…>",
                                 "username":  "<…>",
                                 "email":  "<…>",
                                 "role":  "<…>",
                                 "status":  "<…>"
                             },
                 "number":  0,
                 "first":  false,
                 "last":  false,
                 "numberOfElements":  0,
                 "sort":  {
                              "empty":  false,
                              "sorted":  false,
                              "unsorted":  false
                          },
                 "pageable":  {
                                  "offset":  0,
                                  "sort":  {
                                               "empty":  "<…>",
                                               "sorted":  "<…>",
                                               "unsorted":  "<…>"
                                           },
                                  "pageNumber":  0,
                                  "pageSize":  0,
                                  "paged":  false,
                                  "unpaged":  false
                              },
                 "empty":  false
             }
}
```

## `GET /api/v1/students/me/evidence`

**Mô tả:** Lấy kho minh chứng thí nghiệm của sinh viên hiện tại

Trả về danh sách kết quả đo đạc, báo cáo thí nghiệm ảo của sinh viên đang đăng nhập.

**Xác thực:** Bearer JWT

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListEvidenceDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "evidenceId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "sourceType":  "EXPERIMENT",
                 "sourceId":  "00000000-0000-0000-0000-000000000000",
                 "fileId":  "00000000-0000-0000-0000-000000000000",
                 "fileUrl":  "<string>",
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/students/me/progress`

**Mô tả:** Lấy tiến độ học tập của tôi theo lớp

Sinh viên xem danh sách học liệu đã hoàn thành và tiến độ phần trăm theo lớp học.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `classId` | query | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListLearningProgressDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "progressId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "status":  "NOT_STARTED",
                 "progressPercent":  0,
                 "lastAccessedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `PUT /api/v1/students/me/progress`

**Mô tả:** Cập nhật tiến độ học tập cá nhân

Ghi nhận trạng thái hoàn thành hoặc thời gian tương tác với học liệu số.

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `UpdateLearningProgressDTO`

```json
{
    "topicId":  "00000000-0000-0000-0000-000000000000",
    "classId":  "00000000-0000-0000-0000-000000000000",
    "progressPercent":  0
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseLearningProgressDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "progressId":  "00000000-0000-0000-0000-000000000000",
                 "studentId":  "00000000-0000-0000-0000-000000000000",
                 "classId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "status":  "NOT_STARTED",
                 "progressPercent":  0,
                 "lastAccessedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/subjects`

**Mô tả:** Lấy danh sách môn học

Lấy danh sách phân trang tất cả môn học. Hỗ trợ lọc theo trạng thái (isActive).

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `isActive` | query | Không | boolean | - |
| `page` | query | Không | integer (int32) | - |
| `size` | query | Không | integer (int32) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponsePageSubjectDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "totalPages":  0,
                 "totalElements":  0,
                 "size":  0,
                 "content":  {
                                 "userId":  "<…>",
                                 "username":  "<…>",
                                 "email":  "<…>",
                                 "role":  "<…>",
                                 "status":  "<…>"
                             },
                 "number":  0,
                 "first":  false,
                 "last":  false,
                 "numberOfElements":  0,
                 "sort":  {
                              "empty":  false,
                              "sorted":  false,
                              "unsorted":  false
                          },
                 "pageable":  {
                                  "offset":  0,
                                  "sort":  {
                                               "empty":  "<…>",
                                               "sorted":  "<…>",
                                               "unsorted":  "<…>"
                                           },
                                  "pageNumber":  0,
                                  "pageSize":  0,
                                  "paged":  false,
                                  "unpaged":  false
                              },
                 "empty":  false
             }
}
```

## `POST /api/v1/subjects`

**Mô tả:** Tạo môn học mới (Chỉ Admin)

Tạo một môn học mới.

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `CreateSubjectDTO`

```json
{
    "subjectCode":  "<string>",
    "subjectName":  "<string>",
    "description":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseSubjectDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "subjectCode":  "<string>",
                 "subjectName":  "<string>",
                 "description":  "<string>",
                 "isActive":  false,
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/subjects/{id}`

**Mô tả:** Lấy chi tiết môn học

Lấy thông tin chi tiết của 1 môn học bằng ID.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseSubjectDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "subjectCode":  "<string>",
                 "subjectName":  "<string>",
                 "description":  "<string>",
                 "isActive":  false,
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `PUT /api/v1/subjects/{id}`

**Mô tả:** Cập nhật môn học (Chỉ Admin)

Cập nhật thông tin môn học (tên, mô tả). Không được sửa mã môn.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `UpdateSubjectDTO`

```json
{
    "subjectName":  "<string>",
    "description":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseSubjectDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "subjectCode":  "<string>",
                 "subjectName":  "<string>",
                 "description":  "<string>",
                 "isActive":  false,
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `PUT /api/v1/subjects/{id}/toggle-status`

**Mô tả:** Bật/Tắt môn học (Chỉ Admin)

Toggle trạng thái isActive của môn học (Xóa mềm).

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseSubjectDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "subjectCode":  "<string>",
                 "subjectName":  "<string>",
                 "description":  "<string>",
                 "isActive":  false,
                 "createdAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/subjects/{subjectId}/topics`

**Mô tả:** Lấy danh sách chương mục theo môn học

Trả về toàn bộ các chương/chủ đề kiến thức thuộc môn học.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListTopicDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "topicName":  "<string>",
                 "orderIndex":  0,
                 "description":  "<string>"
             }
}
```

## `POST /api/v1/subjects/{subjectId}/topics`

**Mô tả:** Tạo chương mục kiến thức mới (Chỉ Admin/Giảng viên)

Thêm chương mục mới vào môn học.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `CreateTopicDTO`

```json
{
    "subjectId":  "00000000-0000-0000-0000-000000000000",
    "topicName":  "<string>",
    "orderIndex":  0,
    "description":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseTopicDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "topicName":  "<string>",
                 "orderIndex":  0,
                 "description":  "<string>"
             }
}
```

## `GET /api/v1/subjects/{subjectId}/topics/{topicId}`

**Mô tả:** Lấy chi tiết chương mục theo ID

Xem thông tin tên, mô tả và thứ tự chương mục.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | path | Có | string (uuid) | - |
| `topicId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseTopicDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "topicName":  "<string>",
                 "orderIndex":  0,
                 "description":  "<string>"
             }
}
```

## `PUT /api/v1/subjects/{subjectId}/topics/{topicId}`

**Mô tả:** Cập nhật thông tin chương mục

Chỉnh sửa tên, mô tả và thứ tự hiển thị của chương mục.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | path | Có | string (uuid) | - |
| `topicId` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `CreateTopicDTO`

```json
{
    "subjectId":  "00000000-0000-0000-0000-000000000000",
    "topicName":  "<string>",
    "orderIndex":  0,
    "description":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseTopicDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "subjectId":  "00000000-0000-0000-0000-000000000000",
                 "topicName":  "<string>",
                 "orderIndex":  0,
                 "description":  "<string>"
             }
}
```

## `DELETE /api/v1/subjects/{subjectId}/topics/{topicId}`

**Mô tả:** Xóa chương mục kiến thức (Chỉ Admin)

Xóa một chương mục kiến thức khỏi hệ thống.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `subjectId` | path | Có | string (uuid) | - |
| `topicId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `GET /api/v1/topics/{topicId}/materials`

**Mô tả:** Lấy danh sách học liệu theo chương mục

Trả về danh sách tài liệu số (PDF, Video, Bài giảng) thuộc chương mục.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `topicId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseListLearningMaterialDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "materialId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "fileId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "type":  "PDF",
                 "fileUrl":  "<string>",
                 "contentText":  "<string>",
                 "version":  0,
                 "approvalStatus":  "DRAFT",
                 "sourceCitation":  "<string>",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "updatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `POST /api/v1/topics/{topicId}/materials`

**Mô tả:** Tạo học liệu số mới

Tải lên tài liệu học tập mới (File hoặc URL liên kết).

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `topicId` | path | Có | string (uuid) | - |


### Input: request body (multipart/form-data, không bắt buộc)

Schema: `CreateLearningMaterialDTO`

```json
{
    "topicId":  "00000000-0000-0000-0000-000000000000",
    "title":  "<string>",
    "type":  "PDF",
    "contentText":  "<string>",
    "sourceCitation":  "<string>",
    "file":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseLearningMaterialDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "materialId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "fileId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "type":  "PDF",
                 "fileUrl":  "<string>",
                 "contentText":  "<string>",
                 "version":  0,
                 "approvalStatus":  "DRAFT",
                 "sourceCitation":  "<string>",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "updatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/topics/{topicId}/materials/{materialId}`

**Mô tả:** Lấy chi tiết học liệu theo ID

Xem nội dung chi tiết hoặc link truy cập tài liệu số.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `topicId` | path | Có | string (uuid) | - |
| `materialId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseLearningMaterialDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "materialId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "fileId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "type":  "PDF",
                 "fileUrl":  "<string>",
                 "contentText":  "<string>",
                 "version":  0,
                 "approvalStatus":  "DRAFT",
                 "sourceCitation":  "<string>",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "updatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `PUT /api/v1/topics/{topicId}/materials/{materialId}`

**Mô tả:** Cập nhật học liệu số

Chỉnh sửa thông tin, tệp đính kèm hoặc nội dung bài giảng.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `topicId` | path | Có | string (uuid) | - |
| `materialId` | path | Có | string (uuid) | - |


### Input: request body (multipart/form-data, không bắt buộc)

Schema: `CreateLearningMaterialDTO`

```json
{
    "topicId":  "00000000-0000-0000-0000-000000000000",
    "title":  "<string>",
    "type":  "PDF",
    "contentText":  "<string>",
    "sourceCitation":  "<string>",
    "file":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseLearningMaterialDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "materialId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "fileId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "type":  "PDF",
                 "fileUrl":  "<string>",
                 "contentText":  "<string>",
                 "version":  0,
                 "approvalStatus":  "DRAFT",
                 "sourceCitation":  "<string>",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "updatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `DELETE /api/v1/topics/{topicId}/materials/{materialId}`

**Mô tả:** Xóa học liệu số

Gỡ bỏ tài liệu học tập khỏi chương mục.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `topicId` | path | Có | string (uuid) | - |
| `materialId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `PUT /api/v1/topics/{topicId}/materials/{materialId}/approve`

**Mô tả:** Bộ môn phê duyệt học liệu số

Kiểm duyệt và xuất bản học liệu cho sinh viên truy cập.

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `topicId` | path | Có | string (uuid) | - |
| `materialId` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseLearningMaterialDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "materialId":  "00000000-0000-0000-0000-000000000000",
                 "topicId":  "00000000-0000-0000-0000-000000000000",
                 "fileId":  "00000000-0000-0000-0000-000000000000",
                 "title":  "<string>",
                 "type":  "PDF",
                 "fileUrl":  "<string>",
                 "contentText":  "<string>",
                 "version":  0,
                 "approvalStatus":  "DRAFT",
                 "sourceCitation":  "<string>",
                 "createdBy":  "00000000-0000-0000-0000-000000000000",
                 "createdAt":  "2026-09-24T10:00:00Z",
                 "updatedAt":  "2026-09-24T10:00:00Z"
             }
}
```

## `GET /api/v1/users/{username}`

**Mô tả:** Tra cứu người dùng theo tên đăng nhập (Chỉ Admin)

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `username` | path | Có | string | Username |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | Success | `ApiResponseUserResponseDTO` |
| 400 | Something went wrong | `ApiResponseUserResponseDTO` |
| 403 | Access denied | `ApiResponseUserResponseDTO` |
| 404 | The user doesn't exist | `ApiResponseUserResponseDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "userId":  "00000000-0000-0000-0000-000000000000",
                 "username":  "<string>",
                 "email":  "<string>",
                 "role":  "STUDENT",
                 "status":  "ACTIVE"
             }
}
```

## `DELETE /api/v1/users/{username}`

**Mô tả:** Xóa người dùng theo tên đăng nhập (Chỉ Admin)

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `username` | path | Có | string | Username |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | Success | `ApiResponseString` |
| 400 | Something went wrong | `ApiResponseString` |
| 403 | Access denied | `ApiResponseString` |
| 404 | The user doesn't exist | `ApiResponseString` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `POST /api/v1/users/admin/create-user`

**Mô tả:** Tạo người dùng với vai trò cụ thể (Chỉ Admin)

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `AdminCreateUserDTO`

```json
{
    "username":  "newinstructor",
    "email":  "instructor@example.com",
    "password":  "password123",
    "role":  "INSTRUCTOR"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | Success | `ApiResponseUserResponseDTO` |
| 400 | Something went wrong | `ApiResponseUserResponseDTO` |
| 403 | Access denied | `ApiResponseUserResponseDTO` |
| 422 | Username is already in use | `ApiResponseUserResponseDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "userId":  "00000000-0000-0000-0000-000000000000",
                 "username":  "<string>",
                 "email":  "<string>",
                 "role":  "STUDENT",
                 "status":  "ACTIVE"
             }
}
```

## `GET /api/v1/users/admin/users`

**Mô tả:** Lấy danh sách người dùng phân trang (Chỉ Admin)

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `page` | query | Không | integer | Zero-based page index (0..N) |
| `size` | query | Không | integer | The size of the page to be returned |
| `sort` | query | Không | array | Sorting criteria in the format: property,(asc\\|desc). Default sort order is ascending. Multiple sort criteria are supported. |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponsePageUserResponseDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "totalPages":  0,
                 "totalElements":  0,
                 "size":  0,
                 "content":  {
                                 "userId":  "<…>",
                                 "username":  "<…>",
                                 "email":  "<…>",
                                 "role":  "<…>",
                                 "status":  "<…>"
                             },
                 "number":  0,
                 "first":  false,
                 "last":  false,
                 "numberOfElements":  0,
                 "sort":  {
                              "empty":  false,
                              "sorted":  false,
                              "unsorted":  false
                          },
                 "pageable":  {
                                  "offset":  0,
                                  "sort":  {
                                               "empty":  "<…>",
                                               "sorted":  "<…>",
                                               "unsorted":  "<…>"
                                           },
                                  "pageNumber":  0,
                                  "pageSize":  0,
                                  "paged":  false,
                                  "unpaged":  false
                              },
                 "empty":  false
             }
}
```

## `PUT /api/v1/users/admin/users/{id}`

**Mô tả:** Cập nhật vai trò / email người dùng (Chỉ Admin)

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `AdminUpdateUserDTO`

```json
{
    "role":  "STUDENT",
    "email":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseUserResponseDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "userId":  "00000000-0000-0000-0000-000000000000",
                 "username":  "<string>",
                 "email":  "<string>",
                 "role":  "STUDENT",
                 "status":  "ACTIVE"
             }
}
```

## `GET /api/v1/users/admin/users/{id}/profile`

**Mô tả:** Lấy hồ sơ người dùng theo ID (Chỉ Admin)

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseUserProfileDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "fullName":  "<string>",
                 "avatarUrl":  "<string>",
                 "dateOfBirth":  "2026-09-24",
                 "gender":  "MALE",
                 "phone":  "<string>",
                 "studentCode":  "<string>",
                 "bio":  "<string>"
             }
}
```

## `PUT /api/v1/users/admin/users/{id}/status`

**Mô tả:** Khóa / Mở khóa trạng thái người dùng (Chỉ Admin)

**Xác thực:** Bearer JWT

### Input: path/query

| Tên | Vị trí | Bắt buộc | Kiểu | Mô tả |
|---|---|---:|---|---|
| `id` | path | Có | string (uuid) | - |


### Input: request body (application/json, bắt buộc)

Schema: `UpdateUserStatusDTO`

```json
{
    "status":  "ACTIVE"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseUserResponseDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "userId":  "00000000-0000-0000-0000-000000000000",
                 "username":  "<string>",
                 "email":  "<string>",
                 "role":  "STUDENT",
                 "status":  "ACTIVE"
             }
}
```

## `POST /api/v1/users/forgot-password`

**Mô tả:** Yêu cầu mã đặt lại mật khẩu qua email

Tạo mã đặt lại mật khẩu sử dụng 1 lần (TTL 15 phút) và gửi email hướng dẫn. Giới hạn 3 lần/phút.

**Xác thực:** Không cần token

### Input: request body (application/json, bắt buộc)

Schema: `ForgotPasswordRequestDTO`

```json
{
    "email":  "student@edu.vn"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | Password reset email dispatched successfully | `ApiResponseVoid` |
| 400 | Invalid email format | `ApiResponseVoid` |
| 429 | Rate limit exceeded | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `POST /api/v1/users/logout`

**Mô tả:** Đăng xuất (Thu hồi Refresh Token)

Hủy bỏ Refresh Token trong hệ thống. Access Token sẽ tự động hết hạn khi tới hạn.

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `RefreshRequestDTO`

```json
{
    "refreshToken":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | Refresh token revoked | `ApiResponseVoid` |
| 400 | Something went wrong | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `GET /api/v1/users/me`

**Mô tả:** Lấy thông tin tài khoản đang đăng nhập

**Xác thực:** Bearer JWT

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | Success | `ApiResponseUserResponseDTO` |
| 400 | Something went wrong | `ApiResponseUserResponseDTO` |
| 401 | Expired or invalid JWT token | `ApiResponseUserResponseDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "userId":  "00000000-0000-0000-0000-000000000000",
                 "username":  "<string>",
                 "email":  "<string>",
                 "role":  "STUDENT",
                 "status":  "ACTIVE"
             }
}
```

## `PUT /api/v1/users/me`

**Mô tả:** Cập nhật tên đăng nhập / email của tôi

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `UserUpdateDTO`

```json
{
    "username":  "<string>",
    "email":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseUserResponseDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "userId":  "00000000-0000-0000-0000-000000000000",
                 "username":  "<string>",
                 "email":  "<string>",
                 "role":  "STUDENT",
                 "status":  "ACTIVE"
             }
}
```

## `PUT /api/v1/users/me/password`

**Mô tả:** Đổi mật khẩu tài khoản hiện tại

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `ChangePasswordDTO`

```json
{
    "oldPassword":  "<string>",
    "newPassword":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `GET /api/v1/users/me/profile`

**Mô tả:** Lấy hồ sơ cá nhân của tôi

**Xác thực:** Bearer JWT

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseUserProfileDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "fullName":  "<string>",
                 "avatarUrl":  "<string>",
                 "dateOfBirth":  "2026-09-24",
                 "gender":  "MALE",
                 "phone":  "<string>",
                 "studentCode":  "<string>",
                 "bio":  "<string>"
             }
}
```

## `PUT /api/v1/users/me/profile`

**Mô tả:** Cập nhật hồ sơ cá nhân của tôi

**Xác thực:** Bearer JWT

### Input: request body (application/json, bắt buộc)

Schema: `UserProfileUpdateDTO`

```json
{
    "fullName":  "<string>",
    "avatarUrl":  "<string>",
    "dateOfBirth":  "2026-09-24",
    "gender":  "MALE",
    "phone":  "<string>",
    "studentCode":  "<string>",
    "bio":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | OK | `ApiResponseUserProfileDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "fullName":  "<string>",
                 "avatarUrl":  "<string>",
                 "dateOfBirth":  "2026-09-24",
                 "gender":  "MALE",
                 "phone":  "<string>",
                 "studentCode":  "<string>",
                 "bio":  "<string>"
             }
}
```

## `POST /api/v1/users/refresh`

**Mô tả:** Làm mới Access Token bằng Refresh Token

Không yêu cầu Access Token. Refresh Token cũ sẽ bị hủy và thay thế bằng cặp token mới (Token Rotation).

**Xác thực:** Không cần token

### Input: request body (application/json, bắt buộc)

Schema: `RefreshRequestDTO`

```json
{
    "refreshToken":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | New token pair issued | `ApiResponseAuthResponseDTO` |
| 400 | Something went wrong | `ApiResponseAuthResponseDTO` |
| 401 | Expired or invalid refresh token | `ApiResponseAuthResponseDTO` |
| 404 | User no longer exists | `ApiResponseAuthResponseDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "accessToken":  "<string>",
                 "refreshToken":  "<string>",
                 "tokenType":  "Bearer",
                 "expiresIn":  3600,
                 "refreshExpiresIn":  604800
             }
}
```

## `POST /api/v1/users/reset-password`

**Mô tả:** Đặt lại mật khẩu bằng mã xác thực (Token)

Xác thực mã một lần (token) hợp lệ và cập nhật mật khẩu mới cho người dùng.

**Xác thực:** Không cần token

### Input: request body (application/json, bắt buộc)

Schema: `ResetPasswordRequestDTO`

```json
{
    "token":  "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "newPassword":  "newStrongPass123"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | Password reset successfully | `ApiResponseVoid` |
| 400 | Invalid, expired, or previously used token | `ApiResponseVoid` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  "<string>"
}
```

## `POST /api/v1/users/signin`

**Mô tả:** Đăng nhập hệ thống (nhận Access/Refresh Token)

Áp dụng cơ chế Rate Limiting để ngăn chặn tấn công dò mật khẩu (brute-force).

**Xác thực:** Không cần token

### Input: request body (application/json, bắt buộc)

Schema: `SigninRequestDTO`

```json
{
    "username":  "admin",
    "password":  "admin123456"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | Success | `ApiResponseAuthResponseDTO` |
| 400 | Something went wrong | `ApiResponseAuthResponseDTO` |
| 422 | Invalid username/password supplied | `ApiResponseAuthResponseDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "accessToken":  "<string>",
                 "refreshToken":  "<string>",
                 "tokenType":  "Bearer",
                 "expiresIn":  3600,
                 "refreshExpiresIn":  604800
             }
}
```

## `POST /api/v1/users/signup`

**Mô tả:** Đăng ký tài khoản Sinh viên mới (gán mặc định ROLE_STUDENT)

**Xác thực:** Không cần token

### Input: request body (application/json, bắt buộc)

Schema: `UserDataDTO`

```json
{
    "username":  "<string>",
    "email":  "<string>",
    "password":  "<string>"
}
```

### Output

| HTTP | Ý nghĩa | Schema |
|---:|---|---|
| 200 | Success | `ApiResponseAuthResponseDTO` |
| 400 | Something went wrong | `ApiResponseAuthResponseDTO` |
| 422 | Username is already in use | `ApiResponseAuthResponseDTO` |

Ví dụ response thành công (200):

```json
{
    "status":  200,
    "message":  "Success",
    "data":  {
                 "accessToken":  "<string>",
                 "refreshToken":  "<string>",
                 "tokenType":  "Bearer",
                 "expiresIn":  3600,
                 "refreshExpiresIn":  604800
             }
}
```

