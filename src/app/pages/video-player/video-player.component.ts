import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CoursesService } from '../../services/courses.service';
import { AuthService } from '../../services/auth.service';
import { CourseVideo, User } from '../../models/entities';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ErrorHandlerService } from '../../core/error-handler.service';
import { environment } from '../../../environments/environment.js';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [NgIf],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnDestroy {
  video?: CourseVideo;
  embedUrl: SafeResourceUrl | '' = '';
  blobUrl = '';
  errorMsg = '';
  isLoading = true;

  currentUser?: User;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courses: CoursesService,
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {
    // Load current user first
    this.authService.me().subscribe(user => {
      this.currentUser = user;
      console.log('Current user loaded:', user);
      
      // Clear any previous error messages when component initializes
      this.errorMsg = '';
      this.isLoading = true;
      
      // Handle Chrome extension errors (runtime.lastError)
      // معالجة أخطاء إضافات المتصفح
      this.setupErrorHandling();
      
      const id = Number(this.route.snapshot.paramMap.get('id'));
      console.log('Loading video with ID:', id);
      
      this.courses.getVideo(id).subscribe({
        next: v => {
          this.video = v;
          console.log('Video data loaded:', v);
          
          // Check if it's a YouTube video (has embed URL)
          if (v.videoUrl && (v.videoUrl.includes('youtube.com') || v.videoUrl.includes('youtu.be'))) {
            this.handleYouTubeVideo(v.videoUrl);
          } else {
            // For local videos, try to load directly first
            this.handleLocalVideo(v.videoUrl);
          }
        },
        error: (err) => {
          // Check if it's a Chrome extension error and ignore it
          if (this.isChromeExtensionError(err)) {
            console.log('تم تجاهل خطأ إضافة المتصفح (Chrome extension error)');
            return;
          }
          
          console.error('Error loading video:', err);
          this.errorMsg = this.errorHandler.getErrorMessage(err);
          // Provide a more user-friendly message
          if (this.errorMsg.includes('فشل تحميل الفيديو')) {
            this.errorMsg = 'حدث خطأ أثناء تحميل معلومات الفيديو. قد يكون الفيديو غير متوفر حالياً.';
          }
          // Removed error alert - user doesn't want alerts
          this.isLoading = false;
        }
      });
    });
  }

  onVideoError(event: Event) {
    console.error('Video loading error:', event);
    
    // Check if it's a Chrome extension error and ignore it
    const errorTarget = event.target as any;
    if (errorTarget && this.isChromeExtensionError(errorTarget.error)) {
      // This is a Chrome extension error, ignore it
      console.log('تم تجاهل خطأ إضافة المتصفح (Chrome extension error)');
      return;
    }
    
    // Only show error message if we don't have a valid video URL
    if (!this.blobUrl) {
      this.errorMsg = 'فشل تحميل الفيديو. تأكد من أن السيرفر يعمل والملف موجود.';
    } else {
      // Video is actually working, clear any previous error messages
      this.errorMsg = '';
      // Show a success message instead
      console.log('Video is working correctly despite error event');
    }
    this.isLoading = false;
  }

  /**
   * Setup error handling for Chrome extension errors
   * إعداد معالجة أخطاء إضافات المتصفح
   */
  private setupErrorHandling(): void {
    // Override console.error to filter Chrome extension errors
    if ((window as any).__chromeExtensionErrorFiltered) {
      return; // Already filtered globally
    }
    
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const errorString = args.map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg?.message) return arg.message;
        if (arg?.toString) return arg.toString();
        return String(arg);
      }).join(' ').toLowerCase();
      
      // Check for all Chrome extension error patterns
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
        // تجاهل أخطاء إضافات المتصفح بصمت
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    // Also handle window.onerror
    const originalWindowError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      const errorString = String(message || '').toLowerCase();
      if (
        errorString.includes('runtime.lasterror') ||
        errorString.includes('unchecked runtime.lasterror') ||
        errorString.includes('could not establish connection') ||
        errorString.includes('receiving end does not exist') ||
        errorString.includes('message port closed')
      ) {
        return true; // Suppress error
      }
      if (originalWindowError) {
        return originalWindowError(message, source, lineno, colno, error);
      }
      return false;
    };
  }

  /**
   * Check if error is a Chrome extension runtime error
   * يتحقق من أن الخطأ هو خطأ من إضافة متصفح Chrome
   */
  private isChromeExtensionError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString() || '';
    const errorString = String(errorMessage).toLowerCase();
    
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

  private handleYouTubeVideo(videoUrl: string) {
    // Extract YouTube video ID
    let videoId = '';
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrl.match(youtubeRegex);
    if (match && match[1]) {
      videoId = match[1];
      this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
    } else {
      this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
    }
    this.isLoading = false;
  }

  private handleLocalVideo(videoUrl: string) {
    console.log('Handling local video with URL:', videoUrl);
    
    // If we have a valid video URL, try to use it directly
    if (videoUrl && videoUrl.trim() !== '') {
      // Format the URL properly
      const formattedUrl = this.formatVideoUrl(videoUrl);
      console.log('Formatted video URL:', formattedUrl);
      
      if (formattedUrl) {
        this.blobUrl = formattedUrl;
        this.isLoading = false;
        return;
      }
    }
    
    // If direct URL doesn't work, try signed URL approach
    const videoId = this.video?.videoId;
    if (videoId) {
      this.loadVideoFromSignedUrl(videoId);
    } else {
      this.errorMsg = 'لم يتم العثور على معرف الفيديو المطلوب لتحميله.';
      this.isLoading = false;
    }
  }

  private formatVideoUrl(videoUrl: string): string {
    if (!videoUrl || videoUrl.trim() === '') {
      return '';
    }

    // Normalize Windows backslashes to forward slashes
    let url = videoUrl.replace(/\\/g, '/');

    // If it's already an absolute URL (http:// or https://), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    try {
      // Try to construct a proper URL
      const origin = this.getVideoOrigin();
      
      // Handle Windows absolute path (e.g., G:/courses-site/LMS/LMS.API/wwwroot/videos/file.mp4)
      if (/^[a-zA-Z]:[\/]/.test(url)) {
        // Extract everything after wwwroot/
        const wwwrootIndex = url.indexOf('wwwroot/');
        if (wwwrootIndex !== -1) {
          const path = url.substring(wwwrootIndex + 'wwwroot/'.length);
          return `${origin}/${path}`;
        }
        // If no wwwroot found, extract filename and assume it's in videos folder
        const fileName = url.split('/').pop() || url.split('\\').pop();
        return `${origin}/videos/${fileName}`;
      }

      // Handle wwwroot relative path
      if (url.includes('wwwroot/')) {
        const path = url.substring(url.indexOf('wwwroot/') + 'wwwroot/'.length);
        return `${origin}/${path}`;
      }

      // If it starts with /, it's a relative path from the server root
      if (url.startsWith('/')) {
        return `${origin}${url}`;
      }
      
      // Handle direct "videos/..." (without leading slash)
      if (url.startsWith('videos/')) {
        return `${origin}/${url}`;
      }

      // Default: assume it's from server root
      return `${origin}/${url}`;
    } catch (error) {
      console.error('Error formatting video URL:', error);
      return '';
    }
  }

  private loadVideoFromSignedUrl(videoId: number) {
    this.courses.getSignedUrl(videoId).subscribe({
      next: (response) => {
        const signedUrl = response.signedUrl;
        
        if (!signedUrl) {
          this.errorMsg = 'No signed URL returned from server. Check if video file exists and backend is working.';
          this.isLoading = false;
          return;
        }
        
        // Update video info from signed URL response
        if (this.video) {
          if (response.videoTitle) {
            this.video.videoTitle = response.videoTitle;
          }
          if (response.videoId) {
            this.video.videoId = response.videoId;
          }
          if (response.duration !== undefined && response.duration > 0) {
            this.video.duration = response.duration;
          }
          if (response.courseId !== undefined) {
            this.video.courseId = response.courseId;
          }
        }
        
        // Construct URL with proper origin
        const fullUrl = signedUrl.startsWith('/') 
          ? `${this.getVideoOrigin()}${signedUrl}` 
          : `${this.getVideoOrigin()}/${signedUrl}`;
        
        console.log('Final video URL:', fullUrl);
        
        // Use signed URL directly since it has auth params in query string
        this.blobUrl = fullUrl;
        this.isLoading = false;
      },
      error: (err) => {
        // Check if it's a Chrome extension error and ignore it
        if (this.isChromeExtensionError(err)) {
          console.log('تم تجاهل خطأ إضافة المتصفح (Chrome extension error)');
          return;
        }
        
        console.error('Error getting signed URL:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });
        
        let errorMsg = 'فشل تحميل الفيديو - ';
        if (err.status === 0) {
          errorMsg += 'لا يمكن الاتصال بالسيرفر. تأكد من تشغيل السيرفر.';
        } else if (err.status === 401) {
          errorMsg += 'غير مصرح. الرجاء تسجيل الدخول مرة أخرى.';
        } else if (err.status === 404) {
          errorMsg += 'الفيديو غير موجود. قد يكون ملف الفيديو مفقودًا من السيرفر.';
        } else if (err.status === 500) {
          errorMsg += 'خطأ في السيرفر. تحقق مما إذا كان ملف الفيديو موجودًا على السيرفر.';
        } else {
          errorMsg += `خطأ: ${err.status} - ${err.statusText}`;
        }
        
        this.errorMsg = errorMsg;
        // Removed error alert - user doesn't want alerts
        this.isLoading = false;
      }
    });
  }

  private getApiOrigin(): string {
    try {
      const u = new URL(environment.apiBaseUrl);
      return u.origin;
    } catch {
      const s = environment.apiBaseUrl;
      const idx = s.indexOf('/api');
      return idx >= 0 ? s.substring(0, idx) : s;
    }
  }
  
  // Get video origin for constructing URLs
  private getVideoOrigin(): string {
    try {
      // Use videoBaseUrl if available, otherwise fall back to apiBaseUrl
      const baseUrl = environment.videoBaseUrl || environment.apiBaseUrl;
      const u = new URL(baseUrl);
      return u.origin;
    } catch {
      // Fallback to api origin if videoBaseUrl parsing fails
      return this.getApiOrigin();
    }
  }

  //  Mark video as watched when user navigates away from the video page
   
  ngOnDestroy() {
    // Mark video as watched when leaving the page
    if (this.video && this.video.videoId) {
      // Store watched video in localStorage
      const courseId = this.video.courseId;
      const userId = this.currentUser?.userId || 0;
      if (courseId) {
        try {
          const watchedVideosKey = `user_${userId}_course_${courseId}_watched_videos`;
          const watchedVideos = JSON.parse(localStorage.getItem(watchedVideosKey) || '[]');
          if (!watchedVideos.includes(this.video.videoId)) {
            watchedVideos.push(this.video.videoId);
            localStorage.setItem(watchedVideosKey, JSON.stringify(watchedVideos));
          }
        } catch (e) {
          console.error('Error saving watched video to localStorage:', e);
        }
      }
    }
  }
}