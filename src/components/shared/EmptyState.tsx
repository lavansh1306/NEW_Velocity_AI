import React from 'react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="text-gray-300 mb-4">{icon}</div>}
    <h3 className="text-lg font-light text-gray-600 mb-2">{title}</h3>
    {description && <p className="text-sm text-gray-400 font-light mb-6 max-w-sm">{description}</p>}
    {action && (
      <Button onClick={action.onClick} className="bg-[#1C1917] hover:bg-[#292524] text-white font-light shadow-md">
        {action.label}
      </Button>
    )}
  </div>
);
