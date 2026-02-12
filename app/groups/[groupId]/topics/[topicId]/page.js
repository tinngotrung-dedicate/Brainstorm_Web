'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Providers, { useAuth } from '../../../../providers';
import ResearchTools from '../../../../components/ResearchTools';
import KnowledgeGraph from '../../../../components/KnowledgeGraph';
import TimerPopover from '../../../../components/TimerPopover';
import DrawioModal from '../../../../components/DrawioModal';
import { formatRelative } from '../../../../../lib/utils';

const SAMPLE_SWOT = {
  strengths: [
    { id: 's1', content: 'Khả năng tương thích sinh học cao', author: 'Demo' },
    { id: 's2', content: 'Chi phí sản xuất giảm 12%', author: 'Demo' }
  ],
  weaknesses: [
    { id: 'w1', content: 'Độ ổn định chưa đồng đều', author: 'Demo' },
    { id: 'w2', content: 'Thiếu dữ liệu quy mô lớn', author: 'Demo' }
  ],
  opportunities: [
    { id: 'o1', content: 'Nhu cầu y tế tăng nhanh', author: 'Demo' },
    { id: 'o2', content: 'Tài trợ nghiên cứu 2026', author: 'Demo' }
  ],
  threats: [
    { id: 't1', content: 'Quy định an toàn nghiêm ngặt', author: 'Demo' },
    { id: 't2', content: 'Đối thủ quốc tế mạnh', author: 'Demo' }
  ]
};

const SAMPLE_IDEAS = [
  {
    id: 'i1',
    content: 'Kết hợp vật liệu nano với cảm biến sinh học',
    author: 'Demo',
    created_at: new Date().toISOString()
  },
  {
    id: 'i2',
    content: 'Mô hình thử nghiệm song song trên 3 loại mẫu',
    author: 'Demo',
    created_at: new Date().toISOString()
  },
  {
    id: 'i3',
    content: 'Xây dựng bộ chỉ số đánh giá hiệu quả lâm sàng',
    author: 'Demo',
    created_at: new Date().toISOString()
  }
];

const swotLabels = {
  strengths: 'Điểm mạnh',
  weaknesses: 'Điểm yếu',
  opportunities: 'Cơ hội',
  threats: 'Thách thức'
};

const roleLabels = {
  host: 'Chủ trì',
  swot: 'SWOT',
  idea: 'Ý tưởng',
  both: 'SWOT + Ý tưởng',
  member: 'Thành viên'
};

const PHASE_PRESETS = [
  { key: 'warmup', label: 'Khởi động', minutes: 10 },
  { key: 'collect', label: 'Thu thập ý tưởng', minutes: 20 },
  { key: 'review', label: 'Đánh giá', minutes: 15 }
];

const TEMPLATES = [
  { key: 'swot', label: 'SWOT', hint: 'Tập trung bảng SWOT, ưu tiên phân tích song song.' },
  { key: '635', label: '6-3-5', hint: '6 người, 3 ý tưởng mỗi lượt, 5 phút/lượt. Viết ngắn gọn, không tranh luận.' },
  { key: 'crazy8', label: 'Crazy 8', hint: '8 ý tưởng trong 8 phút, phác nhanh, không cần hoàn thiện.' }
];

const makeLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const mapEntry = (row) => ({
  id: row.id ?? makeLocalId(),
  content: row.content,
  type: row.type,
  author: row.author ?? 'Thành viên',
  created_at: row.created_at ?? new Date().toISOString()
});

const addUniqueById = (list, item) => {
  if (list.some((entry) => entry.id === item.id)) return list;
  return [item, ...list];
};

const getInitials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

const formatRole = (role) => roleLabels[role] || roleLabels.member;

