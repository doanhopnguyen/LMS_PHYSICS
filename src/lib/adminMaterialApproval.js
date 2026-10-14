import { api } from './apiClient.js';

// Used only after an Admin saves a material, not for instructor submissions.
export async function approveAdminMaterial(topicId, material, client = api.materials) {
  if (!topicId || !material?.materialId) throw new Error('API chưa trả về mã học liệu để hoàn tất lưu.');
  if (material.approvalStatus === 'APPROVED') return material;
  const approved = await client.approve(topicId, material.materialId);
  const result = approved || (await client.get(topicId, material.materialId));
  if (result?.approvalStatus !== 'APPROVED' || result.materialId !== material.materialId)
    throw new Error('API chưa xác nhận học liệu đã được duyệt.');
  return result;
}
