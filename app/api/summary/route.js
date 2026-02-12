import { storeApi } from '../../../lib/store';
import { emitGroupEvent, emitTopicEvent } from '../../../lib/events';

export const runtime = 'nodejs';

const DEFAULT_MODEL_PRIORITY = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-pro',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro'
];

const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;
let cachedModels = null;
let cachedAt = 0;

const normalizeModelName = (name) => {
  if (!name) return '';
  return name.replace(/^models\//, '');
};

const scoreModel = (name) => {
  const lower = name.toLowerCase();
  let score = 0;
  if (lower.includes('2.5')) score += 400;
  if (lower.includes('2.0')) score += 300;
  if (lower.includes('1.5')) score += 200;
  if (lower.includes('1.0')) score += 100;
  if (lower.includes('pro')) score += 20;
  if (lower.includes('flash')) score += 10;
  if (lower.includes('preview') || lower.includes('exp')) score -= 5;
  return score;
};

const sortModels = (models) =>
  [...new Set(models)]
    .filter(Boolean)
    .sort((a, b) => scoreModel(b) - scoreModel(a));

const fetchAvailableModels = async (apiKey) => {
  const now = Date.now();
  if (cachedModels && now - cachedAt < MODEL_CACHE_TTL_MS) {
    return cachedModels;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) {
      throw new Error(`Model list failed: ${res.status}`);
    }
    const data = await res.json();
    const models = (data.models || [])
      .filter((model) => (model.supportedGenerationMethods || []).includes('generateContent'))
      .map((model) => normalizeModelName(model.name))
      .filter((name) => name.includes('gemini'));

    if (models.length) {
      cachedModels = sortModels(models);
      cachedAt = now;
      return cachedModels;
    }
  } catch (error) {
    console.warn('Gemini model list failed, falling back to defaults.', error);
  }

  cachedModels = DEFAULT_MODEL_PRIORITY;
  cachedAt = now;
  return cachedModels;
};

const buildPrompt = (ideas) => {
  const list = ideas.map((idea, idx) => `${idx + 1}. ${idea}`).join('\n');
  return `Bạn là trợ lý nghiên cứu. Hãy tóm tắt các ý tưởng dưới đây theo cấu trúc "tường bậc" nhiều cấp (càng nhiều bậc càng tốt, tối thiểu 3 cấp). Trình bày dạng bullet, mỗi cấp con thụt vào 2 dấu cách. Sau đó, liệt kê 6-10 cụm từ khóa chính (mỗi cụm 2-4 từ).\n\nDanh sách ý tưởng:\n${list}\n\nĐịnh dạng bắt buộc:\n- <Ý chính 1>\n  - <Ý phụ 1.1>\n    - <Chi tiết 1.1.1>\n  - <Ý phụ 1.2>\n- <Ý chính 2>\n  - <Ý phụ 2.1>\n    - <Chi tiết 2.1.1>\nTừ khóa: <cụm từ 1>; <cụm từ 2>; ...`;
};

const extractText = (data) =>
  data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';

const requestGemini = async ({ apiKey, model, prompt }) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: errText, status: res.status };
  }

  const data = await res.json();
  const text = extractText(data);
  return { ok: Boolean(text), text, status: res.status, raw: data };
};

export async function POST(request) {
  const payload = await request.json();
  const ideas = Array.isArray(payload.ideas) ? payload.ideas : [];
  const topicId = payload.topicId;
  if (!ideas.length) {
    return Response.json({ error: 'Chưa có ý tưởng để tóm tắt' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'Thiếu GEMINI_API_KEY' }, { status: 500 });
  }

  const prompt = buildPrompt(ideas);

  try {
    const models = await fetchAvailableModels(apiKey);
    let text = '';
    const errors = [];

    for (const model of models) {
      const result = await requestGemini({ apiKey, model, prompt });
      if (result.ok && result.text) {
        text = result.text;
        break;
      }
      errors.push({ model, status: result.status, error: result.error });
    }

    if (!text) {
      console.warn('All Gemini models failed.', errors);
      return Response.json(
        {
          error: 'Không thể gọi Gemini',
          details: 'Không thể tạo tóm tắt. Vui lòng kiểm tra API key hoặc hạn mức.'
        },
        { status: 502 }
      );
    }

    let topic = null;
    if (topicId) {
      topic = await storeApi.updateTopic(topicId, { summary: text });
      if (topic) {
        emitTopicEvent(topicId, { type: 'summary_updated', payload: topic });
        emitGroupEvent(topic.group_id, { type: 'topic_updated', payload: topic });
      }
    }

    return Response.json({ summary: text, topic });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
