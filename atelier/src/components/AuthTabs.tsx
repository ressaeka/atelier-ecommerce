import React from 'react';

interface AuthTabsProps {
  activeTab: 'login' | 'register';
  onTabChange: (tab: 'login' | 'register') => void;
}

export const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2 my-5">
      <button
        type="button"
        onClick={() => onTabChange('login')}
        className={`py-3.5 px-4 text-xs font-bold tracking-[0.15em] uppercase transition-colors text-center cursor-pointer rounded-xs ${
          activeTab === 'login'
            ? 'bg-black text-white shadow-xs'
            : 'bg-[#EAE8E3] text-gray-900 hover:bg-[#E2DFD8]'
        }`}
      >
        MASUK
      </button>
      <button
        type="button"
        onClick={() => onTabChange('register')}
        className={`py-3.5 px-4 text-xs font-bold tracking-[0.15em] uppercase transition-colors text-center cursor-pointer rounded-xs ${
          activeTab === 'register'
            ? 'bg-black text-white shadow-xs'
            : 'bg-[#EAE8E3] text-gray-900 hover:bg-[#E2DFD8]'
        }`}
      >
        DAFTAR
      </button>
    </div>
  );
};

export default AuthTabs;
