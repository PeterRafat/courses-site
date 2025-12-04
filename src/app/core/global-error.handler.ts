import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ErrorHandlerService } from './error-handler.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    // Filter out Chrome extension errors (runtime.lastError)
    // هذه أخطاء من إضافات المتصفح ولا تؤثر على التطبيق
    if (this.isChromeExtensionError(error)) {
      // Ignore Chrome extension errors silently
      return;
    }

    try {
      const errorHandler = this.injector.get(ErrorHandlerService);
      errorHandler.showError(error);
    } catch {}
    console.error(error);
  }

  /**
   * Check if error is a Chrome extension runtime error
   * يتحقق من أن الخطأ هو خطأ من إضافة متصفح Chrome
   */
  private isChromeExtensionError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString() || '';
    const errorString = String(errorMessage).toLowerCase();
    
    // Check for Chrome extension error patterns
    return (
      errorString.includes('runtime.lasterror') ||
      errorString.includes('unchecked runtime.lasterror') ||
      errorString.includes('could not establish connection') ||
      errorString.includes('receiving end does not exist') ||
      errorString.includes('extension context invalidated') ||
      errorString.includes('message port closed') ||
      errorString.includes('the message port closed before a response was received')
    );
  }
}
