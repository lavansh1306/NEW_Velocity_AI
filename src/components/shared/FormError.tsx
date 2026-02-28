import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  message?: string;
  show?: boolean;
}

export const FormError = ({ message, show = true }: FormErrorProps) => {
  if (!message || !show) return null;
  
  return (
    <div className="flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle className="h-3.5 w-3.5 text-[#BE123C] flex-shrink-0" />
      <span className="text-xs text-[#BE123C] font-light">{message}</span>
    </div>
  );
};

// Validation helpers
export const validators = {
  required: (value: string, fieldName: string) => 
    !value.trim() ? `${fieldName} is required` : '',
  
  email: (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
    return '';
  },
  
  password: (value: string, minLength = 8) => {
    if (!value) return 'Password is required';
    if (value.length < minLength) return `Password must be at least ${minLength} characters`;
    return '';
  },
  
  passwordMatch: (password: string, confirm: string) => {
    if (!confirm) return 'Please confirm your password';
    if (password !== confirm) return 'Passwords do not match';
    return '';
  },

  number: (value: string | number, fieldName: string, min?: number, max?: number) => {
    const num = typeof value === 'string' ? Number(value) : value;
    if (isNaN(num)) return `${fieldName} must be a number`;
    if (min !== undefined && num < min) return `${fieldName} must be at least ${min}`;
    if (max !== undefined && num > max) return `${fieldName} must be at most ${max}`;
    return '';
  },
};
