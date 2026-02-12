const presenceMap = new Map();
const TTL_MS = 30000;

const prune = (topicId) => {
  const now = Date.now();
  const topicMap = presenceMap.get(topicId);
  if (!topicMap) return [];

  for (const [key, value] of topicMap.entries()) {
    if (now - value.lastSeen > TTL_MS) {
      topicMap.delete(key);
    }
  }

  return Array.from(topicMap.values());
};

export const updatePresence = (topicId, member) => {
  if (!topicId) return [];
  const topicMap = presenceMap.get(topicId) ?? new Map();
  topicMap.set(member.id, { ...member, lastSeen: Date.now() });
  presenceMap.set(topicId, topicMap);
  return prune(topicId);
};

export const getPresence = (topicId) => {
  if (!topicId) return [];
  return prune(topicId);
};
