// Global utility for accessing Electron APIs in renderer process
// This handles different ways to access ipcRenderer based on the app configuration

let ipcRenderer: any = null;

// Try different ways to access ipcRenderer
try {
  // Method 1: Direct import (should work with nodeIntegration: true)
  ipcRenderer = require('electron').ipcRenderer;
  console.log('ipcRenderer loaded via direct require');
} catch (error) {
  console.error('Failed to import ipcRenderer via require:', error);
  try {
    // Method 2: ES6 import
    const electron = require('electron');
    ipcRenderer = electron.ipcRenderer;
    console.log('ipcRenderer loaded via electron object');
  } catch (error2) {
    console.error('Failed to access ipcRenderer via electron object:', error2);
    try {
      // Method 3: Check if it's available on window (in case of preload script)
      ipcRenderer = (window as any).electron?.ipcRenderer;
      if (ipcRenderer) {
        console.log('ipcRenderer loaded via window.electron');
      } else {
        console.error('ipcRenderer not available on window.electron');
      }
    } catch (error3) {
      console.error('Failed to access ipcRenderer via window:', error3);
    }
  }
}

// Validate ipcRenderer availability
if (!ipcRenderer) {
  console.error('❌ ipcRenderer is not available. Check Electron configuration.');
  console.error('🔧 Make sure nodeIntegration is true and contextIsolation is false');
} else {
  console.log('✅ ipcRenderer successfully initialized');
  console.log('🔧 Available methods:', Object.keys(ipcRenderer));
  console.log('🌍 Running in Electron:', navigator.userAgent.includes('Electron'));
}

// Export the ipcRenderer instance
export { ipcRenderer };

// Helper function to safely invoke IPC calls
export const safeIpcInvoke = async (channel: string, ...args: any[]): Promise<any> => {
  console.log(`🔄 Invoking IPC channel: "${channel}"`, args.length > 0 ? 'with args:' : '', args);

  if (!ipcRenderer) {
    throw new Error('ipcRenderer is not available');
  }

  if (!ipcRenderer.invoke) {
    throw new Error('ipcRenderer.invoke is not available');
  }

  try {
    const result = await ipcRenderer.invoke(channel, ...args);
    console.log(`✅ IPC channel "${channel}" responded:`, result);
    return result;
  } catch (error) {
    console.error(`❌ IPC invoke failed for channel "${channel}":`, error);
    throw error;
  }
};

// Helper function to open DevTools manually
export const openDevTools = (): void => {
  if (ipcRenderer) {
    try {
      // Try to open DevTools via IPC
      ipcRenderer.invoke('open-devtools').catch(() => {
        console.log('💡 To see console logs, press F12 or Ctrl+Shift+I');
      });
    } catch (error) {
      console.log('💡 To see console logs, press F12 or Ctrl+Shift+I');
    }
  }
};

// Helper function to safely send IPC messages
export const safeIpcSend = (channel: string, ...args: any[]): void => {
  if (!ipcRenderer) {
    console.error('ipcRenderer is not available');
    return;
  }
  
  if (!ipcRenderer.send) {
    console.error('ipcRenderer.send is not available');
    return;
  }
  
  try {
    ipcRenderer.send(channel, ...args);
  } catch (error) {
    console.error(`IPC send failed for channel "${channel}":`, error);
  }
};

// Helper function to safely listen to IPC events
export const safeIpcOn = (channel: string, listener: (...args: any[]) => void): void => {
  if (!ipcRenderer) {
    console.error('ipcRenderer is not available');
    return;
  }
  
  if (!ipcRenderer.on) {
    console.error('ipcRenderer.on is not available');
    return;
  }
  
  try {
    ipcRenderer.on(channel, listener);
  } catch (error) {
    console.error(`IPC on failed for channel "${channel}":`, error);
  }
};

// Helper function to safely remove IPC listeners
export const safeIpcRemoveListener = (channel: string, listener: (...args: any[]) => void): void => {
  if (!ipcRenderer) {
    console.error('ipcRenderer is not available');
    return;
  }
  
  if (!ipcRenderer.removeListener) {
    console.error('ipcRenderer.removeListener is not available');
    return;
  }
  
  try {
    ipcRenderer.removeListener(channel, listener);
  } catch (error) {
    console.error(`IPC removeListener failed for channel "${channel}":`, error);
  }
};

// Create the electronAPI object for the window
const electronAPI = {
  testDbConnection: () => safeIpcInvoke('test-db-connection'),
  getTables: () => safeIpcInvoke('get-tables'),
  executeQuery: (query: string, params?: any[]) => safeIpcInvoke('execute-query', query, params),
  fetchData: () => safeIpcInvoke('fetch-data'),
  login: (username: string, password: string) => safeIpcInvoke('login', username, password),
  getUserProfile: (userId: number) => safeIpcInvoke('get-user-profile', userId),
  checkAccountStatus: (username: string) => safeIpcInvoke('check-account-status', username),
  unlockAccount: (username: string) => safeIpcInvoke('unlock-account', username),
  getUserLoginHistory: (username: string, limit?: number) => safeIpcInvoke('get-user-login-history', username, limit),
  getAllLoginHistory: (limit?: number, offset?: number) => safeIpcInvoke('get-all-login-history', limit, offset),
  getLoginStatistics: (days?: number) => safeIpcInvoke('get-login-statistics', days)
};

// Expose electronAPI to the global window object
if (typeof window !== 'undefined') {
  (window as any).electronAPI = electronAPI;
}
