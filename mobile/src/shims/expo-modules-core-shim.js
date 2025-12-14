// Shim for web builds to ensure `expo-modules-core` exports `uuidv4` when a
// particular version of `expo-constants` expects it.
const expoCore = require('expo-modules-core');

try {
  const { v4: uuidv4 } = require('uuid');
  if (!expoCore.uuidv4) {
    expoCore.uuidv4 = uuidv4;
  }
} catch (e) {
  // If uuid package isn't available, we fail gracefully. The runtime may still
  // work without uuidv4 but this shim avoids webpack warnings during web builds.
  // eslint-disable-next-line no-console
  console.warn('Could not patch expo-modules-core with uuidv4:', e?.message || e);
}
// Provide a lightweight EventEmitter if the real one isn't a constructor in web
try {
  if (!expoCore.EventEmitter || typeof expoCore.EventEmitter !== 'function') {
    class EventEmitter {
      constructor(nativeModule) {
        this._nativeModule = nativeModule;
        this._listeners = {};
      }
      addListener(eventName, handler) {
        if (!this._listeners[eventName]) this._listeners[eventName] = new Set();
        this._listeners[eventName].add(handler);
        return {
          remove: () => this._listeners[eventName] && this._listeners[eventName].delete(handler),
        };
      }
      removeAllListeners(eventName) {
        if (eventName) delete this._listeners[eventName];
        else this._listeners = {};
      }
      emit(eventName, payload) {
        const list = this._listeners[eventName];
        if (list) list.forEach(fn => fn(payload));
      }
    }

    expoCore.EventEmitter = EventEmitter;
  }
} catch (e) {
  // If anything goes wrong, log and continue
  // eslint-disable-next-line no-console
  console.warn('Failed to ensure EventEmitter on expo-modules-core shim:', e?.message || e);
}

module.exports = expoCore;
