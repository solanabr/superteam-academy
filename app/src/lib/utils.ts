import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

export function formatProgress(completed: number, total: number): string {
  const percentage = Math.round((completed / total) * 100);
  return `${percentage}% (${completed}/${total})`;
}

export function truncateAddress(address: string, start: number = 4, end: number = 4): string {
  if (address.length <= start + end) {
    return address;
  }
  
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | number): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getTimeAgo(date: Date | string | number): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  return formatDate(date);
}

export function calculateCourseProgress(completedLessons: number, totalLessons: number): number {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
}

export function getCourseStatusColor(status: 'not-enrolled' | 'enrolled' | 'completed'): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'enrolled':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'beginner':
      return 'bg-green-100 text-green-800';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800';
    case 'advanced':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function generateCertificateId(courseId: number, studentAddress: string): string {
  const timestamp = Date.now();
  const hash = btoa(`${courseId}-${studentAddress}-${timestamp}`).slice(0, 8);
  return `CERT-${courseId.toString().padStart(3, '0')}-${hash}`;
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    // Basic validation - Solana addresses are base58 encoded and typically 32-44 characters
    if (address.length < 32 || address.length > 44) return false;
    
    // Check if it contains only valid base58 characters
    const base58Regex = /^[A-HJ-NP-Za-km-z1-9]*$/;
    return base58Regex.test(address);
  } catch {
    return false;
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}