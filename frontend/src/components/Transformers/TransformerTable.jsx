import React from "react";
import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Eye } from 'lucide-react';
import axios from 'axios';

const TransformerTable = ({ activeTable, transformers, inspections, onTransformerDeleted, onInspectionDeleted }) => {
    const navigate = useNavigate();
    const [deletingTransformerId, setDeletingTransformerId] = useState(null);
    const [deletingInspectionId, setDeletingInspectionId] = useState(null);

    const getStatusColor = (state) => {
        switch (state) {
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

    const handleDeleteTransformer = async (transformerNo) => {
        if (!window.confirm(`Are you sure you want to delete transformer ${transformerNo}? This action cannot be undone and will also delete all associated inspections.`)) {
            return;
        }

        setDeletingTransformerId(transformerNo);
        
        try {
            await axios.delete(`http://localhost:8080/api/transformers/${transformerNo}`);
            
            if (onTransformerDeleted) {
                onTransformerDeleted(transformerNo);
            }
        } catch (error) {
            console.error('Error deleting transformer:', error);
            alert('Failed to delete transformer. Please try again.');
        } finally {
            setDeletingTransformerId(null);
        }
    };

    const handleDeleteInspection = async (inspectionNo) => {
        if (!window.confirm(`Are you sure you want to delete inspection ${inspectionNo}? This action cannot be undone.`)) {
            return;
        }

        setDeletingInspectionId(inspectionNo);
        
        try {
            await axios.delete(`http://localhost:8080/api/inspections/${inspectionNo}`);
            
            if (onInspectionDeleted) {
                onInspectionDeleted(inspectionNo);
            }
        } catch (error) {
            console.error('Error deleting inspection:', error);
            alert('Failed to delete inspection. Please try again.');
        } finally {
            setDeletingInspectionId(null);
        }
    };

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
                    {transformers && transformers.length > 0 ? (
                        transformers.map((transformer) => (
                            <div key={transformer.transformerNo} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-5 gap-y-2 p-4 hover:shadow-lg transition duration-200">
                                <div className="text-sm">{transformer.transformerNo}</div>
                                <div className="text-sm">{transformer.poleNo}</div>
                                <div className="text-sm">{transformer.region}</div>
                                <div className="text-sm">{transformer.type}</div>
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={() => navigate(`/transformers/${transformer.transformerNo}`)} 
                                        className="flex items-center text-sm px-3 py-1 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
                                        title="View Details"
                                    >
                                        <Eye className="w-3 h-3 mr-1" />
                                        View
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteTransformer(transformer.transformerNo)}
                                        disabled={deletingTransformerId === transformer.transformerNo}
                                        className={`flex items-center text-sm px-3 py-1 rounded-lg shadow transition-colors ${
                                            deletingTransformerId === transformer.transformerNo 
                                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                                : 'bg-red-500 text-white hover:bg-red-600'
                                        }`}
                                        title="Delete Transformer"
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        {deletingTransformerId === transformer.transformerNo ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white shadow rounded-md border border-gray-200 p-8 text-center">
                            <p className="text-gray-500 text-sm">No transformers found.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTable === "inspections" && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mx-5 mt-10">
                    <div className="grid grid-cols-6 gap-y-2 p-4 bg-gray-100 rounded-md mb-4">
                        <div className="font-semibold">Transformer No</div>
                        <div className="font-semibold">Inspection No</div>
                        <div className="font-semibold">Inspection Date</div>
                        <div className="font-semibold">Maintainance Date</div>
                        <div className="font-semibold">Status</div>
                        <div className="font-semibold">Actions</div>
                    </div>
                    {inspections && inspections.length > 0 ? (
                        inspections.map((inspection) => (
                            <div key={inspection.inspectionNo} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-6 gap-y-2 p-3 hover:shadow-lg transition duration-200">
                                <div className="text-xs">{inspection.transformerNo}</div>
                                <div className="text-xs">{inspection.inspectionNo}</div>
                                <div className="text-xs">{inspection.dateOfInspectionAndTime}</div>
                                <div className="text-xs">
                                    {inspection.maintenanceImageUploadDateAndTime ? 
                                        new Date(inspection.maintenanceImageUploadDateAndTime).toLocaleString() 
                                        : 'Not maintained yet'}
                                </div>
                                <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(inspection.state)}`}>{inspection.state}</div>
                                <div className="flex items-center space-x-1">
                                    <button 
                                        onClick={() => navigate(`/inspections/${inspection.inspectionNo}`)} 
                                        className="flex items-center text-xs px-2 py-1 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
                                        title="View Details"
                                    >
                                        <Eye className="w-3 h-3 mr-1" />
                                        View
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteInspection(inspection.inspectionNo)}
                                        disabled={deletingInspectionId === inspection.inspectionNo}
                                        className={`flex items-center text-xs px-2 py-1 rounded-lg shadow transition-colors ${
                                            deletingInspectionId === inspection.inspectionNo 
                                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                                : 'bg-red-500 text-white hover:bg-red-600'
                                        }`}
                                        title="Delete Inspection"
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        {deletingInspectionId === inspection.inspectionNo ? 'Del...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white shadow rounded-md border border-gray-200 p-8 text-center">
                            <p className="text-gray-500 text-sm">No inspections found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TransformerTable;
