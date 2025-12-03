import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  constructor(private toastr: ToastrService) {}

  /**
   * Extract user-friendly error message from HTTP error
   */
  getErrorMessage(error: any): string {
    if (!error) return 'حدث خطأ غير متوقع';

    // Handle HttpErrorResponse
    if (error instanceof HttpErrorResponse) {
      // Backend error message
      if (error.error?.message) {
        return error.error.message;
      }

      // Backend errors array
      if (Array.isArray(error.error?.errors) && error.error.errors.length > 0) {
        return error.error.errors.join(', ');
      }

      // String error
      if (typeof error.error === 'string') {
        return error.error;
      }

      // Status code based messages
      switch (error.status) {
        case 0:
          // More detailed error message for network issues
          if (error.statusText === 'Unknown Error') {
            return 'لا يمكن الاتصال بالخادم. قد يكون السبب أحد ما يلي:\n- تحقق من اتصالك بالإنترنت\n- تحقق من إعدادات جدار الحماية\n- قد تكون هناك مشكلة في سياسة CORS\n- قد تكون هناك مشكلة في شهادة SSL';
          }
          return 'لا يمكن الاتصال بالخادم. تحقق من اتصالك بالإنترنت';
        case 400:
          return 'الطلب غير صحيح. تحقق من البيانات المدخلة';
        case 401:
          return 'غير مصرح لك. يرجى تسجيل الدخول';
        case 403:
          return 'ليس لديك صلاحية للوصول إلى هذا المورد';
        case 404:
          return 'المورد المطلوب غير موجود';
        case 409:
          return 'تعارض في البيانات. قد يكون المورد موجوداً بالفعل';
        case 422:
          return 'البيانات المدخلة غير صحيحة';
        case 429:
          return 'تم إرسال طلبات كثيرة. يرجى المحاولة لاحقاً';
        case 500:
          return 'خطأ في الخادم. يرجى المحاولة لاحقاً';
        case 502:
          return 'خطأ في الاتصال بالخادم';
        case 503:
          return 'الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً';
        case 504:
          return 'انتهت مهلة الاتصال. يرجى المحاولة لاحقاً';
        default:
          return error.message || 'حدث خطأ غير متوقع';
      }
    }

    // Handle string errors
    if (typeof error === 'string') {
      return error;
    }

    // Handle error objects with message
    if (error.message) {
      return error.message;
    }

    return 'حدث خطأ غير متوقع';
  }

  /**
   * Show error toast notification
   */
  showError(error: any, title: string = 'خطأ'): void {
    const message = this.getErrorMessage(error);
    this.toastr.error(message, title, {
      timeOut: 5000,
      enableHtml: true
    });
  }

  /**
   * Show warning toast notification
   */
  showWarning(message: string, title: string = 'تحذير'): void {
    this.toastr.warning(message, title, {
      timeOut: 4000
    });
  }

  /**
   * Show info toast notification
   */
  showInfo(message: string, title: string = 'معلومة'): void {
    this.toastr.info(message, title, {
      timeOut: 3000
    });
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504;
    }
    return false;
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 401 || error.status === 403;
    }
    return false;
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status >= 400 && error.status < 500;
    }
    return false;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status >= 500;
    }
    return false;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      // Retry on network errors and server errors (except 501, 505)
      return error.status === 0 || 
             error.status === 429 || 
             error.status === 500 || 
             error.status === 502 || 
             error.status === 503 || 
             error.status === 504;
    }
    return false;
  }
}

