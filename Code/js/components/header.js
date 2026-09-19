export function getHeader() {
  return `<header class="sticky top-0 z-40 h-[72px] pl-64 w-full bg-surface-container-lowest border-b border-[#E2E8F0] flex items-center justify-between px-gutter">
<!-- Breadcrumb -->
<div class="flex items-center gap-2 text-body-md font-body-md">
<span class="text-[#64748B] hover:text-primary transition-colors cursor-pointer">Tổng quan</span>
<span class="text-[#CBD5E1]">/</span>
<span class="text-primary font-headline-sm text-headline-sm font-bold tracking-tight">Bảng điều khiển sinh viên</span>
</div>
<!-- Central Search Bar -->
<div class="relative w-[380px] hidden md:block">
<span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xl" data-icon="search">search</span>
<input class="w-full h-11 pl-11 pr-4 bg-surface-container-low border border-[#CBD5E1] rounded-xl text-body-md font-body-md text-on-surface placeholder:text-[#94A3B8] focus:bg-white focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-[#FEE2E2] transition-all" placeholder="Tìm kiếm bài học, tài liệu, công thức..." type="text"/>
<div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
<kbd class="px-1.5 py-0.5 text-[11px] font-mono text-[#64748B] bg-white border border-[#CBD5E1] rounded shadow-xs">⌘K</kbd>
</div>
</div>
<!-- Right Profile & Notification Cluster -->
<div class="flex items-center gap-4">
<!-- Notification Icon -->
<button class="relative p-2.5 rounded-xl text-[#475569] hover:bg-surface-container-low hover:text-primary transition-colors focus:outline-none" title="Thông báo mới">
<span class="material-symbols-outlined text-2xl" data-icon="notifications">notifications</span>
<span class="absolute top-2 right-2 w-2.5 h-2.5 bg-primary-container rounded-full ring-2 ring-white"></span>
</button>
<div class="h-8 w-px bg-[#E2E8F0]"></div>
<!-- Student Profile Card -->
<div class="flex items-center gap-3 pl-1">
<div class="w-10 h-10 rounded-full ring-2 ring-[#FEE2E2] bg-primary-container/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
          VA
        </div>
<div class="hidden sm:block text-left">
<div class="flex items-center gap-2">
<span class="text-body-md-medium font-body-md-medium text-on-surface leading-tight">Nguyễn Văn A</span>
<span class="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] text-label-sm font-label-sm rounded-md">Sinh viên</span>
</div>
<span class="text-body-sm font-body-sm text-[#64748B] tracking-wide">B23DCCN001</span>
</div>
</div>
</div>
</header>`;
}