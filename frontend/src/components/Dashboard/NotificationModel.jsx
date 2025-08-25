import React from 'react'
import { notifications } from '../../constants'

const NotificationModel = ( {notification, onClose}) => {
    if (!notification) return null;

    return (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50'>
            <div className={`p-6 rounded-2xl shadow-xl max-w-sm w-full ${notification.bgColor} ${notification.textColor}`}>
                <h3 className='font-bold mb-5 text-xl'>{notification.title}</h3>
                <p className='text-sm mb-5'>{notification.description}</p>
                <p className='text-xs mb-5'>{notification.description_long}</p>

                <button onClick={onClose} className='mt-4 px-4 py-1 bg-white text-black text-sm rounded-lg shadow'>Close</button>
            </div>
        </div>
    );
};

export default NotificationModel;