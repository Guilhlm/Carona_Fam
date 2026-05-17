const { EventEmitter } = require('events');

const KEEP_ALIVE_INTERVAL_MS = 25000;

class RealtimeService {
  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(0);
    this.channelSubscribers = new Map();
  }

  writeFrame(responseStream, eventName, framePayload) {
    try {
      if (eventName) {
        responseStream.write(`event: ${eventName}\n`);
      }
      responseStream.write(`data: ${JSON.stringify(framePayload)}\n\n`);
    } catch (writeError) {
      this.detachSubscriber(responseStream);
    }
  }

  detachSubscriber(responseStream) {
    for (const [channelName, subscriberSet] of this.channelSubscribers.entries()) {
      if (subscriberSet.delete(responseStream) && subscriberSet.size === 0) {
        this.channelSubscribers.delete(channelName);
      }
    }
  }

  applySseHeaders(responseStream) {
    responseStream.setHeader('Content-Type', 'text/event-stream');
    responseStream.setHeader('Cache-Control', 'no-cache, no-transform');
    responseStream.setHeader('Connection', 'keep-alive');
    responseStream.setHeader('X-Accel-Buffering', 'no');
    if (typeof responseStream.flushHeaders === 'function') {
      responseStream.flushHeaders();
    }
  }

  registerSubscriber(channelName, responseStream) {
    if (!this.channelSubscribers.has(channelName)) {
      this.channelSubscribers.set(channelName, new Set());
    }
    this.channelSubscribers.get(channelName).add(responseStream);
  }

  subscribe(channelName, responseStream, requestStream) {
    this.applySseHeaders(responseStream);
    this.writeFrame(responseStream, 'ready', { channel: channelName, at: new Date().toISOString() });

    const updateHandler = (payload) => this.writeFrame(responseStream, 'update', payload);
    this.emitter.on(channelName, updateHandler);
    this.registerSubscriber(channelName, responseStream);

    const keepAliveTimer = setInterval(() => {
      try {
        responseStream.write(': keep-alive\n\n');
      } catch (keepAliveError) {
        clearInterval(keepAliveTimer);
      }
    }, KEEP_ALIVE_INTERVAL_MS);

    const cleanup = () => {
      clearInterval(keepAliveTimer);
      this.emitter.off(channelName, updateHandler);
      const subscriberSet = this.channelSubscribers.get(channelName);
      if (subscriberSet) {
        subscriberSet.delete(responseStream);
        if (subscriberSet.size === 0) this.channelSubscribers.delete(channelName);
      }
    };

    if (requestStream) {
      requestStream.on('close', cleanup);
      requestStream.on('aborted', cleanup);
    }
    responseStream.on('close', cleanup);
    responseStream.on('error', cleanup);

    return cleanup;
  }

  publish(channelName, payload) {
    this.emitter.emit(channelName, payload);
  }

  subscriberCount(channelName) {
    const subscriberSet = this.channelSubscribers.get(channelName);
    return subscriberSet ? subscriberSet.size : 0;
  }
}

module.exports = RealtimeService;
