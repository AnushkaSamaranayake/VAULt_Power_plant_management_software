import React from "react";
import { useEffect,useState } from "react";
import transformers from "../../constants/transformers.json";
import inspections from "../../constants/inspections.json";
import { useNavigate } from "react-router-dom";

const TransformerTable = ({ activeTable }) => {

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

    // const [transformers, setTransformers] = useState([]);
    // const [inspections, setInspections] = useState([]);

    // useEffect(() => {
    //     // Fetch Table 1 data
    //     fetch("http://localhost:5000/api/transformers")
    //         .then((res) => res.json())
    //         .then((data) => setTransformers(data))
    //         .catch((err) => console.error("Error fetching table transformers:", err));

    //     // Fetch Table 2 data
    //     fetch("http://localhost:5000/api/inspections")
    //         .then((res) => res.json())
    //         .then((data) => setInspections(data))
    //         .catch((err) => console.error("Error fetching table inspections:", err));
    // }, []);

    // Get unique transformer IDs
    const uniqueTransformerIds = [...new Set(transformers.map(t => t.id))];

    return (
        <div>
            {activeTable === "transformers" && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mx-5 mt-10">
                    {/* Filter Block */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                        <div className="flex space-x-4 items-center">
                            <div className="w-64">
                                <select 
                                    className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    defaultValue=""
                                >
                                    <option value="" disabled>By Transformer Number</option>
                                    {uniqueTransformerIds.map(id => (
                                        <option key={id} value={id}>{id}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 relative">
                                <div className="flex">
                                    <input
                                        type="text"
                                        placeholder="Search Transformer"
                                        className="w-full rounded-l-md border border-r-0 border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button className="px-3 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 border border-blue-500">
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className="h-5 w-5" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-5 gap-y-2 p-4 bg-gray-100 rounded-md mb-4">
                        <div className="font-semibold">Transformer No</div>
                        <div className="font-semibold">Pole No</div>
                        <div className="font-semibold">Region</div>
                        <div className="font-semibold">Type</div>
                        <div className="font-semibold">Actions</div>
                    </div>
                    {transformers.map((transformer) => (
                        <div key={transformer.id} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-5 gap-y-2 p-4">
                            <div className="text-xs">{transformer.id}</div>
                            <div className="text-xs">{transformer.pole_no}</div>
                            <div className="text-xs">{transformer.region}</div>
                            <div className="text-xs">{transformer.type}</div>
                            <div className="text-left">
                                <button onClick={() => navigate(`/transformers/${transformer.id}`)} className="text-sm px-4 py-1 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600">View</button>
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
                        <div key={inspection.id} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-6 gap-y-2 p-3">
                            <div className="text-xs">{inspection.id}</div>
                            <div className="text-xs">{inspection.inspec_no}</div>
                            <div className="text-xs">{inspection.inspec_date}</div>
                            <div className="text-xs">{inspection.maintain_date}</div>
                            <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(inspection.status)}`}>{inspection.status}</div>
                            <div className="text-left">
                                <button onClick={() => navigate(`/transformers/${inspection.id}`)} className="text-xs px-4 py-1 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600">View</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransformerTable;
