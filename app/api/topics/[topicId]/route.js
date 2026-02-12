import { storeApi } from '../../../../lib/store';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const topic = await storeApi.getTopic(params.topicId);
  if (!topic) {
    return Response.json({ error: 'Không tìm thấy tab chủ đề' }, { status: 404 });
  }
  return Response.json(topic);
}

export async function PATCH(request, { params }) {
  const payload = await request.json();
  const topic = await storeApi.updateTopic(params.topicId, payload);
  if (!topic) {
    return Response.json({ error: 'Không tìm thấy tab chủ đề' }, { status: 404 });
  }
  return Response.json(topic);
}
