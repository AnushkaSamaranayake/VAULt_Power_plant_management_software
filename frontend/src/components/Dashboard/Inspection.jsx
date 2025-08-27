import React from 'react'
import { useNavigate } from 'react-router-dom'

const Inspection = () => {
  const navigate = useNavigate();

  const handleAddInspection = () => {
    navigate('/transformers');
  }

  return (
    <div className='flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md'>
        <h2 className='text-md font-bold text-gray-800 my-2'>New Inspection</h2>
        <p className='text-sm text-gray-400 my-2'>You can add a new inspection to any transformer from here.</p>
        <button className='mt-4 px-4 py-1 bg-blue-500 text-white rounded-lg text-sm' onClick={handleAddInspection}>Add Inspection</button>
    </div>
  )
}

export default Inspection
