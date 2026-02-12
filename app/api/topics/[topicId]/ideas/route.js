import { storeApi } from '../../../../../lib/store';
import { emitGroupEvent, emitTopicEvent } from '../../../../../lib/events';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const ideas = await storeApi.listIdeas(params.topicId);
  return Response.json(ideas);
}

export async function POST(request, { params }) {
  const payload = await request.json();
  const idea = await storeApi.addIdea(params.topicId, {
    content: payload.content,
    author: payload.author
  });

  emitTopicEvent(params.topicId, { type: 'idea_added', payload: idea });
  const topic = await storeApi.getTopic(params.topicId);
  if (topic?.group_id) {
    emitGroupEvent(topic.group_id, { type: 'topic_updated', payload: topic });
  }
  return Response.json(idea, { status: 201 });
}
