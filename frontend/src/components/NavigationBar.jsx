import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Settings, Database, User, ChevronDown, LogOut } from 'lucide-react';

const NavigationBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showAccountMenu, setShowAccountMenu] = useState(false);

    const navItems = [
        {
            name: 'Dashboard',
            path: '/',
            icon: Home
        },
        {
            name: 'Transformers',
            path: '/transformers',
            icon: Database
        },
        {
            name: 'Settings',
            path: '/settings',
            icon: Settings
        }
    ];

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <nav 
            className="fixed top-0 left-0 right-0 bg-white shadow-md border-b border-gray-200 z-50"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                backgroundColor: 'white',
                display: 'block',
                visibility: 'visible'
            }}
        >
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Brand */}
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 flex items-center">
                            <img 
                                className="h-8 w-8" 
                                src="/src/assets/GridWatchLogo.png" 
                                alt="GridWatch Logo"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className="w-8 h-8 bg-blue-600 rounded-lg items-center justify-center text-white font-bold text-sm hidden">
                                GW
                            </div>
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                            GridWatch
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                        isActive(item.path)
                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Account Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowAccountMenu(!showAccountMenu)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                        >
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                                J
                            </div>
                            <span className="hidden md:block">Jane Doe</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* Account Dropdown */}
                        {showAccountMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">Jane Doe</p>
                                    <p className="text-xs text-gray-500">jonedoe@gridwatch.com</p>
                                </div>
                                <button
                                    onClick={() => {
                                        handleNavigation('/settings');
                                        setShowAccountMenu(false);
                                    }}
                                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <User className="w-4 h-4" />
                                    <span>Profile Settings</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAccountMenu(false);
                                        // Add logout functionality here
                                        console.log('Logout clicked');
                                    }}
                                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setShowAccountMenu(!showAccountMenu)}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {showAccountMenu && (
                    <div className="md:hidden border-t border-gray-200 py-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        handleNavigation(item.path);
                                        setShowAccountMenu(false);
                                    }}
                                    className={`flex items-center space-x-3 w-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                                        isActive(item.path)
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </button>
                            );
                        })}
                        <div className="border-t border-gray-200 mt-2 pt-2">
                            <div className="px-4 py-2">
                                <p className="text-sm font-medium text-gray-900">Admin User</p>
                                <p className="text-xs text-gray-500">admin@gridwatch.com</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAccountMenu(false);
                                    console.log('Logout clicked');
                                }}
                                className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Click outside to close dropdown */}
            {showAccountMenu && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowAccountMenu(false)}
                />
            )}
        </nav>
    );
};

export default NavigationBar;
