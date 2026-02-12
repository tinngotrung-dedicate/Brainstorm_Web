'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Providers, { useAuth } from './providers';

export default function Home() {
  return (
    <Providers>
      <HomeInner />
    </Providers>
  );
}

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, logout, ready } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const forceLogin = searchParams.get('login') === '1';

  useEffect(() => {
    if (forceLogin && ready) {
      const hero = document.getElementById('login');
      hero?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [forceLogin, ready]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập email.');
      return;
    }
    setError('');
    login({ email, name: email.split('@')[0] || 'Người dùng' });
    router.push('/groups');
  };

  return (
      <>
        <div className="bg-orbits" aria-hidden="true" />

        <header className="site-header">
          <nav className="nav">
            <div className="nav-left">
              <div className="brand">
                <span className="brand-mark" />
                <span className="brand-name">Brainstorm Lab</span>
              </div>
              <div className="nav-links">
                <a href="#features">Tính năng</a>
                <a href="#workflow">Quy trình</a>
                <a href="#research-flow">Nghiên cứu</a>
                <a href="#insights">Phân tích</a>
                <a href="#security">Bảo mật</a>
                {user && (
                  <>
                    <Link href="/groups">Nhóm</Link>
                    <Link href="/groups/new">Tạo nhóm</Link>
                    <Link href="/join">Tham gia</Link>
                  </>
                )}
              </div>
            </div>
            <div className="nav-actions">
              {user ? (
                <>
                  <span className="chip">Đăng nhập: User</span>
                  <button className="btn ghost" type="button" onClick={logout}>
                    Đăng xuất
                  </button>
                  <Link className="btn primary" href="/groups">
                    Vào bảng điều khiển
                  </Link>
                </>
              ) : (
                <a className="btn ghost" href="#login">
                  Đăng nhập
                </a>
              )}
            </div>
          </nav>
        </header>

        <main>
          <section id="login" className="hero login-hero">
            <div className="hero-copy">
              <p className="eyebrow">Đăng nhập để bắt đầu</p>
              <h1>
                Không gian nghiên cứu, <span>đăng nhập một chạm</span>
              </h1>
              <p className="lead">
                Quản lý nhóm, bác sĩ, lịch hẹn và RAG backend – tất cả trong một nền tảng duy nhất.
                Bạn có thể đăng nhập, hoặc xem phần giới thiệu ngắn bên cạnh.
              </p>
                <div className="intro-cards">
                  <div className="intro-card">
                    <h4>Người dùng</h4>
                    <p>Tạo nhóm, tham gia tab, phân tích SWOT và ghi ý tưởng.</p>
                    <span className="chip">user@example.com</span>
                  </div>
                </div>
              <div className="hero-actions">
                <a className="btn outline" href="#features">
                  Xem giới thiệu
                </a>
              </div>
            </div>

            <div className="login-card">
              <h3>Đăng nhập</h3>
              <form className="login-form" onSubmit={handleSubmit}>
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Mật khẩu
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
              {error && <div className="notice error">{error}</div>}
                <div className="form-actions">
                  <button type="submit" className="btn primary">
                    Đăng nhập
                  </button>
                  <a className="text-link" href="/forgot">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="form-divider">
                  <span>Hoặc</span>
                </div>
                <p className="text-sm">Một vai trò duy nhất: User. Đăng nhập để bắt đầu.</p>
              </form>
            </div>
          </section>

        <section id="features" className="section reveal">
          <div className="section-header">
            <h2>Bộ công cụ brainstorm đầy đủ</h2>
            <p>Tập trung vào sáng tạo, phân tích và hợp tác.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Tạo chủ đề nhanh</h3>
              <p>Nhập tiêu đề, mô tả, tag, độ ưu tiên và deadline trong 1 phút.</p>
              <span className="chip">Quick start</span>
            </article>
            <article className="feature-card">
              <h3>Phiên thời gian thực</h3>
              <p>Cập nhật ý tưởng, bình luận, bầu chọn với vấn đề được đồng bộ.</p>
              <span className="chip">Live sync</span>
            </article>
            <article className="feature-card">
              <h3>Mindmap thông minh</h3>
              <p>Kết nối ý tưởng tự động, tạo sơ đồ và nhóm cụm chủ đề.</p>
              <span className="chip">Visual</span>
            </article>
            <article className="feature-card">
              <h3>Phân tích ý tưởng</h3>
              <p>Đánh giá theo tiêu chí, xếp hạng và cập nhật tính khả thi.</p>
              <span className="chip">Insights</span>
            </article>
            <article className="feature-card">
              <h3>Tài liệu nghiên cứu</h3>
              <p>Tập trung liên kết bài báo, PDF, và ghi chú dự án.</p>
              <span className="chip">Research</span>
            </article>
            <article className="feature-card">
              <h3>Kanban sau brainstorm</h3>
              <p>Chuyển ý tưởng thành nhiệm vụ và theo dõi tiến độ.</p>
              <span className="chip">Execution</span>
            </article>
            <article className="feature-card">
              <h3>Pha & đồng hồ</h3>
              <p>Preset Khởi động/Thu thập/Đánh giá, tự khóa nhập khi hết giờ.</p>
              <span className="chip">Preset timebox</span>
            </article>
            <article className="feature-card">
              <h3>Chấm điểm ẩn danh</h3>
              <p>Chấm Feasibility/Novelty/Impact, bảng xếp hạng top ý tưởng.</p>
              <span className="chip">Scoring</span>
            </article>
            <article className="feature-card">
              <h3>Template SWOT</h3>
              <p>Template mặc định, hướng dẫn rõ ràng cho phân tích SWOT.</p>
              <span className="chip">Template</span>
            </article>
            <article className="feature-card">
              <h3>Export 1-click</h3>
              <p>Xuất CSV hoặc in/PDF tóm tắt + điểm + ý tưởng.</p>
              <span className="chip">Export</span>
            </article>
          </div>
        </section>

        <section id="workflow" className="section split reveal">
          <div className="split-copy">
            <h2>Quy trình sáng tạo có hệ thống</h2>
            <p>
              Từ khởi động chủ đề đến tổng hợp báo cáo, Brainstorm Lab hướng dẫn nhóm
              đi theo từng bước rõ ràng.
            </p>
            <ul className="flow">
              <li>
                <span>01</span>
                <div>
                  <h4>Khởi tạo chủ đề</h4>
                  <p>Chọn loại brainstorm: phản biện, sáng tạo, thiết kế.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h4>Thu thập ý tưởng</h4>
                  <p>Ghi chú, biểu đồ, voting và gợi ý tự động.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h4>Đánh giá và chốt</h4>
                  <p>Chấm điểm theo khả thi, độ mới lạ, mức độ hoàn thiện.</p>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <h4>Chuyển giao</h4>
                  <p>Gán nhiệm vụ, tạo kanban và báo cáo PDF/slide.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="split-panel">
            <div className="canvas">
              <div className="canvas-node primary">
                <h4>Vấn đề cốt lõi</h4>
                <p>Làm thế nào để tăng hiệu quả nghiên cứu?</p>
              </div>
              <div className="canvas-node">
                <h4>Ý tưởng 1</h4>
                <p>Bộ thưởng điểm ý tưởng tự động</p>
              </div>
              <div className="canvas-node">
                <h4>Ý tưởng 2</h4>
                <p>Nhóm chuyen gia co van</p>
              </div>
              <div className="canvas-node">
                <h4>Ý tưởng 3</h4>
                <p>Mô hình dự đoán tác động</p>
              </div>
              <div className="canvas-lines" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section id="research-flow" className="section reveal">
          <div className="section-header">
            <h2>Luồng nghiên cứu và tổng hợp ý tưởng</h2>
            <p>Tìm bài báo, tóm tắt, thu thập ý tưởng vô danh và gom cụm.</p>
          </div>
          <div className="research-grid">
            <article className="research-card">
              <h3>1. Tìm bài báo nhanh</h3>
              <p>
                Truy cập gián tiếp Google Scholar và các nguồn mở (OpenAlex, Semantic
                Scholar) để tìm bài viết liên quan.
              </p>
              <div className="link-row">
                <a href="https://scholar.google.com/" target="_blank" rel="noreferrer">Google Scholar</a>
                <a href="https://openalex.org/" target="_blank" rel="noreferrer">OpenAlex</a>
                <a href="https://www.semanticscholar.org/" target="_blank" rel="noreferrer">
                  Semantic Scholar
                </a>
              </div>
            </article>
            <article className="research-card">
              <h3>2. Tóm tắt và gợi ý ý tưởng</h3>
              <p>AI tóm tắt bài báo, trích xuất ý chính và gợi ý ý tưởng mới.</p>
              <div className="pill-row">
                <span className="pill">Tóm tắt AI</span>
                <span className="pill">Mầm ý tưởng</span>
                <span className="pill">Bản đồ trích dẫn</span>
              </div>
            </article>
            <article className="research-card">
              <h3>3. Ghi ý tưởng vô danh</h3>
              <p>Mỗi thành viên ghi ý tưởng vào danh sách cá nhân, không hiện tên.</p>
              <div className="inline-card">
                <h4>Danh sách ý tưởng</h4>
                <ul>
                  <li>Thiết kế thử nghiệm A/B cho vật liệu mới</li>
                  <li>Tạo bộ dữ liệu mô phỏng</li>
                  <li>Phân tích kha thi ve kinh te</li>
                </ul>
              </div>
            </article>
            <article className="research-card">
              <h3>4. Gom cụm ý tưởng trùng lặp</h3>
              <p>
                Tổng hợp ý tưởng, đánh dấu mức độ trùng lặp và ưu tiên nhóm ý tưởng
                cao nhất (ScaNN sẽ ứng dụng sau).
              </p>
              <div className="cluster-bars">
                <div>
                  <span style={{ '--fill': '78%' }} />
                  <strong>Cluster A</strong> 78% trùng
                </div>
                <div>
                  <span style={{ '--fill': '61%' }} />
                  <strong>Cluster B</strong> 61% trùng
                </div>
                <div>
                  <span style={{ '--fill': '44%' }} />
                  <strong>Cluster C</strong> 44% trùng
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="section split reveal">
          <div className="split-copy">
            <h2>Knowledge graph tổng quan ý tưởng</h2>
            <p>
              Hệ thống tạo biểu đồ kiến thức từ các cụm ý tưởng và tài liệu liên quan,
              giúp nhóm nhìn rõ các mối quan hệ và hướng nghiên cứu.
            </p>
            <div className="kg-list">
              <div>
                <h4>Nhóm ý tưởng</h4>
                <p>Tổng hợp các cụm ý tưởng theo chủ đề.</p>
              </div>
              <div>
                <h4>Nút liên kết</h4>
                <p>Kết nối bài báo, tác giả, phương pháp và kết quả.</p>
              </div>
              <div>
                <h4>Bình luận theo cụm</h4>
                <p>Trao đổi trực tiếp trên từng cụm ý tưởng.</p>
              </div>
            </div>
          </div>
          <div className="split-panel">
            <div className="kg-panel">
              <div className="kg-node core">Ý tưởng cốt lõi</div>
              <div className="kg-node">Method A</div>
              <div className="kg-node">Paper B</div>
              <div className="kg-node">Dataset C</div>
              <div className="kg-node">Impact D</div>
              <div className="kg-lines" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="section reveal">
          <div className="section-header">
            <h2>Kho dữ liệu nghiên cứu tập trung</h2>
            <p>Kết nối tài liệu, bài báo, và thông tin đáng tin cậy.</p>
          </div>
          <div className="library">
            <div className="library-search">
              <input type="text" placeholder="Tìm bài báo, tác giả, chủ đề..." />
              <button className="btn primary">Tìm kiếm</button>
            </div>
            <div className="library-grid">
              <article>
                <h3>Genome-Based Sensors</h3>
                <p>Tập hợp tài liệu về cảm biến sinh học 2024.</p>
                <span className="pill">PubMed</span>
              </article>
              <article>
                <h3>Hydrogen Catalysis</h3>
                <p>Danh sách paper về chất xúc tác.</p>
                <span className="pill">JSTOR</span>
              </article>
              <article>
                <h3>Energy Harvesting</h3>
                <p>Đề xuất thử nghiệm cho vật liệu mới.</p>
                <span className="pill">Scholar</span>
              </article>
            </div>
          </div>
        </section>

        <section id="insights" className="section reveal">
          <div className="section-header">
            <h2>Bảng phân tích ý tưởng</h2>
            <p>Số liệu trực quan để ra quyết định nhanh và rõ ràng.</p>
          </div>
          <div className="insights">
            <div className="insight-card">
              <h3>Ý tưởng nổi bật</h3>
              <div className="bar">
                <span style={{ width: '78%' }} />
              </div>
              <p>Vật liệu nano từ phân tách sinh học</p>
            </div>
            <div className="insight-card">
              <h3>Thành viên đóng góp</h3>
              <div className="avatars">
                <span>NT</span>
                <span>ML</span>
                <span>HT</span>
                <span>KY</span>
              </div>
              <p>12 lần đóng góp từ nhóm 4 người</p>
            </div>
            <div className="insight-card">
              <h3>Phân bố theo chủ đề</h3>
              <div className="radar">
                <span>Nanotech</span>
                <span>AI</span>
                <span>Y sinh</span>
                <span>Vat lieu</span>
              </div>
              <p>Tập trung cao ở nanotech và y sinh</p>
            </div>
          </div>
        </section>

        <section className="section reveal">
          <div className="section-header">
            <h2>Bình luận theo cụm ý tưởng</h2>
            <p>Trao đổi trực tiếp trên từng cụm để tiếp tục brainstorm.</p>
          </div>
          <div className="comment-grid">
            <article className="comment-card">
              <div className="comment-header">
                <span className="badge">Cluster A</span>
                <span className="meta">12 ý tưởng</span>
              </div>
              <p className="comment-body">
                Nên tập trung vào ứng dụng y sinh, thêm giải pháp thử nghiệm an toàn.
              </p>
              <div className="comment-actions">
                <button className="btn ghost">Trả lời</button>
                <button className="btn outline">Mở tranh luận</button>
              </div>
            </article>
            <article className="comment-card">
              <div className="comment-header">
                <span className="badge">Cluster B</span>
                <span className="meta">8 ý tưởng</span>
              </div>
              <p className="comment-body">
                Có thể cập nhật thêm paper mới về chất xúc tác để mở rộng ý tưởng.
              </p>
              <div className="comment-actions">
                <button className="btn ghost">Trả lời</button>
                <button className="btn outline">Tạo nhiệm vụ</button>
              </div>
            </article>
            <article className="comment-card">
              <div className="comment-header">
                <span className="badge">Cluster C</span>
                <span className="meta">5 ý tưởng</span>
              </div>
              <p className="comment-body">
                Cần kiểm chứng qua mô phỏng trước khi đưa vào thử nghiệm thật.
              </p>
              <div className="comment-actions">
                <button className="btn ghost">Trả lời</button>
                <button className="btn outline">Xem chi tiết</button>
              </div>
            </article>
          </div>
        </section>

        <section id="security" className="section reveal">
          <div className="section-header">
            <h2>Bảo mật và quản lý nhóm</h2>
            <p>Đảm bảo thông tin nghiên cứu được bảo vệ và minh bạch.</p>
          </div>
          <div className="security-grid">
            <article>
              <h3>Quyền truy cập linh hoạt</h3>
              <p>Cấp quyền đọc, viết, quản trị theo vai trò và nhóm.</p>
            </article>
            <article>
              <h3>Chế độ riêng tư</h3>
              <p>Chọn chế độ riêng tư cho từng dự án và tài liệu.</p>
            </article>
            <article>
              <h3>Lịch sử hoạt động</h3>
              <p>Theo dõi thay đổi, tương tác, và bài đăng.</p>
            </article>
            <article>
              <h3>Thông báo thông minh</h3>
              <p>Cảnh báo deadline và cập nhật tự động qua email.</p>
            </article>
          </div>
        </section>

      <section className="cta reveal">
        <div>
          <h2>Sẵn sàng khởi động phiên brainstorm?</h2>
          <p>Chúng ta có thể kết hợp ý tưởng và biến chúng thành dự án thử nghiệm.</p>
        </div>
        <Link className="btn primary" href="/groups/new">
          Tạo nhóm mới
        </Link>
      </section>
      </main>

      <footer className="site-footer">
        <div>
          <strong>Brainstorm Lab</strong>
          <p>Nền tảng hợp tác khoa học cho đội nhóm hiện đại.</p>
        </div>
        <div className="footer-links">
          <a href="#">Tài liệu</a>
          <a href="#">Bảo mật</a>
          <a href="#">Hỗ trợ</a>
        </div>
      </footer>
      </>
  );
}
