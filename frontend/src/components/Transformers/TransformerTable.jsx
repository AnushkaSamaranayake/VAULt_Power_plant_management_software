import React from "react";
import { useEffect,useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Eye, X, FileText } from 'lucide-react';
import axios from 'axios';

const TransformerTable = ({ activeTable, transformers, inspections, onTransformerDeleted, onInspectionDeleted }) => {
    const navigate = useNavigate();
    const [deletingTransformerId, setDeletingTransformerId] = useState(null);
    const [deletingInspectionId, setDeletingInspectionId] = useState(null);
    
    // Filter states for inspections
    const [selectedTransformer, setSelectedTransformer] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [transformerSearchTerm, setTransformerSearchTerm] = useState('');
    const [showTransformerDropdown, setShowTransformerDropdown] = useState(false);
    const [reportStatuses, setReportStatuses] = useState({});

    // Fetch report statuses for inspections
    useEffect(() => {
        const fetchReportStatuses = async () => {
            if (!inspections || inspections.length === 0) return;
            
            const statuses = {};
            await Promise.all(
                inspections.map(async (inspection) => {
                    try {
                        const response = await axios.get(
                            `http://localhost:8080/api/inspection-report-forms/${inspection.inspectionNo}/status`
                        );
                        statuses[inspection.inspectionNo] = response.data.isFinalized || false;
                    } catch (error) {
                        // If form doesn't exist or error, it's not finalized
                        statuses[inspection.inspectionNo] = false;
                    }
                })
            );
            setReportStatuses(statuses);
        };
        
        fetchReportStatuses();
    }, [inspections]);

    // Get unique transformer numbers from inspections
    const uniqueTransformers = useMemo(() => {
        if (!inspections || inspections.length === 0) return [];
        const transformerSet = new Set(inspections.map(i => i.transformerNo));
        return Array.from(transformerSet).sort();
    }, [inspections]);

    // Filter transformers based on search term
    const filteredTransformerOptions = useMemo(() => {
        if (!transformerSearchTerm) return uniqueTransformers;
        return uniqueTransformers.filter(t => 
            t.toLowerCase().includes(transformerSearchTerm.toLowerCase())
        );
    }, [uniqueTransformers, transformerSearchTerm]);

    // Filter inspections based on selected filters
    const filteredInspections = useMemo(() => {
        if (!inspections) return [];
        
        return inspections.filter(inspection => {
            // Filter by transformer
            if (selectedTransformer && inspection.transformerNo !== selectedTransformer) {
                return false;
            }
            
            // Filter by date (compare only date part, not time)
            if (selectedDate) {
                const inspectionDate = new Date(inspection.dateOfInspectionAndTime);
                const filterDate = new Date(selectedDate);
                
                // Compare only year, month, and day
                if (
                    inspectionDate.getFullYear() !== filterDate.getFullYear() ||
                    inspectionDate.getMonth() !== filterDate.getMonth() ||
                    inspectionDate.getDate() !== filterDate.getDate()
                ) {
                    return false;
                }
            }
            
            return true;
        });
    }, [inspections, selectedTransformer, selectedDate]);

    const handleTransformerSelect = (transformerNo) => {
        setSelectedTransformer(transformerNo);
        setTransformerSearchTerm(transformerNo);
        setShowTransformerDropdown(false);
    };

    const clearTransformerFilter = () => {
        setSelectedTransformer('');
        setTransformerSearchTerm('');
    };

    const clearDateFilter = () => {
        setSelectedDate('');
    };

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
                    {/* Filters Section */}
                    <div className="bg-white shadow rounded-md border border-gray-200 p-4 mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Transformer Filter */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Filter by Transformer
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={transformerSearchTerm}
                                        onChange={(e) => {
                                            setTransformerSearchTerm(e.target.value);
                                            setShowTransformerDropdown(true);
                                            if (!e.target.value) {
                                                setSelectedTransformer('');
                                            }
                                        }}
                                        onFocus={() => setShowTransformerDropdown(true)}
                                        placeholder="Search or select transformer..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {selectedTransformer && (
                                        <button
                                            onClick={clearTransformerFilter}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                
                                {/* Dropdown */}
                                {showTransformerDropdown && filteredTransformerOptions.length > 0 && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setShowTransformerDropdown(false)}
                                        />
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            {filteredTransformerOptions.map((transformerNo) => (
                                                <div
                                                    key={transformerNo}
                                                    onClick={() => handleTransformerSelect(transformerNo)}
                                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                                        selectedTransformer === transformerNo ? 'bg-blue-100' : ''
                                                    }`}
                                                >
                                                    {transformerNo}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Date Filter */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Filter by Date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {selectedDate && (
                                        <button
                                            onClick={clearDateFilter}
                                            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Active Filters Display */}
                        {(selectedTransformer || selectedDate) && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                                <span className="font-medium">Active filters:</span>
                                {selectedTransformer && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md flex items-center gap-1">
                                        Transformer: {selectedTransformer}
                                        <X 
                                            className="w-3 h-3 cursor-pointer hover:text-blue-900" 
                                            onClick={clearTransformerFilter}
                                        />
                                    </span>
                                )}
                                {selectedDate && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md flex items-center gap-1">
                                        Date: {new Date(selectedDate).toLocaleDateString()}
                                        <X 
                                            className="w-3 h-3 cursor-pointer hover:text-blue-900" 
                                            onClick={clearDateFilter}
                                        />
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-7 gap-y-2 p-4 bg-gray-100 rounded-md mb-4">
                        <div className="font-semibold">Transformer No</div>
                        <div className="font-semibold">Inspection No</div>
                        <div className="font-semibold">Inspection Date</div>
                        <div className="font-semibold">Maintainance Date</div>
                        <div className="font-semibold">Status</div>
                        <div className="font-semibold">Report</div>
                        <div className="font-semibold">Actions</div>
                    </div>
                    
                    {/* Table Rows */}
                    {filteredInspections && filteredInspections.length > 0 ? (
                        filteredInspections.map((inspection) => (
                            <div key={inspection.inspectionNo} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-7 gap-y-2 p-3 hover:shadow-lg transition duration-200">
                                <div className="text-xs">{inspection.transformerNo}</div>
                                <div className="text-xs">{inspection.inspectionNo}</div>
                                <div className="text-xs">{inspection.dateOfInspectionAndTime}</div>
                                <div className="text-xs">
                                    {inspection.maintenanceImageUploadDateAndTime ? 
                                        new Date(inspection.maintenanceImageUploadDateAndTime).toLocaleString() 
                                        : 'Not maintained yet'}
                                </div>
                                <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(inspection.state)}`}>{inspection.state}</div>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => reportStatuses[inspection.inspectionNo] && navigate(`/inspection/${inspection.inspectionNo}/form`)}
                                        disabled={!reportStatuses[inspection.inspectionNo]}
                                        className={`flex items-center text-xs px-2 py-1 rounded-lg shadow transition-colors ${
                                            reportStatuses[inspection.inspectionNo]
                                                ? 'bg-orange-500 text-white hover:bg-orange-600 cursor-pointer'
                                                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        }`}
                                        title={reportStatuses[inspection.inspectionNo] ? 'View Report' : 'Report not ready'}
                                    >
                                        <FileText className="w-3 h-3 mr-1" />
                                        Report
                                    </button>
                                </div>
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
                            <p className="text-gray-500 text-sm">
                                {(selectedTransformer || selectedDate) 
                                    ? 'No inspections found matching the selected filters.' 
                                    : 'No inspections found.'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TransformerTable;
