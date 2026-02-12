import { getPresence, updatePresence } from '../../../lib/presence';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get('topicId');
  const list = getPresence(topicId);
  return Response.json(list);
}

export async function POST(request) {
  const payload = await request.json();
  const list = updatePresence(payload.topicId, {
    id: payload.memberId,
    name: payload.name,
    role: payload.role
  });
  return Response.json(list);
}
