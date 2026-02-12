import { EventEmitter } from 'events';

const emitter = new EventEmitter();

export const eventBus = emitter;

export const emitGroupEvent = (groupId, payload) => {
  emitter.emit(`group:${groupId}`, payload);
};

export const emitTopicEvent = (topicId, payload) => {
  emitter.emit(`topic:${topicId}`, payload);
};
