'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Providers, { useAuth } from '../../providers';
import { makeId, makeInviteCode } from '../../../lib/utils';

const initialForm = {
  name: '',
  focus: '',
  hostName: '',
  size: 'small',
  privacy: 'private',
  description: ''
};

export default function NewGroupPage() {
  return (
    <Providers>
      <NewGroupInner />
    </Providers>
  );
}

function NewGroupInner() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.push('/?login=1');
    }
  }, [ready, user, router]);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      setStatus({ type: 'error', message: 'Bạn cần đăng nhập trước khi tạo nhóm.' });
      return;
    }
    setStatus({ type: '', message: '' });

    if (!form.name.trim()) {
      setStatus({ type: 'error', message: 'Vui lòng nhập tên nhóm.' });
      return;
    }

    if (!form.hostName.trim()) {
      setStatus({ type: 'error', message: 'Vui lòng nhập tên host.' });
      return;
    }

    setLoading(true);
    const groupId = makeId(form.name);
    const inviteCode = makeInviteCode();

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: groupId,
          name: form.name,
          focus: form.focus,
          description: form.description,
          privacy: form.privacy,
          size: form.size,
          host_name: form.hostName,
          invite_code: inviteCode,
          status: 'Đang mở'
        })
      });

      if (!res.ok) {
        setStatus({ type: 'error', message: 'Không thể tạo nhóm. Vui lòng thử lại.' });
        setLoading(false);
        return;
      }

      const memberRes = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.hostName,
          role: 'host'
        })
      });

      if (!memberRes.ok) {
        setStatus({ type: 'error', message: 'Đã tạo nhóm nhưng không thể tạo host.' });
        setLoading(false);
        router.push(`/groups/${groupId}`);
        return;
      }

      const memberData = await memberRes.json();

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'brainstorm_member',
          JSON.stringify({
            id: memberData.id,
            name: form.hostName,
            role: 'host',
            groupId
          })
        );
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Không thể kết nối backend. Thử lại sau.' });
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(`/groups/${groupId}`);
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
              <Link className="btn ghost" href="/groups">
                Quay lại danh sách
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="page-shell">
        <section className="page-header">
          <div>
            <p className="eyebrow">Khởi tạo nhanh</p>
            <h1 className="page-title">Tạo nhóm brainstorm mới</h1>
            <p className="page-subtitle">
              Tạo nhóm, mời thành viên, và bắt đầu tạo tab chủ đề trong vai trò chủ trì.
            </p>
          </div>
          <div className="page-actions">
            <Link className="btn outline" href="/groups">
              Xem nhóm hiện có
            </Link>
          </div>
        </section>

        {status.message && (
          <div className={`notice ${status.type === 'error' ? 'error' : ''}`}>
            {status.message}
          </div>
        )}

        <section className="form-card">
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="group-name">Tên nhóm</label>
              <input
                id="group-name"
                type="text"
                placeholder="VD: Alpha Lab"
                value={form.name}
                onChange={updateField('name')}
              />
            </div>
            <div className="form-field">
              <label htmlFor="group-focus">Lĩnh vực tập trung</label>
              <input
                id="group-focus"
                type="text"
                placeholder="VD: Vật liệu nano"
                value={form.focus}
                onChange={updateField('focus')}
              />
            </div>
            <div className="form-field">
              <label htmlFor="host-name">Tên host</label>
              <input
                id="host-name"
                type="text"
                placeholder="Người khởi tạo nhóm"
                value={form.hostName}
                onChange={updateField('hostName')}
              />
            </div>
            <div className="form-field">
              <label htmlFor="group-size">Quy mô thành viên</label>
              <select id="group-size" value={form.size} onChange={updateField('size')}>
                <option value="small">Nhỏ (3-5 người)</option>
                <option value="medium">Trung bình (6-10 người)</option>
                <option value="large">Lớn (11+ người)</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="group-privacy">Mức độ riêng tư</label>
              <select id="group-privacy" value={form.privacy} onChange={updateField('privacy')}>
                <option value="private">Riêng tư (chỉ mời mới vào)</option>
                <option value="semi">Nửa công khai (có liên kết)</option>
                <option value="public">Công khai</option>
              </select>
            </div>
            <div className="form-field form-wide">
              <label htmlFor="group-desc">Mô tả</label>
              <textarea
                id="group-desc"
                rows="4"
                placeholder="Mô tả mục tiêu, phạm vi nghiên cứu, hoặc kết quả mong đợi"
                value={form.description}
                onChange={updateField('description')}
              />
            </div>
            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Tạo nhóm và tạo tab chủ đề'}
              </button>
              <button className="btn outline" type="button" onClick={() => setForm(initialForm)}>
                Lưu nháp
              </button>
            </div>
          </form>
        </section>

        <section className="section reveal">
          <div className="section-header">
            <h2>Gợi ý cấu hình role</h2>
            <p>Chủ trì có thể cấp quyền cho thành viên theo từng tab chủ đề.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Quyền SWOT</h3>
              <p>Đánh giá điểm mạnh, điểm yếu, cơ hội và thách thức.</p>
              <span className="chip">Phân tích SWOT</span>
            </article>
            <article className="feature-card">
              <h3>Quyền ý tưởng</h3>
              <p>Đóng góp, trình bày, và phát triển giải pháp mới.</p>
              <span className="chip">Đóng góp ý tưởng</span>
            </article>
            <article className="feature-card">
              <h3>Chủ trì</h3>
              <p>Tạo tab chủ đề, quản lý liên kết mời và tổ chức phiên họp.</p>
              <span className="chip">Vai trò chủ trì</span>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
