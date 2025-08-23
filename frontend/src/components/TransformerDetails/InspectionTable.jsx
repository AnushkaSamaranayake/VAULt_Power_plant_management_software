import React from 'react'
import { useNavigate } from 'react-router'
import { useState } from 'react'
import inspections from '../../constants/inspections.json'
import { useParams } from 'react-router'


const InspectionTable = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mx-5 mt-10">
            <div className="grid grid-cols-5 gap-y-2 p-4 bg-gray-100 rounded-md mb-4">
                <div className="font-semibold">Inspection No</div>
                <div className="font-semibold">Inspection Date </div>
                <div className="font-semibold">Region</div>
                <div className="font-semibold">Type</div>
                <div className="font-semibold">Actions</div>
            </div>

            {inspections.map((inspection) => (
                <div key={inspection.id} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-5 gap-y-2 p-4">
                    <div className="text-xs">{inspection.id}</div>
                    <div className="text-xs">{inspection.pole_no}</div>
                    <div className="text-xs">{inspection.region}</div>
                    <div className="text-xs">{inspection.type}</div>
                    <div className="text-left">
                        <button onClick={() => navigate(`/transformers/${inspection.id}`)} className="text-sm px-4 py-1 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600">View</button>
                    </div>
                </div>
              ))}
        </div>
    )
}

export default InspectionTable
