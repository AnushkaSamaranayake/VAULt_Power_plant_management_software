import React from "react";
import { useEffect,useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Eye, FileText } from 'lucide-react';
import axios from 'axios';
import Toast from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';

const TransformerTable = ({ activeTable, transformers, inspections, onTransformerDeleted, onInspectionDeleted }) => {
    const navigate = useNavigate();
    const [deletingTransformerId, setDeletingTransformerId] = useState(null);
    const [deletingInspectionId, setDeletingInspectionId] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    
    // Filter states for inspections
    const [filterTransformer, setFilterTransformer] = useState('');
    const [filterDate, setFilterDate] = useState('');
    
    // Track report status for each inspection
    const [reportStatuses, setReportStatuses] = useState({});

    // Get unique transformer numbers for the dropdown
    const uniqueTransformers = useMemo(() => {
        if (!inspections || inspections.length === 0) return [];
        const transformerSet = new Set(inspections.map(insp => insp.transformerNo));
        return Array.from(transformerSet).sort();
    }, [inspections]);

    // Filter inspections based on selected filters
    const filteredInspections = useMemo(() => {
        if (!inspections) return [];
        
        return inspections.filter(inspection => {
            // Filter by transformer
            const matchesTransformer = !filterTransformer || 
                inspection.transformerNo.toLowerCase().includes(filterTransformer.toLowerCase());
            
            // Filter by date (compare only date part, not time)
            let matchesDate = true;
            if (filterDate) {
                const inspectionDate = new Date(inspection.dateOfInspectionAndTime);
                const filterDateObj = new Date(filterDate);
                matchesDate = inspectionDate.toDateString() === filterDateObj.toDateString();
            }
            
            return matchesTransformer && matchesDate;
        });
    }, [inspections, filterTransformer, filterDate]);

    // Clear filters
    const clearFilters = () => {
        setFilterTransformer('');
        setFilterDate('');
    };

    // Fetch report status for all inspections
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
                        statuses[inspection.inspectionNo] = false;
                    }
                })
            );
            setReportStatuses(statuses);
        };
        
        if (activeTable === 'inspections') {
            fetchReportStatuses();
        }
    }, [inspections, activeTable]);

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
        setConfirmDialog({
            message: `Are you sure you want to delete transformer ${transformerNo}? This action cannot be undone and will also delete all associated inspections.`,
            onConfirm: async () => {
                setConfirmDialog(null);
                setDeletingTransformerId(transformerNo);
                
                try {
                    await axios.delete(`http://localhost:8080/api/transformers/${transformerNo}`);
                    
                    if (onTransformerDeleted) {
                        onTransformerDeleted(transformerNo);
                    }
                    
                    setToast({ message: 'Transformer deleted successfully!', type: 'success' });
                } catch (error) {
                    console.error('Error deleting transformer:', error);
                    setToast({ message: 'Failed to delete transformer. Please try again.', type: 'error' });
                } finally {
                    setDeletingTransformerId(null);
                }
            },
            onCancel: () => setConfirmDialog(null)
        });
    };

    const handleDeleteInspection = async (inspectionNo) => {
        setConfirmDialog({
            message: `Are you sure you want to delete inspection ${inspectionNo}? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmDialog(null);
                setDeletingInspectionId(inspectionNo);
                
                try {
                    await axios.delete(`http://localhost:8080/api/inspections/${inspectionNo}`);
                    
                    if (onInspectionDeleted) {
                        onInspectionDeleted(inspectionNo);
                    }
                    
                    setToast({ message: 'Inspection deleted successfully!', type: 'success' });
                } catch (error) {
                    console.error('Error deleting inspection:', error);
                    setToast({ message: 'Failed to delete inspection. Please try again.', type: 'error' });
                } finally {
                    setDeletingInspectionId(null);
                }
            },
            onCancel: () => setConfirmDialog(null)
        });
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
                    {/* Filter Section */}
                    <div className="bg-white shadow rounded-md border border-gray-200 p-4 mb-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <label htmlFor="filterTransformer" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                    Filter by Transformer No:
                                </label>
                                <input
                                    type="text"
                                    id="filterTransformer"
                                    list="transformerList"
                                    value={filterTransformer}
                                    onChange={(e) => setFilterTransformer(e.target.value)}
                                    placeholder="Select or type transformer..."
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                                />
                                <datalist id="transformerList">
                                    {uniqueTransformers.map(transformerNo => (
                                        <option key={transformerNo} value={transformerNo} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="flex items-center gap-2">
                                <label htmlFor="filterDate" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                    Inspection Date:
                                </label>
                                <input
                                    type="date"
                                    id="filterDate"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {(filterTransformer || filterDate) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                            
                            <div className="text-sm text-gray-600 ml-auto">
                                Showing {filteredInspections.length} of {inspections?.length || 0} inspections
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-6 gap-y-2 p-4 bg-gray-100 rounded-md mb-4">
                        <div className="font-semibold">Transformer No</div>
                        <div className="font-semibold">Inspection No</div>
                        <div className="font-semibold">Inspection Date</div>
                        <div className="font-semibold">Maintainance Date</div>
                        <div className="font-semibold">Status</div>
                        <div className="font-semibold">Actions</div>
                    </div>
                    {filteredInspections && filteredInspections.length > 0 ? (
                        filteredInspections.map((inspection) => (
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
                                        onClick={() => {
                                            if (reportStatuses[inspection.inspectionNo]) {
                                                navigate(`/inspection/${inspection.inspectionNo}/form`);
                                            }
                                        }}
                                        disabled={!reportStatuses[inspection.inspectionNo]}
                                        className={`flex items-center text-xs px-2 py-1 rounded-lg shadow transition-colors ${
                                            !reportStatuses[inspection.inspectionNo]
                                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                                : 'bg-orange-500 text-white hover:bg-orange-600'
                                        }`}
                                        title={reportStatuses[inspection.inspectionNo] ? "View Report" : "Report Not Ready"}
                                    >
                                        <FileText className="w-3 h-3 mr-1" />
                                        Report
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
                                {(filterTransformer || filterDate) 
                                    ? 'No inspections found matching the selected filters.' 
                                    : 'No inspections found.'}
                            </p>
                        </div>
                    )}
                </div>
            )}
            
            {/* Toast Notification */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}
            
            {/* Confirm Dialog */}
            {confirmDialog && (
                <ConfirmDialog 
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={confirmDialog.onCancel}
                />
            )}
        </div>
    );
};

export default TransformerTable;
