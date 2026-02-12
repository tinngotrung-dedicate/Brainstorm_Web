import { storeApi } from '../../../../../lib/store';
import { emitGroupEvent, emitTopicEvent } from '../../../../../lib/events';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const entries = await storeApi.listSwot(params.topicId);
  return Response.json(entries);
}

export async function POST(request, { params }) {
  const payload = await request.json();
  const entry = await storeApi.addSwot(params.topicId, {
    type: payload.type,
    content: payload.content,
    author: payload.author
  });

  emitTopicEvent(params.topicId, { type: 'swot_added', payload: entry });
  const topic = await storeApi.getTopic(params.topicId);
  if (topic?.group_id) {
    emitGroupEvent(topic.group_id, { type: 'topic_updated', payload: topic });
  }
  return Response.json(entry, { status: 201 });
}
