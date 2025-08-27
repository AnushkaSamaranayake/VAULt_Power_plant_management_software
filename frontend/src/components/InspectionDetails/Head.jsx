import React from 'react'
import { useState, useEffect } from 'react'
// import inspections from '../../constants/inspections.json'
import { useParams } from 'react-router-dom'
import { Image, Eye, Trash2 } from 'lucide-react'

const Head = ({ inspection }) => {

    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date());
        }, 60000);

        return () => clearInterval(interval);
        }, []);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return "border-red-400 bg-red-300 text-red-800 ";
            case "in progress":
                return "border-blue-400 bg-blue-300 text-blue-800";
            case "completed":
                return "border-green-400 bg-green-300 text-green-800";
            default:
                return "border-gray-400 bg-gray-300 text-gray-800";
        }
    };

    return (
            <div className='flex flex-col justify-between p-2'>
                <div className='flex flex-row justify-between items-center mb-6'>
                    <div className='flex flex-col items-start'>
                        <h1 className='text-xl font-semibold'>{inspection?.inspectionNo}</h1>
                        <p className='text-xs text-gray-500'><span>Transformer last inspected on: </span>{inspection?.dateOfInspectionAndTime}</p>
                    </div>
                    <div className='flex flex-row items-center space-x-4'>
                        <p className='text-xs text-gray-500'><span>Last updated on: </span>{time.toLocaleTimeString()}</p>
                        <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(inspection?.state)}`}>{inspection?.state}</div>
                    </div>
                </div>
                <div className='flex flex-row justify-between items-center'>
                    <div className='grid grid-cols-4 gap-4'>
                        <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                            <h2 className='text-md font-semibold'>{inspection?.transformerNo}</h2>
                            <p className='text-xs text-gray-700'>Transformer No</p>
                        </div>
                        <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                            <h2 className='text-md font-semibold'>{inspection?.poleNo}</h2>
                            <p className='text-xs text-gray-700'>Pole No</p>
                        </div>
                        <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                            <h2 className='text-md font-semibold'>{inspection?.branch}</h2>
                            <p className='text-xs text-gray-700'>Branch</p>
                        </div>
                        <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                            <h2 className='text-md font-semibold'>{inspection?.inspecBy}</h2>
                            <p className='text-xs text-gray-700'>Inspected By</p>
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
    )
}

export default Head;
