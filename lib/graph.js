const escapeLabel = (text) =>
  String(text)
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

export const buildMermaidGraph = (summary) => {
  if (!summary) return '';
  const rawLines = summary.split('\n');
  const edges = [];
  const stack = [];
  let nodeId = 0;

  const toNode = (text, level) => {
    const id = `N${nodeId++}`;
    while (stack.length > level) {
      stack.pop();
    }
    const parent = stack.length ? stack[stack.length - 1] : { id: 'Summary' };
    edges.push(`${parent.id} --> ${id}["${escapeLabel(text)}"]`);
    stack.push({ id, level });
  };

  rawLines.forEach((line) => {
    if (!line.trim()) return;
    if (/^từ khóa\s*:/i.test(line.trim())) return;
    const match = line.match(/^(\s*)([-*•])\s+(.*)$/);
    if (match) {
      const indent = match[1].length;
      const level = Math.floor(indent / 2);
      const text = match[3].trim();
      if (text) toNode(text, level);
      return;
    }
    const text = line.trim();
    if (text) toNode(text, 0);
  });

  if (!edges.length) {
    const fallback = summary.split(/(?<=[.!?])\s+/).slice(0, 6);
    fallback.forEach((node) => toNode(node, 0));
  }

  return `graph TD\n  Summary["Tóm tắt"]\n  ${edges.join('\n  ')}`;
};
