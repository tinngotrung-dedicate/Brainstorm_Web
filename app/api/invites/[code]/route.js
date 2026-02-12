import { storeApi } from '../../../../lib/store';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const code = params.code;
  const group = await storeApi.findGroupByInvite(code);
  if (!group) {
    return Response.json({ error: 'Không tìm thấy mã mời' }, { status: 404 });
  }
  const topics = await storeApi.listTopics(group.id);
  return Response.json({ group, topics });
}
