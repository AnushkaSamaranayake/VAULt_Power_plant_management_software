import React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { branches, transformerTypes } from '../../constants'
import { X } from 'lucide-react';


const AddTransformer = ({onClose}) => {

    return (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50'>
            <div className={`p-6 rounded-2xl shadow-xl max-w-lg w-full bg-white`}>
                <form action="">
                    <div className='flex flex-row items-start justify-between mb-4'>
                    <h2 className='font-semibold text-lg mb-5'>Add Transformer</h2>
                    <X className='cursor-pointer' onClick={onClose}/>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerName" className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                        <select id="transformerName" name="transformerName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1">
                            <option value="" disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm">Select region</option>
                            {branches.map((branch) => (
                                <option className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm" key={branch.value} value={branch.value}>{branch.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerType" className="block text-sm font-medium text-gray-700 mb-2">Transformer No</label>
                        <input type="text" id="transformerType" name="transformerType" className="mt-1 block w-full border text-gray-700 border-gray-300 rounded-md shadow-sm p-1 text-sm" placeholder='Transformer No' required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerRegion" className="block text-sm font-medium text-gray-700 mb-2">Pole No</label>
                        <input type="text" id="transformerRegion" name="transformerRegion" className="mt-1 block w-full border text-gray-700 border-gray-300 rounded-md shadow-sm p-1 text-sm" placeholder='Pole No' required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerRegion" className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select id="transformerName" name="transformerName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1">
                            <option value="" disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm">Select type</option>
                            {transformerTypes.map((type) => (
                                <option className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm" key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerRegion" className="block text-sm font-medium text-gray-700 mb-2">Location Details</label>
                        <input type="text" id="transformerRegion" name="transformerRegion" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm" placeholder='Location Details' required />
                    </div>
                    <div className='flex flex-row items-start justify-between gap-4 mt-10'>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md mb-4 text-sm">Add Transformer</button>
                        <button type="submit" className="w-full text-gray-600 py-2 rounded-md text-sm" onClick={onClose}>Close</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddTransformer
