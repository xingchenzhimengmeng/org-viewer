declare namespace chrome {
  namespace runtime {
    const id: string;
    function getURL(path: string): string;
    function sendMessage(message: any, responseCallback?: (response: any) => void): void;
    const onInstalled: {
      addListener(callback: (details: { reason: string; previousVersion?: string }) => void): void;
    };
    const onMessage: {
      addListener(callback: (message: any, sender: { tab?: { id?: number } }, sendResponse: (response?: any) => void) => boolean | void): void;
    };
  }

  namespace extension {
    function isAllowedFileSchemeAccess(callback: (isAllowed: boolean) => void): void;
  }

  namespace tabs {
    function create(createProperties: { url?: string; active?: boolean }): Promise<any>;
  }

  namespace scripting {
    function insertCSS(details: { target: { tabId: number }; files?: string[]; css?: string }): Promise<void>;
    function executeScript(details: { target: { tabId: number }; files?: string[]; func?: (...args: any[]) => any }): Promise<any[]>;
  }

  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | Record<string, any> | null): Promise<Record<string, any>>;
      set(items: Record<string, any>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }
    const sync: StorageArea;
    const local: StorageArea;
  }

  namespace permissions {
    function request(permissions: { permissions?: string[]; origins?: string[] }, callback?: (granted: boolean) => void): void;
    function remove(permissions: { permissions?: string[]; origins?: string[] }, callback?: (removed: boolean) => void): void;
    function contains(permissions: { permissions?: string[]; origins?: string[] }, callback?: (result: boolean) => void): void;
  }

  namespace i18n {
    function getMessage(messageName: string, substitutions?: any): string;
    function getUILanguage(): string;
  }
}