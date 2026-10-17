import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { NotificationsProvider } from './hooks/useNotifications.js';
import './styles/base.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationsProvider><App /></NotificationsProvider>
  </React.StrictMode>
);
