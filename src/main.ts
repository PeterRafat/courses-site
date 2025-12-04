import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

// Enable production mode for better performance
if (environment.production) {
  enableProdMode();
}

// Filter Chrome extension errors globally before Angular starts
// تصفية أخطاء إضافات Chrome على مستوى التطبيق قبل بدء Angular
(function filterChromeExtensionErrors() {
  // Prevent multiple initializations
  if ((window as any).__chromeExtensionErrorFiltered) {
    return;
  }
  (window as any).__chromeExtensionErrorFiltered = true;

  // Override console.error
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    const errorString = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg?.message) return arg.message;
      if (arg?.toString) return arg.toString();
      return String(arg);
    }).join(' ').toLowerCase();

    // Check for Chrome extension error patterns
    if (
      errorString.includes('runtime.lasterror') ||
      errorString.includes('unchecked runtime.lasterror') ||
      errorString.includes('could not establish connection') ||
      errorString.includes('receiving end does not exist') ||
      errorString.includes('extension context invalidated') ||
      errorString.includes('message port closed') ||
      errorString.includes('the message port closed before a response was received')
    ) {
      // Ignore Chrome extension errors silently
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Override window.onerror
  const originalWindowError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    const errorString = String(message || '').toLowerCase();
    if (
      errorString.includes('runtime.lasterror') ||
      errorString.includes('unchecked runtime.lasterror') ||
      errorString.includes('could not establish connection') ||
      errorString.includes('receiving end does not exist') ||
      errorString.includes('message port closed') ||
      errorString.includes('the message port closed before a response was received')
    ) {
      return true; // Suppress error
    }
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Also catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorString = String(event.reason || '').toLowerCase();
    if (
      errorString.includes('runtime.lasterror') ||
      errorString.includes('unchecked runtime.lasterror') ||
      errorString.includes('could not establish connection') ||
      errorString.includes('receiving end does not exist') ||
      errorString.includes('message port closed')
    ) {
      event.preventDefault(); // Suppress error
    }
  });
})();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    // Check if it's a Chrome extension error before logging
    const errorString = String(err?.message || err || '').toLowerCase();
    if (
      !errorString.includes('runtime.lasterror') &&
      !errorString.includes('unchecked runtime.lasterror') &&
      !errorString.includes('could not establish connection') &&
      !errorString.includes('receiving end does not exist') &&
      !errorString.includes('message port closed')
    ) {
      console.error(err);
    }
  });
