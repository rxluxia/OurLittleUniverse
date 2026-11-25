const subscribers = new Set();
const state = {
  currentScene: "opening",
  navUnlocked: false,
};

export function getState() {
  return { ...state };
}

export function setState(updates) {
  const nextState = { ...state, ...updates };
  let changed = false;

  for (const key of Object.keys(nextState)) {
    if (state[key] !== nextState[key]) {
      state[key] = nextState[key];
      changed = true;
    }
  }

  if (changed) {
    subscribers.forEach((subscriber) => subscriber(getState()));
  }

  return getState();
}

export function subscribe(subscriber) {
  if (typeof subscriber !== "function") {
    throw new TypeError("Subscriber must be a function.");
  }

  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}
