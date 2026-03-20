// Currency formatting
export function formatCurrency(amount: number | undefined | null, currency: string = 'INR', maximumFractionDigits: number = 0): string {
  if (amount == null || isNaN(amount)) {
    return `₹0`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(amount);
}

// Safe number formatting for direct toLocaleString usage
export function safeToLocaleString(value: number | undefined | null, locale: string = 'en-IN'): string {
  if (value == null || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString(locale);
}

// Safe toFixed for decimal formatting
export function safeToFixed(value: number | undefined | null, digits: number = 1): string {
  if (value == null || isNaN(value)) {
    return '0.0';
  }
  return value.toFixed(digits);
}

// Safe array handling
export function safeArray<T>(array: T[] | undefined | null): T[] {
  return Array.isArray(array) ? array : [];
}

// Percentage formatting
export function formatPercentage(value: number | undefined | null, maximumFractionDigits: number = 1): string {
  if (value == null || isNaN(value)) {
    return '0.0%';
  }
  return `${value.toFixed(maximumFractionDigits)}%`;
}

// Date formatting
export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'relative':
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
      return `${Math.floor(diffInDays / 365)} years ago`;
    default:
      return dateObj.toLocaleDateString();
  }
}

// Number formatting with abbreviations
export function formatNumber(value: number, abbreviate: boolean = false): string {
  if (value == null || isNaN(value)) {
    return '0';
  }
  if (!abbreviate) {
    return value.toLocaleString('en-IN');
  }

  if (value >= 10000000) {
    return `${safeToFixed(value / 10000000)}Cr`;
  }
  if (value >= 100000) {
    return `${safeToFixed(value / 100000)}L`;
  }
  if (value >= 1000) {
    return `${safeToFixed(value / 1000)}K`;
  }
  return value.toString();
}

// Transaction category colors
export const CATEGORY_COLORS: string[] = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(0, 84%, 60%)',
  'hsl(180, 60%, 45%)',
  'hsl(320, 70%, 50%)',
  'hsl(200, 80%, 50%)',
  'hsl(30, 90%, 55%)',
  'hsl(270, 75%, 60%)',
];

export function getCategoryColor(category: string, index?: number): string {
  // Generate consistent color based on category name
  if (index !== undefined) {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  }
  
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

// Risk level colors
export function getRiskLevelColor(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'low':
      return 'text-success bg-success/10 border-success/20';
    case 'medium':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'high':
      return 'text-destructive bg-destructive/10 border-destructive/20';
    default:
      return 'text-muted-foreground bg-muted/50 border-border';
  }
}

// Trend indicators
export function getTrendIndicator(trend: 'up' | 'down' | 'stable'): {
  icon: string;
  color: string;
  label: string;
} {
  switch (trend) {
    case 'up':
      return {
        icon: '↑',
        color: 'text-success',
        label: 'Increasing',
      };
    case 'down':
      return {
        icon: '↓',
        color: 'text-destructive',
        label: 'Decreasing',
      };
    case 'stable':
      return {
        icon: '→',
        color: 'text-muted-foreground',
        label: 'Stable',
      };
    default:
      return {
        icon: '→',
        color: 'text-muted-foreground',
        label: 'Unknown',
      };
  }
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Local storage utilities
export function storage<T>(key: string, defaultValue?: T): {
  get: () => T | null;
  set: (value: T) => void;
  remove: () => void;
} {
  return {
    get: () => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue || null;
      } catch {
        return defaultValue || null;
      }
    },
    set: (value: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },
    remove: () => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to remove from localStorage:', error);
      }
    },
  };
}
