import React from 'react';
import { X } from 'lucide-react';
import InteractiveImageViewer from './InteractiveImageViewer';

const InteractiveImageModal = ({ 
    isOpen, 
    onClose, 
    src, 
    alt, 
    title = null,
    children = null // For overlay content like bounding boxes
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full h-full max-w-7xl max-h-full p-4">
                {/* Header */}
                <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                    {title && (
                        <div className="bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg text-lg font-medium">
                            {title}
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-auto bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all duration-200 shadow-lg"
                        title="Close"
                    >
                        <X className="w-6 h-6 text-gray-800" />
                    </button>
                </div>

                {/* Interactive Image Viewer */}
                <div className="w-full h-full pt-16">
                    <InteractiveImageViewer
                        src={src}
                        alt={alt}
                        className="rounded-lg"
                        containerClassName="w-full h-full"
                        showControls={true}
                    >
                        {children}
                    </InteractiveImageViewer>
                </div>
            </div>
        </div>
    );
};

export default InteractiveImageModal;