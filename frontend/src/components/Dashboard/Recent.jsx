import React from 'react'
import RecentTransformers from './RecentTransformers'

const Recent = () => {
  return (
    <div className='flex flex-col p-4 bg-white rounded-lg shadow-inner'>
        <h2 className='text-xl font-bold text-gray-800 m-5 text-left'>Recently Added Transformers</h2>
        <RecentTransformers />
    </div>
  )
}

export default Recent