const parseSummaryTree = (summary) => {
  if (!summary) return { blocks: [], keywords: [] };
  const lines = summary.split('\n');
  const blocks = [];
  const stack = [];
  let keywords = [];

  const pushNode = (node, level) => {
    while (stack.length > level) stack.pop();
    if (stack.length === 0) {
      blocks.push(node);
      stack.push(node);
      return;
    }
    const parent = stack[stack.length - 1];
    parent.children.push(node);
    stack.push(node);
  };

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    if (!line.trim()) return;
    const keywordMatch = line.match(/^từ khóa\s*:\s*(.*)$/i);
    if (keywordMatch) {
      keywords = keywordMatch[1]
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean);
      return;
    }
    const match = line.match(/^(\s*)([-*•])\s+(.*)$/);
    if (!match) return;
    const indent = match[1].length;
    const level = Math.floor(indent / 2);
    const text = match[3].trim();
    if (!text) return;
    const node = { text, children: [] };
    pushNode(node, level);
  });

  return { blocks, keywords };
};

const formatStatus = (status) => {
  if (!status) return 'Đang mở';
  const normalized = status.toLowerCase();
  if (normalized === 'dang mo' || normalized === 'đang mở') return 'Đang mở';
  if (normalized === 'dang tong hop' || normalized === 'đang tổng hợp') return 'Đang tổng hợp';
  if (normalized === 'dang dong' || normalized === 'đang đóng') return 'Đang đóng';
  return status;
};

export default function TopicPage({ params }) {
  return (
    <Providers>
      <TopicPageInner params={params} />
    </Providers>
  );
}

