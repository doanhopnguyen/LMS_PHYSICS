export const courses = [
  { code: 'BAS1201', title: 'Vật lý đại cương 1', className: 'D23CQCN01-B', progress: 75, lessons: '18/24', score: '8.5', icon: 'science', color: 'primary' },
  { code: 'BAS1202', title: 'Toán cao cấp 2', className: 'D23CQCN01-B', progress: 42, lessons: '10/24', score: '7.8', icon: 'calculate', color: 'gold' },
  { code: 'INT1306', title: 'Lập trình hướng đối tượng', className: 'D23CQCN01-B', progress: 90, lessons: '21/24', score: '9.1', icon: 'code', color: 'green' }
];

export const modules = [
  { number: '01', title: 'Động học chất điểm', lessons: 6, progress: 100, status: 'Hoàn thành' },
  { number: '02', title: 'Động lực học chất điểm', lessons: 8, progress: 75, status: 'Đang học' },
  { number: '03', title: 'Công và năng lượng', lessons: 5, progress: 30, status: 'Chưa học' },
  { number: '04', title: 'Chuyển động quay của vật rắn', lessons: 5, progress: 0, status: 'Chưa học' }
];

export const tasks = [
  { title: 'Bài kiểm tra trắc nghiệm Chương 2', meta: '45 phút · 30 câu hỏi tính toán', due: '23:59 ngày mai', status: 'Khẩn cấp', tone: 'primary', icon: 'alarm' },
  { title: 'Báo cáo thí nghiệm số 01: Khảo sát rơi tự do', meta: 'Nộp file báo cáo số liệu thực hành phòng Lab 3D', due: '3 ngày nữa', status: 'Đang mở', tone: 'warning', icon: 'calendar_today' },
  { title: 'Luyện tập trắc nghiệm Định luật bảo toàn', meta: 'Bộ câu hỏi tự luyện nâng cao · Chương 3', due: '5 ngày nữa', status: 'Đang mở', tone: 'neutral', icon: 'calendar_today' }
];

export const resources = [
  { title: 'Giáo trình Vật lý đại cương 1', type: 'PDF · 280 trang', author: 'Khoa Cơ bản 1', icon: 'menu_book', tag: 'Giáo trình' },
  { title: 'Bộ công thức trọng tâm Chương 2', type: 'Tài liệu tóm tắt', author: 'PTIT Physics Team', icon: 'functions', tag: 'Công thức' },
  { title: 'Video bài giảng: Các định luật Newton', type: 'Video · 42 phút', author: 'TS. Nguyễn Minh Đức', icon: 'play_circle', tag: 'Bài giảng' },
  { title: 'Mô phỏng lực ma sát trên mặt phẳng nghiêng', type: 'Tương tác 3D', author: 'Virtual Lab', icon: 'science', tag: 'Thí nghiệm' }
];

export const exams = [
  { title: 'Luyện tập Chương 1: Động học', questions: 30, duration: '45 phút', score: '8.8/10', difficulty: 'Cơ bản', completed: true },
  { title: 'Luyện tập Chương 2: Động lực học', questions: 40, duration: '60 phút', score: 'Đang chờ', difficulty: 'Nâng cao', completed: false },
  { title: 'Đề tổng hợp giữa kỳ', questions: 50, duration: '90 phút', score: 'Chưa làm', difficulty: 'Tổng hợp', completed: false }
];

export const notifications = [
  { title: 'Bài kiểm tra Chương 2 sắp đến hạn', description: 'Bạn còn 1 ngày để hoàn thành bài kiểm tra trắc nghiệm.', time: '10 phút trước', icon: 'alarm', tone: 'primary', unread: true },
  { title: 'Giảng viên đã nhận xét báo cáo', description: 'Báo cáo thí nghiệm số 00 đã có phản hồi mới.', time: '2 giờ trước', icon: 'rate_review', tone: 'success', unread: true },
  { title: 'Có tài liệu mới trong kho học liệu', description: 'Bộ công thức trọng tâm Chương 3 đã được cập nhật.', time: 'Hôm qua', icon: 'folder_open', tone: 'neutral', unread: false }
];

export const labs = [
  { title: 'Khảo sát chuyển động thẳng biến đổi đều', code: 'Bài TN 01', status: 'Đã hoàn thành', progress: 100, image: 'speed' },
  { title: 'Khảo sát lực ma sát và chuyển động trên mặt phẳng nghiêng', code: 'Bài TN 02', status: 'Đang thực hiện', progress: 60, image: 'incline' },
  { title: 'Va chạm đàn hồi và không đàn hồi', code: 'Bài TN 03', status: 'Chưa bắt đầu', progress: 0, image: 'collision' },
  { title: 'Con lắc vật lý thuận nghịch Kater', code: 'Bài TN 04', status: 'Chưa mở khóa', progress: 0, image: 'pendulum' }
];

export const rubricRows = [
  ['Cơ sở lý thuyết', '2.0', 'Trình bày đúng định luật và mô hình vật lý', '2.0'],
  ['Phương pháp thực nghiệm', '2.0', 'Mô tả được quy trình và biến số kiểm soát', '1.8'],
  ['Xử lý số liệu', '3.0', 'Bảng số liệu, đồ thị và sai số đo', '2.7'],
  ['Nhận xét và kết luận', '2.0', 'Giải thích kết quả có lập luận', '1.8'],
  ['Trình bày', '1.0', 'Bố cục rõ ràng, đúng định dạng', '1.0']
];

export const results = [
  { label: 'Điểm trung bình', value: '8.5', unit: '/10', icon: 'emoji_events', tone: 'gold' },
  { label: 'Độ chính xác', value: '84.5', unit: '%', icon: 'target', tone: 'green' },
  { label: 'Bài đã hoàn thành', value: '18', unit: '/24', icon: 'task_alt', tone: 'primary' },
  { label: 'Thứ hạng lớp', value: '08', unit: '/42', icon: 'leaderboard', tone: 'neutral' }
];
