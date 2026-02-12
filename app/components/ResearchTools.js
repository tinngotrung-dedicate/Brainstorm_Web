'use client';

import { useState } from 'react';

export default function ResearchTools() {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('openalex');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Vui lòng nhập từ khóa trước khi tìm kiếm.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/papers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, source })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Không thể tìm bài báo.');
        setResults([]);
      } else {
        setResults(data.results || []);
        if (data.warning) {
          setError(`Lưu ý: ${data.warning}`);
        }
      }
    } catch (err) {
      setError('Không thể kết nối backend tìm kiếm.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSummary = async () => {
    setSummary('');
    setSummaryError('');
    if (!results.length) {
      setSummaryError('Cần có ít nhất 1 kết quả để tóm tắt.');
      return;
    }
    const top5 = results.slice(0, 5).map((item) => item.summary || item.title || '');
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideas: top5, topicId: null })
      });
      const data = await res.json();
      if (!res.ok) {
        setSummaryError(data.error || 'Không thể tóm tắt 5 bài đầu.');
      } else {
        setSummary(data.summary || '');
      }
    } catch (err) {
      setSummaryError('Không thể gọi API tóm tắt.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="research-tools">
      <div className="research-card tool-card">
        <div className="tool-header">
          <h3>Tìm bài báo & tóm tắt</h3>
          <span className="badge">Backend cục bộ</span>
        </div>
        <p className="muted-text">
          Tìm từ khóa trong kho bài báo (OpenAlex hoặc Google Scholar). Kết quả có tóm tắt ngắn để
          gợi ý ý tưởng.
        </p>
        <div className="tool-form">
          <input
            type="text"
            placeholder="Nhập từ khóa (VD: nanomaterials biosensor)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="openalex">OpenAlex (API)</option>
            <option value="scholar">Google Scholar (thu thập)</option>
          </select>
          <div className="tool-actions">
            <button className="btn primary" type="button" onClick={handleSearch} disabled={loading}>
              {loading ? 'Đang tìm...' : 'Tìm bài báo'}
            </button>
            <button
              className="btn outline"
              type="button"
              onClick={handleAutoSummary}
              disabled={summaryLoading || results.length === 0}
            >
              {summaryLoading ? 'Đang tóm tắt...' : 'Tóm tắt 5 bài đầu'}
            </button>
          </div>
        </div>
        {source === 'scholar' && (
          <p className="muted-text">
            Lưu ý: Google Scholar có thể chặn scraping. Cần cài `beautifulsoup4` nếu chưa có.
          </p>
        )}
        {error && <div className="notice error">{error}</div>}
        {summaryError && <div className="notice error">{summaryError}</div>}
        {summary && (
          <div className="summary-card">
            <div className="card-header-row">
              <h4>Tóm tắt nhanh 5 bài đầu</h4>
            </div>
            <p className="summary-text">{summary}</p>
          </div>
        )}
        <div className="search-results">
          {results.length === 0 && !loading ? (
            <p className="muted-text">Chưa có kết quả. Hãy thử từ khóa khác.</p>
          ) : (
            results.map((item, index) => (
              <article className="result-card" key={`${item.title}-${index}`}>
                <div>
                  <h4>{item.title}</h4>
                  <p className="result-meta">
                    {item.authors || 'Không rõ tác giả'} · {item.year || 'Năm?'} · {item.source}
                  </p>
                  <p className="result-summary">{item.summary || 'Chưa có tóm tắt.'}</p>
                </div>
                {item.url && (
                  <a className="btn outline" href={item.url} target="_blank" rel="noreferrer">
                    Xem bài báo
                  </a>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
