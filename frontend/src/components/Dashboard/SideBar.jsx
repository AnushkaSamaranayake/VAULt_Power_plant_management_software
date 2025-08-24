import React from 'react'
import { Link } from 'react-router-dom'

const SideBar = () => {
  return (
    <div className="h-screen w-64 bg-white shadow-lg fixed left-0 top-0">
      <div className="flex flex-col h-full">
        {/* Logo/Brand Section */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-900">VAULT</h1>
          <p className="text-xs text-gray-500">Power Plant Management</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/" 
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/transformers" 
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Transformers
              </Link>
            </li>
            <li>
              <Link 
                to="/settings" 
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t">
          <div className="text-xs text-gray-500">
            Version 1.0.0
          </div>
        </div>
      </div>
    </div>
  )
}

export default SideBar
