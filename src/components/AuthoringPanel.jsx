import React from 'react';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import '../styles/authoring-pages.css';

export function AuthoringPanel({ title, description, icon = 'edit_note', busy, onClose, children }) {
  return (
    <Card className="authoring-form authoring-page">
      <div className="authoring-page__heading">
        <div className="authoring-page__intro">
          <span className="material-symbols-outlined authoring-page__icon" aria-hidden="true">
            {icon}
          </span>
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
        </div>
        <Button variant="secondary" icon="arrow_back" disabled={busy} onClick={onClose}>
          Quay lại danh sách
        </Button>
      </div>
      <div className="authoring-page__body">{children}</div>
    </Card>
  );
}
