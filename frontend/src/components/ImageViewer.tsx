import React, { useState, useRef, useEffect } from 'react';

interface ImageViewerProps {
  imageUrl: string;
  alt?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, alt = 'Invoice image' }) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when image URL changes
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsLoading(true);
    setError(null);
  }, [imageUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError('Failed to load image');
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="image-viewer flex flex-col h-full">
      {/* Controls */}
      <div className="bg-gray-100 p-3 rounded-t-lg flex items-center justify-between border-b border-gray-300">
        <div className="text-sm text-gray-700">
          {isLoading ? 'Loading image...' : 'Image loaded'}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={zoomOut}
            className="px-2 py-1 bg-white border border-gray-300 rounded-md"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button 
            onClick={zoomIn}
            className="px-2 py-1 bg-white border border-gray-300 rounded-md"
            title="Zoom In"
          >
            +
          </button>
          <button 
            onClick={resetZoom}
            className="px-2 py-1 bg-white border border-gray-300 rounded-md text-xs"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* Image Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden bg-gray-200 flex items-center justify-center relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-600 bg-red-100 p-4 rounded-md">
              {error}
            </div>
          </div>
        )}
        
        <img
          src={imageUrl}
          alt={alt}
          className="max-h-full max-w-full transition-transform duration-100"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center',
            opacity: isLoading ? 0 : 1
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable="false"
        />
      </div>
    </div>
  );
};

export default ImageViewer;
