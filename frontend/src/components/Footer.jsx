import React from 'react'
import { useState, useEffect } from 'react';

const Footer = () => {

    const [time, setTime] = useState(new Date());
    
        useEffect(() => {
            const interval = setInterval(() => {
                setTime(new Date());
            }, 60000);
    
            return () => clearInterval(interval);
            }, []);

    return (
        <footer className='bottom-0 left-0 right-0 w-full bg-gray-800 text-white py-4'>
        <div className=' flex flex-col container mx-auto text-center'>
            <p className='text-md mb-4'>&copy; 2025 Transformer Management Systems. All rights reserved.</p>
            <p className='text-xs'>Last updated: {time.toLocaleTimeString()}</p>
        </div>
        </footer>
    )
}

export default Footer;
