import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { NotificationsProvider } from './hooks/useNotifications.js';
import './styles.css';
import './styles/header.css';
import './styles/action-menu.css';
import './styles/tables.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationsProvider><App /></NotificationsProvider>
  </React.StrictMode>
);
