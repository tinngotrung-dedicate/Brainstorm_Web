import { storeApi } from '../../../../../lib/store';
import { emitGroupEvent, emitTopicEvent } from '../../../../../lib/events';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const topic = await storeApi.getTopic(params.topicId);
  if (!topic) {
    return Response.json({ error: 'Không tìm thấy tab chủ đề' }, { status: 404 });
  }
  return Response.json({ graph_xml: topic.graph_xml ?? '' });
}

export async function POST(request, { params }) {
  const payload = await request.json();
  const graphXml = payload.graph_xml ?? payload.xml ?? '';

  const topic = await storeApi.updateTopic(params.topicId, { graph_xml: graphXml });
  if (!topic) {
    return Response.json({ error: 'Không tìm thấy tab chủ đề' }, { status: 404 });
  }

  emitTopicEvent(params.topicId, { type: 'graph_updated', payload: topic });
  emitGroupEvent(topic.group_id, { type: 'topic_updated', payload: topic });

  return Response.json(topic);
}
