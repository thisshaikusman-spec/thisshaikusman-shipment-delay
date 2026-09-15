import React from 'react';
import { LayoutDashboard, Sparkles, Truck, SlidersHorizontal } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasActiveResult?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  hasActiveResult,
}) => {
  const tabs = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'predict' as ActiveTab,
      label: hasActiveResult ? 'Result/Predict' : 'Predict',
      icon: Sparkles,
    },
    {
      id: 'shipments' as ActiveTab,
      label: 'Shipments',
      icon: Truck,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: SlidersHorizontal,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#f8f9ff]/90 backdrop-blur-xl border-t border-[#e2e8f0] shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] py-1 transition-all rounded-lg ${
                isActive
                  ? 'text-[#1d4ed8] font-semibold'
                  : 'text-[#64748b] hover:text-[#0b1c30]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`p-1 rounded-md transition-colors ${isActive ? 'bg-[#dce9ff]/60' : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
              </div>
              <span className="text-[11px] tracking-tight mt-0.5 font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
