import { api } from './apiClient.js';
import { listItems } from '../hooks/useApiData.js';

// OpenAPI provides a paged list, not GET /notifications/{id}.
export async function findOwnNotification(id, isActive = () => true) {
  for (let page = 0; page < 10000 && isActive(); page += 1) {
    const data = await api.notifications.list({ page, size: 20 });
    if (!isActive()) return null;
    const rows = listItems(data);
    const match = rows.find((row) => row.notificationId === id);
    if (match) return match;
    if (
      Array.isArray(data) ||
      !rows.length ||
      data?.last === true ||
      (Number.isFinite(data?.totalPages) && page + 1 >= data.totalPages) ||
      (Number.isFinite(data?.totalElements) && (page + 1) * 20 >= data.totalElements)
    )
      return null;
  }
  return null;
}
