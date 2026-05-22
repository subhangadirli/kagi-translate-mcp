export function createMockServer() {
  const tools = [];

  return {
    tools,
    registerTool(name, options, handler) {
      tools.push({ name, options, handler });
    },
  };
}

export function createMockKagiClient(handlers = {}) {
  return {
    async translateText(request) {
      if (handlers.translateText) {
        return handlers.translateText(request);
      }

      return {};
    },
    async translateUrl(request) {
      if (handlers.translateUrl) {
        return handlers.translateUrl(request);
      }

      return {};
    },
    async proofread(request) {
      if (handlers.proofread) {
        return handlers.proofread(request);
      }

      return {};
    },
  };
}