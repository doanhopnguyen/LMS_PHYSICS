import React from 'react';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { PageContainer } from '../components/PageContainer.jsx';
import { PageTitle } from '../components/PageTitle.jsx';
import { ProgressBar } from '../components/ProgressBar.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { rubricRows } from '../data/lmsData.js';

export function LabReportPage() {
  return 
    <AppShell currentPage="virtual_lab.html" title="Rubric báo cáo thí nghiệm · PTIT Physics 1" breadcrumbs={
      ['Phòng thí nghiệm 3D']} current="Rubric báo cáo">
        <PageContainer>
          <PageTitle eyebrow="BÁO CÁO THÍ NGHIỆM SỐ 01" title="Rubric đánh giá báo cáo" description="Khảo sát rơi tự do — nhóm thực hành của Nguyễn Văn A." actions={
            <><Button variant="secondary" icon="save">Lưu bản nháp</Button>
            <Button icon="send">Nộp báo cáo</Button>
            </>
          } />
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone="warning">ĐANG CHẤM</StatusBadge>
                  <span className="text-body-sm text-[#64748B]">Cập nhật 19/03/2025</span>
                  </div>
                  <h2 className="text-headline-md font-bold mt-2">Đánh giá tiến độ báo cáo</h2>
                  <p className="text-body-md text-[#64748B] mt-1">Bạn đã hoàn thành 4/5 hạng mục bắt buộc.</p>
                  </div>
                  <div className="w-full lg:w-80">
                    <ProgressBar value={86} label="Mức độ hoàn thiện" className="text-[#64748B]" />
                    </div></div></Card><div className="grid grid-cols-1 lg:grid-cols-12 gap-6"><Card className="lg:col-span-8 p-6"><div className="flex items-center justify-between mb-5"><h2 className="text-headline-md font-bold">Thang điểm Rubric</h2><strong className="text-headline-md text-[#15803D]">9.3 / 10</strong></div><DataTable columns={['Tiêu chí','Tối đa','Mô tả','Đạt']} rows={rubricRows} renderRow={(row) => <tr className="border-t border-[#E2E8F0]" key={row[0]}><td className="px-4 py-3 font-semibold">{row[0]}</td><td className="px-4 py-3">{row[1]}</td><td className="px-4 py-3 text-[#64748B]">{row[2]}</td><td className="px-4 py-3 font-bold text-[#15803D]">{row[3]}</td></tr>} /></Card><Card className="lg:col-span-4 p-6"><h2 className="text-headline-sm font-bold">Nhận xét giảng viên</h2><div className="mt-4 p-4 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-body-md leading-relaxed">Số liệu được trình bày rõ ràng, sai số tính hợp lý. Bổ sung thêm phần giải thích nguyên nhân chênh lệch giữa giá trị thực nghiệm và lý thuyết.</div><div className="mt-5 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-primary flex items-center justify-center font-bold">MD</div><div><strong className="text-body-md">TS. Minh Đức</strong><p className="text-body-sm text-[#64748B]">Giảng viên hướng dẫn</p></div></div></Card></div><Card className="p-6"><h2 className="text-headline-md font-bold">Minh chứng thực nghiệm</h2><div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">{['Ảnh thiết bị Lab 3D','Bảng số liệu đo','Đồ thị hồi quy'].map((label) => <div key={label} className="aspect-video rounded-xl bg-gradient-to-br from-[#1E293B] to-[#475569] flex flex-col items-center justify-center text-white gap-2"><span className="material-symbols-outlined text-3xl">image</span><span className="text-body-sm">{label}</span></div>)}</div></Card></PageContainer></AppShell>;
}
