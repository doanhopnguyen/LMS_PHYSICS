import React, { useId } from 'react';
import { Card } from './Card.jsx';

export function AuthoringSection({ number, icon, title, description, className = '', children, ...props }) {
  const titleId = useId();
  return (
    <Card className={`authoring-section ${className}`} aria-labelledby={titleId} {...props}>
      <div className="authoring-section__heading">
        <span className="authoring-section__number" aria-hidden="true">
          {number}
        </span>
        <div>
          <h3 id={titleId}>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {icon && (
          <span className="material-symbols-outlined authoring-section__icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div className="authoring-section__body">{children}</div>
    </Card>
  );
}
