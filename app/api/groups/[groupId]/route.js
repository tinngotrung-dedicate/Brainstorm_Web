import { storeApi } from '../../../../lib/store';
import { emitGroupEvent } from '../../../../lib/events';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const group = await storeApi.getGroup(params.groupId);
  if (!group) {
    return Response.json({ error: 'Không tìm thấy nhóm' }, { status: 404 });
  }
  return Response.json(group);
}

export async function PATCH(request, { params }) {
  const payload = await request.json();
  const group = await storeApi.updateGroup(params.groupId, payload);
  if (!group) {
    return Response.json({ error: 'Không tìm thấy nhóm' }, { status: 404 });
  }
  emitGroupEvent(params.groupId, { type: 'group_updated', payload: group });
  return Response.json(group);
}
