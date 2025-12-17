// EXAMPLE: How to use Toast Notifications in Your Pages

// ============================================
// EXAMPLE 1: Using the useNotification Hook
// ============================================

import { useNotification } from '@/hooks/useNotification';

export function MyPage() {
  const notify = useNotification();

  const handleSubmit = async () => {
    try {
      // Your async operation
      await saveData();
      
      // Show success toast
      notify.success('Success!', 'Your data has been saved');
    } catch (error) {
      // Show error toast
      notify.error('Error', 'Failed to save data. Please try again.');
    }
  };

  const handleWarning = () => {
    notify.warning('Warning', 'This action cannot be undone');
  };

  const handleInfo = () => {
    notify.info('Info', 'This is an informational message');
  };

  return (
    <div>
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleInfo}>Show Info</button>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Using useToast Hook Directly
// ============================================

import { useToast } from '@/contexts/ToastContext';

export function DirectContextExample() {
  const { addToast } = useToast();

  return (
    <button
      onClick={() =>
        addToast({
          type: 'success',
          title: 'Custom Toast',
          description: 'This is a custom toast with specific options',
          duration: 6000, // 6 seconds
        })
      }
    >
      Show Custom Toast
    </button>
  );
}

// ============================================
// EXAMPLE 3: In useEffect (Load Data)
// ============================================

import { useEffect } from 'react';
import { useNotification } from '@/hooks/useNotification';

export function DataLoadPage() {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        notify.success('Data Loaded', `Fetched ${data.length} items`);
      } catch (error) {
        notify.error('Load Failed', 'Could not fetch data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [notify]);

  return <div>{loading ? 'Loading...' : 'Data loaded'}</div>;
}

// ============================================
// EXAMPLE 4: Form Validation
// ============================================

import { useNotification } from '@/hooks/useNotification';

export function FormExample() {
  const notify = useNotification();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.email) {
      notify.error('Validation Error', 'Email is required');
      return;
    }
    if (form.password.length < 6) {
      notify.error('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    // Success
    notify.success('Form Valid', 'Proceeding with registration...');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="Email"
      />
      <input
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="Password"
      />
      <button type="submit">Register</button>
    </form>
  );
}

// ============================================
// REMOVE LAYOUT-SHIFTING BANNERS
// ============================================
// Before: Inline banner that shifts layout
// <div className="mb-6 bg-green-50">Success message</div>

// After: Toast notification that floats above
// notify.success('Title', 'Description');

// This prevents CLS (Cumulative Layout Shift) and improves UX!
