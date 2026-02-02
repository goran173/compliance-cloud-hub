export {};

declare global {
  interface Window {
    shopify?: {
      id: {
        getIdToken: () => Promise<string>;
      };
    };
  }
}
