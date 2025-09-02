import React from 'react'
import { useState,useEffect } from 'react';
import axios from 'axios';
import { branches, transformerTypes } from '../../constants'
import { X } from 'lucide-react';

const AddInspector = ({onClose, onInspectionAdded}) => {

    const [formData, setFormData] = useState({
        branch: "",
        transformerNo: "",
        dateOfInspectionAndTime: "",
        state: "Pending"
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post("http://localhost:8080/api/inspections", formData,
                {headers: {"Content-Type": "application/json"},}
            );
            console.log("Inspection created:", response.data);
            // Log specifically to check the maintenance date field
            console.log("Maintenance Image Upload Date:", response.data.maintenanceImageUploadDateAndTime);
            alert("Inspection added successfully!");

            // Reset form
            setFormData({ branch: "", transformerNo: "", dateOfInspectionAndTime: "",});
            
            // Notify parent component to refresh the inspection list
            if (onInspectionAdded) {
                onInspectionAdded();
            }
            
            // Close the modal
            onClose();
        }
        catch (error) {
            console.error("Error adding inspection:", error);
            if (error.response) {
                // Server responded with error status
                alert(`Error: ${error.response.data || 'Failed to add inspection'}`);
            } else if (error.request) {
                // Request made but no response received
                alert("Error: No response from server. Please check if the backend is running.");
            } else {
                // Something else happened
                alert(`Error: ${error.message}`);
            }
        }
    };

    return (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50'>
            <div className={`p-6 rounded-2xl shadow-xl max-w-lg w-full bg-white`}>
                <form onSubmit={handleSubmit}>
                    <div className='flex flex-row items-start justify-between mb-4'>
                    <h2 className='font-semibold text-lg mb-5'>New Inspection</h2>
                    <X className='cursor-pointer' onClick={onClose}/>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerName" className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                        {/* <select id="transformerName" name="transformerName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1">
                            <option value="" disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm">Select branch</option>
                            {branches.map((branch) => (
                                <option className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm" key={branch.value} value={branch.value}>{branch.label}</option>
                            ))}
                        </select> */}
                        <input type="text" id="branch" name="branch" className="mt-1 block w-full border text-gray-700 border-gray-300 rounded-md shadow-sm p-1 text-sm" placeholder='Branch' value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})} required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerType" className="block text-sm font-medium text-gray-700 mb-2">Transformer No</label>
                        <input type="text" id="transformerNo" name="transformerNo" className="mt-1 block w-full border text-gray-700 border-gray-300 rounded-md shadow-sm p-1 text-sm" placeholder='Transformer No' value={formData.transformerNo} onChange={(e) => setFormData({...formData, transformerNo: e.target.value})} required />
                    </div>
                    <div className='flex flex-row items-start justify-start gap-10'>
                    <div className="mb-4">
                        <label htmlFor="inspecDate" className="block text-sm font-medium text-gray-700 mb-2">Date of Inspection</label>
                        <input type="datetime-local" id="inspecDateAndTime" name="inspecDateAndTime" className="mt-1 block w-full border text-gray-700 border-gray-300 rounded-md shadow-sm p-1 text-sm" placeholder='Pole No' required value={formData.dateOfInspectionAndTime} onChange={(e) => setFormData({...formData, dateOfInspectionAndTime: e.target.value})} />
                    </div>
                    {/* <div className="mb-4">
                        <label htmlFor="inspecTime" className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                        <input type="time" id="inspecTime" name="inspecTime" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-gray-700 text-sm" placeholder='Location Details' required />
                    </div> */}
                    </div>
                    <div className='flex flex-row items-start justify-between gap-4 mt-5'>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md mb-4 text-sm">Add Inspection</button>
                        <button type="submit" className="w-full text-gray-600 py-2 rounded-md text-sm" onClick={onClose}>Close</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddInspector
