import { storeApi } from '../../../lib/store';
import { emitGroupEvent } from '../../../lib/events';

export const runtime = 'nodejs';

export async function GET() {
  const groups = await storeApi.listGroups();
  return Response.json(groups);
}

export async function POST(request) {
  const payload = await request.json();
  const group = await storeApi.createGroup({
    id: payload.id,
    name: payload.name,
    focus: payload.focus,
    description: payload.description,
    privacy: payload.privacy,
    size: payload.size,
    host_name: payload.host_name,
    invite_code: payload.invite_code,
    status: payload.status
  });

  emitGroupEvent(group.id, { type: 'group_created', payload: group });
  return Response.json(group, { status: 201 });
}
