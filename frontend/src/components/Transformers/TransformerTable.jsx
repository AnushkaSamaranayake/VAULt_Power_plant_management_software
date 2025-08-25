import React from "react";
import { useEffect,useState } from "react";
// import transformers from "../../constants/transformers.json";
// import inspections from "../../constants/inspections.json";
import { useNavigate } from "react-router-dom";

const TransformerTable = ({ activeTable, transformers, inspections }) => {

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

    const navigate = useNavigate();

    return (
        <div>
            {activeTable === "transformers" && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mx-5 mt-10">
                    <div className="grid grid-cols-5 gap-y-2 p-4 bg-gray-100 rounded-md mb-4">
                        <div className="font-semibold">Transformer No</div>
                        <div className="font-semibold">Pole No</div>
                        <div className="font-semibold">Region</div>
                        <div className="font-semibold">Type</div>
                        <div className="font-semibold">Actions</div>
                    </div>
                    {transformers.map((transformer) => (
                        <div key={transformer.transformerNo} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-5 gap-y-2 p-4 hover:scale-110 transition duration-700">
                            <div className="text-sm">{transformer.transformerNo}</div>
                            <div className="text-sm">{transformer.poleNo}</div>
                            <div className="text-sm">{transformer.region}</div>
                            <div className="text-sm">{transformer.type}</div>
                            <div className="text-left">
                                <button onClick={() => navigate(`/transformers/${transformer.transformerNo}`)} className="text-sm px-4 py-1 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600">View</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTable === "inspections" && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mx-5 mt-10">
                    <div className="grid grid-cols-6 gap-y-2 p-4 bg-gray-100 rounded-md mb-4">
                        <div className="font-semibold">Transformer No</div>
                        <div className="font-semibold">Inspection No</div>
                        <div className="font-semibold">Inspection Date</div>
                        <div className="font-semibold">Maintain Date</div>
                        <div className="font-semibold">Status</div>
                        <div className="font-semibold">Actions</div>
                    </div>
                    {inspections.map((inspection) => (
                        <div key={inspection.inspectionNo} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-6 gap-y-2 p-3 hover:scale-110 transition duration-200">
                            <div className="text-xs">{inspection.transformerNo}</div>
                            <div className="text-xs">{inspection.inspectionNo}</div>
                            <div className="text-xs">{inspection.dateOfInspectionAndTime}</div>
                            <div className="text-xs">{inspection.maintainDate}</div>
                            <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(inspection.status)}`}>{inspection.status}</div>
                            <div className="text-left">
                                <button onClick={() => navigate(`/inspections/${inspection.inspectionNo}`)} className="text-xs px-4 py-1 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600">View</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransformerTable;
