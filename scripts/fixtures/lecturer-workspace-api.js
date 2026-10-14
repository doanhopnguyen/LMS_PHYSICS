localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'INSTRUCTOR',userId:'teacher1',name:'Giảng viên Một'}));
localStorage.setItem('ptit-physics-access-token','isolated-test');
window.calls=[];
const gradingQuestions = [
  { questionId: 'q0', topicId: 't1', content: 'Câu có trọng số 2', questionType: 'MCQ_SINGLE', scoreWeight: 2, options: [{ optionId: 'a0', content: 'Đúng' }, { optionId: 'b0', content: 'Sai' }], selectedOptionIds: ['a0'], isCorrect: true, score: 2 },
  { questionId: 'q5', topicId: 't1', content: 'Câu có trọng số 3', questionType: 'FILL_BLANK', scoreWeight: 3, answerText: 'Sai', isCorrect: false, score: 0 },
];
const examAttempts = [
  { attemptId: 'attempt1', examId: 'exam1', studentId: 'stu1', studentName: 'Sinh viên Một', status: 'GRADED', totalScore: 2, questions: gradingQuestions },
  { attemptId: 'attempt2', examId: 'exam1', studentId: 'stu2', studentName: 'Sinh viên Hai', status: 'SUBMITTED', totalScore: null, questions: gradingQuestions },
  { attemptId: 'attempt3', examId: 'exam1', studentId: 'stu3', studentName: 'Sinh viên Ba', status: 'IN_PROGRESS', totalScore: 0, questions: gradingQuestions },
  { attemptId: 'attempt4', examId: 'exam1', studentId: 'stu4', studentName: 'Sinh viên Bốn', status: 'GRADED', totalScore: 0, questions: gradingQuestions },
];
const subjects=[{subjectId:'s0',subjectCode:'PHY0',subjectName:'Cơ học',isActive:true},{subjectId:'s1',subjectCode:'PHY1',subjectName:'Điện học',isActive:true},{subjectId:'s2',subjectCode:'OTHER',subjectName:'Môn không được phân dạy',isActive:true}];
const classes=Array.from({length:106},(_,i)=>({classId:'c'+i,subjectId:i===105?'s1':'s0',semesterId:i%2===0?'sem1':'sem2',classCode:'VL-'+i,status:'ACTIVE',instructorId:'teacher1',maxStudents:40}));
const semesters=[{semesterId:'sem1',semesterName:'Học kỳ 1',academicYear:'2026–2027'},{semesterId:'sem2',semesterName:'Học kỳ 2',academicYear:'2026–2027'}];
const topics=[{topicId:'t1',subjectId:'s0',topicName:'Định luật Newton',chapterId:'ch1',orderIndex:1}];
const clos=[{cloId:'clo1',subjectId:'s0',cloCode:'CLO1',description:'Vận dụng định luật Newton',isActive:true,orderIndex:1},{cloId:'clo2',subjectId:'s0',cloCode:'CLO2',description:'Chuẩn đầu ra cũ',isActive:false,orderIndex:2}];
const questions=Array.from({length:107},(_,i)=>({questionId:'q'+i,subjectId:'s0',topicId:'t1',content:'Câu hỏi '+i,questionType:'MCQ_SINGLE',difficultyLevel:'EASY',approvalStatus:i===2?'DRAFT':i===3?'REJECTED':i===4?'PENDING':i<80?'APPROVED':'DRAFT',createdBy:i===1?'teacher2':'teacher1',cloIds:['clo1'],rejectionReason:i===3?'Cần sửa nội dung':null,options:[{optionId:'a'+i,content:'Đúng',isCorrect:true},{optionId:'b'+i,content:'Sai',isCorrect:false}]}));
const materials=[{materialId:'m1',topicId:'t1',subjectId:'s0',scope:'SHARED',title:'Bài đọc dùng chung',type:'TEXT',contentText:'Học liệu dùng chung',approvalStatus:'APPROVED',createdBy:'teacher2'},{materialId:'private1',topicId:'t1',subjectId:'s0',classId:'c0',scope:'CLASS',title:'Bài đọc riêng',type:'TEXT',contentText:'Nội dung cho lớp c0',approvalStatus:'PENDING',createdBy:'teacher1'}];
const sent=[];
const exams=[{examId:'exam1',classId:'c0',title:'Kiểm tra Cơ học',examType:'QUIZ',durationMinutes:30,startTime:'2026-10-19T01:00:00Z',endTime:'2026-10-19T02:00:00Z',maxAttempts:2,shuffleQuestions:false,shuffleOptions:false,isPublished:true,totalQuestions:1}];
window.lecturerQuestions=questions;
window.fetch=async(input,options={})=>{
  const url=new URL(input,location.origin),p=url.pathname,m=options.method||'GET';
  const body=options.body instanceof FormData?Object.fromEntries(options.body):typeof options.body==='string'?JSON.parse(options.body):null;
  calls.push({path:p,method:m,query:Object.fromEntries(url.searchParams),body});
  const paged=rows=>{const page=Number(url.searchParams.get('page')||0),size=Number(url.searchParams.get('size')||20);return {content:rows.slice(page*size,(page+1)*size),totalElements:rows.length,totalPages:Math.ceil(rows.length/size),size,last:(page+1)*size>=rows.length};};
  if(window.failLecturer&&m==='GET'&&p==='/api/v1/instructor/classes')return Response.json({message:'Không tải được lớp phụ trách'},{status:500});
  if(p==='/api/v1/instructor/classes/foreign'||p==='/api/v1/classes/foreign')return Response.json({message:'Bạn không được phân công vào lớp này'},{status:403});
  if(window.failSend&&m==='POST'&&p.includes('/notifications/classes/'))return Response.json({message:'Gửi thông báo thất bại'},{status:500});
  let data=[];
  if(p==='/api/v1/users/me'||p==='/api/v1/users/profile')data={userId:'teacher1',role:'INSTRUCTOR',username:'teacher',fullName:'Giảng viên Một'};
  if(p==='/api/v1/notifications/summary')data={unreadCount:0,latestNotifications:[]};
  if(p==='/api/v1/notifications')data=paged([]);
  if(p==='/api/v1/subjects')data=paged(subjects);
  if(p==='/api/v1/semesters')data=semesters;
  if(p==='/api/v1/instructor/classes'||p==='/api/v1/classes')data=paged(classes);
  if(p.startsWith('/api/v1/instructor/classes/')&&p.split('/').length===6)data=classes.find(row=>row.classId===p.split('/').pop());
  if(p.startsWith('/api/v1/classes/')&&p.split('/').length===5)data=classes.find(row=>row.classId===p.split('/').pop());
  if(p.endsWith('/chapters'))data=[{chapterId:'ch1',chapterName:'Chương Cơ học',orderIndex:1}];
  if(p.endsWith('/topics'))data=p.includes('/s0/')?topics:[];
  if(p.endsWith('/clos')&&p.includes('/subjects/'))data=clos.filter(row=>row.subjectId===p.split('/')[4]);
  if(p.endsWith('/students'))data=paged([{studentId:'stu1',fullName:'Sinh viên Một',studentCode:'SV01',username:'sv1',status:'ACTIVE'},{studentId:'stu2',fullName:'Sinh viên Hai',studentCode:'SV02',username:'sv2',status:'ACTIVE'}]);
  if(p.endsWith('/progress'))data=[{studentId:'stu1',classId:'c0',topicId:'t1',progressPercent:75,status:'IN_PROGRESS'},{studentId:'stu2',classId:'c0',topicId:'t1',progressPercent:20,status:'IN_PROGRESS'}];
  if(p==='/api/v1/dashboard/class/c0'||p==='/api/v1/dashboard/me')data={totalStudents:2,averageProgress:47.5};
  if(p.endsWith('/materials')&&m==='GET')data=p.includes('/classes/')?materials:materials.filter(row=>row.scope==='SHARED');
  if(p.endsWith('/materials')&&m==='POST'){data={...body,materialId:'new-private',subjectId:'s0',topicId:'t1',approvalStatus:'PENDING',createdBy:'teacher1'};materials.push(data);}
  if(p.endsWith('/materials/m1'))data=materials[0];
  if(p==='/api/v1/questions'){
    if(m==='POST'){data={...body,questionId:'new-question',createdBy:'teacher1'};questions.push(data);}else data=paged(questions.filter(row=>!url.searchParams.get('subjectId')||row.subjectId===url.searchParams.get('subjectId')));
  }
  if(p.startsWith('/api/v1/questions/')&&!p.includes('import-excel')){const question=questions.find(row=>row.questionId===p.split('/')[4]);if(question){if(m==='PUT'){if(p.endsWith('/submit-review'))question.approvalStatus='PENDING';else Object.assign(question,body);}data=question;}}
  if(p==='/api/v1/questions/import-excel'&&m==='POST'){const question={...questions[2],questionId:'excel-q',content:'Câu Excel giảng viên',approvalStatus:'DRAFT'};questions.push(question);data={totalParsed:1,totalImported:1,questions:[question],warnings:[]};}
  if(p.startsWith('/api/v1/notifications/classes/')){
    if(m==='POST'){data={sentCount:2};sent.push({...body,notificationId:'sent'+sent.length,createdAt:new Date().toISOString()});}else data=paged(sent);
  }
  if(p.startsWith('/api/v1/exams/class/'))data=exams.filter(row=>row.classId===p.split('/').pop());
  if(p==='/api/v1/exams'&&m==='POST'){data={...body,examId:'new-exam',totalQuestions:0};exams.push(data);}
  if(p.startsWith('/api/v1/exams/')&&p.split('/').length===5){data=exams.find(row=>row.examId===p.split('/').pop());if(m==='PUT')Object.assign(data,body);}
  if(p.endsWith('/exam1/questions'))data=gradingQuestions;
  if(p.endsWith('/attempts'))data=examAttempts;
  if(p.includes('/exams/attempts/')) {
    const attempt = examAttempts.find(row => row.attemptId === p.split('/')[5]);
    if (attempt) {
      if (m === 'PUT' && p.endsWith('/grade')) Object.assign(attempt, {totalScore:body.totalScore,status:'GRADED'});
      data = attempt;
    }
  }
  if(p.endsWith('/roster'))data={students:[{studentId:'stu1',fullName:'Sinh viên Một'}]};
  if(p==='/api/v1/exam-matrices')data=[];
  if(p==='/api/v1/experiments')data=[{experimentId:'exp1',subjectId:'s0',title:'Thí nghiệm Newton',description:'Mô phỏng chuyển động'}];
  if(p.endsWith('/exp1/assign'))data={assignmentId:'assignment1',...body};
  if(p.includes('/experiment')&&p.includes('/submissions'))data=[];
  return Response.json({data});
};
