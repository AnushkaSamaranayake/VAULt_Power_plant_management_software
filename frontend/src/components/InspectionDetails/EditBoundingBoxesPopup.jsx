import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const EditBoundingBoxesPopup = ({ inspection, boundingBoxes, onClose, onSave }) => {
    const imageRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [visibleBoxes, setVisibleBoxes] = useState(() => 
        boundingBoxes.map((_, idx) => idx) // Initially all boxes visible
    );
    const [editingBoxIndex, setEditingBoxIndex] = useState(null);
    const [editedBoxes, setEditedBoxes] = useState(boundingBoxes);
    const [draggingCorner, setDraggingCorner] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [boxNotes, setBoxNotes] = useState({}); // Store notes for each box
    const [expandedNotes, setExpandedNotes] = useState({}); // Track which note sections are expanded
    // Track deleted entries' metadata (geometry + note) so we can persist comment after removal
    const [deletedMeta, setDeletedMeta] = useState([]); // { box, class, confidence, note }
    const [deletedBoxes, setDeletedBoxes] = useState([]); // Currently deleted boxes (loaded from backend)

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;
    const ZOOM_STEP = 0.25;

    // Draw bounding boxes when component mounts or data changes
    useEffect(() => {
        if (editedBoxes.length > 0 && imageRef.current && canvasRef.current) {
            const image = imageRef.current;
            
            if (image.complete) {
                drawBoundingBoxes();
            } else {
                image.onload = drawBoundingBoxes;
            }
        }
    }, [editedBoxes, visibleBoxes, editingBoxIndex, zoomLevel, panOffset]);

    // Load deleted boxes from backend
    useEffect(() => {
        if (inspection?.deletedBoundingBoxes) {
            try {
                const deleted = JSON.parse(inspection.deletedBoundingBoxes);
                setDeletedBoxes(deleted || []);
            } catch (err) {
                console.error('Failed to parse deleted boxes:', err);
                setDeletedBoxes([]);
            }
        }
    }, [inspection?.deletedBoundingBoxes]);

    // Helper: parse AI predictions and existing edited records
    const parseAiPredictions = () => {
        try {
            if (!inspection?.aiBoundingBoxes) return [];
            const ai = JSON.parse(inspection.aiBoundingBoxes);
            return Array.isArray(ai?.predictions) ? ai.predictions : [];
        } catch { return []; }
    };

    const parseExistingEdited = () => {
        try {
            if (!inspection?.editedOrManuallyAddedBoxes) return [];
            const ed = JSON.parse(inspection.editedOrManuallyAddedBoxes);
            return Array.isArray(ed) ? ed : [];
        } catch { return []; }
    };

    const boxesCloseAbs = (a, b, eps = 2.0) => {
        if (!a || !b) return false;
        return Math.abs(a[0]-b[0]) < eps && Math.abs(a[1]-b[1]) < eps && Math.abs(a[2]-b[2]) < eps && Math.abs(a[3]-b[3]) < eps;
    };

    // Sync editedBoxes with boundingBoxes prop (enrich with origin metadata)
    useEffect(() => {
        const aiPreds = parseAiPredictions();
        const existingEdited = parseExistingEdited();
        const enriched = (boundingBoxes || []).map((p) => {
            // Try to find AI origin
            const matchedAi = aiPreds.find(ai => boxesCloseAbs(ai.box, p.box, 2.0));
            if (matchedAi) {
                return { ...p, source: 'ai', originBox: matchedAi.box, prevType: 'ai' };
            }
            // Try to find existing edited originBox by matching current box to previous edited box
            const matchedEdited = existingEdited.find(ed => ed.box && boxesCloseAbs(ed.box, p.box, 2.0));
            if (matchedEdited) {
                const typeLower = (matchedEdited.type ? String(matchedEdited.type).toLowerCase() : (matchedEdited.originalBox ? 'edited' : 'added'));
                return { ...p, source: 'edited', originBox: matchedEdited.originalBox || matchedEdited.box, prevType: typeLower };
            }
            // Default to manual/edited with itself as origin
            return { ...p, source: 'edited', originBox: p.box, prevType: 'added' };
        });
        setEditedBoxes(enriched);
        setVisibleBoxes(enriched.map((_, idx) => idx));
        // Seed notes from incoming predictions (if any comments are present)
        const initialNotes = {};
        enriched.forEach((p, idx) => {
            if (p.comment && typeof p.comment === 'string' && p.comment.trim() !== '') {
                initialNotes[idx] = p.comment;
            }
        });
        setBoxNotes(initialNotes);
        // Expand note sections that already have content
        const initialExpanded = {};
        Object.keys(initialNotes).forEach(k => { initialExpanded[k] = true; });
        setExpandedNotes(initialExpanded);
    }, [boundingBoxes, inspection?.aiBoundingBoxes, inspection?.editedOrManuallyAddedBoxes]);

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    };

    const handleContainerMouseDown = (e) => {
        // Only allow panning when zoomed in and not in edit mode or dragging corner
        if (zoomLevel > 1 && !isDragging && e.target === containerRef.current) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        }
    };

    const handleContainerMouseMove = (e) => {
        if (isPanning) {
            setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }
    };

    const handleContainerMouseUp = () => {
        setIsPanning(false);
    };

    const toggleBoxVisibility = (index) => {
        setVisibleBoxes(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    const toggleEditMode = (index) => {
        if (editingBoxIndex === index) {
            setEditingBoxIndex(null);
            // Collapse note section when exiting edit mode
            setExpandedNotes(prev => ({ ...prev, [index]: false }));
        } else {
            setEditingBoxIndex(index);
            // Expand note section when entering edit mode
            setExpandedNotes(prev => ({ ...prev, [index]: true }));
        }
    };

    const handleNoteChange = (index, note) => {
        setBoxNotes(prev => ({
            ...prev,
            [index]: note
        }));
    };

    const toggleNoteExpansion = (index) => {
        setExpandedNotes(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleDeleteClick = (index) => {
        setDeleteIndex(index);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (deleteIndex === null) return;
        // Capture deletion metadata BEFORE removing
        const toDelete = editedBoxes[deleteIndex];
        const deleteNote = boxNotes[deleteIndex] || '';
        setDeletedMeta(prev => ([...prev, {
            box: toDelete.box,
            class: toDelete.class,
            confidence: toDelete.confidence,
            note: deleteNote,
        }]));

        // Remove the box from editedBoxes
        setEditedBoxes(prev => prev.filter((_, idx) => idx !== deleteIndex));
        
        // Update visibleBoxes - remove the deleted index and adjust remaining indices
        setVisibleBoxes(prev => {
            const newVisible = prev
                .filter(idx => idx !== deleteIndex)
                .map(idx => idx > deleteIndex ? idx - 1 : idx);
            return newVisible;
        });

        // Update notes - remove deleted box's note and adjust indices
        setBoxNotes(prev => {
            const newNotes = {};
            Object.keys(prev).forEach(key => {
                const idx = parseInt(key);
                if (idx < deleteIndex) {
                    newNotes[idx] = prev[key];
                } else if (idx > deleteIndex) {
                    newNotes[idx - 1] = prev[key];
                }
            });
            return newNotes;
        });

        // Update expanded notes
        setExpandedNotes(prev => {
            const newExpanded = {};
            Object.keys(prev).forEach(key => {
                const idx = parseInt(key);
                if (idx < deleteIndex) {
                    newExpanded[idx] = prev[key];
                } else if (idx > deleteIndex) {
                    newExpanded[idx - 1] = prev[key];
                }
            });
            return newExpanded;
        });
        
        // If the deleted box was being edited, clear edit mode
        if (editingBoxIndex === deleteIndex) {
            setEditingBoxIndex(null);
        } else if (editingBoxIndex !== null && editingBoxIndex > deleteIndex) {
            // Adjust editing index if it's after the deleted box
            setEditingBoxIndex(editingBoxIndex - 1);
        }
        
        // Close the dialog
        setShowDeleteDialog(false);
        setDeleteIndex(null);
    };

    const cancelDelete = () => {
        setShowDeleteDialog(false);
        setDeleteIndex(null);
    };

    const getCornerPosition = (corner, box, scaleX, scaleY) => {
        const [x1, y1, x2, y2] = box;
        switch (corner) {
            case 'tl': return { x: x1 * scaleX, y: y1 * scaleY };
            case 'tr': return { x: x2 * scaleX, y: y1 * scaleY };
            case 'bl': return { x: x1 * scaleX, y: y2 * scaleY };
            case 'br': return { x: x2 * scaleX, y: y2 * scaleY };
            default: return { x: 0, y: 0 };
        }
    };

    const isNearCorner = (mouseX, mouseY, cornerX, cornerY, threshold = 10) => {
        const dx = mouseX - cornerX;
        const dy = mouseY - cornerY;
        return Math.sqrt(dx * dx + dy * dy) < threshold;
    };

    const handleCanvasMouseDown = (e) => {
        if (editingBoxIndex === null) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / zoomLevel;
        const mouseY = (e.clientY - rect.top) / zoomLevel;

        const image = imageRef.current;
        const baseScaleX = image.width / image.naturalWidth;
        const baseScaleY = image.height / image.naturalHeight;

        const box = editedBoxes[editingBoxIndex].box;
        const corners = ['tl', 'tr', 'bl', 'br'];

        for (const corner of corners) {
            const pos = getCornerPosition(corner, box, baseScaleX, baseScaleY);
            if (isNearCorner(mouseX, mouseY, pos.x, pos.y)) {
                setDraggingCorner(corner);
                setIsDragging(true);
                return;
            }
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (!isDragging || draggingCorner === null || editingBoxIndex === null) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / zoomLevel;
        const mouseY = (e.clientY - rect.top) / zoomLevel;

        const image = imageRef.current;
        const baseScaleX = image.width / image.naturalWidth;
        const baseScaleY = image.height / image.naturalHeight;

        // Convert mouse position to image coordinates
        const imgX = mouseX / baseScaleX;
        const imgY = mouseY / baseScaleY;

        setEditedBoxes(prev => {
            const newBoxes = [...prev];
            const [x1, y1, x2, y2] = newBoxes[editingBoxIndex].box;

            let newBox;
            switch (draggingCorner) {
                case 'tl':
                    newBox = [imgX, imgY, x2, y2];
                    break;
                case 'tr':
                    newBox = [x1, imgY, imgX, y2];
                    break;
                case 'bl':
                    newBox = [imgX, y1, x2, imgY];
                    break;
                case 'br':
                    newBox = [x1, y1, imgX, imgY];
                    break;
                default:
                    newBox = [x1, y1, x2, y2];
            }

            // Ensure coordinates are in correct order (x1 < x2, y1 < y2)
            const normalizedBox = [
                Math.min(newBox[0], newBox[2]),
                Math.min(newBox[1], newBox[3]),
                Math.max(newBox[0], newBox[2]),
                Math.max(newBox[1], newBox[3])
            ];

            newBoxes[editingBoxIndex] = {
                ...newBoxes[editingBoxIndex],
                box: normalizedBox
            };

            return newBoxes;
        });
    };

    const handleCanvasMouseUp = () => {
        setIsDragging(false);
        setDraggingCorner(null);
    };

    const drawBoundingBoxes = () => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Get the base displayed size of the image (before zoom)
        const baseWidth = image.width;
        const baseHeight = image.height;
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;

        // Calculate base scaling ratios
        const baseScaleX = baseWidth / naturalWidth;
        const baseScaleY = baseHeight / naturalHeight;

        // Set canvas size to match zoomed image size
        canvas.width = baseWidth * zoomLevel;
        canvas.height = baseHeight * zoomLevel;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply zoom scaling
        ctx.scale(zoomLevel, zoomLevel);

        // Draw each bounding box (only if visible)
        editedBoxes.forEach((prediction, index) => {
            // Skip if this box is not visible
            if (!visibleBoxes.includes(index)) return;

            const [x1, y1, x2, y2] = prediction.box;
            
            // Scale coordinates to match base image size
            const scaledX1 = x1 * baseScaleX;
            const scaledY1 = y1 * baseScaleY;
            const scaledX2 = x2 * baseScaleX;
            const scaledY2 = y2 * baseScaleY;
            const width = scaledX2 - scaledX1;
            const height = scaledY2 - scaledY1;

            // Color based on class
            let color;
            switch (prediction.class) {
                case 0:
                    color = '#ef4444'; // Red - Faulty
                    break;
                case 1:
                    color = '#10b981'; // Green - Normal
                    break;
                case 2:
                    color = '#f59e0b'; // Orange - Potentially Faulty
                    break;
                default:
                    color = '#6b7280'; // Gray
            }

            // Draw rectangle
            ctx.strokeStyle = color;
            ctx.lineWidth = (index === editingBoxIndex ? 4 : 3) / zoomLevel;
            ctx.strokeRect(scaledX1, scaledY1, width, height);

            // Draw error number badge in top-left corner
            const errorNumber = `${index + 1}`;
            const fontSize = 14 / zoomLevel;
            ctx.font = `bold ${fontSize}px Arial`;
            const badgeSize = 24 / zoomLevel;
            
            // Draw circular badge background
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(scaledX1 + badgeSize/2, scaledY1 + badgeSize/2, badgeSize/2, 0, 2 * Math.PI);
            ctx.fill();

            // Draw error number
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(errorNumber, scaledX1 + badgeSize/2, scaledY1 + badgeSize/2);
            
            // Reset text alignment
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';

            // Draw corner handles if in edit mode
            if (index === editingBoxIndex) {
                const cornerRadius = 6 / zoomLevel;
                const corners = [
                    { x: scaledX1, y: scaledY1 }, // top-left
                    { x: scaledX2, y: scaledY1 }, // top-right
                    { x: scaledX1, y: scaledY2 }, // bottom-left
                    { x: scaledX2, y: scaledY2 }  // bottom-right
                ];

                corners.forEach(corner => {
                    // Outer circle (white border)
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(corner.x, corner.y, cornerRadius + 1/zoomLevel, 0, 2 * Math.PI);
                    ctx.fill();

                    // Inner circle (gray)
                    ctx.fillStyle = '#6b7280';
                    ctx.beginPath();
                    ctx.arc(corner.x, corner.y, cornerRadius, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }
        });

        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);

        // Helper distance and closeness for boxes
        const boxDistance = (a, b) => Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[2]-b[2]) + Math.abs(a[3]-b[3]);
        const boxesClose = (a, b, eps = 2.0) => boxDistance(a, b) < eps;
        const boxMatchThreshold = (o) => {
            // Dynamic threshold based on box size to better capture large-but-related edits
            const w = Math.abs(o[2] - o[0]);
            const h = Math.abs(o[3] - o[1]);
            return Math.max(10.0, 1.5 * (w + h));
        };

        try {
            const original = boundingBoxes || [];
            const current = editedBoxes || [];

            let aiBoxCount = 0;
            if (inspection?.aiBoundingBoxes) {
                try {
                    const aiData = JSON.parse(inspection.aiBoundingBoxes);
                    if (aiData && Array.isArray(aiData.predictions)) {
                        aiBoxCount = aiData.predictions.length;
                    }
                } catch (err) {
                    console.warn('Failed to parse AI bounding boxes while determining deletion origin:', err);
                }
            }

            // Build lists via metadata instead of pure geometry
            const usedOriginal = new Array(original.length).fill(false);
            const usedCurrent = new Array(current.length).fill(false);

            const nowIso = new Date().toISOString();
            const userId = 'ui-user';

            const added = [];
            const edited = [];
            const deleted = [];

            // Construct edits/additions from enriched metadata
            current.forEach((c, idx) => {
                const note = (boxNotes[idx] || '');
                if (c.source === 'ai') {
                    // Moved vs unchanged AI prediction
                    if (!boxesCloseAbs(c.box, c.originBox, 2.0)) {
                        edited.push({
                            type: 'edited', userId, timestamp: nowIso,
                            comment: note,
                            originalBox: c.originBox, box: c.box, class: c.class, confidence: c.confidence,
                        });
                    }
                } else if (c.source === 'edited') {
                    // Preserve prior type if it existed in DB
                    const prior = c.prevType || 'added';
                    if (prior === 'edited' && c.originBox && !boxesCloseAbs(c.box, c.originBox, 2.0)) {
                        // Remains an edit of its original AI box
                        edited.push({
                            type: 'edited', userId, timestamp: nowIso,
                            comment: note,
                            originalBox: c.originBox, box: c.box, class: c.class, confidence: c.confidence,
                        });
                    } else if (prior === 'edited' && c.originBox && boxesCloseAbs(c.box, c.originBox, 2.0)) {
                        // No new change to persist for an edited item
                    } else {
                        // Added (new manual or previously manual)
                        added.push({
                            type: 'added', userId, timestamp: nowIso,
                            comment: note,
                            box: c.box, class: c.class, confidence: c.confidence,
                        });
                    }
                } else {
                    // Fallback: if classification metadata is missing, treat as added
                    added.push({
                        type: 'added', userId, timestamp: nowIso,
                        comment: note,
                        box: c.box, class: c.class, confidence: c.confidence,
                    });
                }
            });

            // Deleted: original not matched
            // Helper: find note for a deleted original box by matching geometry to captured deletedMeta
            const findDeletedNote = (box) => {
                let bestIdx = -1;
                let bestD = Number.POSITIVE_INFINITY;
                for (let k = 0; k < deletedMeta.length; k++) {
                    const dm = deletedMeta[k];
                    const d = boxDistance(box, dm.box);
                    if (d < bestD) { bestD = d; bestIdx = k; }
                }
                if (bestIdx !== -1) {
                    return deletedMeta[bestIdx].note || '';
                }
                return '';
            };

            // Deleted: AI predictions that are no longer present as current items with source 'ai'
            // Any current box that originated from an AI prediction (including edited ones)
            const representedAiOrigins = new Set(
                current
                    .filter(c => c.originBox)
                    .map(c => JSON.stringify(c.originBox))
            );
            // Collect AI originals from inspection.aiBoundingBoxes strictly (not the merged original)
            const aiOriginals = parseAiPredictions();
            aiOriginals.forEach((o) => {
                const key = JSON.stringify(o.box);
                if (!representedAiOrigins.has(key)) {
                    deleted.push({
                        type: 'deleted', userId, timestamp: nowIso,
                        comment: findDeletedNote(o.box),
                        box: o.box, class: o.class, confidence: o.confidence,
                        deletedFrom: 'ai',
                    });
                }
            });

            // Ensure we don't double-account: remove any deleted that overlaps with edited entries
            const deletedFiltered = deleted.filter((del) => {
                const delBox = del.box;
                // If any edited entry references this box (either as originalBox or new box), don't keep as deleted
                for (const ed of edited) {
                    if (ed.originalBox && boxesClose(delBox, ed.originalBox, 2.0)) return false;
                    if (ed.box && boxesClose(delBox, ed.box, 2.0)) return false;
                }
                return true;
            });

            const payload = {
                editedOrManuallyAddedBoxes: JSON.stringify([...added, ...edited]),
                deletedBoundingBoxes: JSON.stringify(deletedFiltered),
            };

            const response = await axios.post(
                `http://localhost:8080/api/inspections/${inspection.inspectionNo}/annotations`,
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );

            console.log('Annotations saved successfully:', response.data);

            if (onSave) await onSave();
            onClose();
        } catch (error) {
            console.error('Failed to save annotations:', error);
            setSaveError(error.response?.data?.message || 'Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRecoverBox = async (deletedBox) => {
        try {
            setIsSaving(true);
            setSaveError(null);

            // Determine destination column (prefer backend metadata, then fall back)
            let destination = deletedBox.deletedFrom ? deletedBox.deletedFrom.toLowerCase() : null;
            if (!destination || destination.trim() === '') {
                // Fallback: check if this box matches current AI predictions
                const originalAiBoxes = boundingBoxes || [];
                const tolerance = 2.0;
                const isFromAI = originalAiBoxes.some(aiBox => (
                    Math.abs(aiBox.box[0] - deletedBox.box[0]) < tolerance &&
                    Math.abs(aiBox.box[1] - deletedBox.box[1]) < tolerance &&
                    Math.abs(aiBox.box[2] - deletedBox.box[2]) < tolerance &&
                    Math.abs(aiBox.box[3] - deletedBox.box[3]) < tolerance
                ));
                destination = isFromAI ? 'ai' : 'edited';
            }

            if (destination === 'manual') {
                destination = 'edited';
            }

            const payload = {
                box: deletedBox.box,
                destination: destination
            };

            await axios.post(
                `http://localhost:8080/api/inspections/${inspection.inspectionNo}/annotations/recover`,
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );

            console.log('Box recovered successfully to:', destination);

            // Optimistically remove recovered entry from local deleted list
            setDeletedBoxes(prev => prev.filter(entry => {
                const tolerance = 0.5;
                return Math.abs(entry.box[0] - deletedBox.box[0]) > tolerance ||
                    Math.abs(entry.box[1] - deletedBox.box[1]) > tolerance ||
                    Math.abs(entry.box[2] - deletedBox.box[2]) > tolerance ||
                    Math.abs(entry.box[3] - deletedBox.box[3]) > tolerance;
            }));

            // Refresh inspection data to update UI
            if (onSave) await onSave();
            
            // Reload deleted boxes from latest inspection snapshot
            const response = await axios.get(`http://localhost:8080/api/inspections/${inspection.inspectionNo}`);
            if (response.data?.deletedBoundingBoxes) {
                const deleted = JSON.parse(response.data.deletedBoundingBoxes);
                setDeletedBoxes(deleted || []);
            } else {
                setDeletedBoxes([]);
            }

            // Remove recovered entry from cached deleted metadata
            setDeletedMeta(prev => prev.filter(entry => {
                const tolerance = 0.5;
                return Math.abs(entry.box[0] - deletedBox.box[0]) > tolerance ||
                    Math.abs(entry.box[1] - deletedBox.box[1]) > tolerance ||
                    Math.abs(entry.box[2] - deletedBox.box[2]) > tolerance ||
                    Math.abs(entry.box[3] - deletedBox.box[3]) > tolerance;
            }));
        } catch (error) {
            console.error('Failed to recover box:', error);
            setSaveError(error.response?.data?.message || 'Failed to recover box. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddNewBox = () => {
        setShowAddDialog(true);
        setSelectedClass(null);
    };

    const confirmAddBox = () => {
        if (selectedClass === null) {
            alert('Please select a classification');
            return;
        }

        const image = imageRef.current;
        if (!image) return;

        // Create a new box in the center of the image with default size
        const centerX = image.naturalWidth / 2;
        const centerY = image.naturalHeight / 2;
        const defaultWidth = 100;
        const defaultHeight = 100;

        const newBox = {
            box: [
                centerX - defaultWidth / 2,
                centerY - defaultHeight / 2,
                centerX + defaultWidth / 2,
                centerY + defaultHeight / 2
            ],
            class: selectedClass,
            confidence: 1.0, // Default confidence for manually added boxes
            source: 'edited', // treat as manual/edited origin for save classification
            prevType: 'added' // ensure it persists as an added item
        };

        // Add the new box to editedBoxes
        setEditedBoxes(prev => [...prev, newBox]);
        
        // Make it visible
        setVisibleBoxes(prev => [...prev, editedBoxes.length]);
        
        // Automatically enter edit mode for the new box
        setEditingBoxIndex(editedBoxes.length);
        
        // Expand note section for new box
        setExpandedNotes(prev => ({ ...prev, [editedBoxes.length]: true }));
        
        // Close the dialog
        setShowAddDialog(false);
        setSelectedClass(null);
    };

    const cancelAddBox = () => {
        setShowAddDialog(false);
        setSelectedClass(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative z-50">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-semibold text-gray-800">Edit Bounding Boxes</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                        disabled={isSaving}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Error Message */}
                    {saveError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            ❌ {saveError}
                        </div>
                    )}

                    {/* Image Section with Canvas Overlay */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-700">AI Analysis Image</h3>
                            {/* Zoom Controls */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleZoomOut}
                                    disabled={zoomLevel <= MIN_ZOOM}
                                    className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Zoom Out"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                    </svg>
                                </button>
                                <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                                    {Math.round(zoomLevel * 100)}%
                                </span>
                                <button
                                    onClick={handleZoomIn}
                                    disabled={zoomLevel >= MAX_ZOOM}
                                    className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Zoom In"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleResetZoom}
                                    disabled={zoomLevel === 1 && panOffset.x === 0 && panOffset.y === 0}
                                    className="px-3 py-2 bg-white border border-gray-300 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Reset Zoom"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                        {editingBoxIndex !== null && (
                            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                                ✏️ Editing mode active for Error {editingBoxIndex + 1}. Drag the corner handles to resize the box.
                            </div>
                        )}
                        <div 
                            ref={containerRef}
                            className="bg-gray-100 border rounded-lg flex items-center justify-center p-4 overflow-auto max-h-[500px]"
                            style={{ cursor: isPanning ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default') }}
                            onMouseDown={handleContainerMouseDown}
                            onMouseMove={handleContainerMouseMove}
                            onMouseUp={handleContainerMouseUp}
                            onMouseLeave={handleContainerMouseUp}
                        >
                            <div 
                                className="relative inline-block"
                                style={{
                                    transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
                                }}
                            >
                                <img
                                    ref={imageRef}
                                    src={`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`}
                                    alt="Thermal Analysis - Edit Mode"
                                    className="block"
                                    style={{
                                        transform: `scale(${zoomLevel})`,
                                        transformOrigin: 'top left',
                                        maxWidth: 'none'
                                    }}
                                    crossOrigin="anonymous"
                                    onLoad={drawBoundingBoxes}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0"
                                    style={{ 
                                        cursor: editingBoxIndex !== null ? 'crosshair' : 'inherit',
                                        pointerEvents: editingBoxIndex !== null ? 'auto' : 'none'
                                    }}
                                    onMouseDown={handleCanvasMouseDown}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseUp}
                                />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {editingBoxIndex !== null 
                                ? 'Drag the gray corner handles to resize the bounding box. Use zoom controls for precision.'
                                : zoomLevel > 1 
                                    ? 'Click and drag to pan the image. Click "Edit" on an error to enable drag-to-resize mode.'
                                    : 'Use zoom controls to zoom in. Click "Edit" on an error to enable drag-to-resize mode.'
                            }
                        </p>
                    </div>

                    {/* Detection Details Section */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-700">
                                Detected Anomalies ({editedBoxes.length})
                            </h3>
                            <button
                                onClick={handleAddNewBox}
                                className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <span className="text-lg font-bold">+</span>
                                <span>Add New Box</span>
                            </button>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {editedBoxes.map((pred, idx) => {
                                const className = pred.class === 0 ? 'Faulty' : pred.class === 1 ? 'Normal' : 'Potentially Faulty';
                                const colorClass = pred.class === 0 ? 'text-red-600' : pred.class === 1 ? 'text-green-600' : 'text-orange-600';
                                const bgColor = pred.class === 0 ? 'bg-red-600' : pred.class === 1 ? 'bg-green-600' : 'bg-orange-600';
                                const bgClass = pred.class === 0 ? 'bg-red-50' : pred.class === 1 ? 'bg-green-50' : 'bg-orange-50';
                                const isVisible = visibleBoxes.includes(idx);
                                const isEditing = editingBoxIndex === idx;
                                const hasNote = boxNotes[idx] && boxNotes[idx].trim() !== '';
                                const isNoteExpanded = expandedNotes[idx] || false;
                                
                                return (
                                    <div key={idx} className={`rounded-lg border ${!isVisible ? 'opacity-50' : ''} ${isEditing ? 'ring-2 ring-blue-500' : ''}`}>
                                        {/* Main row */}
                                        <div className={`flex items-center justify-between p-3 ${bgClass}`}>
                                            <div className="flex items-center space-x-3 flex-1">
                                                {/* Visibility Checkbox */}
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isVisible}
                                                        onChange={() => toggleBoxVisibility(idx)}
                                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </label>
                                                
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`${bgColor} text-white px-2 py-1 rounded text-xs font-semibold`}>
                                                            Error {idx + 1}
                                                        </span>
                                                        <span className={`font-medium ${colorClass} text-sm`}>
                                                            {className}
                                                            {isEditing && <span className="ml-2 text-xs text-blue-600">(Editing)</span>}
                                                        </span>
                                                        {hasNote && (
                                                            <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                                                📝 Note added
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Confidence: {(pred.confidence * 100).toFixed(1)}%
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Box: [{pred.box.map(v => v.toFixed(0)).join(', ')}]
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => toggleEditMode(idx)}
                                                    className={`px-3 py-1 border text-sm rounded transition-colors ${
                                                        isEditing 
                                                            ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {isEditing ? '✓ Done' : 'Edit'}
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(idx)}
                                                    className="px-3 py-1 bg-red-100 border border-red-300 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Note Section - Shows when editing or when note exists */}
                                        {(isEditing || hasNote) && isNoteExpanded && (
                                            <div className={`border-t ${bgClass} bg-opacity-50 p-3`}>
                                                <div className="flex items-start space-x-2">
                                                    <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            Add Note (optional)
                                                        </label>
                                                        <textarea
                                                            value={boxNotes[idx] || ''}
                                                            onChange={(e) => handleNoteChange(idx, e.target.value)}
                                                            placeholder="Add notes about this error detection or any changes made..."
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                                            rows="3"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {boxNotes[idx] ? `${boxNotes[idx].length} characters` : 'No note added'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Expand/Collapse Note Toggle - Only show if not editing but has note */}
                                        {!isEditing && hasNote && (
                                            <button
                                                onClick={() => toggleNoteExpansion(idx)}
                                                className={`w-full py-2 text-xs text-gray-600 hover:text-gray-800 border-t ${bgClass} bg-opacity-30 flex items-center justify-center space-x-1 transition-colors`}
                                            >
                                                <span>{isNoteExpanded ? 'Hide Note' : 'Show Note'}</span>
                                                <svg 
                                                    className={`w-4 h-4 transform transition-transform ${isNoteExpanded ? 'rotate-180' : ''}`} 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Deleted Boxes Section */}
                    {deletedBoxes.length > 0 && (
                        <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                            <h3 className="font-semibold text-red-700 mb-3">
                                Deleted Boxes ({deletedBoxes.length})
                            </h3>
                            <p className="text-xs text-red-600 mb-3">
                                These boxes have been deleted but can be recovered. Click "Recover" to restore a box.
                            </p>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {deletedBoxes.map((box, idx) => {
                                    const className = box.class === 0 ? 'Faulty' : box.class === 1 ? 'Normal' : 'Potentially Faulty';
                                    const colorClass = box.class === 0 ? 'text-red-600' : box.class === 1 ? 'text-green-600' : 'text-orange-600';
                                    const bgColor = box.class === 0 ? 'bg-red-600' : box.class === 1 ? 'bg-green-600' : 'bg-orange-600';
                                    
                                    return (
                                        <div key={idx} className="bg-white rounded-lg border border-red-200 p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`${bgColor} text-white px-2 py-1 rounded text-xs font-semibold`}>
                                                            Deleted #{idx + 1}
                                                        </span>
                                                        <span className={`font-medium ${colorClass} text-sm`}>
                                                            {className}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600">
                                                        Confidence: {(box.confidence * 100).toFixed(1)}%
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Box: [{box.box.map(v => v.toFixed(0)).join(', ')}]
                                                    </p>
                                                    {box.comment && (
                                                        <p className="text-xs text-gray-600 mt-1 italic">
                                                            Note: {box.comment}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Deleted: {new Date(box.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRecoverBox(box)}
                                                    disabled={isSaving}
                                                    className="ml-3 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Recover
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Save Changes</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Add New Box Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Bounding Box</h3>
                        <p className="text-sm text-gray-600 mb-4">Select the classification for the new bounding box:</p>
                        
                        <div className="space-y-3 mb-6">
                            {/* Faulty Option */}
                            <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedClass === 0 ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                            }`}>
                                <input
                                    type="radio"
                                    name="classification"
                                    value="0"
                                    checked={selectedClass === 0}
                                    onChange={() => setSelectedClass(0)}
                                    className="w-4 h-4 text-red-600 cursor-pointer"
                                />
                                <span className="ml-3 flex items-center">
                                    <span className="w-4 h-4 bg-red-600 rounded-full mr-2"></span>
                                    <span className="font-medium text-gray-700">Faulty</span>
                                </span>
                            </label>

                            {/* Potentially Faulty Option */}
                            <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedClass === 2 ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                            }`}>
                                <input
                                    type="radio"
                                    name="classification"
                                    value="2"
                                    checked={selectedClass === 2}
                                    onChange={() => setSelectedClass(2)}
                                    className="w-4 h-4 text-orange-600 cursor-pointer"
                                />
                                <span className="ml-3 flex items-center">
                                    <span className="w-4 h-4 bg-orange-600 rounded-full mr-2"></span>
                                    <span className="font-medium text-gray-700">Potentially Faulty</span>
                                </span>
                            </label>

                            {/* Normal Option */}
                            <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedClass === 1 ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                            }`}>
                                <input
                                    type="radio"
                                    name="classification"
                                    value="1"
                                    checked={selectedClass === 1}
                                    onChange={() => setSelectedClass(1)}
                                    className="w-4 h-4 text-green-600 cursor-pointer"
                                />
                                <span className="ml-3 flex items-center">
                                    <span className="w-4 h-4 bg-green-600 rounded-full mr-2"></span>
                                    <span className="font-medium text-gray-700">Normal</span>
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center justify-end space-x-3">
                            <button
                                onClick={cancelAddBox}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAddBox}
                                disabled={selectedClass === null}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Box
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Delete Bounding Box</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Are you sure you want to delete Error {deleteIndex !== null ? deleteIndex + 1 : ''}?
                                </p>
                            </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-6">
                            The bounding box will be moved to the deleted section. You can recover it later if needed.
                        </p>

                        <div className="flex items-center justify-end space-x-3">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditBoundingBoxesPopup;
