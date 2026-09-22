import React from 'react';
import { Button } from './Button.jsx';
import { Card } from './Card.jsx';

export function LecturerNotFoundState({ message, backHref, backLabel = 'Quay lại danh sách' }) {
  return (
    <Card className="p-8 text-center md:p-10">
      <span className="material-symbols-outlined text-4xl text-[#94A3B8]" aria-hidden="true">
        search_off
      </span>
      <h2 className="mt-3 text-headline-sm font-bold">Không tìm thấy dữ liệu</h2>
      <p className="mx-auto mt-2 max-w-xl text-body-md text-[#64748B]">{message}</p>
      <a href={backHref} className="mt-5 inline-flex">
        <Button variant="secondary" icon="arrow_back">
          {backLabel}
        </Button>
      </a>
    </Card>
  );
}
