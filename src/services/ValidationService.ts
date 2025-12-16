/**
 * Service for validating and sanitizing user inputs
 * Protects against XSS, injection attacks, and malicious data
 */

/**
 * Sanitizes a string by removing/escaping potentially dangerous characters
 * @param input The string to sanitize
 * @param maxLength Maximum allowed length
 * @returns Sanitized string
 */
export const sanitizeString = (input: string, maxLength: number = 500): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Limit length
  sanitized = sanitized.substring(0, maxLength);
  
  // Remove HTML tags to prevent XSS
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove script injection attempts
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized;
};

/**
 * Validates and sanitizes a URL
 * @param url The URL to validate
 * @returns Sanitized URL or null if invalid
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  // Trim whitespace
  const trimmed = url.trim();
  
  // Check if it's a valid URL format
  try {
    const urlObj = new URL(trimmed);
    
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }
    
    // Additional check: only allow trusted domains
    const allowedDomains = [
      'denovi.mk',
      'firebasestorage.googleapis.com',  // Firebase Storage
      'storage.googleapis.com',           // Google Cloud Storage
    ];
    const hostname = urlObj.hostname.toLowerCase();

    const isAllowed = allowedDomains.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isAllowed) {
      console.warn(`URL from untrusted domain blocked: ${hostname}`);
      return null;
    }
    
    return urlObj.toString();
  } catch (error) {
    // Invalid URL format
    return null;
  }
};

/**
 * Validates a time string (HH:MM format)
 * @param time The time string to validate
 * @returns Valid time string or default
 */
export const sanitizeTime = (time: string): string => {
  if (!time || typeof time !== 'string') return '09:00';
  
  // Match HH:MM format
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  
  if (timeRegex.test(time.trim())) {
    return time.trim();
  }
  
  return '09:00'; // Default fallback
};

/**
 * Validates a date
 * @param date The date to validate
 * @returns Valid date or current date
 */
export const sanitizeDate = (date: any): Date => {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  
  // Try to parse if it's a string
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Default to current date
  return new Date();
};

/**
 * Validates a service type
 * @param type The service type to validate
 * @returns Valid service type or default
 */
export const sanitizeServiceType = (type: string): 'LITURGY' | 'EVENING_SERVICE' | 'CHURCH_OPEN' | 'PICNIC' => {
  const validTypes = ['LITURGY', 'EVENING_SERVICE', 'CHURCH_OPEN', 'PICNIC'];
  
  if (validTypes.includes(type)) {
    return type as 'LITURGY' | 'EVENING_SERVICE' | 'CHURCH_OPEN' | 'PICNIC';
  }
  
  return 'LITURGY'; // Default
};

/**
 * Validates and sanitizes a complete church event
 * @param event The event to validate
 * @returns Sanitized and validated event
 */
export const sanitizeChurchEvent = (event: any): {
  name: string;
  date: Date;
  time: string;
  serviceType: 'LITURGY' | 'EVENING_SERVICE' | 'CHURCH_OPEN' | 'PICNIC';
  description?: string;
  imageUrl?: string;
  saintName?: string;
} => {
  return {
    name: sanitizeString(event.name, 200),
    date: sanitizeDate(event.date),
    time: sanitizeTime(event.time),
    serviceType: sanitizeServiceType(event.serviceType),
    description: event.description ? sanitizeString(event.description, 500) : undefined,
    imageUrl: event.imageUrl ? sanitizeUrl(event.imageUrl) || undefined : undefined,
    saintName: event.saintName ? sanitizeString(event.saintName, 200) : undefined,
  };
};

/**
 * Rate limiting helper - prevents spam/abuse
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  /**
   * Checks if an action is allowed based on rate limits
   * @param key Unique key for the action (e.g., 'add_event', 'edit_event')
   * @param maxAttempts Maximum attempts allowed
   * @param windowMs Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  isAllowed(key: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Filter out old attempts outside the time window
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false; // Rate limited
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  /**
   * Clears rate limit for a key
   */
  clear(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

