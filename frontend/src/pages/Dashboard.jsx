import React from 'react'
import { useState } from 'react';

const Dashboard = () => {

    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className='flex'>
            {/* sidebar */}
            <div className={`fixed top-0 left-0 h-full bg-gray-800 text-white p-4 transition-transform duration-300 ${ isOpen ? 'translate-x-0 w-64': '-translate-x-full w-64' }`}>
                <div className='flex items-center justify-between mb-6'>
                    <p className='text-xl'>Menu</p>
                    <button onClick={() => setIsOpen(false)} className='text-xl'>Close</button>
                </div>
                <ul className='space-y-4'>
                    <li>Dashboard</li>
                    <li>Transformers</li>
                    <li>Settings</li>
                </ul>
            </div>

            {/* Main content */}
            <div className='flex-1 p-6'>
                {!isOpen && (
                    <button onClick={() => setIsOpen(true)} className='p-2 text-xl bg-gray-200 rounded'>Open</button>
                )}

                <h1 className='text-2xl font-bold text-center mt-4'>Welcome to the Dashboard</h1>
            </div>
        </div>
    )
}

export default Dashboard;
