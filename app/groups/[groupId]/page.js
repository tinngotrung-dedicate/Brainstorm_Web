'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Providers, { useAuth } from '../../providers';
import { formatRelative, makeId } from '../../../lib/utils';

const SAMPLE_GROUP = {
  id: 'alpha-lab',
  name: 'Alpha Lab',
  focus: 'Vật liệu nano ứng dụng y sinh',
  description: 'Chủ đề tổng quan: vật liệu mới và năng lượng.',
  hostName: 'Tín Ngô',
  memberCount: 8,
  topicCount: 3,
  inviteCode: 'ALPHA2026'
};

const SAMPLE_TOPICS = [
  {
    id: 'nano-bio',
    title: 'Vật liệu nano sinh học',
    status: 'Đang mở',
    members: 6,
    swot: 4,
    ideas: 12,
    focus: 'Y sinh - vật liệu mới'
  },
  {
    id: 'energy-storage',
    title: 'Lưu trữ hydrogen',
    status: 'Đang tổng hợp',
    members: 5,
    swot: 3,
    ideas: 9,
    focus: 'Năng lượng tái tạo'
  },
  {
    id: 'ai-protocol',
    title: 'AI dự đoán thực nghiệm',
    status: 'Đang mở',
    members: 4,
    swot: 2,
    ideas: 6,
    focus: 'Mô phỏng và tối ưu'
  }
];

const SAMPLE_MEMBERS = [
  { name: 'Tín Ngô', role: 'host' },
  { name: 'Mai Ly', role: 'swot' },
  { name: 'Hoàng Trần', role: 'idea' },
  { name: 'Kỳ Anh', role: 'both' }
];

const roleLabel = (role) => {
  if (role === 'host') return 'Chủ trì';
  if (role === 'swot') return 'Phân tích SWOT';
  if (role === 'idea') return 'Đóng góp ý tưởng';
  if (role === 'both') return 'SWOT + Ý tưởng';
  return 'Thành viên';
};

const roleRights = (role) => {
  if (role === 'host') return 'Tạo tab, mời thành viên';
  if (role === 'swot') return 'Phân tích SWOT';
  if (role === 'idea') return 'Đóng góp ý tưởng';
  if (role === 'both') return 'Phân tích và ý tưởng';
  return 'Đóng góp nội dung';
};

const mapTopic = (topic) => ({
  id: topic.id,
  title: topic.title ?? topic.id,
  status: topic.status ?? 'Đang mở',
  members: topic.member_count ?? 0,
  swot: topic.swot_count ?? 0,
  ideas: topic.idea_count ?? 0,
  focus: topic.description ?? 'Chưa cập nhật'
});

const mapMember = (member) => ({
  id: member.id ?? member.name,
  name: member.name,
  role: member.role
});

const addUniqueById = (list, item) => {
  if (list.some((entry) => entry.id === item.id)) return list;
  return [item, ...list];
};

export default function GroupDashboard({ params }) {
  return (
    <Providers>
      <GroupDashboardInner params={params} />
    </Providers>
  );
}

