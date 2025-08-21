import React from 'react'
import Footer from '../components/Footer';
import Health from '../components/Dashboard/Health'
import Inspection from '../components/Dashboard/Inspection'
import Notification from '../components/Dashboard/Notification'
import Recent from '../components/Dashboard/Recent'
import Addition from '../components/Dashboard/Addition'

const Dashboard = () => {

    const [branch, setBranch] = React.useState("");

    return (
        <>
            <div className='flex flex-col min-h-screen'>
                <div className='items-center'>
                    <h1 className='text-center mt-10 text-5xl font-medium'>Transformer <span className='text-blue-500'>Management</span> System</h1>
                </div>
                <div className='m-10'>
                    <label htmlFor="branch-name" className='mr-8 text-md'>Branch</label>
                    <select name="branch-name" id="branch-name" value={branch} onChange={(e) => setBranch(e.target.value)} className='border border-none bg-yellow-50 p-2 rounded-lg w-60 text-center text-sm'>
                        <option value="" disabled>Select Branch</option>
                        <option value="nugegoda">Nugegoda</option>
                        <option value="kottawa">Kottawa</option>
                        <option value="moratuwa">Moratuwa</option>
                    </select>
                </div>
                <div className='flex flex-row m-10 justify-between items-start'>
                    <div className='text-center w-1/3 h-100% bg-yellow-50 mr-6'>
                        <Health />
                    </div>
                    <div className='text-center w-1/3 h-100% bg-yellow-50 mx-6'>
                        <Addition />
                    </div>
                    <div className='text-center w-1/3 h-100% bg-yellow-50 ml-6'>
                        <Inspection />
                    </div>
                </div>
                <div className='flex flex-row mt-2 ml-10 mr-10 items-start justify-between'>
                    <div className='text-center w-2/3 h-100% bg-yellow-50 mr-6'>
                        <Recent />
                    </div>
                    <div className='text-center w-1/3 h-100% bg-yellow-50 ml-6'>
                        <Notification />
                    </div>
                </div>
                
            </div>
            <Footer />
        </>
    )
}

export default Dashboard
