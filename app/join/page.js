'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Providers, { useAuth } from '../providers';

export default function JoinPage() {
  return (
    <Providers>
      <JoinInner />
    </Providers>
  );
}

function JoinInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, ready } = useAuth();
  const inviteCode = searchParams.get('code') || '';
  const roleFromUrl = searchParams.get('role') || 'idea';
  const topicFromUrl = searchParams.get('topic') || '';

  const [group, setGroup] = useState(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState(roleFromUrl);
  const [topicId, setTopicId] = useState(topicFromUrl);
  const [topics, setTopics] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.push('/?login=1');
    }
  }, [ready, user, router]);

  useEffect(() => {
    setRole(roleFromUrl);
  }, [roleFromUrl]);

  useEffect(() => {
    setTopicId(topicFromUrl);
  }, [topicFromUrl]);

  useEffect(() => {
    if (!inviteCode) return;
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`/api/invites/${inviteCode}`);
        if (!res.ok) {
          setStatus({ type: 'error', message: 'Không tìm thấy nhóm với liên kết mời này.' });
          return;
        }
        const data = await res.json();
        if (!active) return;
        setGroup(data.group);
        setTopics(data.topics || []);
      } catch (error) {
        setStatus({ type: 'error', message: 'Không thể kết nối backend. Thử lại sau.' });
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [inviteCode]);

  const handleJoin = async () => {
    setStatus({ type: '', message: '' });

    if (!inviteCode) {
      setStatus({ type: 'error', message: 'Vui lòng nhập liên kết mời hợp lệ.' });
      return;
    }

    if (!name.trim()) {
      setStatus({ type: 'error', message: 'Vui lòng nhập tên của bạn.' });
      return;
    }

    if (!group) {
      setStatus({ type: 'error', message: 'Không tìm thấy nhóm. Kiểm tra lại liên kết mời.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          role,
          topic_id: topicId || null
        })
      });

      if (!res.ok) {
        setStatus({ type: 'error', message: 'Không thể tham gia nhóm. Vui lòng thử lại.' });
        setLoading(false);
        return;
      }

      const memberData = await res.json();

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'brainstorm_member',
          JSON.stringify({
            id: memberData.id,
            name,
            role,
            groupId: group.id
          })
        );
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Không thể kết nối backend. Thử lại sau.' });
      setLoading(false);
      return;
    }

    setLoading(false);

    if (topicId) {
      router.push(`/groups/${group.id}/topics/${topicId}`);
      return;
    }

    router.push(`/groups/${group.id}`);
  };

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
              {user && <Link href="/groups">Nhóm</Link>}
            </div>
          </div>
          <div className="nav-actions">
            {user && (
              <Link className="btn ghost" href="/groups">
                Quay lại nhóm
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="page-shell">
        <section className="page-header">
          <div>
            <p className="eyebrow">Tham gia nhóm</p>
            <h1 className="page-title">Gia nhập bằng liên kết mời</h1>
            <p className="page-subtitle">
              Nhập tên của bạn và chọn quyền trong tab chủ đề. Link mời sẽ đưa bạn vào nhóm ngay.
            </p>
          </div>
        </section>

        {status.message && (
          <div className={`notice ${status.type === 'error' ? 'error' : ''}`}>
            {status.message}
          </div>
        )}

        <section className="form-card join-card">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="invite-code">Mã mời</label>
              <input id="invite-code" type="text" value={inviteCode} readOnly />
            </div>
            <div className="form-field">
              <label htmlFor="join-name">Tên của bạn</label>
              <input
                id="join-name"
                type="text"
                placeholder="Nhập tên hiển thị"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="join-role">Quyền trong tab</label>
              <select id="join-role" value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="swot">Phân tích SWOT</option>
                <option value="idea">Đóng góp ý tưởng</option>
                <option value="both">SWOT + Ý tưởng</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="join-topic">Tab chủ đề (tùy chọn)</label>
              <select id="join-topic" value={topicId} onChange={(event) => setTopicId(event.target.value)}>
                <option value="">Không chỉ định</option>
                {topics.map((topic) => (
                  <option value={topic.id} key={topic.id}>
                    {topic.title ?? topic.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {group && (
            <div className="notice">
              Bạn đang tham gia nhóm: <strong>{group.name ?? group.id}</strong>
            </div>
          )}
          <div className="form-actions">
            <button className="btn primary" type="button" onClick={handleJoin} disabled={loading}>
              {loading ? 'Đang tham gia...' : 'Tham gia ngay'}
            </button>
            <Link className="btn outline" href="/groups">
              Quay lại danh sách nhóm
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
