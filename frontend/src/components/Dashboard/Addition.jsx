import React from 'react'

const Addition = () => {
    return (
        <div className='flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md'>
            <h2 className='text-md font-bold text-gray-800 my-2'>New Transformer</h2>
            <p className='text-sm text-gray-400 my-2'>You can add a new transformer to the system from here.</p>
            <button className='mt-4 px-4 py-1 bg-blue-500 text-white rounded-lg text-sm'>Add transformer</button>
        </div>
    )
}

export default Addition
