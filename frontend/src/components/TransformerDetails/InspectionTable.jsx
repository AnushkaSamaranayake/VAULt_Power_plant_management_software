import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
// import inspections from '../../constants/inspections.json'
import { useParams } from 'react-router-dom'


const InspectionTable = ({inspections}) => {

    const navigate = useNavigate();

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mx-5 mt-10">
            <div className="grid grid-cols-5 gap-y-2 p-4 bg-gray-100 rounded-md mb-4">
                <div className="font-semibold">Inspection No</div>
                <div className="font-semibold">Inspection Date </div>
                <div className="font-semibold">Maintain Date</div>
                <div className="font-semibold">Status</div>
                <div className="font-semibold">Actions</div>
            </div>

            {inspections && inspections.length > 0 ? (
                inspections.map((inspection) => (
                    <div key={inspection.inspectionNo} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-5 gap-y-2 p-4 hover:scale-110 transition duration-700">
                        <div className="text-xs">{inspection.inspectionNo}</div>
                        <div className="text-xs">{inspection.dateOfInspectionAndTime}</div>
                        <div className="text-xs">{inspection.maintainDate}</div>
                        <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(inspection.status)}`}>{inspection.status}</div>
                        <div className="text-left">
                            <button onClick={() => navigate(`/inspections/${inspection.inspectionNo}`)} className="text-sm px-4 py-1 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600">View</button>
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
