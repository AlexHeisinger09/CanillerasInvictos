import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2, Move, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

const ShinGuardCanvas = ({ images, guardType, isActive }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePositions, setImagePositions] = useState({});

  const handleImageClick = (imageId) => {
    setSelectedImage(selectedImage === imageId ? null : imageId);
  };

  const handleImageMove = (imageId, direction) => {
    setImagePositions(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        x: (prev[imageId]?.x || 0) + (direction === 'left' ? -5 : direction === 'right' ? 5 : 0),
        y: (prev[imageId]?.y || 0) + (direction === 'up' ? -5 : direction === 'down' ? 5 : 0)
      }
    }));
  };

  const handleImageResize = (imageId, action) => {
    setImagePositions(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        scale: Math.max(0.5, Math.min(2, (prev[imageId]?.scale || 1) + (action === 'increase' ? 0.1 : -0.1)))
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

  const getImageStyle = (imageId) => {
    const position = imagePositions[imageId] || {};
    return {
      transform: `translate(${position.x || 0}px, ${position.y || 0}px) scale(${position.scale || 1}) rotate(${position.rotation || 0}deg)`,
      transition: 'transform 0.2s ease'
    };
  };

  return (
    <div className="space-y-4">
      {/* Canvas Area */}
      <Card className={`relative bg-gradient-to-b from-gray-100 to-gray-200 border-2 transition-all duration-300 ${
        isActive ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      }`}>
        <div className="relative h-96 overflow-hidden rounded-lg bg-white/50 backdrop-blur-sm">
          {/* Shin Guard Outline */}
          <div className="absolute inset-4 border-2 border-dashed border-gray-400 rounded-2xl bg-white/30">
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              {images.length === 0 ? (
                <div className="text-center">
                  <div className="text-4xl mb-2">🦵</div>
                  <p className="text-sm">Canillera {guardType === 'left' ? 'Izquierda' : 'Derecha'}</p>
                  <p className="text-xs text-gray-400">Sube imágenes para comenzar</p>
                </div>
              ) : null}
            </div>
            
            {/* Images */}
            {images.map((image, index) => (
              <div
                key={`${image.id}-${index}`}
                className={`absolute cursor-pointer transition-all duration-200 ${
                  selectedImage === image.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
                style={{
                  left: `${20 + (index % 2) * 40}%`,
                  top: `${20 + Math.floor(index / 2) * 40}%`,
                  width: '80px',
                  height: '80px',
                  ...getImageStyle(image.id)
                }}
                onClick={() => handleImageClick(image.id)}
              >
                <img
                  src={image.url}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
                />
                {selectedImage === image.id && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                )}
              </div>
            ))}
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