import React, { useEffect, useRef } from 'react';

const BoundingBoxOverlay = ({ 
    boundingBoxes = [], 
    showBoxes = true, 
    imageRef = null,
    className = "",
    onBoundingBoxClick = null
}) => {
    const canvasRef = useRef(null);

    const handleCanvasClick = (event) => {
        if (!onBoundingBoxClick || !showBoxes || !boundingBoxes.length) return;
        
        const canvas = canvasRef.current;
        const image = imageRef?.current;
        
        if (!canvas || !image) return;
        
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // Get container and image dimensions
        const containerWidth = image.offsetWidth;
        const containerHeight = image.offsetHeight;
        const imageNaturalWidth = image.naturalWidth;
        const imageNaturalHeight = image.naturalHeight;

        // Calculate the displayed image dimensions and position when using object-contain
        const containerAspectRatio = containerWidth / containerHeight;
        const imageAspectRatio = imageNaturalWidth / imageNaturalHeight;

        let displayedImageWidth, displayedImageHeight, offsetX, offsetY;

        if (imageAspectRatio > containerAspectRatio) {
            displayedImageWidth = containerWidth;
            displayedImageHeight = containerWidth / imageAspectRatio;
            offsetX = 0;
            offsetY = (containerHeight - displayedImageHeight) / 2;
        } else {
            displayedImageWidth = containerHeight * imageAspectRatio;
            displayedImageHeight = containerHeight;
            offsetX = (containerWidth - displayedImageWidth) / 2;
            offsetY = 0;
        }

        const scaleX = displayedImageWidth / imageNaturalWidth;
        const scaleY = displayedImageHeight / imageNaturalHeight;
        
        // Check if click is inside any bounding box
        for (let i = 0; i < boundingBoxes.length; i++) {
            const prediction = boundingBoxes[i];
            const [x1, y1, x2, y2] = prediction.box;
            
            const scaledX1 = (x1 * scaleX) + offsetX;
            const scaledY1 = (y1 * scaleY) + offsetY;
            const scaledX2 = (x2 * scaleX) + offsetX;
            const scaledY2 = (y2 * scaleY) + offsetY;
            
            if (clickX >= scaledX1 && clickX <= scaledX2 && 
                clickY >= scaledY1 && clickY <= scaledY2) {
                onBoundingBoxClick(prediction, i);
                break;
            }
        }
    };

    const drawBoundingBoxes = () => {
        const canvas = canvasRef.current;
        const image = imageRef?.current;
        
        if (!canvas || !image) return;
        
        const ctx = canvas.getContext('2d');

        // Get container and image dimensions
        const containerWidth = image.offsetWidth;
        const containerHeight = image.offsetHeight;
        const imageNaturalWidth = image.naturalWidth;
        const imageNaturalHeight = image.naturalHeight;

        // Set canvas size to match the container
        canvas.width = containerWidth;
        canvas.height = containerHeight;

        // Calculate the displayed image dimensions and position when using object-contain
        const containerAspectRatio = containerWidth / containerHeight;
        const imageAspectRatio = imageNaturalWidth / imageNaturalHeight;

        let displayedImageWidth, displayedImageHeight, offsetX, offsetY;

        if (imageAspectRatio > containerAspectRatio) {
            // Image is wider - fit to width, center vertically
            displayedImageWidth = containerWidth;
            displayedImageHeight = containerWidth / imageAspectRatio;
            offsetX = 0;
            offsetY = (containerHeight - displayedImageHeight) / 2;
        } else {
            // Image is taller - fit to height, center horizontally
            displayedImageWidth = containerHeight * imageAspectRatio;
            displayedImageHeight = containerHeight;
            offsetX = (containerWidth - displayedImageWidth) / 2;
            offsetY = 0;
        }

        // Calculate scale factors based on displayed image size
        const scaleX = displayedImageWidth / imageNaturalWidth;
        const scaleY = displayedImageHeight / imageNaturalHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!showBoxes || !boundingBoxes.length) return;

        // Draw each bounding box
        boundingBoxes.forEach((prediction) => {
            const [x1, y1, x2, y2] = prediction.box;
            
            // Scale and offset the coordinates to match displayed image position
            const scaledX1 = (x1 * scaleX) + offsetX;
            const scaledY1 = (y1 * scaleY) + offsetY;
            const scaledWidth = (x2 - x1) * scaleX;
            const scaledHeight = (y2 - y1) * scaleY;

            // Color based on class
            let color, label;
            switch (prediction.class) {
                case 0:
                    color = '#ef4444'; // Red - Faulty
                    label = 'Faulty';
                    break;
                case 1:
                    color = '#10b981'; // Green - Normal
                    label = 'Normal';
                    break;
                case 2:
                    color = '#f59e0b'; // Orange - Potentially Faulty
                    label = 'Potentially Faulty';
                    break;
                default:
                    color = '#6b7280'; // Gray
                    label = 'Unknown';
            }

            // Draw rectangle using scaled coordinates
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(scaledX1, scaledY1, scaledWidth, scaledHeight);

            // Draw label background
            const labelText = `${label} (${(prediction.confidence * 100).toFixed(1)}%)`;
            ctx.font = 'bold 16px Arial';
            const textMetrics = ctx.measureText(labelText);
            const textHeight = 20;
            
            ctx.fillStyle = color;
            ctx.fillRect(scaledX1, scaledY1 - textHeight - 4, textMetrics.width + 8, textHeight + 4);

            // Draw label text
            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, scaledX1 + 4, scaledY1 - 6);
        });
    };

    // Redraw when dependencies change
    useEffect(() => {
        if (imageRef?.current) {
            const image = imageRef.current;
            
            if (image.complete) {
                drawBoundingBoxes();
            } else {
                image.onload = drawBoundingBoxes;
            }
            
            // Add resize observer to redraw when image size changes
            const resizeObserver = new ResizeObserver(() => {
                drawBoundingBoxes();
            });
            
            resizeObserver.observe(image);
            
            return () => {
                resizeObserver.disconnect();
            };
        }
    }, [showBoxes, boundingBoxes, imageRef]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute top-0 left-0 w-full h-full pointer-events-none ${className}`}
            style={{ display: showBoxes ? 'block' : 'none' }}
        />
    );
};

export default BoundingBoxOverlay;