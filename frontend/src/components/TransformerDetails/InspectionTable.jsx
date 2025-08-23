import React from 'react'
import { useNavigate } from 'react-router'
import { useState } from 'react'
// import inspections from '../../constants/inspections.json'
import { useParams } from 'react-router'


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

            {inspections.map((inspection) => (
                <div key={inspection.inspec_no} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-5 gap-y-2 p-4">
                    <div className="text-xs">{inspection.inspec_no}</div>
                    <div className="text-xs">{inspection.inspec_date}</div>
                    <div className="text-xs">{inspection.maintain_date}</div>
                    <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(inspection.status)}`}>{inspection.status}</div>
                    <div className="text-left">
                        <button onClick={() => navigate(`/inspections/${inspection.inspec_no}`)} className="text-sm px-4 py-1 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600">View</button>
                    </div>
                </div>
              ))}
        </div>
    )
}

export default InspectionTable
