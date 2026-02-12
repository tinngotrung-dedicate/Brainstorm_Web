'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Providers, { useAuth } from '../providers';
import { formatRelative } from '../../lib/utils';

const SAMPLE_GROUPS = [
  {
    id: 'alpha-lab',
    name: 'Alpha Lab',
    focus: 'Vật liệu nano sinh học',
    host: 'Tín Ngô',
    members: 8,
    topics: 4,
    status: 'Đang hoạt động',
    updated: 'Cập nhật 2 giờ trước'
  },
  {
    id: 'green-energy',
    name: 'Green Energy',
    focus: 'Lưu trữ hydrogen và pin thế hệ mới',
    host: 'Mai Ly',
    members: 6,
    topics: 3,
    status: 'Đang mở',
    updated: 'Cập nhật hôm qua'
  },
  {
    id: 'ai-health',
    name: 'AI Health',
    focus: 'Hệ thống AI hỗ trợ chẩn đoán',
    host: 'Hoàng Trần',
    members: 10,
    topics: 5,
    status: 'Đang tổng hợp',
    updated: 'Cập nhật 3 ngày trước'
  }
];

export default function GroupsPage() {
  return (
    <Providers>
      <GroupsInner />
    </Providers>
  );
}

function GroupsInner() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [groups, setGroups] = useState(SAMPLE_GROUPS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.push('/?login=1');
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const load = async () => {
      try {
        const res = await fetch('/api/groups');
        if (!res.ok) {
          setError('Không thể tải dữ liệu từ backend.');
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!active) return;
        if (Array.isArray(data) && data.length) {
          setGroups(
            data.map((group) => ({
              id: group.id,
              name: group.name ?? group.id,
              focus: group.focus ?? 'Chưa cập nhật',
              host: group.host_name ?? 'Chủ trì',
              members: group.member_count ?? 0,
              topics: group.topic_count ?? 0,
              status: group.status ?? 'Đang mở',
              updated: formatRelative(group.updated_at || group.created_at)
            }))
          );
        }
        setLoading(false);
      } catch (error) {
        setError('Không thể kết nối backend.');
        setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [user]);

  const kpis = useMemo(() => {
    const totalMembers = groups.reduce((sum, group) => sum + (group.members || 0), 0);
    const totalTopics = groups.reduce((sum, group) => sum + (group.topics || 0), 0);

    return [
      { label: 'Nhóm đang hoạt động', value: String(groups.length).padStart(2, '0') },
      { label: 'Thành viên đang tham gia', value: totalMembers || 0 },
      { label: 'Chủ đề đang mở', value: totalTopics || 0 }
    ];
  }, [groups]);

  return (
    <>
      <div className="bg-orbits" aria-hidden="true" />

      <header className="site-header">
        <nav className="nav">
          <div className="nav-left">
            <Link className="brand" href="/">
              <span className="brand-mark" />
              <span className="brand-name">Brainstorm Lab</span>
            </Link>
            <div className="nav-links">
              <Link href="/">Trang chủ</Link>
              {user && (
                <>
                  <Link href="/groups">Nhóm</Link>
                  <Link href="/groups/new">Tạo nhóm</Link>
                </>
              )}
            </div>
          </div>
          <div className="nav-actions">
            {user && (
              <Link className="btn ghost" href="/groups/new">
                Tạo nhóm
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="page-shell">
        <section className="page-header">
          <div>
            <p className="eyebrow">Quản lý nhóm</p>
            <h1 className="page-title">Tất cả nhóm đang brainstorm</h1>
            <p className="page-subtitle">
              Tạo nhóm mới, quản lý thành viên, và theo dõi các chủ đề nghiên cứu
              theo từng phiên hợp tác.
            </p>
          </div>
          <div className="page-actions">
            <Link className="btn primary" href="/groups/new">
              Tạo nhóm mới
            </Link>
            <Link className="btn outline" href="/join">
              Tham gia bằng liên kết
            </Link>
          </div>
        </section>

        {loading && <div className="notice">Đang tải dữ liệu nhóm...</div>}
        {error && <div className="notice error">{error}</div>}

        <section className="kpi-row">
          {kpis.map((kpi) => (
            <div className="kpi-card" key={kpi.label}>
              <span className="kpi-value">{kpi.value}</span>
              <span className="kpi-label">{kpi.label}</span>
            </div>
          ))}
        </section>

        <section className="group-grid">
          {groups.map((group) => (
            <article className="group-card" key={group.id}>
              <div className="group-header">
                <h3>{group.name}</h3>
                <span className="badge">{group.status}</span>
              </div>
              <p className="group-focus">{group.focus}</p>
              <div className="group-meta">
                <span>Chủ trì: {group.host}</span>
                <span>{group.members} thành viên</span>
                <span>{group.topics} chủ đề</span>
              </div>
              <span className="group-update">{group.updated}</span>
              <div className="group-actions">
                <Link className="btn primary" href={`/groups/${group.id}`}>
                  Mở bảng điều khiển
                </Link>
            <Link className="btn outline" href={`/groups/${group.id}/invite`}>
                  Mời thành viên
            </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="section reveal">
          <div className="section-header">
            <h2>Quy trình làm việc gọn gàng</h2>
            <p>Từ tạo nhóm đến chia quyền cho từng tab chủ đề.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <h3>1. Tạo nhóm</h3>
              <p>Đặt tên, mô tả, và quy định mức độ riêng tư.</p>
              <span className="chip">Thiết lập nhóm</span>
            </article>
            <article className="feature-card">
              <h3>2. Mời thành viên</h3>
              <p>Gửi liên kết mời, tự động cấp quyền theo vai trò.</p>
              <span className="chip">Luồng mời</span>
            </article>
            <article className="feature-card">
              <h3>3. Tạo tab chủ đề</h3>
              <p>Chủ trì khởi tạo tab, chọn quyền SWOT và ý tưởng.</p>
              <span className="chip">Tab chủ đề</span>
            </article>
            <article className="feature-card">
              <h3>4. Thu thập ý tưởng</h3>
              <p>Thành viên phân tích SWOT và đóng góp giải pháp.</p>
              <span className="chip">Hợp tác</span>
            </article>
          </div>
        </section>

      </main>
    </>
  );
}
