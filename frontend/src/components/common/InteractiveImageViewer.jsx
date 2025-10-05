import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

const InteractiveImageViewer = ({ 
    src, 
    alt, 
    className = '', 
    containerClassName = '',
    showControls = true,
    onImageLoad = null,
    onTransformChange = null, // New prop to pass transform state
    children = null // For overlay content like bounding boxes
}) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // Notify parent of transform changes
    useEffect(() => {
        if (onTransformChange) {
            onTransformChange({ scale, position });
        }
    }, [scale, position, onTransformChange]);

    // Reset transform to initial state
    const resetTransform = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    // Zoom in
    const zoomIn = useCallback(() => {
        setScale(prev => Math.min(prev * 1.2, 5)); // Max zoom 5x
    }, []);

    // Zoom out
    const zoomOut = useCallback(() => {
        setScale(prev => Math.max(prev / 1.2, 0.1)); // Min zoom 0.1x
    }, []);

    // Handle wheel zoom
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(scale * delta, 0.1), 5);
        
        // Adjust position to zoom towards mouse cursor
        const scaleChange = newScale / scale;
        setPosition(prev => ({
            x: prev.x - mouseX * (scaleChange - 1),
            y: prev.y - mouseY * (scaleChange - 1)
        }));
        
        setScale(newScale);
    }, [scale]);

    // Handle mouse down for dragging
    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return; // Only left click
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
        e.preventDefault();
    }, [position]);

    // Handle mouse move for dragging
    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Handle image load
    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
        if (onImageLoad && imageRef.current) {
            onImageLoad(imageRef.current);
        }
    }, [onImageLoad]);

    // Add/remove event listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });
        
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            container.removeEventListener('wheel', handleWheel);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleWheel, handleMouseMove, handleMouseUp, isDragging]);

    // Reset when image source changes
    useEffect(() => {
        resetTransform();
        setImageLoaded(false);
    }, [src, resetTransform]);

    const imageStyle = {
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        transformOrigin: 'center center',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        pointerEvents: 'auto'
    };

    const overlayStyle = {
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        transformOrigin: 'center center',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        pointerEvents: 'none'
    };

    return (
        <div className={`relative overflow-hidden ${containerClassName}`}>
            {/* Image Container */}
            <div 
                ref={containerRef}
                className={`relative w-full h-full bg-gray-100 ${className}`}
                style={{ minHeight: '200px' }}
            >
                <img
                    ref={imageRef}
                    src={src}
                    alt={alt}
                    className="w-full h-auto max-w-none"
                    style={imageStyle}
                    onMouseDown={handleMouseDown}
                    onLoad={handleImageLoad}
                    draggable={false}
                />
                
                {/* Overlay Content */}
                {children && imageLoaded && (
                    <div 
                        className="absolute top-0 left-0 w-full h-full"
                        style={overlayStyle}
                    >
                        {React.isValidElement(children) 
                            ? React.cloneElement(children, { 
                                transform: { scale, position },
                                imageRef: imageRef 
                            })
                            : children
                        }
                    </div>
                )}
            </div>

            {/* Controls */}
            {showControls && (
                <div className="absolute top-4 left-4 flex flex-col space-y-2 bg-white bg-opacity-90 rounded-lg p-2 shadow-lg">
                    <button
                        onClick={zoomIn}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                        title="Zoom In"
                        disabled={scale >= 5}
                    >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                        onClick={zoomOut}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                        title="Zoom Out"
                        disabled={scale <= 0.1}
                    >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                        onClick={resetTransform}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                        title="Reset View"
                    >
                        <RotateCcw className="w-4 h-4 text-gray-700" />
                    </button>
                    <div className="p-2 text-xs text-gray-600 text-center">
                        <Move className="w-3 h-3 mx-auto mb-1" />
                        <div>Drag</div>
                    </div>
                </div>
            )}

            {/* Zoom Level Indicator */}
            {showControls && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                    {Math.round(scale * 100)}%
                </div>
            )}

            {/* Instructions */}
            {showControls && (
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-xs">
                    Scroll to zoom • Click and drag to pan
                </div>
            )}
        </div>
    );
};

export default InteractiveImageViewer;