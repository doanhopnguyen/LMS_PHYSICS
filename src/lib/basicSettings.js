const fields = [
  { key: 'exam.late_penalty_percent', label: 'Trừ điểm khi nộp muộn (%)', min: 0, max: 100, step: 'any' },
  { key: 'exam.max_attempts', label: 'Số lần làm bài tối đa', min: 1, step: 1 },
  { key: 'ai.daily_message_limit', label: 'Tin nhắn AI tối đa mỗi ngày', min: 0, step: 1 },
  { key: 'file.max_upload_mb', label: 'Dung lượng tệp tối đa (MB)', min: 1, step: 'any' },
];

export function basicSettings(rows) {
  return fields.flatMap((field) => {
    const row = rows.find((item) => item.settingKey === field.key);
    return row ? [{ ...field, value: row.settingValue ?? '' }] : [];
  });
}

export function settingsPayload(fields, values) {
  return Object.fromEntries(fields.map(({ key }) => [key, String(values[key] ?? '')]));
}
