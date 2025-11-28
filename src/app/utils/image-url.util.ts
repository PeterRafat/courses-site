import { environment } from '../../environments/environment';

function getApiOrigin(): string {
  try {
    const u = new URL(environment.apiBaseUrl);
    return u.origin;
  } catch {
    const s = environment.apiBaseUrl;
    const idx = s.indexOf('/api');
    return idx >= 0 ? s.substring(0, idx) : s;
  }
}

/**
 * Formats a course image URL to ensure it's a complete, accessible URL
 * @param imageUrl - The image URL from the API (could be relative or absolute)
 * @returns A complete URL that can be used in img src
 */
export function formatCourseImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return ''; // Return empty string if no image
  }

  // If it's already an absolute URL (http:// or https://), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it starts with /, it's a relative path from the server root
  if (imageUrl.startsWith('/')) {
    const origin = getApiOrigin();
    return `${origin}${imageUrl}`;
  }

  // If it's a relative path without leading slash, assume it's from server root
  const origin = getApiOrigin();
  return `${origin}/${imageUrl}`;
}

/**
 * Formats a video URL to ensure it's a complete, accessible URL
 * @param videoUrl - The video URL from the API (could be relative or absolute)
 * @returns A complete URL that can be used in video src
 */
export function formatVideoUrl(videoUrl: string | null | undefined): string {
  if (!videoUrl || videoUrl.trim() === '') {
    return ''; // Return empty string if no video URL
  }

  // Normalize Windows backslashes to forward slashes
  let url = videoUrl.replace(/\\/g, '/');

  // If it's already an absolute URL (http:// or https://), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const origin = getApiOrigin();

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
}

