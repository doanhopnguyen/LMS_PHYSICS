import React from 'react';
import { StatCard } from '../../components/StatCard.jsx';
import { useResource, Resource, itemsOf } from './LecturerShared.jsx';
import { PaginatedList } from '../../components/Pagination.jsx';

export function useTeachingScope(enabled = true) {
  const classes = useResource(enabled ? '/api/v1/instructor/classes' : null, true);
  const subjects = useResource(enabled ? '/api/v1/subjects' : null, true);
  const ids = new Set(itemsOf(classes.data).map((row) => row.subjectId));
  const data = itemsOf(subjects.data).filter((row) => ids.has(row.subjectId));
  return {
    classes,
    subjects: {
      ...subjects,
      data,
      loading: classes.loading || subjects.loading,
      error: classes.error || subjects.error,
      reload: () => {
        classes.reload();
        subjects.reload();
      },
    },
  };
}

export function TeachingSubjectCards({ resource, classes, onSelect, search = '' }) {
  const rows = itemsOf(resource.data).filter((row) =>
    `${row.subjectCode || ''} ${row.subjectName || ''}`
      .toLocaleLowerCase('vi')
      .includes(search.trim().toLocaleLowerCase('vi'))
  );
  return (
    <Resource value={resource}>
      {() =>
        rows.length ? (
          <PaginatedList className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <StatCard
                key={row.subjectId}
                label={row.subjectName}
                value={row.subjectCode}
                icon="menu_book"
                ribbonLabel="MÔN ĐƯỢC PHÂN DẠY"
                accentColor="#E52220"
                onOpen={() => onSelect(row.subjectId)}
                footer={
                  <span className="text-body-sm text-slate-500">
                    {itemsOf(classes).filter((item) => item.subjectId === row.subjectId).length} lớp phụ trách
                  </span>
                }
              />
            ))}
          </PaginatedList>
        ) : (
          <p className="p-5 text-body-sm text-slate-500">Không có môn học phù hợp trong danh sách được phân dạy.</p>
        )
      }
    </Resource>
  );
}
