import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Image, Eye, Trash2, Upload, X, AlertCircle, Brain } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import NavigationBar from '../components/NavigationBar';
import Footer from '../components/Footer';

const ThermalInspectionForm = () => {
    const { inspectionNo } = useParams();
    const navigate = useNavigate();
    const [inspection, setInspection] = useState(null);
    const [transformer, setTransformer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBaselineModal, setShowBaselineModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedWeather, setSelectedWeather] = useState('sunny');
    const [uploadError, setUploadError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Bounding boxes and canvas refs
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const imageRef = useRef(null);
    const canvasRef = useRef(null);

    // Form data state
    const [formData, setFormData] = useState({
        dateOfInspection: new Date().toISOString().split('T')[0],
        timeOfInspection: new Date().toTimeString().slice(0, 5),
        inspectedBy: '',
        baselineImagingRight: '',
        baselineImagingLeft: '',
        baselineImagingFront: '',
        lastMonthKVA: '',
        lastMonthDate: '',
        lastMonthTime: '',
        currentMonthKVA: '',
        baselineCondition: '',
        transformerType: '',
        meterSerialNumber: '',
        meterCTRatio: '',
        meterMake: '',
        afterThermalDate: '',
        afterThermalTime: '',
        workContent: [
            { c: true, ci: true, t: true, r: true, other: '' },
            { c: true, ci: true, t: true, r: true, other: '' },
            { c: true, ci: true, t: true, r: true, other: '' },
            { c: false, ci: false, t: false, r: false, other: '' }
        ],
        inspectionReport: [
            { ok: true, notOk: false, irNo: '' },
            { ok: true, notOk: false, irNo: '' },
            { ok: true, notOk: false, irNo: '' },
            { ok: true, notOk: false, irNo: '' }
        ],
        // Section 7: First Inspection Readings
        firstInspectionVR: '',
        firstInspectionVY: '',
        firstInspectionVB: '',
        firstInspectionIR: '',
        firstInspectionIY: '',
        firstInspectionIB: '',
        // Section 7: Second Inspection Readings
        secondInspectionVR: '',
        secondInspectionVY: '',
        secondInspectionVB: '',
        secondInspectionIR: '',
        secondInspectionIY: '',
        secondInspectionIB: ''
    });

    const [isEditing, setIsEditing] = useState(true);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

    useEffect(() => {
        fetchInspectionData();
        fetchSavedFormData();
    }, [inspectionNo]);

    // Auto-save effect with debouncing
    useEffect(() => {
        console.log('Auto-save effect triggered', { 
            hasInspection: !!inspection,
            inspectionNo: inspectionNo,
            workContent: formData.workContent,
            inspectionReport: formData.inspectionReport
        });
        
        if (!inspection) {
            console.log('Skipping auto-save: no inspection loaded yet');
            return; // Don't auto-save until inspection is loaded
        }

        console.log('Setting auto-save timer...');
        const debounceTimer = setTimeout(() => {
            console.log('Auto-save timer fired, calling autoSaveFormData');
            autoSaveFormData();
        }, 2000); // Auto-save after 2 seconds of inactivity

        return () => {
            console.log('Clearing auto-save timer');
            clearTimeout(debounceTimer);
        };
    }, [
        formData.dateOfInspection,
        formData.timeOfInspection,
        formData.inspectedBy,
        formData.baselineImagingRight,
        formData.baselineImagingLeft,
        formData.baselineImagingFront,
        formData.lastMonthKVA,
        formData.lastMonthDate,
        formData.lastMonthTime,
        formData.currentMonthKVA,
        formData.baselineCondition,
        formData.transformerType,
        formData.meterSerialNumber,
        formData.meterCTRatio,
        formData.meterMake,
        formData.afterThermalDate,
        formData.afterThermalTime,
        JSON.stringify(formData.workContent), // Serialize array to detect changes
        JSON.stringify(formData.inspectionReport), // Serialize array to detect changes
        formData.firstInspectionVR,
        formData.firstInspectionVY,
        formData.firstInspectionVB,
        formData.firstInspectionIR,
        formData.firstInspectionIY,
        formData.firstInspectionIB,
        formData.secondInspectionVR,
        formData.secondInspectionVY,
        formData.secondInspectionVB,
        formData.secondInspectionIR,
        formData.secondInspectionIY,
        formData.secondInspectionIB,
        inspection
    ]);

    const fetchInspectionData = async () => {
        try {
            setLoading(true);
            const inspectionResponse = await axios.get(`http://localhost:8080/api/inspections/${inspectionNo}`);
            setInspection(inspectionResponse.data);

            // Fetch transformer data
            if (inspectionResponse.data.transformerNo) {
                const transformerResponse = await axios.get(`http://localhost:8080/api/transformers/${inspectionResponse.data.transformerNo}`);
                setTransformer(transformerResponse.data);
            }

            // Fetch effective bounding boxes
            if (inspectionResponse.data.inspectionNo) {
                try {
                    const boxesResponse = await axios.get(`http://localhost:8080/api/inspections/${inspectionResponse.data.inspectionNo}/effective-boxes`);
                    const data = typeof boxesResponse.data === 'string' ? JSON.parse(boxesResponse.data) : boxesResponse.data;
                    setBoundingBoxes((data && Array.isArray(data.predictions)) ? data.predictions : []);
                } catch (error) {
                    console.error('Failed to fetch bounding boxes:', error);
                    setBoundingBoxes([]);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load inspection details");
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedFormData = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/inspection-report-forms/${inspectionNo}`);
            if (response.data) {
                // Parse JSON strings back to objects
                const savedData = {
                    ...response.data,
                    workContent: response.data.workContent ? JSON.parse(response.data.workContent) : formData.workContent,
                    inspectionReport: response.data.inspectionReport ? JSON.parse(response.data.inspectionReport) : formData.inspectionReport
                };
                setFormData(prev => ({
                    ...prev,
                    ...savedData
                }));
                
                // If form is finalized, set to read-only mode
                if (response.data.isFinalized) {
                    setIsEditing(false);
                }
                
                console.log('Loaded saved form data', {
                    workContent: savedData.workContent,
                    inspectionReport: savedData.inspectionReport,
                    isFinalized: response.data.isFinalized
                });
            }
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('No saved form data found, using defaults');
            } else {
                console.error('Error loading saved form data:', error);
            }
        }
    };

    const autoSaveFormData = async () => {
        console.log('autoSaveFormData called');
        try {
            const dataToSave = {
                ...formData,
                workContent: JSON.stringify(formData.workContent),
                inspectionReport: JSON.stringify(formData.inspectionReport)
            };

            console.log('Sending auto-save request to:', `http://localhost:8080/api/inspection-report-forms/${inspectionNo}/auto-save`);
            console.log('Data being sent:', dataToSave);

            const response = await axios.post(`http://localhost:8080/api/inspection-report-forms/${inspectionNo}/auto-save`, dataToSave);
            
            console.log('Auto-save response:', response.data);
            console.log('Form auto-saved successfully', {
                workContent: formData.workContent,
                inspectionReport: formData.inspectionReport,
                firstInspection: {
                    VR: dataToSave.firstInspectionVR,
                    VY: dataToSave.firstInspectionVY,
                    VB: dataToSave.firstInspectionVB,
                    IR: dataToSave.firstInspectionIR,
                    IY: dataToSave.firstInspectionIY,
                    IB: dataToSave.firstInspectionIB
                },
                secondInspection: {
                    VR: dataToSave.secondInspectionVR,
                    VY: dataToSave.secondInspectionVY,
                    VB: dataToSave.secondInspectionVB,
                    IR: dataToSave.secondInspectionIR,
                    IY: dataToSave.secondInspectionIY,
                    IB: dataToSave.secondInspectionIB
                }
            });
        } catch (error) {
            console.error('Error auto-saving form:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            // Silent failure for auto-save - don't disrupt user
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleBaselineUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('weather', selectedWeather);

        try {
            const response = await axios.post(
                `http://localhost:8080/api/transformers/${inspection.transformerNo}/baseline-image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            if (response.data) {
                setTransformer(response.data);
                // Refresh inspection data
                await fetchInspectionData();
            }

            setTimeout(() => {
                setShowBaselineModal(false);
                setIsUploading(false);
            }, 1000);

        } catch (error) {
            console.error('Error uploading baseline image:', error);
            setUploadError(error.response?.data || 'Failed to upload baseline image. Please try again.');
            setIsUploading(false);
        }
    };

    const handleDeleteBaselineImage = async () => {
        if (!window.confirm('Are you sure you want to delete the baseline image?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `http://localhost:8080/api/transformers/${inspection.transformerNo}/baseline-image`
            );

            if (response.data) {
                setTransformer(response.data);
            }
        } catch (error) {
            console.error('Error deleting baseline image:', error);
            alert('Failed to delete baseline image. Please try again.');
        }
    };

    const handleViewBaselineImage = () => {
        if (transformer?.baselineImagePath) {
            setCurrentImageUrl(`http://localhost:8080/api/transformers/images/${transformer.baselineImagePath}`);
            setShowImageModal(true);
        }
    };

    const handleFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleWorkContentChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            workContent: prev.workContent.map((row, idx) => 
                idx === index ? { ...row, [field]: value } : row
            )
        }));
    };

    const handleInspectionReportChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            inspectionReport: prev.inspectionReport.map((row, idx) => 
                idx === index ? { ...row, [field]: value } : row
            )
        }));
    };

    const handleSave = async () => {
        const now = new Date();
        const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const time = now.toTimeString().slice(0, 5);
        
        const updatedFormData = {
            ...formData,
            afterThermalDate: date,
            afterThermalTime: time
        };
        
        setFormData(updatedFormData);
        
        try {
            // Finalize the report in backend
            const dataToSave = {
                ...updatedFormData,
                workContent: JSON.stringify(updatedFormData.workContent),
                inspectionReport: JSON.stringify(updatedFormData.inspectionReport)
            };

            await axios.post(`http://localhost:8080/api/inspection-report-forms/${inspectionNo}/finalize`, dataToSave);
            
            setIsEditing(false);
            alert('Form saved and finalized successfully!');
            
            // Navigate back to inspection details page
            navigate(`/inspections/${inspectionNo}`);
        } catch (error) {
            console.error('Error saving form:', error);
            alert('Failed to save form. Please try again.');
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handlePrintReport = async () => {
        try {
            const pdfBlob = await generatePDF();
            const url = URL.createObjectURL(pdfBlob);
            setPdfPreviewUrl(url);
            setShowPrintPreview(true);
        } catch (error) {
            console.error('Error generating PDF preview:', error);
            alert('Failed to generate PDF preview');
        }
    };

    const handleExportPDF = () => {
        if (pdfPreviewUrl) {
            const link = document.createElement('a');
            link.href = pdfPreviewUrl;
            link.download = `Thermal_Inspection_Report_${inspection?.inspectionNo || 'Unknown'}.pdf`;
            link.click();
        }
    };

    const handleClosePreview = () => {
        setShowPrintPreview(false);
        if (pdfPreviewUrl) {
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
        }
    };

    const generatePDF = async () => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 25.4; // 1 inch = 25.4mm
        const maxY = pageHeight - margin; // Bottom margin
        let yPosition = margin; // Start at top margin

        const checkPageBreak = (requiredSpace) => {
            if (yPosition + requiredSpace > maxY) {
                pdf.addPage();
                yPosition = margin;
                return true;
            }
            return false;
        };

        // Add GridWatch Logo
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('GridWatch', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;

        // Grey line separator
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Title
        pdf.setFontSize(16);
        pdf.setTextColor(0, 51, 153);
        pdf.text('Thermal Image Inspection Form', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Reset text color
        pdf.setTextColor(0, 0, 0);

        checkPageBreak(60); // Check if we need space for Basic Information section

        // Section 1: Basic Information
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Basic Information', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(12);
        
        // Branch
        pdf.setFont('helvetica', 'bold');
        pdf.text('Branch', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(transformer?.branch || 'N/A', margin + 50, yPosition);
        yPosition += 7;

        // Transformer No
        pdf.setFont('helvetica', 'bold');
        pdf.text('Transformer No.', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(inspection?.transformerNo || 'N/A', margin + 50, yPosition);
        yPosition += 7;
        
        // Pole No
        pdf.setFont('helvetica', 'bold');
        pdf.text('Pole No.', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(transformer?.poleNo || 'N/A'), margin + 50, yPosition);
        yPosition += 7;

        // Location Details
        pdf.setFont('helvetica', 'bold');
        pdf.text('Location Details', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        const locationText = transformer?.location || 'N/A';
        pdf.text(locationText, margin + 50, yPosition, { maxWidth: pageWidth - margin - 65 });
        yPosition += 7;

        // Date of Inspection
        pdf.setFont('helvetica', 'bold');
        pdf.text('Date of Inspection', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.dateOfInspection || 'N/A', margin + 50, yPosition);
        yPosition += 7;
        
        // Time
        pdf.setFont('helvetica', 'bold');
        pdf.text('Time', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.timeOfInspection || 'N/A', margin + 50, yPosition);
        yPosition += 7;
        
        // Inspected By
        pdf.setFont('helvetica', 'bold');
        pdf.text('Inspected By', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.inspectedBy || 'N/A', margin + 50, yPosition);
        yPosition += 12;

        // Grey line separator
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        checkPageBreak(30); // Check space for Base Line Imaging section

        // Section 2: Base Line Imaging nos (IR)
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Base Line Imaging nos (IR)', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(12);
        
        // Right
        pdf.setFont('helvetica', 'bold');
        pdf.text('Right', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.baselineImagingRight || 'N/A', margin + 50, yPosition);
        yPosition += 7;
        
        // Left
        pdf.setFont('helvetica', 'bold');
        pdf.text('Left', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.baselineImagingLeft || 'N/A', margin + 50, yPosition);
        yPosition += 7;
        
        // Front
        pdf.setFont('helvetica', 'bold');
        pdf.text('Front', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.baselineImagingFront || 'N/A', margin + 50, yPosition);
        yPosition += 10;

        // Thermal Analysis Image
        if (inspection?.maintenanceImagePath && imageRef.current) {
            try {
                const imgHeight = 75;
                checkPageBreak(imgHeight + 15); // Check space for image
                
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Thermal Analysis Image', margin, yPosition);
                yPosition += 8;
                
                const imgWidth = 120;
                const imgX = (pageWidth - imgWidth) / 2;
                
                // Create a temporary canvas to combine image and bounding boxes
                const tempCanvas = document.createElement('canvas');
                const image = imageRef.current;
                
                // Get natural and target dimensions
                const naturalWidth = image.naturalWidth;
                const naturalHeight = image.naturalHeight;
                
                // Set canvas to natural size for high quality
                tempCanvas.width = naturalWidth;
                tempCanvas.height = naturalHeight;
                
                const ctx = tempCanvas.getContext('2d');
                
                // Draw the thermal image at natural size
                ctx.drawImage(image, 0, 0, naturalWidth, naturalHeight);
                
                // Draw bounding boxes if they exist
                if (boundingBoxes.length > 0) {
                    boundingBoxes.forEach((pred, index) => {
                        // Bounding box coordinates are already in natural image dimensions
                        const [x1, y1, x2, y2] = pred.box;
                        const x = x1;
                        const y = y1;
                        const width = x2 - x1;
                        const height = y2 - y1;
                        
                        // Set box color based on class
                        let color;
                        if (pred.class === 0) {
                            color = '#ef4444'; // Red for Faulty
                        } else if (pred.class === 1) {
                            color = '#10b981'; // Green for Normal
                        } else {
                            color = '#f59e0b'; // Orange for Potentially Faulty
                        }
                        
                        // Draw bounding box with appropriate line width for natural size
                        ctx.strokeStyle = color;
                        ctx.lineWidth = Math.max(3, naturalWidth / 200); // Scale line width
                        ctx.strokeRect(x, y, width, height);
                        
                        // Draw numbered badge as circle
                        const badgeRadius = Math.max(12, naturalWidth / 100);
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(x + badgeRadius, y + badgeRadius, badgeRadius, 0, 2 * Math.PI);
                        ctx.fill();
                        
                        // Draw number
                        ctx.fillStyle = 'white';
                        ctx.font = `bold ${Math.max(14, naturalWidth / 70)}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(String(index + 1), x + badgeRadius, y + badgeRadius);
                    });
                }
                
                // Convert canvas to image data and add to PDF
                const imgData = tempCanvas.toDataURL('image/jpeg', 0.95);
                pdf.addImage(imgData, 'JPEG', imgX, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 8;
            } catch (error) {
                console.error('Error adding image to PDF:', error);
            }
        }

        // Detection Details
        if (boundingBoxes.length > 0) {
            checkPageBreak(20 + (boundingBoxes.length * 7)); // Check space for detection details
            
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${boundingBoxes.length} anomal${boundingBoxes.length !== 1 ? 'ies' : 'y'} detected`, margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Detection Details:', margin, yPosition);
            yPosition += 6;

            boundingBoxes.forEach((pred, idx) => {
                const className = pred.class === 0 ? 'Faulty' : pred.class === 1 ? 'Normal' : 'Potentially Faulty';
                const confidence = (pred.confidence * 100).toFixed(1);
                
                pdf.setFont('helvetica', 'bold');
                pdf.text(`Error ${idx + 1}:`, margin + 5, yPosition);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`${className} - Confidence: ${confidence}%`, margin + 25, yPosition);
                yPosition += 7;
            });
        }

        // Check if we need a new page for remaining sections
        checkPageBreak(100);

        // Grey line separator
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        // Section 3: Last Month
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Last Month', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(12);
        
        // kVA
        pdf.setFont('helvetica', 'bold');
        pdf.text('kVA', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.lastMonthKVA || 'N/A', margin + 50, yPosition);
        yPosition += 7;
        
        // Date
        pdf.setFont('helvetica', 'bold');
        pdf.text('Date', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.lastMonthDate || 'N/A', margin + 50, yPosition);
        yPosition += 7;
        
        // Time
        pdf.setFont('helvetica', 'bold');
        pdf.text('Time', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.lastMonthTime || 'N/A', margin + 50, yPosition);
        yPosition += 12;

        // Grey line separator
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        checkPageBreak(30); // Check space for Current Month

        // Section 4: Current Month
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Current Month', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Current Month kVA', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.currentMonthKVA || 'N/A', margin + 50, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Baseline Condition', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.baselineCondition || 'N/A', margin + 50, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Transformer Type', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.transformerType || 'N/A', margin + 50, yPosition);
        yPosition += 12;

        // Grey line separator
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        checkPageBreak(30); // Check space for Meter Details

        // Section 5: Meter Details
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Meter Details', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Serial Number', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.meterSerialNumber || 'N/A', margin + 50, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Meter CT Ratio', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.meterCTRatio ? `${formData.meterCTRatio}/5A` : 'N/A', margin + 50, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Make', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formData.meterMake || 'N/A', margin + 50, yPosition);
        yPosition += 12;

        // Grey line separator
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        // Force new page for Work Content section to ensure it has enough space
        pdf.addPage();
        yPosition = margin;

        // Section 6: Work Content and After Inspection Report
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Work Content and After Inspection Report', margin, yPosition);
        yPosition += 10;

        // Work Content Table
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Work Content', margin, yPosition);
        yPosition += 7;

        // Work Content Table Headers
        pdf.setFontSize(10);
        const wcStartX = margin + 5;
        const wcColWidths = [15, 15, 15, 15, 15, 60];
        let wcX = wcStartX;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('No.', wcX, yPosition);
        wcX += wcColWidths[0];
        pdf.text('C', wcX, yPosition);
        wcX += wcColWidths[1];
        pdf.text('CI', wcX, yPosition);
        wcX += wcColWidths[2];
        pdf.text('T', wcX, yPosition);
        wcX += wcColWidths[3];
        pdf.text('R', wcX, yPosition);
        wcX += wcColWidths[4];
        pdf.text('Other', wcX, yPosition);
        yPosition += 6;

        // Work Content Data Rows
        pdf.setFont('helvetica', 'normal');
        formData.workContent.forEach((row, idx) => {
            wcX = wcStartX;
            pdf.text(String(idx + 1), wcX, yPosition);
            wcX += wcColWidths[0];
            pdf.text(row.c ? 'Y' : '-', wcX, yPosition);
            wcX += wcColWidths[1];
            pdf.text(row.ci ? 'Y' : '-', wcX, yPosition);
            wcX += wcColWidths[2];
            pdf.text(row.t ? 'Y' : '-', wcX, yPosition);
            wcX += wcColWidths[3];
            pdf.text(row.r ? 'Y' : '-', wcX, yPosition);
            wcX += wcColWidths[4];
            pdf.text(row.other || '-', wcX, yPosition);
            yPosition += 6;
        });

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.text('C- Check, CI- Clean, T- Tight, R- Replace', margin + 5, yPosition);
        yPosition += 10;

        // After Inspection Report Table
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('After Inspection Report', margin, yPosition);
        yPosition += 7;

        // After Inspection Report Table Headers
        pdf.setFontSize(10);
        const airStartX = margin + 5;
        const airColWidths = [15, 20, 25, 60];
        let airX = airStartX;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('No.', airX, yPosition);
        airX += airColWidths[0];
        pdf.text('OK', airX, yPosition);
        airX += airColWidths[1];
        pdf.text('NOT OK', airX, yPosition);
        airX += airColWidths[2];
        pdf.text('IR No(s).', airX, yPosition);
        yPosition += 6;

        // After Inspection Report Data Rows
        pdf.setFont('helvetica', 'normal');
        formData.inspectionReport.forEach((row, idx) => {
            airX = airStartX;
            pdf.text(String(idx + 1), airX, yPosition);
            airX += airColWidths[0];
            pdf.text(row.ok ? 'Y' : '-', airX, yPosition);
            airX += airColWidths[1];
            pdf.text(row.notOk ? 'Y' : '-', airX, yPosition);
            airX += airColWidths[2];
            pdf.text(row.irNo || '-', airX, yPosition);
            yPosition += 6;
        });

        yPosition += 5;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('After Thermal Date: ' + (formData.afterThermalDate || 'Not set'), margin + 5, yPosition);
        pdf.text('Time: ' + (formData.afterThermalTime || 'Not set'), 120, yPosition);
        yPosition += 12;

        // Grey line separator at the end
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        // Inspection completion timestamp
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Inspection Completed On:', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        const completionDate = formData.afterThermalDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const completionTime = formData.afterThermalTime || new Date().toTimeString().slice(0, 5);
        pdf.text(`${completionDate} at ${completionTime}`, margin + 55, yPosition);
        yPosition += 12;

        // Grey line separator
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        checkPageBreak(60); // Check space for Inspection Values

        // Section 7: First and Second Inspection Values
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('First and Second Inspection Values', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('First Inspection Voltage and Current Readings', margin, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`V - R: ${formData.firstInspectionVR || '-'}`, margin + 5, yPosition);
        pdf.text(`Y: ${formData.firstInspectionVY || '-'}`, 70, yPosition);
        pdf.text(`B: ${formData.firstInspectionVB || '-'}`, 115, yPosition);
        yPosition += 6;
        pdf.text(`I - R: ${formData.firstInspectionIR || '-'}`, margin + 5, yPosition);
        pdf.text(`Y: ${formData.firstInspectionIY || '-'}`, 70, yPosition);
        pdf.text(`B: ${formData.firstInspectionIB || '-'}`, 115, yPosition);
        yPosition += 10;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Second Inspection Voltage and Current Readings', margin, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`V - R: ${formData.secondInspectionVR || '-'}`, margin + 5, yPosition);
        pdf.text(`Y: ${formData.secondInspectionVY || '-'}`, 70, yPosition);
        pdf.text(`B: ${formData.secondInspectionVB || '-'}`, 115, yPosition);
        yPosition += 6;
        pdf.text(`I - R: ${formData.secondInspectionIR || '-'}`, margin + 5, yPosition);
        pdf.text(`Y: ${formData.secondInspectionIY || '-'}`, 70, yPosition);
        pdf.text(`B: ${formData.secondInspectionIB || '-'}`, 115, yPosition);

        // Return the PDF as a blob
        return pdf.output('blob');
    };



    // Draw bounding boxes on canvas
    useEffect(() => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas || boundingBoxes.length === 0) return;

        const drawBoundingBoxes = () => {
            const ctx = canvas.getContext('2d');
            const displayedWidth = image.clientWidth || image.width;
            const displayedHeight = image.clientHeight || image.height;
            const naturalWidth = image.naturalWidth;
            const naturalHeight = image.naturalHeight;

            if (!displayedWidth || !displayedHeight || !naturalWidth || !naturalHeight) return;

            const scaleX = displayedWidth / naturalWidth;
            const scaleY = displayedHeight / naturalHeight;

            canvas.width = displayedWidth;
            canvas.height = displayedHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            boundingBoxes.forEach((prediction, index) => {
                const [x1, y1, x2, y2] = prediction.box;
                const scaledX1 = x1 * scaleX;
                const scaledY1 = y1 * scaleY;
                const scaledX2 = x2 * scaleX;
                const scaledY2 = y2 * scaleY;
                const width = scaledX2 - scaledX1;
                const height = scaledY2 - scaledY1;

                let color;
                switch (prediction.class) {
                    case 0: color = '#ef4444'; break; // Red - Faulty
                    case 1: color = '#10b981'; break; // Green - Normal
                    case 2: color = '#f59e0b'; break; // Orange - Potentially Faulty
                    default: color = '#6b7280'; // Gray
                }

                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.strokeRect(scaledX1, scaledY1, width, height);

                const errorNumber = `${index + 1}`;
                ctx.font = 'bold 14px Arial';
                const badgeSize = 24;
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(scaledX1 + badgeSize/2, scaledY1 + badgeSize/2, badgeSize/2, 0, 2 * Math.PI);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(errorNumber, scaledX1 + badgeSize/2, scaledY1 + badgeSize/2);
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
            });
        };

        if (image.complete) {
            drawBoundingBoxes();
        } else {
            image.onload = drawBoundingBoxes;
        }

        const ro = new ResizeObserver(() => drawBoundingBoxes());
        try { ro.observe(image); } catch (_) {}

        window.addEventListener('resize', drawBoundingBoxes);

        return () => {
            try { ro.disconnect(); } catch (_) {}
            window.removeEventListener('resize', drawBoundingBoxes);
        };
    }, [boundingBoxes]);

    if (loading) {
        return (
            <>
                <NavigationBar />
                <div className="flex justify-center items-center min-h-screen" style={{ marginTop: '80px' }}>
                    <div className="text-lg">Loading inspection form...</div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !inspection) {
        return (
            <>
                <NavigationBar />
                <div className="flex justify-center items-center min-h-screen" style={{ marginTop: '80px' }}>
                    <div className="text-red-600 text-lg">{error || "Inspection not found"}</div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <NavigationBar />
            <div className='flex flex-col m-10 min-h-screen' style={{ marginTop: '80px' }}>
                {/* Header with Back Button */}
                <div className='flex items-center gap-4 mb-6'>
                    <button 
                        onClick={() => navigate(`/inspections/${inspectionNo}`)}
                        className='flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors'
                    >
                        <ArrowLeft className='w-5 h-5' />
                        Back to Inspection
                    </button>
                </div>

                {/* Title */}
                <div className='mb-10'>
                    <h1 className='text-3xl font-bold text-blue-900'>Thermal Image Inspection Form</h1>
                </div>

                {/* Inspection Details Tile */}
                <div className='flex flex-col p-5 bg-white rounded-md shadow-md mb-10'>
                    <div className='flex flex-col justify-between p-2'>
                        <div className='flex flex-row justify-between items-center mb-6'>
                            <div className='flex flex-col items-start'>
                                <h1 className='text-xl font-semibold'>{inspection?.inspectionNo}</h1>
                                <p className='text-xs text-gray-500'>
                                    <span>Transformer last inspected on: </span>
                                    {inspection?.dateOfInspectionAndTime || 'N/A'}
                                </p>
                            </div>
                            <div className='flex flex-row items-center space-x-4'>
                                <p className='text-xs text-gray-500'>
                                    <span>Last updated on: </span>
                                    {formatDateTime(inspection?.lastUpdated).split(',')[1]?.trim() || 'N/A'}
                                </p>
                                <div className='px-4 py-1 text-center text-xs font-medium rounded-full w-fit border-green-400 bg-green-300 text-green-800'>
                                    Inspection in Progress
                                </div>
                            </div>
                        </div>
                        <div className='flex flex-row justify-between items-center'>
                            <div className='grid grid-cols-4 gap-4'>
                                <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                                    <h2 className='text-md font-semibold'>{inspection?.transformerNo || 'N/A'}</h2>
                                    <p className='text-xs text-gray-700'>Transformer No</p>
                                </div>
                                <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                                    <h2 className='text-md font-semibold'>{transformer?.poleNo || 'N/A'}</h2>
                                    <p className='text-xs text-gray-700'>Pole No</p>
                                </div>
                                <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                                    <h2 className='text-md font-semibold'>{inspection?.branch || 'N/A'}</h2>
                                    <p className='text-xs text-gray-700'>Branch</p>
                                </div>
                                <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                                    <h2 className='text-md font-semibold'>{inspection?.inspecBy || 'N/A'}</h2>
                                    <p className='text-xs text-gray-700'>Inspected By</p>
                                </div>
                            </div>
                            <div className='grid grid-cols-1 w-100% h-10'>
                                <div className='border rounded-xl py-2 px-4 flex flex-row justify-center items-center bg-indigo-200 shadow-md'>
                                    <Image 
                                        className="text-gray-700 cursor-pointer hover:text-gray-900" 
                                        onClick={() => setShowBaselineModal(true)}
                                        title="Upload Baseline Image"
                                    />
                                    <p className='ml-2 text-xs text-gray-900 text-center'>Baseline Image</p>
                                    {transformer?.baselineImagePath && (
                                        <>
                                            <Eye 
                                                className='mx-2 text-blue-600 hover:text-blue-800 cursor-pointer' 
                                                onClick={handleViewBaselineImage}
                                                title="View Baseline Image"
                                            />
                                            <Trash2 
                                                className='text-red-500 hover:text-red-700 cursor-pointer' 
                                                onClick={handleDeleteBaselineImage}
                                                title="Delete Baseline Image"
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Baseline Image Upload Modal */}
                {showBaselineModal && (
                    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
                        <div className='bg-white p-6 rounded-lg shadow-xl w-96'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-semibold'>
                                    {transformer?.baselineImagePath ? 'Update Baseline Image' : 'Upload Baseline Image'}
                                </h3>
                                <button
                                    onClick={() => setShowBaselineModal(false)}
                                    className='p-1 hover:bg-gray-100 rounded'
                                >
                                    <X className='w-5 h-5' />
                                </button>
                            </div>

                            {uploadError ? (
                                <div className='mb-4 p-3 bg-red-100 border border-red-200 rounded text-red-700 text-sm'>
                                    <AlertCircle className='w-4 h-4 inline mr-2' />
                                    {uploadError}
                                </div>
                            ) : null}

                            {transformer?.baselineImagePath && (
                                <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded'>
                                    <p className='text-sm text-blue-800'>
                                        <span className='font-medium'>Current baseline image:</span> Uploaded on {' '}
                                        {transformer.baselineImageUploadDateAndTime ? 
                                            new Date(transformer.baselineImageUploadDateAndTime).toLocaleDateString() : 
                                            'Unknown date'
                                        }
                                    </p>
                                    {transformer.weather && (
                                        <p className='text-xs text-blue-600 mt-1'>
                                            Weather: {transformer.weather}
                                        </p>
                                    )}
                                </div>
                            )}

                            <form>
                                <div className='mb-4'>
                                    <label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-2">
                                        Weather Condition <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        name="weather" 
                                        id="weather" 
                                        value={selectedWeather}
                                        onChange={(e) => setSelectedWeather(e.target.value)}
                                        className='border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                        disabled={isUploading}
                                    >
                                        <option value="sunny">Sunny</option>
                                        <option value="cloudy">Cloudy</option>
                                        <option value="rainy">Rainy</option>
                                        <option value="snowy">Snowy</option>
                                        <option value="windy">Windy</option>
                                        <option value="foggy">Foggy</option>
                                    </select>
                                </div>

                                <div className='mb-4'>
                                    <label className='flex items-center justify-center px-4 py-3 bg-green-500 text-white text-sm rounded-lg cursor-pointer hover:bg-green-600 transition-colors duration-200'>
                                        <Upload className='w-4 h-4 mr-2' />
                                        {isUploading ? 'Uploading...' : 'Select Baseline Image'}
                                        <input 
                                            type="file" 
                                            accept="image/jpeg,image/png,image/gif" 
                                            onChange={handleBaselineUpload} 
                                            className='hidden'
                                            disabled={isUploading}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Supported formats: JPG, PNG, GIF (Max: 10MB)
                                    </p>
                                </div>

                                {isUploading && (
                                    <div className='mb-4'>
                                        <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden'>
                                            <div 
                                                className='bg-green-500 h-4 transition-all duration-200'
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className='text-right text-gray-500 text-sm mt-1'>{uploadProgress}%</p>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}

                {/* Image View Modal */}
                {showImageModal && currentImageUrl && (
                    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50'>
                        <div className='relative max-w-6xl max-h-full p-4'>
                            <button
                                onClick={() => setShowImageModal(false)}
                                className='absolute top-4 right-4 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all duration-200'
                            >
                                <X className='w-6 h-6' />
                            </button>
                            <img 
                                src={currentImageUrl} 
                                alt="Baseline Thermal Image" 
                                className='max-w-full max-h-full object-contain rounded-lg'
                            />
                        </div>
                    </div>
                )}

                {/* Form Content Area */}
                <div className='bg-white rounded-md shadow-md p-6'>
                    <form className='space-y-6'>
                        {/* Section 1: Basic Information */}
                        <div className='space-y-4'>
                            {/* First Row: Branch, Transformer No, Pole No */}
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Branch
                                    </label>
                                    <input
                                        type='text'
                                        value={inspection?.branch || ''}
                                        disabled
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Transformer No.
                                    </label>
                                    <input
                                        type='text'
                                        value={inspection?.transformerNo || ''}
                                        disabled
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Pole No.
                                    </label>
                                    <input
                                        type='text'
                                        value={transformer?.poleNo || ''}
                                        disabled
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed'
                                    />
                                </div>
                            </div>

                            {/* Second Row: Location Details */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Location Details
                                </label>
                                <input
                                    type='text'
                                    value={transformer?.location || ''}
                                    disabled
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed'
                                />
                            </div>

                            {/* Third Row: Date of Inspection, Time, Inspected By */}
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Date of Inspection
                                    </label>
                                    <div className='relative'>
                                        <input
                                            type='date'
                                            name='dateOfInspection'
                                            value={formData.dateOfInspection}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            disabled={!isEditing}
                                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Time
                                    </label>
                                    <input
                                        type='time'
                                        name='timeOfInspection'
                                        value={formData.timeOfInspection}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        disabled={!isEditing}
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Inspected By
                                    </label>
                                    <input
                                        type='text'
                                        name='inspectedBy'
                                        value={formData.inspectedBy}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        placeholder='Inspector ID'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300 my-6'></div>

                        {/* Section 2: Base Line Imaging nos (IR) */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800'>Base Line Imaging nos (IR)</h3>
                            
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Right
                                    </label>
                                    <input
                                        type='text'
                                        name='baselineImagingRight'
                                        value={formData.baselineImagingRight}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        placeholder='Enter IR value'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Left
                                    </label>
                                    <input
                                        type='text'
                                        name='baselineImagingLeft'
                                        value={formData.baselineImagingLeft}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        placeholder='Enter IR value'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Front
                                    </label>
                                    <input
                                        type='text'
                                        name='baselineImagingFront'
                                        value={formData.baselineImagingFront}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        placeholder='Enter IR value'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>

                            {/* AI Analysis Image with Bounding Boxes */}
                            {inspection?.maintenanceImagePath && (
                                <div className='mt-6 mx-auto' style={{ width: '60%' }}>
                                    <h4 className='text-sm font-medium text-gray-700 mb-3'>Thermal Analysis Image</h4>
                                    <div className='relative border border-gray-300 rounded-lg overflow-hidden shadow-sm'>
                                        <img 
                                            ref={imageRef}
                                            src={`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`}
                                            alt="AI Analysis with Bounding Boxes"
                                            className='w-full h-auto object-contain block'
                                            crossOrigin="anonymous"
                                        />
                                        {boundingBoxes.length > 0 && (
                                            <canvas
                                                ref={canvasRef}
                                                className='absolute top-0 left-0 pointer-events-none'
                                            />
                                        )}
                                    </div>

                                    {/* Anomalies Summary */}
                                    {boundingBoxes.length > 0 && (
                                        <div className='mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
                                            <div className='flex items-center space-x-3'>
                                                <Brain className='w-5 h-5 text-blue-600' />
                                                <div>
                                                    <p className='text-sm font-semibold text-gray-800'>
                                                        {boundingBoxes.length} anomal{boundingBoxes.length !== 1 ? 'ies' : 'y'} detected
                                                    </p>
                                                    <p className='text-xs text-gray-600'>
                                                        View analysis in the comparison view above
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Detection Details */}
                                    {boundingBoxes.length > 0 && (
                                        <div className='mt-6 space-y-2'>
                                            <h4 className='font-semibold text-sm text-gray-700'>Detection Details:</h4>
                                            {boundingBoxes.map((pred, idx) => {
                                                const className = pred.class === 0 ? 'Faulty' : pred.class === 1 ? 'Normal' : 'Potentially Faulty';
                                                const colorClass = pred.class === 0 ? 'text-red-600' : pred.class === 1 ? 'text-green-600' : 'text-orange-600';
                                                const bgColor = pred.class === 0 ? 'bg-red-600' : pred.class === 1 ? 'bg-green-600' : 'bg-orange-600';
                                                
                                                return (
                                                    <div key={idx} className='bg-gray-50 rounded border border-gray-200 p-3'>
                                                        <div className='flex items-center justify-between mb-3'>
                                                            <div className='flex items-center gap-2'>
                                                                <span className={`${bgColor} text-white px-2 py-1 rounded text-xs font-semibold`}>
                                                                    Error {idx + 1}
                                                                </span>
                                                                <span className={`font-medium ${colorClass} text-sm`}>{className}</span>
                                                            </div>
                                                            <span className='text-gray-600 text-sm'>
                                                                Confidence: {(pred.confidence * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className='text-xs text-gray-600'>
                                                            <p className='mb-1'>
                                                                <span className='font-medium'>Box Coordinates:</span> X1: {pred.box[0].toFixed(2)}, Y1: {pred.box[1].toFixed(2)}, X2: {pred.box[2].toFixed(2)}, Y2: {pred.box[3].toFixed(2)}
                                                            </p>
                                                            <p>
                                                                <span className='font-medium'>Dimensions:</span> Width: {(pred.box[2] - pred.box[0]).toFixed(2)}px, Height: {(pred.box[3] - pred.box[1]).toFixed(2)}px
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300 my-6'></div>

                        {/* Section 3: Last Month */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800'>Last Month</h3>
                            
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        kVA
                                    </label>
                                    <input
                                        type='text'
                                        name='lastMonthKVA'
                                        value={formData.lastMonthKVA}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        placeholder='Enter Value'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Date
                                    </label>
                                    <input
                                        type='date'
                                        name='lastMonthDate'
                                        value={formData.lastMonthDate}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Time
                                    </label>
                                    <input
                                        type='time'
                                        name='lastMonthTime'
                                        value={formData.lastMonthTime}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300 my-6'></div>

                        {/* Section 4: Current Month */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800'>Current Month</h3>
                            
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Current Month kVA
                                    </label>
                                    <input
                                        type='text'
                                        name='currentMonthKVA'
                                        value={formData.currentMonthKVA}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        placeholder='Enter Value'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Baseline Condition
                                    </label>
                                    <select
                                        name='baselineCondition'
                                        value={formData.baselineCondition}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    >
                                        <option value=''>Select Weather</option>
                                        <option value='Sunny'>Sunny</option>
                                        <option value='Cloudy'>Cloudy</option>
                                        <option value='Rainy'>Rainy</option>
                                        <option value='Windy'>Windy</option>
                                        <option value='Foggy'>Foggy</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Transformer Type
                                    </label>
                                    <select
                                        name='transformerType'
                                        value={formData.transformerType}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    >
                                        <option value=''>Select Type</option>
                                        <option value='Distribution'>Distribution</option>
                                        <option value='Power'>Power</option>
                                        <option value='Instrument'>Instrument</option>
                                        <option value='Auto'>Auto</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300 my-6'></div>

                        {/* Section 5: Meter Details */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800'>Meter Details</h3>
                            
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Serial Number
                                    </label>
                                    <input
                                        type='text'
                                        name='meterSerialNumber'
                                        value={formData.meterSerialNumber}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        placeholder='Enter Serial Number'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Meter CT Ratio
                                    </label>
                                    <div className='relative'>
                                        <input
                                            type='text'
                                            name='meterCTRatio'
                                            value={formData.meterCTRatio}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'>/5A</span>
                                    </div>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Make
                                    </label>
                                    <input
                                        type='text'
                                        name='meterMake'
                                        value={formData.meterMake}
                                        onChange={handleFormInputChange}
                                        disabled={!isEditing}
                                        placeholder='Enter Make'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300 my-6'></div>

                        {/* Section 6: Work Content and After Inspection Report */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800'>Work Content and After Inspection Report</h3>
                            
                            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                                {/* Work Content */}
                                <div className='space-y-4'>
                                    <h4 className='text-sm font-medium text-gray-700'>Work Content</h4>
                                
                                <div className='space-y-3'>
                                    {formData.workContent.map((row, idx) => (
                                        <div key={idx} className='grid grid-cols-7 gap-2 items-center'>
                                            <div className='text-center text-sm font-medium text-gray-700'>
                                                {idx + 1}
                                            </div>
                                            <div className='flex justify-center'>
                                                <input
                                                    type='checkbox'
                                                    checked={row.c}
                                                    onChange={(e) => handleWorkContentChange(idx, 'c', e.target.checked)}
                                                    disabled={!isEditing}
                                                    className='w-4 h-4 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
                                                />
                                            </div>
                                            <div className='flex justify-center'>
                                                <input
                                                    type='checkbox'
                                                    checked={row.ci}
                                                    onChange={(e) => handleWorkContentChange(idx, 'ci', e.target.checked)}
                                                    disabled={!isEditing}
                                                    className='w-4 h-4 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
                                                />
                                            </div>
                                            <div className='flex justify-center'>
                                                <input
                                                    type='checkbox'
                                                    checked={row.t}
                                                    onChange={(e) => handleWorkContentChange(idx, 't', e.target.checked)}
                                                    disabled={!isEditing}
                                                    className='w-4 h-4 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
                                                />
                                            </div>
                                            <div className='flex justify-center'>
                                                <input
                                                    type='checkbox'
                                                    checked={row.r}
                                                    onChange={(e) => handleWorkContentChange(idx, 'r', e.target.checked)}
                                                    disabled={!isEditing}
                                                    className='w-4 h-4 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
                                                />
                                            </div>
                                            <div className='col-span-2'>
                                                <input
                                                    type='text'
                                                    value={row.other}
                                                    onChange={(e) => handleWorkContentChange(idx, 'other', e.target.value)}
                                                    disabled={!isEditing}
                                                    placeholder='-'
                                                    className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Column Headers */}
                                    <div className='grid grid-cols-7 gap-2 items-center pt-2 border-t border-gray-200'>
                                        <div className='text-center text-xs font-medium text-gray-600'>No.</div>
                                        <div className='text-center text-xs font-medium text-gray-600'>C</div>
                                        <div className='text-center text-xs font-medium text-gray-600'>CI</div>
                                        <div className='text-center text-xs font-medium text-gray-600'>T</div>
                                        <div className='text-center text-xs font-medium text-gray-600'>R</div>
                                        <div className='col-span-2 text-center text-xs font-medium text-gray-600'>Other</div>
                                    </div>
                                    <div className='text-xs text-gray-500 mt-2'>
                                        C- Check, CI- Clean, T- Tight, R- Replace
                                    </div>
                                </div>
                            </div>

                            {/* After Inspection Report */}
                            <div className='space-y-4'>
                                <h4 className='text-sm font-medium text-gray-700'>After Inspection Report</h4>
                                
                                <div className='space-y-3'>
                                    {formData.inspectionReport.map((row, idx) => (
                                        <div key={idx} className='grid grid-cols-4 gap-3 items-center'>
                                            <div className='flex justify-center'>
                                                <input
                                                    type='checkbox'
                                                    checked={row.ok}
                                                    onChange={(e) => handleInspectionReportChange(idx, 'ok', e.target.checked)}
                                                    disabled={!isEditing}
                                                    className='w-4 h-4 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
                                                />
                                            </div>
                                            <div className='flex justify-center'>
                                                <input
                                                    type='checkbox'
                                                    checked={row.notOk}
                                                    onChange={(e) => handleInspectionReportChange(idx, 'notOk', e.target.checked)}
                                                    disabled={!isEditing}
                                                    className='w-4 h-4 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
                                                />
                                            </div>
                                            <div className='col-span-2'>
                                                <input
                                                    type='text'
                                                    value={row.irNo}
                                                    onChange={(e) => handleInspectionReportChange(idx, 'irNo', e.target.value)}
                                                    placeholder='-'
                                                    className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Column Headers */}
                                    <div className='grid grid-cols-4 gap-3 items-center pt-2 border-t border-gray-200'>
                                        <div className='text-center text-xs font-medium text-gray-600'>OK</div>
                                        <div className='text-center text-xs font-medium text-gray-600'>NOT OK</div>
                                        <div className='col-span-2 text-center text-xs font-medium text-gray-600'>IR No(s).</div>
                                    </div>
                                    <div className='flex items-center justify-between text-xs text-gray-500 mt-3'>
                                        <span>After Thermal Date: {formData.afterThermalDate || 'Not set'}</span>
                                        <span>Time: {formData.afterThermalTime || 'Not set'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300 my-6'></div>

                        {/* Section 7: First and Second Inspection Values */}
                        <div className='space-y-6'>
                            <h3 className='text-lg font-semibold text-gray-800'>First and Second Inspection Values</h3>
                            
                            {/* First Inspection Voltage and Current Readings */}
                            <div className='space-y-4'>
                                <h4 className='text-sm font-medium text-gray-700'>First Inspection Voltage and Current Readings</h4>
                                
                                <div className='space-y-3'>
                                    {/* Header Row */}
                                    <div className='grid grid-cols-[50px_1fr_1fr_1fr] gap-3'>
                                        <div></div>
                                        <div className='text-center font-semibold text-gray-700'>R</div>
                                        <div className='text-center font-semibold text-gray-700'>Y</div>
                                        <div className='text-center font-semibold text-gray-700'>B</div>
                                    </div>
                                    
                                    {/* V Row */}
                                    <div className='grid grid-cols-[50px_1fr_1fr_1fr] gap-3 items-center'>
                                        <div className='font-semibold text-gray-700'>V</div>
                                        <input
                                            type='text'
                                            name='firstInspectionVR'
                                            value={formData.firstInspectionVR}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <input
                                            type='text'
                                            name='firstInspectionVY'
                                            value={formData.firstInspectionVY}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <input
                                            type='text'
                                            name='firstInspectionVB'
                                            value={formData.firstInspectionVB}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                    
                                    {/* I Row */}
                                    <div className='grid grid-cols-[50px_1fr_1fr_1fr] gap-3 items-center'>
                                        <div className='font-semibold text-gray-700'>I</div>
                                        <input
                                            type='text'
                                            name='firstInspectionIR'
                                            value={formData.firstInspectionIR}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <input
                                            type='text'
                                            name='firstInspectionIY'
                                            value={formData.firstInspectionIY}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <input
                                            type='text'
                                            name='firstInspectionIB'
                                            value={formData.firstInspectionIB}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Second Inspection Voltage and Current Readings */}
                            <div className='space-y-4'>
                                <h4 className='text-sm font-medium text-gray-700'>Second Inspection Voltage and Current Readings</h4>
                                
                                <div className='space-y-3'>
                                    {/* Header Row */}
                                    <div className='grid grid-cols-[50px_1fr_1fr_1fr] gap-3'>
                                        <div></div>
                                        <div className='text-center font-semibold text-gray-700'>R</div>
                                        <div className='text-center font-semibold text-gray-700'>Y</div>
                                        <div className='text-center font-semibold text-gray-700'>B</div>
                                    </div>
                                    
                                    {/* V Row */}
                                    <div className='grid grid-cols-[50px_1fr_1fr_1fr] gap-3 items-center'>
                                        <div className='font-semibold text-gray-700'>V</div>
                                        <input
                                            type='text'
                                            name='secondInspectionVR'
                                            value={formData.secondInspectionVR}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <input
                                            type='text'
                                            name='secondInspectionVY'
                                            value={formData.secondInspectionVY}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <input
                                            type='text'
                                            name='secondInspectionVB'
                                            value={formData.secondInspectionVB}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                    
                                    {/* I Row */}
                                    <div className='grid grid-cols-[50px_1fr_1fr_1fr] gap-3 items-center'>
                                        <div className='font-semibold text-gray-700'>I</div>
                                        <input
                                            type='text'
                                            name='secondInspectionIR'
                                            value={formData.secondInspectionIR}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <input
                                            type='text'
                                            name='secondInspectionIY'
                                            value={formData.secondInspectionIY}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <input
                                            type='text'
                                            name='secondInspectionIB'
                                            value={formData.secondInspectionIB}
                                            onChange={handleFormInputChange}
                                            disabled={!isEditing}
                                            placeholder='Enter Value'
                                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='flex justify-end gap-4 mt-8 pt-6 border-t border-gray-300'>
                            {isEditing ? (
                                <button
                                    type='button'
                                    onClick={handleSave}
                                    className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                                >
                                    Save
                                </button>
                            ) : (
                                <button
                                    type='button'
                                    onClick={handleEdit}
                                    className='px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
                                >
                                    Edit
                                </button>
                            )}
                            <button
                                type='button'
                                onClick={handlePrintReport}
                                className='px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500'
                            >
                                Print Report
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Print Preview Modal */}
            {showPrintPreview && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col'>
                        {/* Modal Header */}
                        <div className='px-6 py-4 border-b border-gray-200'>
                            <h2 className='text-xl font-semibold text-gray-800'>Print Preview</h2>
                        </div>

                        {/* PDF Preview */}
                        <div className='flex-1 overflow-auto p-4 bg-gray-100'>
                            {pdfPreviewUrl && (
                                <iframe
                                    src={pdfPreviewUrl}
                                    className='w-full h-full border-0 rounded shadow-lg bg-white'
                                    title='PDF Preview'
                                />
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className='px-6 py-4 border-t border-gray-200 flex justify-end gap-3'>
                            <button
                                onClick={handleClosePreview}
                                className='px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
                            >
                                Back
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                Export PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </>
    );
};

export default ThermalInspectionForm;
