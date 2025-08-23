import React from 'react'
import axios from 'axios'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { branches, transformerTypes } from '../../constants'
import { X } from 'lucide-react';


const AddTransformer = ({onClose}) => {

    const [formData, setFormData] = useState({
        region: "",
        transformerNo: "",
        poleNo: "",
        type: "",
        locationDetails: "",
        // baselineImage: "",
        // baselineImageUploadDateAndTime: "",
        // weather: ""
    })

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post("http://localhost:8080/api/transformers", formData,
                {headers: {"Content-Type": "application/json"},}
            );
            alert("Transformer added successfully!");

            setFormData({ region: "", transformerNo: "", poleNo: "", type: "", locationDetails: "" });
        }
        catch (error) {
            console.error("Error adding transformer:", error);
        }

    };

    return (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50'>
            <div className={`p-6 rounded-2xl shadow-xl max-w-lg w-full bg-white`}>
                <form onSubmit={handleSubmit}>
                    <div className='flex flex-row items-start justify-between mb-4'>
                    <h2 className='font-semibold text-lg mb-5'>Add Transformer</h2>
                    <X className='cursor-pointer' onClick={onClose}/>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerName" className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                        {/* <select id="transformerName" name="transformerName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1">
                            <option value="" disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm">Select region</option>
                            {branches.map((branch) => (
                                <option className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm" key={branch.value} value={branch.value}>{branch.label}</option>
                            ))}
                        </select> */}
                        <input type="text" id="region" name="transformerRegion" className="mt-1 block w-full border text-gray-700 border-gray-300 rounded-md shadow-sm p-1 text-sm" placeholder='Region' value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerType" className="block text-sm font-medium text-gray-700 mb-2">Transformer No</label>
                        <input type="text" id="transformerType" name="transformerType" className="mt-1 block w-full border text-gray-700 border-gray-300 rounded-md shadow-sm p-1 text-sm" placeholder='Transformer No' value={formData.transformerNo} onChange={(e) => setFormData({...formData, transformerNo: e.target.value})} required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerRegion" className="block text-sm font-medium text-gray-700 mb-2">Pole No</label>
                        <input type="text" id="transformerRegion" name="transformerRegion" className="mt-1 block w-full border text-gray-700 border-gray-300 rounded-md shadow-sm p-1 text-sm" placeholder='Pole No' value={formData.poleNo} onChange={(e) => setFormData({...formData, poleNo: e.target.value})} required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerRegion" className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        {/* <select id="transformerName" name="transformerName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1">
                            <option value="" disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm">Select type</option>
                            {transformerTypes.map((type) => (
                                <option className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm" key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select> */}
                        <input type="text" id="transformerType" name="transformerType" className="mt-1 block w-full border text-gray-700 border-gray-300 rounded-md shadow-sm p-1 text-sm" placeholder='Transformer No' value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerRegion" className="block text-sm font-medium text-gray-700 mb-2">Location Details</label>
                        <input type="text" id="transformerRegion" name="transformerRegion" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm" placeholder='Location Details' value={formData.locationDetails} onChange={(e) => setFormData({...formData, locationDetails: e.target.value})} required />
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

export default AddTransformer;
