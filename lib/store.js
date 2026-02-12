import fs from 'fs/promises';
import path from 'path';

// Vercel/serverless: allow running without writable FS.
const DATA_DIR = process.env.DATA_DIR || '/tmp/brainstorm-store';
const ENABLE_PERSISTENCE = process.env.ENABLE_PERSISTENCE !== 'false';
const storePath = path.join(DATA_DIR, 'store.json');

let storeCache = null;
let persistWarningLogged = false;

const makeId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const seedStore = () => {
  const now = new Date().toISOString();
  const groupId = 'alpha-lab';
    const topics = {
      'nano-bio': {
        id: 'nano-bio',
        group_id: groupId,
        title: 'Vật liệu nano sinh học',
        description: 'Y sinh - vật liệu mới',
        summary: '',
        graph_xml: '',
        status: 'Đang mở',
        created_at: now
      },
      'energy-storage': {
        id: 'energy-storage',
        group_id: groupId,
        title: 'Lưu trữ hydrogen',
        description: 'Năng lượng tái tạo',
        summary: '',
        graph_xml: '',
        status: 'Đang tổng hợp',
        created_at: now
      },
      'ai-protocol': {
        id: 'ai-protocol',
        group_id: groupId,
        title: 'AI dự đoán thực nghiệm',
        description: 'Mô phỏng và tối ưu',
        summary: '',
        graph_xml: '',
        status: 'Đang mở',
        created_at: now
      }
    };

  const memberId = makeId('member');

  return {
    groups: {
      [groupId]: {
        id: groupId,
        name: 'Alpha Lab',
        focus: 'Vật liệu nano ứng dụng y sinh',
        description: 'Chủ đề tổng quan: vật liệu mới và năng lượng.',
        privacy: 'private',
        size: 'small',
        host_name: 'Tín Ngô',
        invite_code: 'ALPHA2026',
        status: 'Đang mở',
        created_at: now,
        updated_at: now
      }
    },
    topics,
    members: {
      [memberId]: {
        id: memberId,
        group_id: groupId,
        name: 'Tín Ngô',
        role: 'host',
        topic_id: null,
        created_at: now
      }
    },
    swot_entries: {},
    ideas: {}
  };
};

const warnOnce = (msg) => {
  if (persistWarningLogged) return;
  persistWarningLogged = true;
  console.warn(msg);
};

const ensureStore = async () => {
  if (storeCache) return storeCache;

  // In-memory only mode (default safer for Vercel).
  if (!ENABLE_PERSISTENCE) {
    warnOnce('Persistence disabled; using in-memory store (clears on cold start).');
    storeCache = seedStore();
    return storeCache;
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    warnOnce('Cannot create data dir, falling back to in-memory store.');
    storeCache = seedStore();
    return storeCache;
  }

  try {
    const raw = await fs.readFile(storePath, 'utf-8');
    storeCache = JSON.parse(raw);
  } catch (error) {
    storeCache = seedStore();
    try {
      await fs.writeFile(storePath, JSON.stringify(storeCache, null, 2));
    } catch (writeErr) {
      warnOnce('Cannot write store file, continuing in-memory only.');
    }
  }

  return storeCache;
};

const saveStore = async () => {
  if (!storeCache) return;
  if (!ENABLE_PERSISTENCE) return;
  try {
    await fs.writeFile(storePath, JSON.stringify(storeCache, null, 2));
  } catch (error) {
    warnOnce('Failed to persist store file; continuing in-memory.');
  }
};

const listByGroup = (collection, groupId) =>
  Object.values(collection).filter((item) => item.group_id === groupId);

const listByTopic = (collection, topicId) =>
  Object.values(collection).filter((item) => item.topic_id === topicId);

const withGroupCounts = (store, group) => {
  const memberCount = listByGroup(store.members, group.id).length;
  const topicCount = listByGroup(store.topics, group.id).length;
  return { ...group, member_count: memberCount, topic_count: topicCount };
};

const withTopicCounts = (store, topic) => {
  const memberCount = Object.values(store.members).filter((m) => m.topic_id === topic.id).length;
  const swotCount = listByTopic(store.swot_entries, topic.id).length;
  const ideaCount = listByTopic(store.ideas, topic.id).length;
  return {
    ...topic,
    member_count: memberCount,
    swot_count: swotCount,
    idea_count: ideaCount
  };
};

