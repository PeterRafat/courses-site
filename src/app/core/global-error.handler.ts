import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ErrorHandlerService } from './error-handler.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    try {
      const errorHandler = this.injector.get(ErrorHandlerService);
      errorHandler.showError(error);
    } catch {}
    console.error(error);
  }
}
