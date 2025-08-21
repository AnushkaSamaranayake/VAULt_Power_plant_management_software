import React from 'react'
import { notifications } from '../../constants'

const Notification = () => {
  return (
    <div className='flex flex-col p-4 bg-white rounded-lg shadow-inner'>
        <h2 className='text-xl font-bold text-gray-800 m-5 text-left'>Notifications</h2>
        <div className='flex flex-col'>
            {notifications.length === 0 ? (
                <p className='text-md text-gray-500'>No new notifications</p>
            ) : (
                <div className='space-y-3'>
                    {notifications.map((notification) => (
                        <div key={notification.id} className={`p-4 bg-white shadow rounded-2xl border border-solid hover:shadow-lg transition duration-300 ${notification.bgColor} ${notification.borderColor} bg-opacity-60`}>
                            <h3 className={`font-semibold ${notification.textColor}`}>{notification.title}</h3>
                            <p className={`text-sm ${notification.textColor}`}>{notification.description}</p>
                            <span className={`text-xs ${notification.textColor}`}>{notification.time}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  )
}

export default Notification;
