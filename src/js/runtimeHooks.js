__mods["js/runtimeHooks.js"] = (() => {
const hooks = {
  createState: () => ({}),
  resolveTextSize: (_state, fallback) => fallback,
  beforeObservationSave: () => {},
  handleAction: () => false,
  handleChange: () => false,
  syncDateState: () => false,
  startDateTracking: () => () => {},
  todayFlowerContext: ({ date, storage }) => ({ date, storage }),
  relaySnapshot: (snapshot) => snapshot,
  resolveSyntheticAction: (_snapshot, action) => action,
  shouldForceNetworkFailure: () => false,
  renderSettingsExtra: () => null
};

function installRuntimeHooks(overrides = {}) {
  for (const key of Object.keys(hooks)) {
    if (typeof overrides[key] === 'function') hooks[key] = overrides[key];
  }
}

return { hooks, installRuntimeHooks };
})();
