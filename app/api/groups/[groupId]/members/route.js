import { storeApi } from '../../../../../lib/store';
import { emitGroupEvent } from '../../../../../lib/events';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const members = await storeApi.listMembers(params.groupId);
  return Response.json(members);
}

export async function POST(request, { params }) {
  const payload = await request.json();
  const member = await storeApi.addMember(params.groupId, {
    id: payload.id,
    name: payload.name,
    role: payload.role,
    topic_id: payload.topic_id ?? null
  });

  emitGroupEvent(params.groupId, { type: 'member_joined', payload: member });
  return Response.json(member, { status: 201 });
}