function TopicPageInner({ params }) {
  const groupId = params?.groupId ?? 'alpha-lab';
  const topicId = params?.topicId ?? 'nano-bio';
  const router = useRouter();
  const { user, ready } = useAuth();
  const [topic, setTopic] = useState({
    id: topicId,
    title: topicId.replace(/-/g, ' '),
    status: 'Đang mở',
    description: 'Tab chủ đề chưa cập nhật mô tả.'
  });
  const [swot, setSwot] = useState(SAMPLE_SWOT);
  const [ideas, setIdeas] = useState(SAMPLE_IDEAS);
  const [memberRole, setMemberRole] = useState('both');
  const [memberName, setMemberName] = useState('Thành viên');
  const [presenceKey, setPresenceKey] = useState('');
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [swotType, setSwotType] = useState('strengths');
  const [swotText, setSwotText] = useState('');
  const [ideaText, setIdeaText] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [graphXml, setGraphXml] = useState('');
  const [graphOpen, setGraphOpen] = useState(false);
  const [graphError, setGraphError] = useState('');
  const [graphSaving, setGraphSaving] = useState(false);
  const [groupTopics, setGroupTopics] = useState([]);
  const [phase, setPhase] = useState({
    key: '',
    label: 'Chưa bắt đầu',
    minutes: 0,
    endsAt: null,
    running: false,
    locked: false
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [template, setTemplate] = useState('swot');
  const [ratings, setRatings] = useState({});
  const tickRef = useRef(null);
  const [metaOpen, setMetaOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.push('/?login=1');
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let key = localStorage.getItem('brainstorm_presence_key');
    if (!key) {
      key = `guest-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('brainstorm_presence_key', key);
    }
    setPresenceKey(key);
    const saved = localStorage.getItem('brainstorm_member');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.role) setMemberRole(parsed.role);
      if (parsed?.name) setMemberName(parsed.name);
    } catch (error) {
      // ignore parse error
    }

    // phase
    const savedPhase = localStorage.getItem(`brainstorm_phase_${topicId}`);
    if (savedPhase) {
      try {
        const parsed = JSON.parse(savedPhase);
        setPhase(parsed);
      } catch (error) {
        // ignore
      }
    }

    // template
    const savedTemplate = localStorage.getItem(`brainstorm_template_${topicId}`);
    if (savedTemplate && TEMPLATES.some((t) => t.key === savedTemplate)) {
      setTemplate(savedTemplate);
    }

    // ratings
    const savedRatings = localStorage.getItem(`brainstorm_ratings_${topicId}`);
    if (savedRatings) {
      try {
        setRatings(JSON.parse(savedRatings));
      } catch (error) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const load = async () => {
      try {
        const [topicRes, swotRes, ideaRes, topicsRes] = await Promise.all([
          fetch(`/api/topics/${topicId}`),
          fetch(`/api/topics/${topicId}/swot`),
          fetch(`/api/topics/${topicId}/ideas`),
          fetch(`/api/groups/${groupId}/topics`)
        ]);

        if (!active) return;

        if (topicRes.ok) {
          const topicData = await topicRes.json();
          setTopic({
            id: topicData.id,
            title: topicData.title ?? topicData.id,
            status: topicData.status ?? 'Đang mở',
            description: topicData.description ?? 'Tab chủ đề chưa cập nhật mô tả.',
            summary: topicData.summary ?? ''
          });
          if (topicData.summary) {
            setSummary(topicData.summary);
          }
          setGraphXml(topicData.graph_xml ?? '');
        }

        if (swotRes.ok) {
          const swotData = await swotRes.json();
          const nextSwot = { strengths: [], weaknesses: [], opportunities: [], threats: [] };
          swotData.forEach((entry) => {
            if (nextSwot[entry.type]) nextSwot[entry.type].push(mapEntry(entry));
          });
          setSwot(nextSwot);
        }

        if (ideaRes.ok) {
          const ideaData = await ideaRes.json();
          setIdeas(Array.isArray(ideaData) ? ideaData.map((item) => mapEntry(item)) : []);
        }

        if (topicsRes.ok) {
          const list = await topicsRes.json();
          setGroupTopics(Array.isArray(list) ? list : []);
          const current = Array.isArray(list)
            ? list.find((tab) => tab.id === topicId)
            : null;
          if (current) {
            setTopic((prev) => ({
              ...prev,
              id: current.id ?? prev.id,
              title: current.title ?? current.id ?? prev.title,
              description: current.description ?? prev.description,
              status: current.status ?? prev.status
            }));
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
  }, [topicId, groupId, user]);

  useEffect(() => {
    if (!presenceKey) return;
    let active = true;

    const heartbeat = async () => {
      try {
        const res = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicId,
            memberId: presenceKey,
            name: memberName,
            role: memberRole
          })
        });
        if (!active) return;
        if (res.ok) {
          const list = await res.json();
          setOnlineMembers(list);
        }
      } catch (error) {
        // ignore network errors
      }
    };

    heartbeat();
    const interval = setInterval(heartbeat, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [topicId, presenceKey, memberName, memberRole]);

  useEffect(() => {
    const source = new EventSource(`/api/stream?topicId=${topicId}`);
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'swot_added') {
          const mapped = mapEntry(data.payload);
          const entryType = mapped.type || data.payload.type;
          setSwot((prev) => {
            if (!entryType || !prev[entryType]) return prev;
            return {
              ...prev,
              [entryType]: addUniqueById(prev[entryType], mapped)
            };
          });
        }
        if (data.type === 'idea_added') {
          setIdeas((prev) => addUniqueById(prev, mapEntry(data.payload)));
        }
        if (data.type === 'summary_updated' && data.payload?.summary) {
          setSummary(data.payload.summary);
        }
        if (data.type === 'graph_updated') {
          setGraphXml(data.payload?.graph_xml ?? '');
        }
      } catch (error) {
        // ignore parse errors
      }
    };

    return () => source.close();
  }, [topicId]);

  // Phase timer
  useEffect(() => {
    if (!phase.running || !phase.endsAt) {
      setTimeLeft(0);
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }

    const tick = () => {
      const diff = Math.max(0, phase.endsAt - Date.now());
      setTimeLeft(diff);
      if (diff <= 0) {
        setPhase((prev) => ({ ...prev, running: false, locked: true, endsAt: null }));
        localStorage.setItem(
          `brainstorm_phase_${topicId}`,
          JSON.stringify({ ...phase, running: false, locked: true, endsAt: null })
        );
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };

    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [phase.running, phase.endsAt, topicId, phase]);

  const isHost = useMemo(() => ['host', 'both'].includes(memberRole) || user?.role === 'admin', [memberRole, user]);
  const canSwot = useMemo(() => ['host', 'swot', 'both'].includes(memberRole), [memberRole]);
  const canIdea = useMemo(() => ['host', 'idea', 'both'].includes(memberRole), [memberRole]);
  const summaryData = useMemo(() => parseSummaryTree(summary), [summary]);
  const summaryPalette = [
    'var(--summary-1)',
    'var(--summary-2)',
    'var(--summary-3)',
    'var(--summary-4)',
    'var(--summary-5)'
  ];

  const renderSummaryList = (items, depth = 0) => {
    if (!items.length) return null;
    return (
      <ul className={`summary-list depth-${depth}`}>
        {items.map((item, idx) => (
          <li key={`${item.text}-${idx}`}>
            {item.text}
            {renderSummaryList(item.children || [], Math.min(depth + 1, 3))}
          </li>
        ))}
      </ul>
    );
  };

  const startPhase = (preset) => {
    const minutes = preset.minutes;
    const endsAt = Date.now() + minutes * 60 * 1000;
    const next = {
      key: preset.key,
      label: preset.label,
      minutes,
      endsAt,
      running: true,
      locked: false
    };
    setPhase(next);
    localStorage.setItem(`brainstorm_phase_${topicId}`, JSON.stringify(next));
  };

  const stopPhase = () => {
    const next = { ...phase, running: false, locked: true, endsAt: null };
    setPhase(next);
    localStorage.setItem(`brainstorm_phase_${topicId}`, JSON.stringify(next));
  };

  const unlockInputs = () => {
    const next = { ...phase, locked: false, running: false, endsAt: null, label: 'Mở tự do', key: 'open', minutes: 0 };
    setPhase(next);
    localStorage.setItem(`brainstorm_phase_${topicId}`, JSON.stringify(next));
  };

  const formatTimeLeft = () => {
    if (!phase.running || !phase.endsAt) return 'Chưa chạy';
    const totalSeconds = Math.max(0, Math.floor(timeLeft / 1000));
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleTemplateChange = (value) => {
    setTemplate(value);
    localStorage.setItem(`brainstorm_template_${topicId}`, value);
  };

  const ideaScore = (ideaId) => {
    const row = ratings[ideaId];
    if (!row) return null;
    const vals = ['feasibility', 'novelty', 'impact']
      .map((k) => Number(row[k]))
      .filter((v) => !Number.isNaN(v) && v > 0);
    if (!vals.length) return null;
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    return { avg, ...row };
  };

  const updateRating = (ideaId, field, value) => {
    const next = {
      ...ratings,
      [ideaId]: {
        ...ratings[ideaId],
        [field]: Number(value)
      }
    };
    setRatings(next);
    localStorage.setItem(`brainstorm_ratings_${topicId}`, JSON.stringify(next));
  };

  const topIdeas = useMemo(() => {
    return ideas
      .map((idea) => ({ idea, score: ideaScore(idea.id)?.avg ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [ideas, ratings]);

  const inputsLocked = phase.locked;
  const templateHint = useMemo(
    () => TEMPLATES.find((t) => t.key === template)?.hint ?? TEMPLATES[0].hint,
    [template]
  );
  const ideaPlaceholder = useMemo(() => {
    if (template === '635') return 'Nhập 3 ý tưởng ngắn; dùng xuống dòng cho từng ý.';
    if (template === 'crazy8') return 'Viết nhanh 8 ý tưởng (ngăn cách bằng xuống dòng).';
    return 'Nhập ý tưởng mới (có thể xuống dòng để tạo bullet)';
  }, [template]);

  const handleAddSwot = async () => {
    setStatus({ type: '', message: '' });

    if (!swotText.trim()) {
      setStatus({ type: 'error', message: 'Nhập nội dung SWOT trước khi gửi.' });
      return;
    }

    if (inputsLocked) {
      setStatus({ type: 'error', message: 'Phiên đã khóa, chờ host mở lại.' });
      return;
    }

    if (!canSwot) {
      setStatus({ type: 'error', message: 'Bạn không có quyền SWOT trong tab này.' });
      return;
    }

    try {
      const res = await fetch(`/api/topics/${topicId}/swot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: swotType,
          content: swotText,
          author: memberName
        })
      });

      if (!res.ok) {
        setStatus({ type: 'error', message: 'Không thể gửi SWOT. Vui lòng thử lại.' });
        return;
      }

      const data = await res.json();
      setSwot((prev) => ({
        ...prev,
        [swotType]: addUniqueById(prev[swotType], mapEntry(data))
      }));
      setSwotText('');
    } catch (error) {
      setStatus({ type: 'error', message: 'Không thể kết nối backend.' });
    }
  };

  const handleAddIdea = async () => {
    setStatus({ type: '', message: '' });

    if (!ideaText.trim()) {
      setStatus({ type: 'error', message: 'Nhập ý tưởng trước khi gửi.' });
      return;
    }

    if (inputsLocked) {
      setStatus({ type: 'error', message: 'Phiên đã khóa, chờ host mở lại.' });
      return;
    }

    if (!canIdea) {
      setStatus({ type: 'error', message: 'Bạn không có quyền đóng góp ý tưởng.' });
      return;
    }

    try {
      const res = await fetch(`/api/topics/${topicId}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: ideaText,
          author: memberName
        })
      });

      if (!res.ok) {
        setStatus({ type: 'error', message: 'Không thể gửi ý tưởng. Vui lòng thử lại.' });
        return;
      }

      const data = await res.json();
      setIdeas((prev) => addUniqueById(prev, mapEntry(data)));
      setIdeaText('');
    } catch (error) {
      setStatus({ type: 'error', message: 'Không thể kết nối backend.' });
    }
  };

  const handleSummary = async () => {
    setSummaryError('');
    if (!ideas.length) {
      setSummaryError('Chưa có ý tưởng để tóm tắt.');
      return;
    }
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideas: ideas.map((idea) => idea.content),
          topicId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.details ? ` ${data.details}` : '';
        setSummaryError(`${data.error || 'Không thể tạo tóm tắt.'}${detail}`);
      } else {
        setSummary(data.summary || '');
      }
    } catch (error) {
      setSummaryError('Không thể kết nối API tóm tắt.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGraphSave = async (xml) => {
    if (!xml) return;
    setGraphError('');
    setGraphSaving(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph_xml: xml })
      });
      const data = await res.json();
      if (!res.ok) {
        setGraphError(data.error || 'Không thể lưu graph.');
        return;
      }
      setGraphXml(data.graph_xml ?? xml);
    } catch (error) {
      setGraphError('Không thể kết nối backend graph.');
    } finally {
      setGraphSaving(false);
    }
  };

  const exportCsv = () => {
    const header = ['idea', 'feasibility', 'novelty', 'impact', 'avg', 'created_at'];
    const rows = ideas.map((idea) => {
      const score = ideaScore(idea.id);
      return [
        `"${(idea.content || '').replace(/"/g, '""')}"`,
        score?.feasibility ?? '',
        score?.novelty ?? '',
        score?.impact ?? '',
        score?.avg ? score.avg.toFixed(2) : '',
        idea.created_at
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${topicId}-ideas.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printable = `
      <html>
        <head><title>${topic.title} - Brainstorm</title></head>
        <body>
          <h1>${topic.title}</h1>
          <p>Phase: ${phase.label} - Locked: ${phase.locked ? 'Yes' : 'No'}</p>
          <h2>Tóm tắt</h2>
          <pre>${summary || 'Chưa có tóm tắt'}</pre>
          <h2>Ý tưởng & điểm</h2>
          <ul>
            ${ideas
              .map((idea) => {
                const score = ideaScore(idea.id);
                return `<li><strong>${idea.content}</strong> - Điểm: ${
                  score?.avg ? score.avg.toFixed(2) : 'N/A'
                }</li>`;
              })
              .join('')}
          </ul>
        </body>
      </html>
    `;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(printable);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
      <>
      <div className="bg-orbits" aria-hidden="true" />

      <header className="site-header">
        <nav className="nav nav-topic">
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
          <div className="nav-taskbar">
            <div className="taskbar-main">
              <div className="task-title">
                <span className="task-label">Tab hiện tại</span>
                <strong>{topic.title}</strong>
                <span className="task-desc">{topic.description}</span>
              </div>
            </div>
            <div className="nav-actions">
              <TimerPopover />
              <button
                className="taskbar-toggle"
                type="button"
                aria-expanded={metaOpen}
                onClick={() => setMetaOpen((v) => !v)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
            {metaOpen && (
              <div className="taskbar-sheet">
                <div className="task-avatars">
                  {onlineMembers.slice(0, 12).map((member, index) => (
                    <div
                      className="task-avatar"
                      key={`${member.name}-${index}`}
                      title={member.name || 'Thành viên'}
                      onClick={() => setSelectedMember(member)}
                    >
                      {getInitials(member.name || 'TV')}
                    </div>
                  ))}
                  {!onlineMembers.length && <span className="muted-text">Chưa có thành viên trực tuyến.</span>}
                </div>
                {selectedMember && (
                  <div className="member-card">
                    <div className="member-card-header">
                      <span className="badge">Thành viên</span>
                      <button className="btn ghost xs" type="button" onClick={() => setSelectedMember(null)}>
                        Đóng
                      </button>
                    </div>
                    <p className="member-name">{selectedMember.name || 'Thành viên'}</p>
                    <p className="muted-text">Quyền: {formatRole(selectedMember.role)}</p>
                  </div>
                )}
                <div className="task-roles spaced">
                  <span className={`role-pill swot ${canSwot ? '' : 'disabled'}`}>Quyền SWOT</span>
                  <span className={`role-pill idea ${canIdea ? '' : 'disabled'}`}>Quyền ý tưởng</span>
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="page-shell">
        <div className="topic-workspace">
          <div className="workspace-main">
            {status.message && (
              <div className={`notice ${status.type === 'error' ? 'error' : ''}`}>
                {status.message}
              </div>
            )}
            {inputsLocked && (
              <div className="notice">
                Phiên đang khóa sau khi hết giờ. Host có thể bấm "Mở lại nhập" để tiếp tục.
              </div>
            )}

            <section className="section reveal" id="research">
              <ResearchTools />
            </section>

            <section className="topic-layout" id="content">
              <div className="dashboard-card swot-panel">
                <div className="card-header-row">
                  <h3 className="card-title">Bảng SWOT</h3>
                  <div className="inline-form">
                    <select value={swotType} onChange={(event) => setSwotType(event.target.value)}>
                      <option value="strengths">Điểm mạnh</option>
                      <option value="weaknesses">Điểm yếu</option>
                      <option value="opportunities">Cơ hội</option>
                      <option value="threats">Thách thức</option>
                    </select>
                    <button className="btn outline" type="button" onClick={handleAddSwot}>
                      Thêm nhận xét
                    </button>
                  </div>
                </div>
                <div className="idea-input">
                  <input
                    type="text"
                    placeholder="Nhập nhanh nội dung SWOT"
                    value={swotText}
                    onChange={(event) => setSwotText(event.target.value)}
                    disabled={!canSwot || inputsLocked}
                  />
                </div>
                <div className="swot-grid">
                  {Object.entries(swot).map(([key, values]) => (
                    <div className="swot-card" key={key}>
                      <h4>{swotLabels[key]}</h4>
                      <ul className="swot-list">
                        {values.map((item) => (
                          <li key={item.id}>{item.content}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header-row">
                  <h3 className="card-title">Đóng góp ý tưởng</h3>
                  <div className="inline-form">
                    <button className="btn outline" type="button" onClick={handleAddIdea}>
                      Thêm ý tưởng
                    </button>
                    <button
                      className="btn primary"
                      type="button"
                      onClick={handleSummary}
                      disabled={summaryLoading}
                    >
                      {summaryLoading ? 'Đang tóm tắt...' : 'Tóm tắt'}
                    </button>
                  </div>
                </div>
                <div className="idea-input">
                  <textarea
                    rows={3}
                    placeholder={ideaPlaceholder}
                    value={ideaText}
                    onChange={(event) => setIdeaText(event.target.value)}
                    disabled={!canIdea || inputsLocked}
                  />
                  <button className="btn primary" type="button" onClick={handleAddIdea}>
                    Gửi
                  </button>
                </div>
                <div className="idea-list">
                  {ideas.map((idea, idx) => {
                    const score = ideaScore(idea.id);
                    return (
                      <div className="idea-card" key={idea.id}>
                        <div className="card-header-row">
                          <div className="idea-title">
                            <span className="chip ghost">{idx + 1}</span>
                            <p>{idea.content}</p>
                          </div>
                          <div className="idea-badges">
                            <span className="badge">Ý tưởng</span>
                            {score?.avg ? (
                              <span className="badge pill success">Điểm: {score.avg.toFixed(2)}</span>
                            ) : (
                              <span className="muted-text">Chưa chấm</span>
                            )}
                          </div>
                        </div>
                        <div className="idea-meta">
                          <span>Cập nhật {formatRelative(idea.created_at)}</span>
                        </div>
                        <div className="rating-row">
                          <label>
                            Khả thi
                            <select
                              value={ratings[idea.id]?.feasibility ?? ''}
                              onChange={(e) => updateRating(idea.id, 'feasibility', e.target.value)}
                            >
                              <option value="">-</option>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option value={n} key={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Độ mới
                            <select
                              value={ratings[idea.id]?.novelty ?? ''}
                              onChange={(e) => updateRating(idea.id, 'novelty', e.target.value)}
                            >
                              <option value="">-</option>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option value={n} key={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Impact
                            <select
                              value={ratings[idea.id]?.impact ?? ''}
                              onChange={(e) => updateRating(idea.id, 'impact', e.target.value)}
                            >
                              <option value="">-</option>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option value={n} key={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="dashboard-card">
                  <div className="card-header-row">
                    <h4>Bảng xếp hạng nhanh</h4>
                    <div className="inline-form">
                      <button className="btn outline" type="button" onClick={exportCsv}>
                        Xuất CSV
                      </button>
                      <button className="btn outline" type="button" onClick={handlePrint}>
                        In/PDF
                      </button>
                    </div>
                  </div>
                  {topIdeas.length ? (
                    <div className="kpi-row">
                      {topIdeas.map((entry, idx) => (
                        <div className="kpi-card compact" key={entry.idea.id}>
                          <span className="kpi-value">#{idx + 1}</span>
                          <span className="kpi-label">{entry.idea.content.slice(0, 60)}</span>
                          <span className="muted-text">Điểm: {entry.score.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted-text">Chưa có điểm để xếp hạng.</p>
                  )}
                </div>
                {summaryError && <div className="notice error">{summaryError}</div>}
                {summary && (
                  <div className="summary-card">
                    <div className="card-header-row">
                      <h4>Tóm tắt ý tưởng (tường bậc)</h4>
                  <div className="graph-actions">
                    <span className="badge">Draw.io</span>
                    <button
                      className="btn outline"
                      type="button"
                      onClick={() => setGraphOpen(true)}
                      disabled={!summary}
                    >
                      {graphXml ? 'Chỉnh sửa sơ đồ' : 'Tạo sơ đồ'}
                    </button>
                  </div>
                </div>
                {summaryData.blocks.length ? (
                  <div className="summary-grid">
                    {summaryData.blocks.map((block, index) => (
                      <div
                        className="summary-block"
                        style={{ background: summaryPalette[index % summaryPalette.length] }}
                        key={`${block.text}-${index}`}
                      >
                        <div className="summary-block-title">{block.text}</div>
                        {renderSummaryList(block.children || [], 1)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="summary-text">{summary}</div>
                )}
                {summaryData.keywords.length ? (
                  <div className="summary-keywords">
                    {summaryData.keywords.map((keyword) => (
                      <span className="summary-chip" key={keyword}>
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="muted-text">
                  {graphXml
                    ? 'Sơ đồ draw.io đã được lưu. Bạn có thể chỉnh sửa và cập nhật lại.'
                    : 'Chưa có sơ đồ draw.io. Bấm \"Tạo sơ đồ\" để khởi tạo từ tóm tắt.'}
                </p>
                {graphSaving && <p className="muted-text">Đang lưu sơ đồ...</p>}
                    {graphError && <div className="notice error">{graphError}</div>}
                    <KnowledgeGraph summary={summary} />
                  </div>
                )}
              </div>
            </section>
          </div>

        </div>
        <DrawioModal
          open={graphOpen}
          graphXml={graphXml}
          summary={summary}
          onClose={() => setGraphOpen(false)}
          onSave={handleGraphSave}
        />
      </main>
    </>
  );
}