export const storeApi = {
  async getStore() {
    return ensureStore();
  },
  async listGroups() {
    const store = await ensureStore();
    return Object.values(store.groups).map((group) => withGroupCounts(store, group));
  },
  async getGroup(groupId) {
    const store = await ensureStore();
    const group = store.groups[groupId];
    if (!group) return null;
    return withGroupCounts(store, group);
  },
  async findGroupByInvite(code) {
    const store = await ensureStore();
    const group = Object.values(store.groups).find((item) => item.invite_code === code);
    if (!group) return null;
    return withGroupCounts(store, group);
  },
  async createGroup(data) {
    const store = await ensureStore();
    const now = new Date().toISOString();
    const groupId = data.id || makeId('group');
    store.groups[groupId] = {
      id: groupId,
      name: data.name,
      focus: data.focus ?? '',
      description: data.description ?? '',
      privacy: data.privacy ?? 'private',
      size: data.size ?? 'small',
      host_name: data.host_name ?? 'Host',
      invite_code: data.invite_code ?? makeId('invite').slice(-8).toUpperCase(),
      status: data.status ?? 'Đang mở',
      created_at: now,
      updated_at: now
    };
    await saveStore();
    return withGroupCounts(store, store.groups[groupId]);
  },
  async updateGroup(groupId, updates) {
    const store = await ensureStore();
    const group = store.groups[groupId];
    if (!group) return null;
    store.groups[groupId] = {
      ...group,
      ...updates,
      updated_at: new Date().toISOString()
    };
    await saveStore();
    return withGroupCounts(store, store.groups[groupId]);
  },
  async listTopics(groupId) {
    const store = await ensureStore();
    return listByGroup(store.topics, groupId).map((topic) => withTopicCounts(store, topic));
  },
  async getTopic(topicId) {
    const store = await ensureStore();
    const topic = store.topics[topicId];
    if (!topic) return null;
    return withTopicCounts(store, topic);
  },
  async createTopic(groupId, data) {
    const store = await ensureStore();
    const now = new Date().toISOString();
    const topicId = data.id || makeId('topic');
    store.topics[topicId] = {
      id: topicId,
      group_id: groupId,
      title: data.title,
      description: data.description ?? '',
      summary: data.summary ?? '',
      graph_xml: data.graph_xml ?? '',
      status: data.status ?? 'Đang mở',
      created_at: now
    };
    await saveStore();
    return withTopicCounts(store, store.topics[topicId]);
  },
  async updateTopic(topicId, updates) {
    const store = await ensureStore();
    const topic = store.topics[topicId];
    if (!topic) return null;
    store.topics[topicId] = {
      ...topic,
      ...updates
    };
    await saveStore();
    return withTopicCounts(store, store.topics[topicId]);
  },
  async listMembers(groupId) {
    const store = await ensureStore();
    return listByGroup(store.members, groupId);
  },
  async addMember(groupId, data) {
    const store = await ensureStore();
    const now = new Date().toISOString();
    const memberId = data.id || makeId('member');
    store.members[memberId] = {
      id: memberId,
      group_id: groupId,
      name: data.name,
      role: data.role ?? 'idea',
      topic_id: data.topic_id ?? null,
      created_at: now
    };
    await saveStore();
    return store.members[memberId];
  },
  async listSwot(topicId) {
    const store = await ensureStore();
    return listByTopic(store.swot_entries, topicId);
  },
  async addSwot(topicId, data) {
    const store = await ensureStore();
    const now = new Date().toISOString();
    const entryId = data.id || makeId('swot');
    store.swot_entries[entryId] = {
      id: entryId,
      topic_id: topicId,
      type: data.type,
      content: data.content,
      author: data.author ?? 'Thành viên',
      created_at: now
    };
    await saveStore();
    return store.swot_entries[entryId];
  },
  async listIdeas(topicId) {
    const store = await ensureStore();
    return listByTopic(store.ideas, topicId);
  },
  async addIdea(topicId, data) {
    const store = await ensureStore();
    const now = new Date().toISOString();
    const ideaId = data.id || makeId('idea');
    store.ideas[ideaId] = {
      id: ideaId,
      topic_id: topicId,
      content: data.content,
      author: data.author ?? 'Thành viên',
      created_at: now
    };
    await saveStore();
    return store.ideas[ideaId];
  }
};

export { makeId };
