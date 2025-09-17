// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, BarChart3, Home, Trophy } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { ROUTES, APP_CONFIG } from '../utils/constants';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate(ROUTES.home);
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    { to: ROUTES.dashboard, label: 'Dashboard', icon: Home },
    { to: ROUTES.insights, label: 'Insights', icon: BarChart3 },
    { to: ROUTES.players, label: 'Players', icon: User },
    { to: ROUTES.fixtures, label: 'Fixtures', icon: Trophy },
  ];

  // Navigation items for non-authenticated users
  const publicNavItems = [
    { to: ROUTES.home, label: 'Home', icon: Home },
    { to: ROUTES.insights, label: 'Insights', icon: BarChart3 },
  ];

  const navItems = isAuthenticated() ? authenticatedNavItems : publicNavItems;

  return (
    <nav className="bg-fpl-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link 
              to={ROUTES.home} 
              className="flex items-center space-x-2 text-white hover:text-fpl-secondary transition-colors duration-200"
              onClick={closeMenu}
            >
              <BarChart3 className="h-8 w-8" />
              <span className="font-display font-bold text-xl hidden sm:block">
                {APP_CONFIG.name}
              </span>
              <span className="font-display font-bold text-lg sm:hidden">
                FPL Master
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-fpl-secondary bg-fpl-primary/50'
                      : 'text-white hover:text-fpl-secondary hover:bg-fpl-primary/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated() ? (
              <>
                <div className="flex items-center space-x-2 text-white">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {user?.displayName || user?.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to={ROUTES.login}
                  className="px-4 py-2 text-white hover:text-fpl-secondary transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.register}
                  className="px-4 py-2 bg-fpl-secondary text-fpl-primary rounded-md hover:bg-fpl-secondary/90 transition-colors duration-200 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-white hover:text-fpl-secondary transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-fpl-primary border-t border-fpl-secondary/20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMenu}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-fpl-secondary bg-fpl-primary/50'
                      : 'text-white hover:text-fpl-secondary hover:bg-fpl-primary/30'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Mobile user menu */}
            <div className="border-t border-fpl-secondary/20 pt-3 mt-3">
              {isAuthenticated() ? (
                <>
                  <div className="flex items-center space-x-2 px-3 py-2 text-white">
                    <User className="h-5 w-5" />
                    <span className="text-sm">
                      {user?.displayName || user?.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left text-white hover:text-red-300 transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    to={ROUTES.login}
                    onClick={closeMenu}
                    className="block px-3 py-2 text-white hover:text-fpl-secondary transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to={ROUTES.register}
                    onClick={closeMenu}
                    className="block px-3 py-2 bg-fpl-secondary text-fpl-primary rounded-md hover:bg-fpl-secondary/90 transition-colors duration-200 font-medium text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;