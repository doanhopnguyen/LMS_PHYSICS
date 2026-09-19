export function getSidebar() {
  return `<aside class="fixed top-0 left-0 h-screen w-64 flex flex-col justify-between p-space-md bg-surface-container-lowest border-r border-[#E2E8F0] z-50 transition-all duration-200">
<div>
<!-- Brand Logo & Academy Header -->
<div class="flex items-center gap-3 px-space-xs py-space-sm mb-6">
<div class="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white shadow-sm flex-shrink-0">
<span class="material-symbols-outlined text-2xl font-bold" data-icon="school">school</span>
</div>
<div class="overflow-hidden">
<h1 class="text-headline-sm font-headline-sm font-bold text-primary tracking-tight leading-tight">VẬT LÝ 1</h1>
<p class="text-label-sm font-label-sm text-[#64748B] truncate">Hệ thống học tập thông minh</p>
</div>
</div>
<!-- Navigation Menu (8 items) -->
<nav class="space-y-1.5 custom-scrollbar overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
<!-- Item 1: Tổng quan (Active) -->
<a class="flex items-center gap-3 px-space-md py-2.5 rounded-lg bg-[#FEE2E2] text-primary font-body-md-medium text-body-md-medium transition-all duration-150 group" href="dashboard.html">
<span class="material-symbols-outlined text-primary" data-icon="dashboard" style="font-variation-settings: 'FILL' 1;">dashboard</span>
<span>Tổng quan</span>
</a>
<!-- Item 2: Học phần của tôi -->
<a class="flex items-center gap-3 px-space-md py-2.5 rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low hover:text-primary transition-all duration-150 group hover:translate-x-0.5" href="my_courses.html">
<span class="material-symbols-outlined text-[#64748B] group-hover:text-primary transition-colors" data-icon="menu_book">menu_book</span>
<span>Học phần của tôi</span>
</a>
<!-- Item 3: Kho học liệu -->
<a class="flex items-center gap-3 px-space-md py-2.5 rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low hover:text-primary transition-all duration-150 group hover:translate-x-0.5" href="library.html">
<span class="material-symbols-outlined text-[#64748B] group-hover:text-primary transition-colors" data-icon="folder_open">folder_open</span>
<span>Kho học liệu</span>
</a>
<!-- Item 4: Trợ giảng AI -->
<a class="flex items-center gap-3 px-space-md py-2.5 rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low hover:text-primary transition-all duration-150 group hover:translate-x-0.5" href="ai_tutor.html">
<span class="material-symbols-outlined text-[#64748B] group-hover:text-primary transition-colors" data-icon="smart_toy">smart_toy</span>
<span>Trợ giảng AI</span>
<span class="ml-auto bg-[#FEF2F2] text-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#FECACA]">24/7</span>
</a>
<!-- Item 5: Ôn luyện -->
<a class="flex items-center gap-3 px-space-md py-2.5 rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low hover:text-primary transition-all duration-150 group hover:translate-x-0.5" href="exam_practice_center.html">
<span class="material-symbols-outlined text-[#64748B] group-hover:text-primary transition-colors" data-icon="fitness_center">fitness_center</span>
<span>Ôn luyện</span>
</a>
<!-- Item 6: Kiểm tra -->
<a class="flex items-center gap-3 px-space-md py-2.5 rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low hover:text-primary transition-all duration-150 group hover:translate-x-0.5" href="exam_session.html">
<span class="material-symbols-outlined text-[#64748B] group-hover:text-primary transition-colors" data-icon="quiz">quiz</span>
<span>Kiểm tra</span>
<span class="w-2 h-2 rounded-full bg-primary-container ml-auto"></span>
</a>
<!-- Item 7: Phòng thí nghiệm 3D -->
<a class="flex items-center gap-3 px-space-md py-2.5 rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low hover:text-primary transition-all duration-150 group hover:translate-x-0.5" href="virtual_lab.html">
<span class="material-symbols-outlined text-[#64748B] group-hover:text-primary transition-colors" data-icon="science">science</span>
<span>Phòng thí nghiệm 3D</span>
</a>
<!-- Item 8: Kết quả học tập -->
<a class="flex items-center gap-3 px-space-md py-2.5 rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low hover:text-primary transition-all duration-150 group hover:translate-x-0.5" href="learning_results.html">
<span class="material-symbols-outlined text-[#64748B] group-hover:text-primary transition-colors" data-icon="insights">insights</span>
<span>Kết quả học tập</span>
</a>
</nav>
</div>
<!-- Sidebar Bottom Footer Tabs -->
<div class="pt-4 border-t border-[#E2E8F0] space-y-1">
<a class="flex items-center gap-3 px-space-md py-2 rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low hover:text-primary transition-all duration-150 group" href="notifications_help.html">
<span class="material-symbols-outlined text-[#64748B] group-hover:text-primary transition-colors" data-icon="help">help</span>
<span>Trợ giúp</span>
</a>
<a class="flex items-center gap-3 px-space-md py-2 rounded-lg text-on-surface-variant font-body-md text-body-md hover:bg-surface-container-low hover:text-primary transition-all duration-150 group" href="profile_settings.html">
<span class="material-symbols-outlined text-[#64748B] group-hover:text-primary transition-colors" data-icon="settings">settings</span>
<span>Cài đặt</span>
</a>
</div>
</aside>`;
}