function GroupDashboardInner({ params }) {
  const groupId = params?.groupId ?? SAMPLE_GROUP.id;
  const router = useRouter();
  const { user, ready } = useAuth();
  const [group, setGroup] = useState({ ...SAMPLE_GROUP, id: groupId });
  const [topics, setTopics] = useState(SAMPLE_TOPICS);
  const [members, setMembers] = useState(SAMPLE_MEMBERS);
  const [origin, setOrigin] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);

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
    if (!user) return;
    let active = true;

    const load = async () => {
      try {
        const [groupRes, topicRes, memberRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/groups/${groupId}/topics`),
          fetch(`/api/groups/${groupId}/members`)
        ]);

        if (!active) return;

        if (groupRes.ok) {
          const groupData = await groupRes.json();
          setGroup({
            id: groupData.id,
            name: groupData.name ?? groupData.id,
            focus: groupData.focus ?? 'Chưa cập nhật',
            description: groupData.description ?? 'Chủ đề tổng quan chưa cập nhật.',
            hostName: groupData.host_name ?? 'Chủ trì',
            memberCount: groupData.member_count ?? 0,
            topicCount: groupData.topic_count ?? 0,
            inviteCode: groupData.invite_code ?? ''
          });
        } else {
          setStatus({ type: 'error', message: 'Không tìm thấy nhóm.' });
        }

        if (topicRes.ok) {
          const topicData = await topicRes.json();
          setTopics(Array.isArray(topicData) ? topicData.map((topic) => mapTopic(topic)) : []);
        }

        if (memberRes.ok) {
          const memberData = await memberRes.json();
          setMembers(Array.isArray(memberData) ? memberData.map((member) => mapMember(member)) : []);
        }

        setLoading(false);
      } catch (error) {
        setStatus({ type: 'error', message: 'Không thể kết nối backend.' });
        setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [groupId, user]);

  useEffect(() => {
    const source = new EventSource(`/api/stream?groupId=${groupId}`);
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'topic_created') {
          const mapped = mapTopic(data.payload);
          setTopics((prev) => {
            const exists = prev.some((topic) => topic.id === mapped.id);
            if (exists) return prev;
            setGroup((prevGroup) => ({ ...prevGroup, topicCount: (prevGroup.topicCount || 0) + 1 }));
            return [mapped, ...prev];
          });
        }
        if (data.type === 'member_joined') {
          const mapped = mapMember(data.payload);
          setMembers((prev) => {
            const exists = prev.some((member) => member.id === mapped.id);
            if (exists) return prev;
            setGroup((prevGroup) => ({ ...prevGroup, memberCount: (prevGroup.memberCount || 0) + 1 }));
            return addUniqueById(prev, mapped).slice(0, 6);
          });
        }
        if (data.type === 'topic_updated') {
          setTopics((prev) =>
            prev.map((topic) => (topic.id === data.payload.id ? mapTopic(data.payload) : topic))
          );
        }
        if (data.type === 'group_updated') {
          setGroup((prev) => ({
            ...prev,
            memberCount: data.payload.member_count ?? prev.memberCount,
            topicCount: data.payload.topic_count ?? prev.topicCount,
            inviteCode: data.payload.invite_code ?? prev.inviteCode
          }));
        }
      } catch (error) {
        // ignore parse errors
      }
    };
    return () => source.close();
  }, [groupId]);

  const inviteLink = useMemo(() => {
    if (!origin || !group.inviteCode) return '';
    return `${origin}/join?code=${group.inviteCode}`;
  }, [origin, group.inviteCode]);

  const handleCopyLink = async () => {
    if (!inviteLink) {
      setStatus({ type: 'error', message: 'Chưa có liên kết mời để sao chép.' });
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(inviteLink);
      setStatus({ type: 'success', message: 'Đã sao chép liên kết mời vào clipboard.' });
      return;
    }

    setStatus({ type: 'error', message: 'Trình duyệt không hỗ trợ sao chép tự động.' });
  };

  const handleCreateTopic = async () => {
    setStatus({ type: '', message: '' });

    if (!topicTitle.trim()) {
      setStatus({ type: 'error', message: 'Vui lòng nhập tên chủ đề.' });
      return;
    }

    const topicId = makeId(topicTitle);
    try {
      const res = await fetch(`/api/groups/${groupId}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: topicId,
          title: topicTitle,
          status: 'Đang mở'
        })
      });

      if (!res.ok) {
        setStatus({ type: 'error', message: 'Không thể tạo tab chủ đề.' });
        return;
      }

      const topicData = await res.json();
      setGroup((prev) => ({ ...prev, topicCount: (prev.topicCount || 0) + 1 }));
      setTopics((prev) => addUniqueById(prev, mapTopic(topicData)));
    } catch (error) {
      setStatus({ type: 'error', message: 'Không thể kết nối backend.' });
      return;
    }
    setTopicTitle('');
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
              <Link href="/groups/new">Tạo nhóm</Link>
            </div>
          </div>
          <div className="nav-actions">
            <Link className="btn ghost" href="/groups">
              Quay lại
            </Link>
          </div>
        </nav>
      </header>

      <main className="page-shell">
        <div className="breadcrumb">
          <Link href="/groups">Nhóm</Link>
          <span>/</span>
          <span>{group.name}</span>
        </div>

        <section className="page-header">
          <div>
            <p className="eyebrow">Bảng điều khiển nhóm</p>
            <h1 className="page-title">{group.name}</h1>
            <p className="page-subtitle">
              Chủ trì có thể tạo tab chủ đề, cấp quyền SWOT và ý tưởng, và theo dõi
              tiến độ của từng nhóm con.
            </p>
          </div>
          <div className="page-actions">
            <Link className="btn outline" href={`/groups/${groupId}/invite`}>
              Mời thành viên
            </Link>
            {topics[0]?.id ? (
              <Link className="btn primary" href={`/groups/${groupId}/topics/${topics[0].id}`}>
                Mở tab đầu tiên
              </Link>
            ) : (
              <button className="btn primary" type="button" disabled>
                Tạo tab để bắt đầu
              </button>
            )}
          </div>
        </section>

        {loading && <div className="notice">Đang tải dữ liệu nhóm...</div>}
        {status.message && (
          <div className={`notice ${status.type === 'error' ? 'error' : ''}`}>
            {status.message}
          </div>
        )}

        <section className="dashboard-grid">
          <div className="dashboard-col">
            <div className="dashboard-card">
              <h3 className="card-title">Thông tin nhóm</h3>
              <p className="muted-text">{group.description}</p>
              <div className="kpi-row">
                <div className="kpi-card compact">
                  <span className="kpi-value">{group.memberCount}</span>
                  <span className="kpi-label">Thành viên</span>
                </div>
                <div className="kpi-card compact">
                  <span className="kpi-value">{group.topicCount}</span>
                  <span className="kpi-label">Tab chủ đề</span>
                </div>
              </div>
              <div className="meta-stack">
                <span>Chủ trì: {group.hostName}</span>
                <span>Quyền: Tạo tab, cấp quyền, mời thành viên</span>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header-row">
              <h3 className="card-title">Liên kết mời thành viên</h3>
              <Link className="btn outline" href={`/groups/${groupId}/invite`}>
                Quản lý mời
              </Link>
            </div>
            <div className="invite-box">
              <span className="invite-link">
                  {inviteLink || 'Tạo liên kết mời trong trang mời thành viên'}
              </span>
              <button className="btn ghost" type="button" onClick={handleCopyLink}>
                  Sao chép liên kết
              </button>
            </div>
            <p className="muted-text">
                Liên kết này tự động gán quyền theo tab mà chủ trì chọn.
            </p>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Thành viên & quyền</h3>
              <div className="member-list">
                {members.map((member) => (
                  <div className="member-row" key={member.id ?? member.name}>
                    <div>
                      <strong>{member.name}</strong>
                      <span className="member-sub">{roleRights(member.role)}</span>
                    </div>
                    <span className="role-pill">{roleLabel(member.role)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-col">
            <div className="dashboard-card">
              <div className="card-header-row">
                <h3 className="card-title">Tab chủ đề</h3>
                <div className="inline-form">
                  <input
                    type="text"
                    placeholder="Tên tab mới"
                    value={topicTitle}
                    onChange={(event) => setTopicTitle(event.target.value)}
                  />
                  <button className="btn outline" type="button" onClick={handleCreateTopic}>
                    Tạo tab mới
                  </button>
                </div>
              </div>
              <div className="tab-row">
                {topics.map((topic, index) => (
                  <Link
                    key={topic.id}
                    className={`tab-button ${index === 0 ? 'active' : ''}`}
                    href={`/groups/${groupId}/topics/${topic.id}`}
                  >
                    {topic.title}
                  </Link>
                ))}
              </div>
              <div className="topic-grid">
                {topics.map((topic) => (
                  <div className="topic-card" key={topic.id}>
                    <div className="topic-header">
                      <h4>{topic.title}</h4>
                      <span className="badge">{topic.status}</span>
                    </div>
                    <p className="muted-text">{topic.focus}</p>
                    <div className="topic-meta">
                      <span>{topic.members} thành viên</span>
                      <span>{topic.swot} phân tích SWOT</span>
                      <span>{topic.ideas} ý tưởng</span>
                    </div>
                    <div className="topic-actions">
                      <span className="role-pill swot">Quyền SWOT</span>
                      <span className="role-pill idea">Quyền ý tưởng</span>
                      <Link className="btn primary" href={`/groups/${groupId}/topics/${topic.id}`}>
                        Mở tab
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Hệ thống quyền trong tab</h3>
              <div className="role-grid">
                <div className="role-card">
                  <h4>Phân tích SWOT</h4>
                  <p>Đánh giá điểm mạnh, điểm yếu, cơ hội và rủi ro.</p>
                  <span className="role-pill swot">Phân tích SWOT</span>
                </div>
                <div className="role-card">
                  <h4>Đóng góp ý tưởng</h4>
                  <p>Đóng góp ý tưởng mới, gợi ý giải pháp và bình luận.</p>
                  <span className="role-pill idea">Đóng góp ý tưởng</span>
                </div>
              </div>
              <div className="meta-stack">
                <span>Cập nhật: {formatRelative(new Date().toISOString())}</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
