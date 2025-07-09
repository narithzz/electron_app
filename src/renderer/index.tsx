import ReactDom from 'react-dom/client'
import React, { Suspense, useEffect, useState } from 'react'

import { Routes } from './routes'
import { ElectronLoader } from './components/LoadingSpinner'

import './electron.css'
import './utils/electron' // Initialize electron API

// Add console log to track loading
console.log('🚀 React app initializing...');

// Configuration for loading behavior
const LOADING_CONFIG = {
  // Set to 0 for production, or higher value for development to see loading screen
  minLoadingTime: process.env.NODE_ENV === 'development' ? 1000 : 0,
  showInitialLoader: true
};

// App wrapper with initial loading state
function App() {
  const [isInitializing, setIsInitializing] = useState(LOADING_CONFIG.showInitialLoader);

  useEffect(() => {
    if (!LOADING_CONFIG.showInitialLoader) {
      return;
    }

    // Simulate app initialization time or wait for actual initialization
    const timer = setTimeout(() => {
      console.log('✅ App initialization complete');
      setIsInitializing(false);
    }, LOADING_CONFIG.minLoadingTime);

    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) {
    return <ElectronLoader />;
  }

  return (
    <Suspense fallback={<ElectronLoader />}>
      <Routes />
    </Suspense>
  );
}

ReactDom.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
