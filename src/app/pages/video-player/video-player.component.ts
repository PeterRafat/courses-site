import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CoursesService } from '../../services/courses.service';
import { CourseVideo } from '../../models/entities';
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
export class VideoPlayerComponent {
  video?: CourseVideo;
  embedUrl: SafeResourceUrl | '' = '';
  blobUrl = '';
  errorMsg = '';
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private courses: CoursesService,
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private sanitizer: DomSanitizer
  ) {
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
        console.error('Error loading video:', err);
        this.errorMsg = this.errorHandler.getErrorMessage(err);
        this.errorHandler.showError(err, 'فشل تحميل الفيديو');
        this.isLoading = false;
      }
    });
  }

  onVideoError(event: Event) {
    console.error('Video loading error:', event);
    this.errorMsg = 'فشل تحميل الفيديو. تأكد من أن السيرفر يعمل والملف موجود.';
    this.isLoading = false;
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
        this.errorHandler.showError(err, 'فشل الحصول على رابط الفيديو');
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
}