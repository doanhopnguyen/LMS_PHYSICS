import { SelectField as SharedSelectField } from '../../components/SelectField.jsx';
import { PaginatedList } from '../../components/Pagination.jsx';
import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { PageContainer } from '../../components/PageContainer.jsx';
import { PageTitle } from '../../components/PageTitle.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { api } from '../../lib/apiClient.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const labProgressOf = (experiment) => {
  const value = Number(experiment?.progressPercent ?? experiment?.completionPercent ?? experiment?.progress);
  if (Number.isFinite(value)) return Math.min(100, Math.max(0, value));
  const status = String(
    experiment?.submissionStatus || experiment?.assignmentStatus || experiment?.status || ''
  ).toUpperCase();
  return ['SUBMITTED', 'GRADED', 'COMPLETED', 'CONFIRMED'].includes(status) ? 100 : 0;
};
const labStatus = (experiment, progress) => {
  if (progress >= 100) return 'Đã hoàn thành';
  return experiment?.submissionStatus || experiment?.assignmentStatus || experiment?.status || 'Chưa bắt đầu';
};

export function VirtualLabPage() {
  const [experiments, setExperiments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const selectedClass = classes.find((item) => String(item.classId) === String(classId));

  useEffect(() => {
    let alive = true;
    Promise.all([api.students.myClasses(), api.students.myExperimentAssignments().catch(() => [])])
      .then(([data, assignmentData]) => {
        if (!alive) return;
        const items = rowsOf(data);
        setClasses(items);
        setAssignments(rowsOf(assignmentData));
        if (!items.length) setLoading(false);
      })
      .catch((loadError) => {
        if (alive) {
          setError(loadError.message || 'Không thể tải học phần.');
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!classes.length) return;
    let alive = true;
    setLoading(true);
    setError('');
    const assigned = assignments.filter(
      (item) => !selectedClass || String(item.classId) === String(selectedClass.classId)
    );
    if (assigned.length) {
      Promise.all(
        assigned.map(async (assignment) => ({
          ...assignment,
          ...(await api.experiments.get(assignment.experimentId)),
          experimentId: assignment.experimentId,
        }))
      )
        .then((items) => {
          if (alive) setExperiments(items);
        })
        .catch((loadError) => {
          if (alive) setError(loadError.message || 'Không thể tải chi tiết thí nghiệm được giao.');
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }
    const subjectIds = [
      ...new Set((selectedClass ? [selectedClass] : classes).map((item) => item.subjectId).filter(Boolean)),
    ];
    Promise.all(subjectIds.map((id) => api.experiments.list(id)))
      .then((groups) => {
        if (!alive) return;
        const unique = new Map();
        groups.flatMap(rowsOf).forEach((item) => unique.set(String(item.experimentId), item));
        setExperiments([...unique.values()]);
      })
      .catch((loadError) => {
        if (alive) setError(loadError.message || 'Không thể tải danh sách thí nghiệm.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [assignments, classId, classes]);

  return (
    <AppShell
      currentPage="virtual_lab.html"
      title="Phòng thí nghiệm 3D · PTIT Physics 1"
      breadcrumbs={['Phòng thí nghiệm 3D']}
      current="Danh sách thí nghiệm"
      filterActions={
        <>
          <SharedSelectField
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            label={<>Học phần</>}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap text-body-sm font-semibold"
          >
            <option value="">Tất cả học phần</option>
            {classes.map((item) => (
              <option key={item.classId} value={item.classId}>
                {item.subjectName || item.subjectCode || item.classCode}
              </option>
            ))}
          </SharedSelectField>
          <a href="student_evidence.html">
            <Button icon="history">Minh chứng của tôi</Button>
          </a>
        </>
      }
    >
      <PageContainer>
        <PageTitle
          eyebrow="PHÒNG THÍ NGHIỆM 3D"
          title="Thí nghiệm trực tuyến"
          description="Chọn học phần để mở mô phỏng, đọc hướng dẫn và lập báo cáo thực hành."
        />
        {loading ? (
          <p className="py-10 text-center text-body-md text-[#64748B]">Đang tải danh sách thí nghiệm…</p>
        ) : error ? (
          <Card className="p-8 text-center">
            <p role="alert" className="text-primary">
              {error}
            </p>
          </Card>
        ) : !classes.length ? (
          <Card className="p-10 text-center text-[#64748B]">Bạn chưa được ghi danh vào học phần nào.</Card>
        ) : !experiments.length ? (
          <Card className="p-10 text-center text-[#64748B]">Không có bài thí nghiệm phù hợp.</Card>
        ) : (
          <PaginatedList className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {experiments.map((experiment, index) => {
              const progress = labProgressOf(experiment);
              const linkedClassId = selectedClass?.classId || experiment.classId || '';
              const query = `experimentId=${encodeURIComponent(experiment.experimentId)}${linkedClassId ? `&classId=${encodeURIComponent(linkedClassId)}` : ''}`;
              return (
                <StatCard
                  key={experiment.experimentId}
                  label={experiment.title || 'Thí nghiệm không có tiêu đề'}
                  value={`${Math.round(progress)}%`}
                  detail={`Thí nghiệm ${String(experiment.orderIndex || index + 1).padStart(2, '0')}`}
                  icon="science"
                  ribbonLabel={`THÍ NGHIỆM ${String(experiment.orderIndex || index + 1).padStart(2, '0')}`}
                  ribbonPosition="bottom"
                  accentColor={['#E52220', '#0284C7', '#7C3AED', '#15803D'][index % 4]}
                  footer={
                    <>
                      <p className="line-clamp-2 text-body-sm text-[#64748B]">
                        {experiment.description || labStatus(experiment, progress)}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <a href={`3d_workspace.html?${query}`} className="flex-1">
                          <Button className="w-full" icon="play_arrow">
                            Mở mô phỏng
                          </Button>
                        </a>
                        <a
                          href={`lab_report_rubric.html?${query}${experiment.assignmentId ? `&assignmentId=${encodeURIComponent(experiment.assignmentId)}` : ''}`}
                        >
                          <button
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#CBD5E1] text-[#64748B] hover:border-primary hover:text-primary"
                            aria-label="Mở báo cáo"
                          >
                            <span className="material-symbols-outlined">description</span>
                          </button>
                        </a>
                      </div>
                    </>
                  }
                />
              );
            })}
          </PaginatedList>
        )}
      </PageContainer>
    </AppShell>
  );
}
