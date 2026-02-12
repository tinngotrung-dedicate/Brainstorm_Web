'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Providers, { useAuth } from '../../../providers';

const SAMPLE_GROUP = {
  id: 'alpha-lab',
  name: 'Alpha Lab',
  inviteCode: 'ALPHA2026'
};

const SAMPLE_TOPICS = [
  { id: 'nano-bio', title: 'Vật liệu nano sinh học' },
  { id: 'energy-storage', title: 'Lưu trữ hydrogen' },
  { id: 'ai-protocol', title: 'AI dự đoán thực nghiệm' }
];

export default function InvitePage({ params }) {
  return (
    <Providers>
      <InviteInner params={params} />
    </Providers>
  );
}

function InviteInner({ params }) {
  const groupId = params?.groupId ?? SAMPLE_GROUP.id;
  const router = useRouter();
  const { user, ready } = useAuth();
  const [group, setGroup] = useState({ ...SAMPLE_GROUP, id: groupId });
  const [topics, setTopics] = useState(SAMPLE_TOPICS);
  const [origin, setOrigin] = useState('');
  const [topicId, setTopicId] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.push('/?login=1');
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [groupRes, topicRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/groups/${groupId}/topics`)
        ]);

        if (!active) return;

        if (groupRes.ok) {
          const groupData = await groupRes.json();
          setGroup({
            id: groupData.id,
            name: groupData.name ?? groupData.id,
            inviteCode: groupData.invite_code ?? ''
          });
        }

        if (topicRes.ok) {
          const topicData = await topicRes.json();
          if (Array.isArray(topicData) && topicData.length) {
            setTopics(topicData.map((topic) => ({ id: topic.id, title: topic.title ?? topic.id })));
          }
        }
      } catch (error) {
        setStatus({ type: 'error', message: 'Không thể kết nối backend.' });
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [groupId]);

  const buildLink = (role) => {
    if (!origin || !group.inviteCode) return '';
    const params = new URLSearchParams();
    params.set('code', group.inviteCode);
    params.set('role', role);
    if (topicId) params.set('topic', topicId);
    return `${origin}/join?${params.toString()}`;
  };

  const linkSwot = useMemo(() => buildLink('swot'), [origin, group.inviteCode, topicId]);
  const linkIdea = useMemo(() => buildLink('idea'), [origin, group.inviteCode, topicId]);
  const linkBoth = useMemo(() => buildLink('both'), [origin, group.inviteCode, topicId]);

  const copyLink = async (link) => {
    if (!link) {
      setStatus({ type: 'error', message: 'Chưa có liên kết để sao chép.' });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      setStatus({ type: 'success', message: 'Đã sao chép liên kết mời.' });
      return;
    }
    setStatus({ type: 'error', message: 'Trình duyệt không hỗ trợ sao chép tự động.' });
  };

  const regenerateCode = async () => {
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, { method: 'POST' });
      if (!res.ok) {
        setStatus({ type: 'error', message: 'Không thể tạo liên kết mời.' });
        return;
      }
      const data = await res.json();
      setGroup((prev) => ({ ...prev, inviteCode: data.invite_code ?? prev.inviteCode }));
      setStatus({ type: 'success', message: 'Đã tạo liên kết mời thành công.' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Không thể kết nối backend.' });
    }
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
              <Link href="/groups">Nhóm</Link>
              <Link href={`/groups/${groupId}`}>Bảng điều khiển</Link>
            </div>
          </div>
          <div className="nav-actions">
            <Link className="btn ghost" href={`/groups/${groupId}`}>
              Quay lại nhóm
            </Link>
          </div>
        </nav>
      </header>

      <main className="page-shell">
        <div className="breadcrumb">
          <Link href="/groups">Nhóm</Link>
          <span>/</span>
          <Link href={`/groups/${groupId}`}>{group.name}</Link>
          <span>/</span>
          <span>Mời thành viên</span>
        </div>

        <section className="page-header">
          <div>
            <p className="eyebrow">Mời thành viên</p>
            <h1 className="page-title">Gửi liên kết tham gia</h1>
            <p className="page-subtitle">
              Chủ trì chia sẻ liên kết mời, chọn tab chủ đề và gán quyền SWOT hoặc ý tưởng.
            </p>
          </div>
          <div className="page-actions">
            <button className="btn primary" type="button" onClick={regenerateCode}>
              Tạo liên kết mời
            </button>
          </div>
        </section>

        {status.message && (
          <div className={`notice ${status.type === 'error' ? 'error' : ''}`}>
            {status.message}
          </div>
        )}

        <section className="dashboard-card">
          <h3 className="card-title">Chọn tab chủ đề (tùy chọn)</h3>
          <div className="inline-form">
            <select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
              <option value="">Mỗi tab chủ đề</option>
              {topics.map((topic) => (
                <option value={topic.id} key={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="dashboard-card">
          <h3 className="card-title">Liên kết mời hiện tại</h3>
          <div className="invite-box">
            <span className="invite-link">{linkBoth || 'Đang tạo liên kết...'}</span>
            <button className="btn ghost" type="button" onClick={() => copyLink(linkBoth)}>
              Sao chép liên kết
            </button>
          </div>
          <div className="invite-meta">
            <span className="badge">Hiệu lực 7 ngày</span>
            <span className="badge">Tự động gán quyền</span>
          </div>
          <p className="muted-text">
            Bạn có thể tạo liên kết riêng theo quyền SWOT hoặc ý tưởng bên dưới.
          </p>
          <div className="link-grid">
            <div>
              <h4>Phân tích SWOT</h4>
              <span className="invite-link">{linkSwot}</span>
            </div>
            <div>
              <h4>Đóng góp ý tưởng</h4>
              <span className="invite-link">{linkIdea}</span>
            </div>
            <div>
              <h4>SWOT + Ý tưởng</h4>
              <span className="invite-link">{linkBoth}</span>
            </div>
          </div>
        </section>

        <section className="section reveal">
          <div className="section-header">
            <h2>Hướng dẫn nhanh</h2>
            <p>3 bước để mời đúng người vào đúng tab chủ đề.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <h3>1. Chọn tab chủ đề</h3>
              <p>Xác định thành viên sẽ tham gia tab nào.</p>
              <span className="chip">Phân tab</span>
            </article>
            <article className="feature-card">
              <h3>2. Gán quyền</h3>
              <p>Chọn phân tích SWOT hoặc đóng góp ý tưởng.</p>
              <span className="chip">Kiểm soát quyền</span>
            </article>
            <article className="feature-card">
              <h3>3. Gửi liên kết</h3>
              <p>Chia sẻ liên kết qua email, chat, hoặc LMS.</p>
              <span className="chip">Liên kết mời</span>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
