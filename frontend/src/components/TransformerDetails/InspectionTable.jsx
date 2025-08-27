import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Trash2, Eye } from 'lucide-react'
import axios from 'axios'

const InspectionTable = ({inspections, onInspectionDeleted}) => {

    const navigate = useNavigate();
    const [deletingId, setDeletingId] = useState(null);

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending":
                return "border-red-400 bg-red-300 text-red-800 ";
            case "In progress":
                return "border-blue-400 bg-blue-300 text-blue-800";
            case "Completed":
                return "border-green-400 bg-green-300 text-green-800";
            default:
                return "border-gray-400 bg-gray-300 text-gray-800";
        }
    };

    const handleDeleteInspection = async (inspectionNo) => {
        if (!window.confirm(`Are you sure you want to delete inspection ${inspectionNo}? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(inspectionNo);
        
        try {
            await axios.delete(`http://localhost:8080/api/inspections/${inspectionNo}`);
            
            if (onInspectionDeleted) {
                onInspectionDeleted(inspectionNo);
            }
        } catch (error) {
            console.error('Error deleting inspection:', error);
            alert('Failed to delete inspection. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mx-5 mt-10">
            <div className="grid grid-cols-5 gap-y-2 p-4 bg-gray-100 rounded-md mb-4">
                <div className="font-semibold">Inspection No</div>
                <div className="font-semibold">Inspection Date</div>
                <div className="font-semibold">Maintain Date</div>
                <div className="font-semibold">Status</div>
                <div className="font-semibold">Actions</div>
            </div>

            {inspections && inspections.length > 0 ? (
                inspections.map((inspection) => (
                    <div key={inspection.inspectionNo} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-5 gap-y-2 p-4 hover:shadow-lg transition duration-200">
                        <div className="text-xs">{inspection.inspectionNo}</div>
                        <div className="text-xs">{inspection.dateOfInspectionAndTime}</div>
                        <div className="text-xs">{inspection.maintainDate}</div>
                        <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(inspection.status)}`}>{inspection.status}</div>
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => navigate(`/inspections/${inspection.inspectionNo}`)} 
                                className="flex items-center text-sm px-3 py-1 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
                                title="View Details"
                            >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                            </button>
                            <button 
                                onClick={() => handleDeleteInspection(inspection.inspectionNo)}
                                disabled={deletingId === inspection.inspectionNo}
                                className={`flex items-center text-sm px-3 py-1 rounded-lg shadow transition-colors ${
                                    deletingId === inspection.inspectionNo 
                                        ? 'bg-gray-400 text-white cursor-not-allowed'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                }`}
                                title="Delete Inspection"
                            >
                                <Trash2 className="w-3 h-3 mr-1" />
                                {deletingId === inspection.inspectionNo ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-white shadow rounded-md border border-gray-200 p-8 text-center">
                    <p className="text-gray-500 text-sm">No inspections found for this transformer.</p>
                </div>
            )}
        </div>
    )
}

export default InspectionTable
