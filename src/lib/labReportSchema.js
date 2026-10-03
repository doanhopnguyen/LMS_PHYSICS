const positive = (key, label, unit) => ({ key, label, unit, positive: true });
const velocity = (key, label) => ({ key, label, unit: 'm/s' });

export const labReportSchemas = {
  FREE_FALL_3D: {
    type: 'FREE_FALL_3D', title: 'Rơi tự do',
    fields: [positive('heightM', 'Độ cao', 'm'), positive('timeS', 'Thời gian rơi', 's')],
  },
  SIMPLE_PENDULUM_3D: {
    type: 'SIMPLE_PENDULUM_3D', title: 'Con lắc đơn',
    fields: [positive('lengthM', 'Chiều dài dây', 'm'), { key: 'oscillations', label: 'Số dao động', unit: 'lần', positive: true, integer: true }, positive('durationS', 'Tổng thời gian', 's')],
  },
  ROTATIONAL_INERTIA_3D: {
    type: 'ROTATIONAL_INERTIA_3D', title: 'Mô-men quán tính',
    fields: [positive('hangingMassKg', 'Khối lượng vật treo', 'kg'), positive('pulleyRadiusM', 'Bán kính trục quấn dây', 'm'), positive('fallDistanceM', 'Quãng đường vật rơi', 'm'), positive('timeS', 'Thời gian rơi', 's')],
  },
  AIR_TRACK_COLLISION_3D: {
    type: 'AIR_TRACK_COLLISION_3D', title: 'Va chạm trên đệm khí',
    fields: [positive('mass1Kg', 'Khối lượng xe 1', 'kg'), positive('mass2Kg', 'Khối lượng xe 2', 'kg'), velocity('velocity1BeforeMS', 'Vận tốc xe 1 trước va chạm'), velocity('velocity2BeforeMS', 'Vận tốc xe 2 trước va chạm'), velocity('velocity1AfterMS', 'Vận tốc xe 1 sau va chạm'), velocity('velocity2AfterMS', 'Vận tốc xe 2 sau va chạm')],
    hint: 'Chọn một chiều dương chung. Vận tốc có thể bằng 0 hoặc âm nếu xe chuyển động ngược chiều dương.',
  },
};

export const MIN_LAB_TRIALS = 3;
export const MAX_LAB_TRIALS = 20;

export function getLabReportSchema(experiment) {
  const type = experiment?.sceneAssetsJson?.type;
  if (labReportSchemas[type]) return labReportSchemas[type];
  const text = `${experiment?.title || ''} ${experiment?.sceneAssetUrl || ''}`
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  if (/con lac don|simple-pendulum/.test(text)) return labReportSchemas.SIMPLE_PENDULUM_3D;
  if (/roi tu do|free-fall/.test(text)) return labReportSchemas.FREE_FALL_3D;
  if (/mo-men quan tinh|mo men quan tinh|rotational-inertia/.test(text)) return labReportSchemas.ROTATIONAL_INERTIA_3D;
  if (/va cham|air-track-collision/.test(text)) return labReportSchemas.AIR_TRACK_COLLISION_3D;
  return null;
}

export function emptyLabTrial(schema) {
  return Object.fromEntries(schema.fields.map((field) => [field.key, '']));
}

export function buildLabReport(schema, rows, notes = '') {
  if (!schema) return { data: notes.trim() ? { notes } : null, errors: {} };
  const errors = {};
  if (rows.length < MIN_LAB_TRIALS || rows.length > MAX_LAB_TRIALS) {
    errors.rows = `Cần từ ${MIN_LAB_TRIALS} đến ${MAX_LAB_TRIALS} lần đo.`;
  }
  const measurements = rows.map((row, index) => {
    const measurement = { trial: index + 1 };
    for (const field of schema.fields) {
      const raw = String(row[field.key] ?? '').trim();
      const number = Number(raw);
      const key = `${index}.${field.key}`;
      if (!raw) errors[key] = 'Cần nhập số liệu.';
      else if (!Number.isFinite(number)) errors[key] = 'Cần nhập một số hợp lệ.';
      else if (field.positive && number <= 0) errors[key] = 'Giá trị phải lớn hơn 0.';
      else if (field.integer && !Number.isSafeInteger(number)) errors[key] = 'Cần nhập số nguyên dương.';
      measurement[field.key] = number;
    }
    return measurement;
  });
  if (Object.keys(errors).length) return { data: null, errors };
  return {
    errors,
    data: {
      schemaVersion: 1,
      experimentType: schema.type,
      units: Object.fromEntries(schema.fields.map((field) => [field.key, field.unit])),
      measurements,
      notes,
    },
  };
}
