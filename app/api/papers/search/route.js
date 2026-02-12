import { spawn } from 'child_process';
import path from 'path';

export const runtime = 'nodejs';

const summarize = (text = '') => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const sentences = clean.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 2).join(' ');
};

const abstractFromInverted = (inverted) => {
  if (!inverted) return '';
  const positions = [];
  Object.entries(inverted).forEach(([word, indexes]) => {
    indexes.forEach((idx) => {
      positions[idx] = word;
    });
  });
  return positions.filter(Boolean).join(' ');
};

const runScholar = (query) => {
  const scriptPath = path.join(process.cwd(), 'scripts', 'scholar_search.py');
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [scriptPath, query], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Quá thời gian truy vấn Scholar'));
    }, 20000);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    child.on('close', () => {
      clearTimeout(timer);
      if (!stdout.trim()) {
        reject(new Error(stderr || 'Không có đầu ra từ script Scholar'));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error('JSON không hợp lệ từ script Scholar'));
      }
    });
  });
};

export async function POST(request) {
  const payload = await request.json();
  const query = String(payload.query || '').trim();
  const source = payload.source || 'openalex';

  if (!query) {
    return Response.json({ results: [], error: 'Thiếu từ khóa' }, { status: 400 });
  }

  try {
    if (source === 'scholar') {
      if (process.env.ENABLE_SCHOLAR !== 'true') {
        return Response.json(
          { results: [], error: 'Google Scholar bị tắt trên môi trường này.' },
          { status: 503 }
        );
      }
      const data = await runScholar(query);
      const results = (data.results || []).map((item) => ({
        title: item.title,
        url: item.url,
        authors: item.authors,
        year: item.year,
        source: item.source || 'Google Scholar',
        summary: summarize(item.snippet)
      }));
      return Response.json({ results, warning: data.error });
    }

    const res = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=5`
    );
    if (!res.ok) {
      return Response.json({ results: [], error: 'Không thể gọi OpenAlex' }, { status: 502 });
    }
    const data = await res.json();
    const results = (data.results || []).map((item) => {
      const abstract = abstractFromInverted(item.abstract_inverted_index);
      const summary = summarize(abstract || item.title || '');
      return {
        title: item.display_name,
        url: item.id,
        authors: item.authorships
          ? item.authorships.map((author) => author.author?.display_name).filter(Boolean).join(', ')
          : '',
        year: item.publication_year,
        source: 'OpenAlex',
        summary
      };
    });
    return Response.json({ results });
  } catch (error) {
    return Response.json({ results: [], error: error.message }, { status: 500 });
  }
}
