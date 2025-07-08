import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2, Move, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

const ShinGuardCanvas = ({ images, guardType, isActive }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePositions, setImagePositions] = useState({});

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
      transition: selectedImage === imageId ? 'none' : 'transform 0.2s ease',
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
        <div className="relative h-96 overflow-hidden rounded-lg bg-white/50 backdrop-blur-sm">
          {/* Shin Guard Shape */}
          <div className="absolute inset-4">
            <div className="relative w-full h-full">
              {/* SVG Shin Guard Shape */}
              <svg
                viewBox="0 0 200 300"
                className="absolute inset-0 w-full h-full"
                style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))' }}
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
                />
              </svg>
              
              {/* Content Area */}
              <div className="absolute inset-0 flex items-center justify-center">
                {images.length === 0 ? (
                  <div className="text-center z-10">
                    <div className="text-4xl mb-2">🦵</div>
                    <p className="text-sm font-medium text-gray-600">Canillera {guardType === 'left' ? 'Izquierda' : 'Derecha'}</p>
                    <p className="text-xs text-gray-400">Sube imágenes para comenzar</p>
                  </div>
                ) : null}
              </div>
              
              {/* Images */}
              <div className="absolute inset-0 clip-path-shin-guard">
                {images.map((image, index) => (
                  <div
                    key={`${image.id}-${index}`}
                    className={`absolute cursor-pointer transition-all duration-200 hover:z-20 ${
                      selectedImage === image.id ? 'ring-2 ring-blue-500 ring-offset-2 z-30' : 'z-10'
                    }`}
                    style={{
                      width: '60px',
                      height: '60px',
                      ...getImageStyle(image.id, index)
                    }}
                    onClick={() => handleImageClick(image.id)}
                  >
                    <img
                      src={image.url}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
                      draggable={false}
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

      {/* Image Controls */}
      {selectedImage && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex flex-col space-y-3">
            <div className="text-sm font-medium text-blue-800 mb-2">
              Controles de Imagen Seleccionada
            </div>
            
            {/* Movement Controls */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageMove(selectedImage, 'left')}
                className="col-start-1"
              >
                ←
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageMove(selectedImage, 'up')}
                className="col-start-2"
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageMove(selectedImage, 'right')}
                className="col-start-3"
              >
                →
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageMove(selectedImage, 'down')}
                className="col-start-2"
              >
                ↓
              </Button>
            </div>

            {/* Transform Controls */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageResize(selectedImage, 'decrease')}
                className="flex-1"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageResize(selectedImage, 'increase')}
                className="flex-1"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImageRotate(selectedImage)}
                className="flex-1"
              >
                <RotateCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ShinGuardCanvas;