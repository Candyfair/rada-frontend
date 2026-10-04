// -------------------------------------------------------------------
// A user preference kept in localStorage, made for useSyncExternalStore:
//
//   const value = useSyncExternalStore(pref.subscribe, pref.read, () => pref.defaultValue);
//
// The server and the hydration pass render the default, then React
// switches to the saved value without a setState in an effect.
// Other tabs stay in sync through the "storage" event.
// -------------------------------------------------------------------

export interface StoredPreference<T extends string> {
  defaultValue: T;
  subscribe: (onChange: () => void) => () => void;
  read: () => T;
  write: (value: T) => void;
}

export function createStoredPreference<T extends string>(
  key: string,
  values: readonly T[],
  defaultValue: T
): StoredPreference<T> {
  // Same-tab subscribers; the "storage" event only fires in other tabs
  const listeners = new Set<() => void>();

  // localStorage can throw (blocked storage, some private modes):
  // the preference then still works for the current page
  let fallback = defaultValue;

  const isValue = (saved: string | null): saved is T =>
    saved !== null && (values as readonly string[]).includes(saved);

  return {
    defaultValue,

    subscribe(onChange) {
      listeners.add(onChange);
      window.addEventListener("storage", onChange);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onChange);
      };
    },

    read() {
      try {
        const saved = localStorage.getItem(key);
        return isValue(saved) ? saved : defaultValue;
      } catch {
        return fallback;
      }
    },

    write(value) {
      fallback = value;
      try {
        localStorage.setItem(key, value);
      } catch {
        // Preference just won't persist
      }
      listeners.forEach((listener) => listener());
    },
  };
}
