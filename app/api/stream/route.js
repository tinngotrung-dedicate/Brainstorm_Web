import { eventBus } from '../../../lib/events';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');
  const topicId = searchParams.get('topicId');

  const channel = groupId ? `group:${groupId}` : topicId ? `topic:${topicId}` : null;

  if (!channel) {
    return Response.json({ error: 'Thiếu groupId hoặc topicId' }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (payload) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const handler = (payload) => send(payload);
      eventBus.on(channel, handler);

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`: keep-alive\n\n`));
      }, 15000);

      const close = () => {
        clearInterval(keepAlive);
        eventBus.off(channel, handler);
        controller.close();
      };

      request.signal.addEventListener('abort', close);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
