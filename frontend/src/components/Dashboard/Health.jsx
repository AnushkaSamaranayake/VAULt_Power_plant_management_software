import React from 'react'
import Gauge from '../Dashboard/Gauge'

const Health = () => {
  return (
    <div className='flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md'>
        <h2 className='text-md font-bold text-gray-800 my-2'>Health Status</h2>
        <p className='text-sm text-gray-400 my-2'>All transformers are functioning within normal parameters.</p>
        <div className='my-4'>
          <Gauge />
        </div>
        <button className='mt-4 px-4 py-1 bg-blue-500 text-white rounded-lg text-sm'>View Details</button>
    </div>
  )
}

export default Health;
