import { storeApi, makeId } from '../../../../../lib/store';
import { emitGroupEvent } from '../../../../../lib/events';

export const runtime = 'nodejs';

export async function POST(_request, { params }) {
  const inviteCode = makeId('invite').slice(-8).toUpperCase();
  const group = await storeApi.updateGroup(params.groupId, { invite_code: inviteCode });
  if (!group) {
    return Response.json({ error: 'Không tìm thấy nhóm' }, { status: 404 });
  }
  emitGroupEvent(params.groupId, { type: 'group_updated', payload: group });
  return Response.json(group);
}
