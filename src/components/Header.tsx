import { useState, useRef, useEffect } from 'react';
import { Bars2Icon, Cog6ToothIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { LogOut } from 'lucide-react';
import { getCurrentUser } from '../data/mockData';
import { redirectToLoginIfNeeded } from '../utils/auth';
import { authUtils } from '../api';
import { useGenderFilter } from '../contexts/GenderFilterContext';

export default function Header() {
  const navigate = useNavigate();
  const { selectedGender, setSelectedGender } = useGenderFilter();
  const currentUser = getCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGenderFilter, setShowGenderFilter] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = authUtils.isAuthenticated();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutsideMenu = menuRef.current && !menuRef.current.contains(event.target as Node);
      const clickedOutsideMobileMenu = mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node);

      if (clickedOutsideMenu && clickedOutsideMobileMenu) {
        setIsMenuOpen(false);
        setShowGenderFilter(false);
      }
    };

    if (isMenuOpen || showGenderFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, showGenderFilter]);

  const handleCreatePost = () => {
    if (redirectToLoginIfNeeded(navigate)) return;
    navigate('/create-post');
  };

  const handleProfileClick = () => {
    setIsMenuOpen(false);
    navigate('/profile');
  };

  const handleFilterClick = () => {
    setShowGenderFilter(true);
  };

  const handleGenderSelect = (gender: 'male' | 'female' | null) => {
    setSelectedGender(gender);
    setShowGenderFilter(false);
    setIsMenuOpen(false);
  };

  const handleFeedback = () => {
    setIsMenuOpen(false);
    navigate('/feedback');
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    setLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setLogoutModalOpen(false);
    authUtils.logout();
    navigate('/login');
  };

  const handleBackToMenu = () => {
    setShowGenderFilter(false);
  };

  const dropdownClass = "absolute right-0 top-full mt-2 w-56 bg-[#1c1b1e]/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden z-[110]";
  const dropdownItemClass = "w-full px-4 py-3 text-left text-[#c4c4c8] hover:bg-white/5 hover:text-[#e0e0e3] transition-colors font-sans text-sm font-medium";
  const dividerClass = "h-px bg-white/5";

  const DropdownMenu = () => (
    <>
      {!showGenderFilter ? (
        <>
          <button
            onClick={handleFilterClick}
            className={`${dropdownItemClass} flex items-center justify-between`}
          >
            <span>性别筛选</span>
            <ChevronRightIcon className="h-4 w-4 text-[#6e6e73]" />
          </button>
          <button onClick={handleProfileClick} className={dropdownItemClass}>
            个人资料
          </button>

          <button onClick={handleFeedback} className={dropdownItemClass}>
            反馈
          </button>
          <div className={dividerClass} />
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors font-sans text-sm font-medium"
          >
            退出
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handleBackToMenu}
            className={`${dropdownItemClass} flex items-center gap-2`}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            返回
          </button>
          <div className={dividerClass} />
          <div className="px-4 py-3">
            <div className="text-xs text-[#6e6e73] mb-2 font-sans">性别筛选</div>
            <div className="space-y-1">
              {([null, 'male', 'female'] as const).map((g) => (
                <button
                  key={g ?? 'all'}
                  onClick={() => handleGenderSelect(g)}
                  className={`w-full px-3 py-2 text-left rounded-lg transition-colors font-sans text-sm ${selectedGender === g
                      ? 'bg-[#8ff5ff]/10 text-[#8ff5ff] font-medium'
                      : 'text-[#c4c4c8] hover:bg-white/5'
                    }`}
                >
                  {g === null ? '全部' : g === 'male' ? '男' : '女'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <header className="bg-[#0e0e0f]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-[100] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div
            className="flex items-center cursor-pointer gap-3 group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)' }}
            >
              <span className="text-[#0e0e0f] font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>搭</span>
            </div>
            <div className="hidden sm:block">
              <h1
                className="text-lg font-bold tracking-tight leading-none"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#8ff5ff', letterSpacing: '-0.02em' }}
              >
                轻搭
              </h1>
              <p className="text-xs font-normal mt-0.5" style={{ color: '#6e6e73' }}>发现志同道合的伙伴</p>
            </div>
          </div>

          {/* Navigation - Mobile */}
          <div className="flex items-center space-x-3 sm:hidden">
            {isAuthenticated ? (
              <>
                <button onClick={handleCreatePost}>
                  <PlusCircleIcon className="h-8 w-8 text-[#8ff5ff]" />
                </button>
                <div className="relative" ref={mobileMenuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2.5 hover:bg-white/5 rounded-full transition-all duration-300"
                  >
                    <Bars2Icon className={`h-6 w-6 transition-colors ${isMenuOpen || showGenderFilter ? 'text-[#8ff5ff]' : 'text-[#6e6e73]'}`} />
                  </button>
                  {(isMenuOpen || showGenderFilter) && (
                    <div className={dropdownClass}>
                      <DropdownMenu />
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="p-2.5 text-[#6e6e73] hover:bg-white/5 rounded-full transition-all duration-300"
                  >
                    <Cog6ToothIcon className="h-6 w-6" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-[#0e0e0f] font-semibold px-4 py-2 rounded-full text-sm transition-all duration-300 hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)' }}
              >
                登录
              </button>
            )}
          </div>

          {/* Navigation - Desktop */}
          <div className="hidden sm:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleCreatePost}
                  className="flex items-center space-x-2 group text-[#0e0e0f] font-semibold px-5 py-2 rounded-full text-sm transition-all duration-300 hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)' }}
                >
                  <PencilIcon className="h-4 w-4 group-hover:-rotate-12 transition-transform duration-300" />
                  <span>发布帖子</span>
                </button>

                <div className="h-5 w-px bg-white/10 mx-1" />

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2.5 hover:bg-white/5 rounded-full transition-all duration-300"
                  >
                    <Bars2Icon className={`h-6 w-6 transition-colors ${isMenuOpen || showGenderFilter ? 'text-[#8ff5ff]' : 'text-[#6e6e73]'}`} />
                  </button>
                  {(isMenuOpen || showGenderFilter) && (
                    <div className={dropdownClass}>
                      <DropdownMenu />
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="p-2.5 text-[#6e6e73] hover:text-[#e0e0e3] hover:bg-white/5 rounded-full transition-all duration-300"
                  >
                    <Cog6ToothIcon className="h-6 w-6" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-[#0e0e0f] font-semibold px-6 py-2.5 rounded-full text-sm transition-all duration-300 hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)' }}
              >
                登录
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Logout confirmation modal */}
      <Modal
        open={logoutModalOpen}
        onCancel={() => setLogoutModalOpen(false)}
        footer={null}
        centered
        width={340}
        closable={false}
        styles={{
          content: {
            backgroundColor: '#1c1b1e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1.5rem',
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
          },
          body: { padding: 0 },
          mask: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.65)' },
        }}
      >
        <div style={{ padding: '1.75rem' }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(255,59,48,0.15), rgba(255,59,48,0.06))',
              border: '1px solid rgba(255,59,48,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LogOut style={{ width: '1.125rem', height: '1.125rem', color: '#ff6b6b' }} strokeWidth={2} />
            </div>
            <div>
              <div style={{ color: '#e0e0e3', fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>退出登录</div>
              <div style={{ color: '#6e6e73', fontSize: '0.75rem', marginTop: '0.125rem' }}>确认后将退出当前账号</div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.875rem', cursor: 'pointer',
                backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#c4c4c8', fontWeight: 600, fontSize: '0.9375rem', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
            >
              取消
            </button>
            <button
              type="button"
              onClick={confirmLogout}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.875rem', cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(255,59,48,0.18), rgba(255,59,48,0.1))',
                border: '1px solid rgba(255,59,48,0.28)',
                color: '#ff6b6b', fontWeight: 600, fontSize: '0.9375rem', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              退出
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
