import React from 'react'
import NavigationBar from '../components/NavigationBar'

const Settings = () => {
  return (
    <>
      <NavigationBar />
      <div className='flex flex-col mx-10 mt-20 min-h-screen'>
        <div className='flex flex-row justify-between items-center mb-10'>
          <h1 className='text-3xl font-bold text-blue-900'>Settings</h1>
        </div>
      </div>
    </>
  )
}

export default Settings