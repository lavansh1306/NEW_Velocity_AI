import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * Deduplicated page header pattern used across Dashboard, Projects, People, etc.
 * Provides consistent spacing and responsive layout for page titles with action buttons.
 */
export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <div className="flex items-center justify-between mb-10">
    <div>
      <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">{title}</h1>
      {subtitle && <p className="text-[#78716C] mt-2 font-light">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-3">{actions}</div>}
  </div>
);