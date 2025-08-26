import React from 'react'
import { useState } from 'react'
import Footer from '../components/Footer'

const Settings = () => {
  return (
        <>
            <div className='flex flex-col m-10 min-h-screen'>
                <div className='flex flex-row justify-between items-center mb-10'>
                    <h1 className='text-3xl font-bold text-blue-900'>Settings</h1>
                </div>
            </div>
            <Footer />
        </>
  )
}

export default Settings
