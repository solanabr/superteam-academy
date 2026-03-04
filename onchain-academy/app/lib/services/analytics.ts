// lib/services/analytics.ts

/**
 * ANALYTICS SERVICE
 * 
 * Tracks user behavior and platform metrics
 * Integrates with Google Analytics and custom tracking
 */

import { AnalyticsEvent } from '@/lib/types/domain';

/**
 * Analytics event types
 */
export type EventType =
  | 'page_view'
  | 'lesson_started'
  | 'lesson_completed'
  | 'course_started'
  | 'course_completed'
  | 'code_executed'
  | 'achievement_unlocked'
  | 'credential_minted'
  | 'wallet_connected'
  | 'wallet_disconnected'
  | 'search'
  | 'share'
  | 'error';

/**
 * Interface for Analytics Service
 */
export interface IAnalyticsService {
  /** Track an event */
  track(event: EventType, properties?: Record<string, any>): void;
  
  /** Track page view */
  pageView(path: string, title?: string): void;
  
  /** Identify user */
  identify(userId: string, traits?: Record<string, any>): void;
  
  /** Track timing */
  timing(category: string, variable: string, value: number): void;
}

/**
 * Google Analytics Service
 * 
 * Integrates with Google Analytics 4
 */
export class GoogleAnalyticsService implements IAnalyticsService {
  private measurementId: string;
  private isEnabled: boolean;

  constructor() {
    this.measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
    this.isEnabled = typeof window !== 'undefined' && !!this.measurementId;
    
    if (this.isEnabled) {
      this.initializeGA();
    }
  }

  private initializeGA() {
    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', this.measurementId, {
      page_path: window.location.pathname,
      send_page_view: false, // We'll manually track page views
    });
  }

  track(event: EventType, properties?: Record<string, any>): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    try {
      window.gtag('event', event, {
        ...properties,
        timestamp: new Date().toISOString(),
      });
      
      console.log('📊 Analytics Event:', event, properties);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  pageView(path: string, title?: string): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    window.gtag('config', this.measurementId, {
      user_id: userId,
      user_properties: traits,
    });
  }

  timing(category: string, variable: string, value: number): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    window.gtag('event', 'timing_complete', {
      name: variable,
      value: value,
      event_category: category,
    });
  }
}

/**
 * Custom Analytics Service
 * 
 * For internal metrics and tracking
 */
export class CustomAnalyticsService implements IAnalyticsService {
  private events: AnalyticsEvent[] = [];
  private endpoint: string;

  constructor(endpoint?: string) {
    this.endpoint = endpoint || '/api/analytics';
  }

  track(event: EventType, properties?: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: properties || {},
      timestamp: new Date().toISOString(),
    };

    this.events.push(analyticsEvent);

    // Send to backend
    this.sendEvent(analyticsEvent);
  }

  pageView(path: string, title?: string): void {
    this.track('page_view', {
      path,
      title: title || document.title,
      referrer: document.referrer,
    });
  }

  identify(userId: string, traits?: Record<string, any>): void {
    // Store user ID for future events
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_user_id', userId);
    }

    this.track('identify' as any, {
      userId,
      ...traits,
    });
  }

  timing(category: string, variable: string, value: number): void {
    this.track('timing' as any, {
      category,
      variable,
      value,
    });
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Get stored user ID
      const userId = localStorage.getItem('analytics_user_id');
      
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          userId,
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events = [];
  }
}

/**
 * Composite Analytics Service
 * 
 * Sends events to multiple analytics providers
 */
export class CompositeAnalyticsService implements IAnalyticsService {
  private services: IAnalyticsService[];

  constructor(services: IAnalyticsService[]) {
    this.services = services;
  }

  track(event: EventType, properties?: Record<string, any>): void {
    this.services.forEach(service => service.track(event, properties));
  }

  pageView(path: string, title?: string): void {
    this.services.forEach(service => service.pageView(path, title));
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.services.forEach(service => service.identify(userId, traits));
  }

  timing(category: string, variable: string, value: number): void {
    this.services.forEach(service => service.timing(category, variable, value));
  }
}

/**
 * Analytics Hook
 * 
 * React hook for tracking events
 */
let analyticsInstance: IAnalyticsService | null = null;

export function initializeAnalytics(): IAnalyticsService {
  if (analyticsInstance) return analyticsInstance;

  const services: IAnalyticsService[] = [];

  // Add Google Analytics if configured
  if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    services.push(new GoogleAnalyticsService());
  }

  // Add custom analytics
  services.push(new CustomAnalyticsService());

  analyticsInstance = new CompositeAnalyticsService(services);
  
  return analyticsInstance;
}

export function getAnalytics(): IAnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = initializeAnalytics();
  }
  return analyticsInstance;
}

/**
 * Utility functions for common tracking
 */
export const analytics = {
  /** Track lesson started */
  lessonStarted(lessonId: string, courseId: string, lessonTitle: string) {
    getAnalytics().track('lesson_started', {
      lesson_id: lessonId,
      course_id: courseId,
      lesson_title: lessonTitle,
    });
  },

  /** Track lesson completed */
  lessonCompleted(
    lessonId: string,
    courseId: string,
    lessonTitle: string,
    timeSpent: number,
    xpEarned: number
  ) {
    getAnalytics().track('lesson_completed', {
      lesson_id: lessonId,
      course_id: courseId,
      lesson_title: lessonTitle,
      time_spent_seconds: timeSpent,
      xp_earned: xpEarned,
    });
  },

  /** Track code execution */
  codeExecuted(lessonId: string, language: string, success: boolean, executionTime: number) {
    getAnalytics().track('code_executed', {
      lesson_id: lessonId,
      language,
      success,
      execution_time_ms: executionTime,
    });
  },

  /** Track achievement unlocked */
  achievementUnlocked(achievementId: string, achievementTitle: string, xpEarned: number) {
    getAnalytics().track('achievement_unlocked', {
      achievement_id: achievementId,
      achievement_title: achievementTitle,
      xp_earned: xpEarned,
    });
  },

  /** Track wallet connection */
  walletConnected(walletType: string) {
    getAnalytics().track('wallet_connected', {
      wallet_type: walletType,
    });
  },

  /** Track search */
  search(query: string, resultsCount: number) {
    getAnalytics().track('search', {
      query,
      results_count: resultsCount,
    });
  },

  /** Track error */
  error(errorMessage: string, errorStack?: string, context?: Record<string, any>) {
    getAnalytics().track('error', {
      error_message: errorMessage,
      error_stack: errorStack,
      ...context,
    });
  },
};

// Type augmentation for window.gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
