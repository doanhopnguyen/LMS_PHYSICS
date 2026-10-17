import React from 'react';
import { SelectField } from './SelectField.jsx';
import { difficultyLevels, cognitiveLevels, canonicalCognitiveLevel } from '../lib/questionLevels.js';

export function QuestionLevelFields({ initial = {}, disabled = false }) {
  const cognitiveLevel = canonicalCognitiveLevel(initial.cognitiveLevel);
  const legacyValue = cognitiveLevel && !cognitiveLevels.some(([value]) => value === cognitiveLevel);
  return (
    <>
      <SelectField
        label="Độ khó *"
        name="difficultyLevel"
        defaultValue={initial.difficultyLevel || 'EASY'}
        required
        disabled={disabled}
      >
        {difficultyLevels.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <SelectField label="Mức nhận thức" name="cognitiveLevel" defaultValue={cognitiveLevel} disabled={disabled}>
        <option value="">Chưa phân loại</option>
        {legacyValue && <option value={cognitiveLevel}>Giá trị đã lưu: {cognitiveLevel}</option>}
        {cognitiveLevels.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
    </>
  );
}
