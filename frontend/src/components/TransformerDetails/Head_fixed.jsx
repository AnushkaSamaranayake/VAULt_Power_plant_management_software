import React from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Image, Eye, Trash2 } from 'lucide-react'

const Head = ({ transformer }) => {

    const { id } = useParams();

    const [time, setTime] = useState(new Date());

    useEffect(() => {
            const interval = setInterval(() => {
                setTime(new Date());
            }, 60000);
    
            return () => clearInterval(interval);
            }, []);

    return (
        <div className='flex flex-col justify-between p-2'>
            <div className='flex flex-row justify-between items-center mb-3'>
                <div className='flex flex-col'>
                    <h1 className='text-2xl font-bold text-blue-900'>{transformer?.transformerNo || 'Loading...'}</h1>
                    <p className='text-sm text-gray-600'>{transformer?.locationDetails || 'Loading...'}</p>
                    <p className='text-xs text-gray-500'><span>Region: </span>{transformer?.region || 'Loading...'}</p>
                </div>
                <div className='flex flex-row items-center space-x-4'>
                    <p className='text-xs text-gray-500'><span>Last updated on: </span>{time.toLocaleTimeString()}</p>
                </div>
            </div>
            <div className='flex flex-row justify-between items-center'>
                <div className='grid grid-cols-4 gap-4'>
                    <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                        <h2 className='text-md font-semibold'>{transformer?.poleNo || '...'}</h2>
                        <p className='text-xs text-gray-700'>Pole No</p>
                    </div>
                    <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                        <h2 className='text-md font-semibold'>{transformer?.capacity || '...'}</h2>
                        <p className='text-xs text-gray-700'>Capacity</p>
                    </div>
                    <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                        <h2 className='text-md font-semibold'>{transformer?.type || '...'}</h2>
                        <p className='text-xs text-gray-700'>Type</p>
                    </div>
                    <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                        <h2 className='text-md font-semibold'>{transformer?.numberOfFeeders || '...'}</h2>
                        <p className='text-xs text-gray-700'>No. of Feeders</p>
                    </div>
                </div>
                <div className='grid grid-cols-1 w-100% h-10'>
                    <div className='border rounded-xl py-2 px-4 flex flex-row justify-center items-center bg-indigo-200 shadow-md'>
                        <Image className="text-gray-700"/>
                        <p className='ml-2 text-xs text-gray-900 text-center'>Baseline Image</p>
                        <Eye className='mx-2 text-gray-700 hover:text-gray-900 cursor-pointer' />
                        <Trash2 className='text-red-500 hover:text-gray-700 cursor-pointer' />
                    </div>
                </div>
            </div> 
        </div>
    );
};

export default Head;
