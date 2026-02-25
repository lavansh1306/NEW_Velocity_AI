import React from 'react';
import { Header } from './Header';
import { VelocityAISidebar } from './VelocityAISidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex h-screen bg-[#F5F5F4]">
      {/* Sidebar */}
      <div className="hidden md:flex">
        <VelocityAISidebar>
          {children}
        </VelocityAISidebar>
      </div>
      
      {/* Mobile sidebar would render here */}
      <div className="md:hidden w-full">
        <VelocityAISidebar>
          {children}
        </VelocityAISidebar>
      </div>
    </div>
  );
};

export const LayoutWithHeader = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex flex-col h-screen bg-[#F5F5F4]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <VelocityAISidebar>
          {children}
        </VelocityAISidebar>
      </div>
    </div>
  );
};
