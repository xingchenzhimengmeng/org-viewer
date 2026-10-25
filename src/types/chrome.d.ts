declare namespace chrome {
  namespace runtime {
    const id: string;
    const lastError: { message?: string } | undefined;
    function getURL(path: string): string;
    function sendMessage(message: any, responseCallback?: (response: any) => void): Promise<any>;
    function openOptionsPage(): Promise<void>;
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
    function sendMessage(tabId: number, message: any): Promise<any>;
    function query(queryInfo: {
      active?: boolean;
      currentWindow?: boolean;
    }): Promise<Array<{ id?: number; url?: string; title?: string }>>;
    const onUpdated: {
      addListener(callback: (
        tabId: number,
        changeInfo: { status?: string },
        tab: { url?: string }
      ) => void): void;
    };
  }

  namespace action {
    const onClicked: {
      addListener(callback: (tab: { id?: number; url?: string }) => void): void;
    };
  }

  namespace scripting {
    function insertCSS(details: { target: { tabId: number }; files?: string[]; code?: string }): Promise<void>;
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
