import React from 'react';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { clearDemoSession, demoRoles } from '../lib/demoSession.js';
import { navigate } from '../lib/navigation.js';

export function RoleAccessPage({ session }) {
  const goLogin = () => { clearDemoSession(); navigate('login.html'); };
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-5 flex items-center justify-center">
      <Card className="max-w-lg w-full p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-primary">lock</span>
        <p className="mt-4 text-label-md font-bold text-primary">TRUY CẬP BỊ GIỚI HẠN</p>
        <h1 className="mt-2 text-headline-md font-bold">Vai trò {session ? demoRoles[session.role].label : 'hiện tại'} không có quyền mở trang này</h1>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          {session && <Button onClick={() => navigate(session.home)}>Về khu vực của tôi</Button>}
          <Button variant="secondary" onClick={goLogin}>Đổi tài khoản demo</Button>
        </div>
      </Card>
    </main>
  );
}
