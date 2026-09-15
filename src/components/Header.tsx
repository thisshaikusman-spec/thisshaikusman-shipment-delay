import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab, UserProfile } from '../types';
import { User, ChevronDown, Settings, LogOut } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  isResultView?: boolean;
  profile: UserProfile;
  onNavigateToSettings: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  isResultView,
  profile,
  onNavigateToSettings,
  onSignOut,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  let screenTitle = 'Dashboard';
  if (isResultView) {
    screenTitle = 'Risk Evaluation';
  } else if (activeTab === 'predict') {
    screenTitle = 'Predict Risk';
  } else if (activeTab === 'shipments') {
    screenTitle = 'Live Shipments';
  } else if (activeTab === 'settings') {
    screenTitle = 'API & Config';
  }

  // Derive initials from profile name
  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SO';

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  const handleGoToProfile = () => {
    setDropdownOpen(false);
    onNavigateToSettings();
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-[#e2e8f0]/80 shadow-[0_1px_8px_rgba(0,0,0,0.03)] pt-safe">
      <div className="h-16 px-4 md:px-6 max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and App Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            alt="LogiPredict AI Logo"
            className="h-8 w-auto object-contain flex-shrink-0"
            src="https://lh3.googleusercontent.com/aida/AEtjO1XC4SV7U7jDhhs_Y1ZB9waQzURYhu_E50XdpUpQ_sCsLOyVlPENaNtvOHSDLR3GEcAmscmAPIXhqceu5e5TJSnSUR841kViYY7WdtOoSZDSsklyTA9T9wdoxukHmhjwzeICx4B9xDFMvMDbE6XdxPVnDfeJhBca5XKeRAbgB_t_4ZgbOvFyPXHdZ49mFJKjMFN3KipVLgadLGEzJkS6ZjxZ12UfAGRs1qRUdmnlh81NnbmnvfPvW4_CNrI"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-bold text-[15px] text-[#0b1c30] tracking-tight truncate">
                LogiPredict AI
              </span>
              <span className="px-1.5 py-0.5 bg-[#d3e4fe] text-[#374559] font-medium text-[10px] tracking-wider uppercase rounded">
                OPS DISPATCH
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-[#64748b] font-medium tracking-tight truncate">
                Model v4.2 • Active
              </span>
            </div>
          </div>
        </div>

        {/* Screen Status and Profile Avatar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Screen label + dynamic region from profile */}
          <div className="text-right hidden sm:block">
            <span className="block text-[12px] text-[#0b1c30] font-semibold">
              {screenTitle}
            </span>
            <span className="block text-[10px] text-[#64748b] truncate max-w-[120px]">
              {profile.name} · {profile.region}
            </span>
          </div>

          {/* Clickable Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="profile-avatar-btn"
              type="button"
              aria-label="Open profile menu"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 group cursor-pointer focus:outline-none"
            >
              <div className="relative">
                {/* Initials avatar */}
                <div className="w-8 h-8 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#e2e8f0] group-hover:ring-[#1d4ed8] transition-all select-none">
                  {initials}
                </div>
                {/* Online dot */}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"></span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#64748b] transition-transform duration-200 hidden sm:block ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-[#e2e8f0] shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
              >
                {/* Profile summary at top */}
                <div className="px-4 py-3 border-b border-[#f1f5f9]">
                  <p className="text-sm font-bold text-[#0b1c30] truncate">{profile.name}</p>
                  <p className="text-xs text-[#64748b] truncate">{profile.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#1d4ed8] text-[10px] font-semibold">
                      {profile.role}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#f0fdf4] text-emerald-700 text-[10px] font-semibold">
                      {profile.region}
                    </span>
                  </div>
                </div>

                {/* Menu actions */}
                <div className="py-1">
                  <button
                    id="profile-edit-btn"
                    type="button"
                    onClick={handleGoToProfile}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#374559] hover:bg-[#f8f9ff] transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-[#64748b]" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    id="profile-settings-btn"
                    type="button"
                    onClick={handleGoToProfile}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#374559] hover:bg-[#f8f9ff] transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-[#64748b]" />
                    <span>App Settings</span>
                  </button>
                </div>

                <div className="border-t border-[#f1f5f9] py-1">
                  <button
                    id="profile-signout-btn"
                    type="button"
                    onClick={() => { setDropdownOpen(false); onSignOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
