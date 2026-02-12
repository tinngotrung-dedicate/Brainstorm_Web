import { storeApi } from '../../../../../lib/store';
import { emitGroupEvent } from '../../../../../lib/events';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const topics = await storeApi.listTopics(params.groupId);
  return Response.json(topics);
}

export async function POST(request, { params }) {
  const payload = await request.json();
  const topic = await storeApi.createTopic(params.groupId, {
    id: payload.id,
    title: payload.title,
    description: payload.description,
    status: payload.status
  });

  emitGroupEvent(params.groupId, { type: 'topic_created', payload: topic });
  return Response.json(topic, { status: 201 });
}
