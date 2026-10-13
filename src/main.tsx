import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('main.tsx: Script loaded');

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Keep the app running even if there's an error
  event.preventDefault();
});

// Add error handling
const rootElement = document.getElementById('root');
console.log('main.tsx: Root element found?', !!rootElement);

if (!rootElement) {
  console.error('main.tsx: Failed to find the root element');
  // Create a root element if one doesn't exist
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  console.log('main.tsx: Created a new root element');
}

const actualRoot = document.getElementById('root') || document.body;

console.log('main.tsx: Starting application render...');

// Create a fallback UI in case of errors
const createFallbackUI = () => {
  actualRoot.innerHTML = `
    <div style="padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh;">
      <h1 style="margin-bottom: 20px; font-size: 24px; font-weight: bold;">Hirica</h1>
      <p>There was a problem loading the application. Please check your browser console for details.</p>
    </div>
  `;
};

try {
  console.log('main.tsx: Creating React root...');
  const root = ReactDOM.createRoot(actualRoot);
  
  console.log('main.tsx: Rendering app...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('main.tsx: Application rendered successfully');
} catch (error) {
  console.error('main.tsx: Failed to render application:', error);
  createFallbackUI();
} 