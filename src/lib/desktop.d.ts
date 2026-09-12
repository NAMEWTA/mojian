export type MojianDesktopApi = {
  isDesktop: true;
  platform: NodeJS.Platform;
  pickDirectory: () => Promise<string | null>;
  getDataDir: () => Promise<string>;
  readData: () => Promise<string | null>;
  writeData: (json: string) => Promise<void>;
};

declare global {
  interface Window {
    mojianDesktop?: MojianDesktopApi;
  }
}

export {};
