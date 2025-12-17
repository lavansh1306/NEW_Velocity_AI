# Toast Notification System

## Overview

A fixed, floating toast notification system that prevents layout shifts by displaying notifications in a fixed container at the top-right of the viewport.

## Architecture

### Files Created

1. **`src/contexts/ToastContext.tsx`** - Global toast state management
2. **`src/components/ToastContainer.tsx`** - Fixed position toast renderer
3. **`src/hooks/useNotification.ts`** - Convenient notification helper hook

### App Integration

Updated `src/App.tsx` to wrap the entire application with:
```tsx
<ToastProvider>
  {/* All routes */}
  <ToastContainer />
</ToastProvider>
```

## Usage

### Method 1: Direct Toast Context (React Hook)

```tsx
import { useToast } from '@/contexts/ToastContext';

export function MyComponent() {
  const { addToast } = useToast();

  const handleAction = () => {
    addToast({
      type: 'success',
      title: 'Operation Successful',
      description: 'Your changes have been saved',
      duration: 4000, // optional, defaults to auto-remove
    });
  };

  return <button onClick={handleAction}>Save</button>;
}
```

### Method 2: Convenience Hook (Recommended)

```tsx
import { useNotification } from '@/hooks/useNotification';

export function MyComponent() {
  const notify = useNotification();

  const handleAction = () => {
    notify.success('Saved!', 'Your changes have been saved');
  };

  return <button onClick={handleAction}>Save</button>;
}
```

## Toast Types & Methods

- **`notify.success(title, description?)`** - Green toast (4s duration)
- **`notify.error(title, description?)`** - Red toast (5s duration)
- **`notify.warning(title, description?)`** - Orange toast (4.5s duration)
- **`notify.info(title, description?)`** - Blue toast (4s duration)

## Features

✅ **Fixed positioning** - Never shifts page layout
✅ **Auto-dismiss** - Configurable duration per toast
✅ **Manual dismiss** - Close button always available
✅ **Multiple toasts** - Stack multiple notifications
✅ **Type safe** - Full TypeScript support
✅ **Accessible** - Semantic HTML with proper ARIA labels
✅ **Animations** - Smooth slide-in and fade effects
✅ **Responsive** - Works on mobile and desktop

## Example: Projects Page Integration

Before (Inline banner that shifts layout):
```tsx
<div className="mb-6 rounded-lg border bg-green-50">
  {/* Layout shifts down */}
</div>
```

After (Toast notification):
```tsx
const { success } = useNotification();

useEffect(() => {
  if (projectsLoaded) {
    success('CSV Connected', 'Loaded 4 projects');
  }
}, [projectsLoaded]);
```

## Styling

Toast colors are based on the `type` prop:

- **success**: Green (bg-green-50, text-green-900)
- **error**: Red (bg-red-50, text-red-900)
- **warning**: Orange (bg-orange-50, text-orange-900)
- **info**: Blue (bg-blue-50, text-blue-900)

## Position

Currently positioned at **top-right corner** with:
- 16px margin from top and right edges
- Fixed z-index: 50 (always above content)
- Max width: 448px (responsive on mobile)

To change position, edit `src/components/ToastContainer.tsx` class:
```tsx
// Change 'top-4 right-4' to 'top-4 left-4' for top-left
<div className="fixed top-4 right-4 z-50 ...">
```

## Removing Inline Banners

The Projects page has been refactored to use toasts instead of inline banners:

- ✅ Removed "CSV Data Source Connected" banner
- ✅ Removed "Jira Integration Disconnected" banner
- ✅ Removed "Analytics Connection Status" banner
- ✅ Added toast notifications for these events

This prevents layout shift and improves UX.
