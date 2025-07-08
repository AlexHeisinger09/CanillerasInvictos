import React, { useState, useEffect, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2, Move, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

const ShinGuardCanvas = ({ images, guardType, isActive }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePositions, setImagePositions] = useState({});
  const [dragState, setDragState] = useState({ isDragging: false, imageId: null, startX: 0, startY: 0 });
  const canvasRef = useRef(null);

  // Touch/Mouse interaction state
  const [touchState, setTouchState] = useState({
    touches: [],
    lastDistance: 0,
    lastAngle: 0,
    isGesturing: false
  });

  // Initialize positions for new images
  useEffect(() => {
    images.forEach((image, index) => {
      if (!imagePositions[image.id]) {
        setImagePositions(prev => ({
          ...prev,
          [image.id]: {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            initialX: 20 + (index % 2) * 40,
            initialY: 20 + Math.floor(index / 2) * 40
          }
        }));
      }
    });
  }, [images]);

  // Handle clicks outside images to deselect
  const handleCanvasClick = (e) => {
    // Only deselect if clicking directly on canvas, not on images
    if (e.target === e.currentTarget || e.target.closest('.canvas-background')) {
      setSelectedImage(null);
    }
  };

  // Mouse event handlers
  const handleMouseDown = (e, imageId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current.getBoundingClientRect();
    setDragState({
      isDragging: true,
      imageId,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top
    });
    setSelectedImage(imageId);
    
    // Add global mouse listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!dragState.isDragging || !dragState.imageId) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const deltaX = currentX - dragState.startX;
    const deltaY = currentY - dragState.startY;
    
    setImagePositions(prev => ({
      ...prev,
      [dragState.imageId]: {
        ...prev[dragState.imageId],
        x: (prev[dragState.imageId]?.x || 0) + deltaX * 0.5,
        y: (prev[dragState.imageId]?.y || 0) + deltaY * 0.5
      }
    }));
    
    setDragState(prev => ({
      ...prev,
      startX: currentX,
      startY: currentY
    }));
  };

  const handleMouseUp = () => {
    setDragState({ isDragging: false, imageId: null, startX: 0, startY: 0 });
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleWheel = (e, imageId) => {
    if (selectedImage !== imageId) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    
    setImagePositions(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        scale: Math.max(0.1, Math.min(8, (prev[imageId]?.scale || 1) + delta))
      }
    }));
  };

  // Touch event handlers
  const handleTouchStart = (e, imageId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touches = Array.from(e.touches);
    setSelectedImage(imageId);
    
    if (touches.length === 1) {
      // Single touch - drag
      const rect = canvasRef.current.getBoundingClientRect();
      setDragState({
        isDragging: true,
        imageId,
        startX: touches[0].clientX - rect.left,
        startY: touches[0].clientY - rect.top
      });
    } else if (touches.length === 2) {
      // Multi-touch - pinch/rotate
      const distance = getTouchDistance(touches[0], touches[1]);
      const angle = getTouchAngle(touches[0], touches[1]);
      
      setTouchState({
        touches,
        lastDistance: distance,
        lastAngle: angle,
        isGesturing: true
      });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touches = Array.from(e.touches);
    
    if (touches.length === 1 && dragState.isDragging) {
      // Single touch drag
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = touches[0].clientX - rect.left;
      const currentY = touches[0].clientY - rect.top;
      
      const deltaX = currentX - dragState.startX;
      const deltaY = currentY - dragState.startY;
      
      setImagePositions(prev => ({
        ...prev,
        [dragState.imageId]: {
          ...prev[dragState.imageId],
          x: (prev[dragState.imageId]?.x || 0) + deltaX * 0.5,
          y: (prev[dragState.imageId]?.y || 0) + deltaY * 0.5
        }
      }));
      
      setDragState(prev => ({
        ...prev,
        startX: currentX,
        startY: currentY
      }));
    } else if (touches.length === 2 && touchState.isGesturing && selectedImage) {
      // Multi-touch pinch/rotate
      const distance = getTouchDistance(touches[0], touches[1]);
      const angle = getTouchAngle(touches[0], touches[1]);
      
      // Scale based on distance change
      const scaleChange = (distance - touchState.lastDistance) * 0.01;
      
      // Rotation based on angle change
      let rotationChange = angle - touchState.lastAngle;
      if (rotationChange > 180) rotationChange -= 360;
      if (rotationChange < -180) rotationChange += 360;
      
      setImagePositions(prev => ({
        ...prev,
        [selectedImage]: {
          ...prev[selectedImage],
          scale: Math.max(0.1, Math.min(8, (prev[selectedImage]?.scale || 1) + scaleChange)),
          rotation: (prev[selectedImage]?.rotation || 0) + rotationChange
        }
      }));
      
      setTouchState({
        touches,
        lastDistance: distance,
        lastAngle: angle,
        isGesturing: true
      });
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({ isDragging: false, imageId: null, startX: 0, startY: 0 });
    setTouchState({ touches: [], lastDistance: 0, lastAngle: 0, isGesturing: false });
  };

  // Helper functions
  const getTouchDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchAngle = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  const handleImageClick = (imageId) => {
    setSelectedImage(selectedImage === imageId ? null : imageId);
  };

  const handleImageMove = (imageId, direction) => {
    setImagePositions(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        x: (prev[imageId]?.x || 0) + (direction === 'left' ? -10 : direction === 'right' ? 10 : 0),
        y: (prev[imageId]?.y || 0) + (direction === 'up' ? -10 : direction === 'down' ? 10 : 0)
      }
    }));
  };

  const handleImageResize = (imageId, action) => {
    setImagePositions(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        scale: Math.max(0.3, Math.min(2.5, (prev[imageId]?.scale || 1) + (action === 'increase' ? 0.15 : -0.15)))
      }
    }));
  };

  const handleImageRotate = (imageId) => {
    setImagePositions(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        rotation: (prev[imageId]?.rotation || 0) + 15
      }
    }));
  };

  const getImageStyle = (imageId, index) => {
    const position = imagePositions[imageId] || {};
    const baseLeft = position.initialX || (20 + (index % 2) * 40);
    const baseTop = position.initialY || (20 + Math.floor(index / 2) * 40);
    
    return {
      transform: `translate(${position.x || 0}px, ${position.y || 0}px) scale(${position.scale || 1}) rotate(${position.rotation || 0}deg)`,
      transition: dragState.isDragging || touchState.isGesturing ? 'none' : 'transform 0.2s ease',
      left: `${baseLeft}%`,
      top: `${baseTop}%`
    };
  };

  return (
    <div className="space-y-4">
      {/* Canvas Area */}
      <Card className={`relative bg-gradient-to-b from-gray-100 to-gray-200 border-2 transition-all duration-300 ${
        isActive ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      }`}>
        <div 
          ref={canvasRef}
          className="relative h-96 overflow-hidden rounded-lg bg-white/50 backdrop-blur-sm"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleCanvasClick}
        >
          {/* Shin Guard Shape */}
          <div className="absolute inset-4 canvas-background" onClick={handleCanvasClick}>
            <div className="relative w-full h-full">
              {/* SVG Shin Guard Shape */}
              <svg
                viewBox="0 0 200 300"
                className="absolute inset-0 w-full h-full canvas-background"
                style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))' }}
                onClick={handleCanvasClick}
              >
                <defs>
                  <linearGradient id={`shinGuardGradient-${guardType}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.9 }} />
                    <stop offset="50%" style={{ stopColor: '#f8fafc', stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: '#e2e8f0', stopOpacity: 0.7 }} />
                  </linearGradient>
                </defs>
                
                {/* Shin Guard Path - Realistic Shape */}
                <path
                  d="M 60 20 
                     C 45 20, 30 30, 30 50
                     L 30 120
                     C 30 140, 35 160, 45 175
                     L 50 200
                     C 55 220, 60 240, 70 250
                     L 80 270
                     C 90 280, 110 280, 120 270
                     L 130 250
                     C 140 240, 145 220, 150 200
                     L 155 175
                     C 165 160, 170 140, 170 120
                     L 170 50
                     C 170 30, 155 20, 140 20
                     Z"
                  fill={`url(#shinGuardGradient-${guardType})`}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="canvas-background"
                />
              </svg>
              
              {/* Content Area */}
              <div className="absolute inset-0 flex items-center justify-center canvas-background" onClick={handleCanvasClick}>
                {images.length === 0 ? (
                  <div className="text-center z-10 canvas-background">
                    <div className="text-4xl mb-2">🦵</div>
                    <p className="text-sm font-medium text-gray-600">Canillera {guardType === 'left' ? 'Izquierda' : 'Derecha'}</p>
                    <p className="text-xs text-gray-400">Sube imágenes para comenzar</p>
                    <div className="mt-3 text-xs text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <span>📱</span>
                        <span>Arrastra, pellizca y rota</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              
              {/* Images */}
              <div className="absolute inset-0 clip-path-shin-guard">
                {images.map((image, index) => (
                  <div
                    key={`${image.id}-${index}`}
                    className={`absolute cursor-pointer transition-all duration-200 hover:z-20 select-none ${
                      selectedImage === image.id ? 'ring-2 ring-blue-500 ring-offset-2 z-30' : 'z-10'
                    }`}
                    style={{
                      width: '60px',
                      height: '60px',
                      touchAction: 'none',
                      userSelect: 'none',
                      ...getImageStyle(image.id, index)
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(image.id);
                    }}
                    onMouseDown={(e) => handleMouseDown(e, image.id)}
                    onWheel={(e) => handleWheel(e, image.id)}
                    onTouchStart={(e) => handleTouchStart(e, image.id)}
                  >
                    <img
                      src={image.url}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover shadow-md hover:shadow-lg transition-shadow pointer-events-none"
                      draggable={false}
                      style={{ borderRadius: '0px' }}
                    />
                    {selectedImage === image.id && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="text-center space-y-2">
          <h4 className="text-sm font-semibold text-blue-800">💡 Cómo usar:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-700">
            <div className="flex items-center justify-center gap-1">
              <span>🖱️</span>
              <span>Arrastra para mover</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span>🔄</span>
              <span>Rueda del mouse para zoom</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span>🤏</span>
              <span>Pellizca para zoom/rotar</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Image Controls */}
      {selectedImage && (
        <Card className="p-4 bg-blue-50 border-blue-200 animate-in slide-in-from-bottom-2">
          <div className="flex flex-col space-y-3">
            <div className="text-sm font-medium text-blue-800 mb-2 flex items-center justify-between">
              <span>Controles de Imagen Seleccionada</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedImage(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            
            {/* Movement Controls */}
            <div className="grid grid-cols-3 gap-2">
              <div></div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageMove(selectedImage, 'up')}
                className="h-8 hover:bg-blue-100"
              >
                ↑
              </Button>
              <div></div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageMove(selectedImage, 'left')}
                className="h-8 hover:bg-blue-100"
              >
                ←
              </Button>
              <div className="flex items-center justify-center text-xs text-gray-500">
                Mover
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageMove(selectedImage, 'right')}
                className="h-8 hover:bg-blue-100"
              >
                →
              </Button>
              
              <div></div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageMove(selectedImage, 'down')}
                className="h-8 hover:bg-blue-100"
              >
                ↓
              </Button>
              <div></div>
            </div>

            {/* Transform Controls */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageResize(selectedImage, 'decrease')}
                className="flex items-center justify-center gap-1 hover:bg-blue-100"
              >
                <ZoomOut className="h-3 w-3" />
                <span className="text-xs">Reducir</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageRotate(selectedImage)}
                className="flex items-center justify-center gap-1 hover:bg-blue-100"
              >
                <RotateCw className="h-3 w-3" />
                <span className="text-xs">Rotar</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageResize(selectedImage, 'increase')}
                className="flex items-center justify-center gap-1 hover:bg-blue-100"
              >
                <ZoomIn className="h-3 w-3" />
                <span className="text-xs">Ampliar</span>
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setImagePositions(prev => ({
                    ...prev,
                    [selectedImage]: {
                      ...prev[selectedImage],
                      x: 0,
                      y: 0,
                      scale: 1,
                      rotation: 0
                    }
                  }));
                }}
                className="flex-1 text-xs"
              >
                Resetear Posición
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ShinGuardCanvas;