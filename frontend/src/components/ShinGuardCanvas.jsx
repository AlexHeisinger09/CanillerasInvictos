import React, { useState, useEffect, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

const ShinGuardCanvas = ({ images, guardType, isActive }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePositions, setImagePositions] = useState({});
  const canvasRef = useRef(null);
  
  // Estado para arrastrar
  const [dragState, setDragState] = useState({
    isDragging: false,
    imageId: null,
    lastX: 0,
    lastY: 0,
    hasMoved: false  // Para distinguir entre clic y drag
  });

  // Estado para resize dinámico
  const [resizeState, setResizeState] = useState({
    isResizing: false,
    imageId: null,
    startX: 0,
    startY: 0,
    startScale: 1,
    handle: null // 'nw', 'ne', 'sw', 'se', etc.
  });

  // Estado para gestos táctiles
  const [touchState, setTouchState] = useState({
    isGesturing: false,
    initialDistance: 0,
    initialAngle: 0,
    startScale: 1,
    startRotation: 0
  });

  // Inicializar posiciones para nuevas imágenes
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

  // Funciones de utilidad para touch
  const getTouchDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchAngle = (touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  // ========== RESIZE DINÁMICO ==========
  const handleResizeStart = (e, imageId, handle) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Iniciando resize con handle:', handle);
    
    const currentPos = imagePositions[imageId] || {};
    setSelectedImage(imageId);
    
    setResizeState({
      isResizing: true,
      imageId,
      startX: e.clientX,
      startY: e.clientY,
      startScale: currentPos.scale || 1,
      handle
    });
  };

  const handleResizeMove = (e) => {
    if (!resizeState.isResizing || !resizeState.imageId) return;
    
    e.preventDefault();
    
    // Calcular distancia de movimiento
    const deltaX = e.clientX - resizeState.startX;
    const deltaY = e.clientY - resizeState.startY;
    
    // Determinar el factor de escala basado en el handle y la dirección del movimiento
    let scaleFactor = 1;
    
    switch (resizeState.handle) {
      case 'nw': // esquina superior izquierda
        scaleFactor = 1 + (-deltaX + -deltaY) * 0.01;
        break;
      case 'ne': // esquina superior derecha
        scaleFactor = 1 + (deltaX + -deltaY) * 0.01;
        break;
      case 'sw': // esquina inferior izquierda
        scaleFactor = 1 + (-deltaX + deltaY) * 0.01;
        break;
      case 'se': // esquina inferior derecha
        scaleFactor = 1 + (deltaX + deltaY) * 0.01;
        break;
      case 'n': // lado superior
        scaleFactor = 1 + (-deltaY) * 0.02;
        break;
      case 's': // lado inferior
        scaleFactor = 1 + (deltaY) * 0.02;
        break;
      case 'w': // lado izquierdo
        scaleFactor = 1 + (-deltaX) * 0.02;
        break;
      case 'e': // lado derecho
        scaleFactor = 1 + (deltaX) * 0.02;
        break;
      default:
        scaleFactor = 1;
    }
    
    // Aplicar el nuevo scale
    const newScale = Math.max(0.1, Math.min(5, resizeState.startScale * scaleFactor));
    
    setImagePositions(prev => ({
      ...prev,
      [resizeState.imageId]: {
        ...prev[resizeState.imageId],
        scale: newScale
      }
    }));
  };

  const handleResizeEnd = () => {
    if (resizeState.isResizing) {
      console.log('🛑 Terminando resize');
      setResizeState({
        isResizing: false,
        imageId: null,
        startX: 0,
        startY: 0,
        startScale: 1,
        handle: null
      });
    }
  };

  // ========== EVENTOS DE CLIC ==========
  const handleImageClick = (imageId, e) => {
    e.stopPropagation();
    
    // Solo seleccionar si no se ha arrastrado
    if (!dragState.hasMoved) {
      console.log('🖱️ Imagen clickeada para seleccionar:', imageId);
      setSelectedImage(prev => {
        const newSelected = prev === imageId ? null : imageId;
        console.log('✅ Nueva selección:', newSelected);
        return newSelected;
      });
    } else {
      console.log('🚫 No seleccionar porque se arrastró');
    }
  };

  const handleCanvasClick = (e) => {
    // Verificar si el click fue en el canvas o en elementos de fondo
    if (
      e.target === e.currentTarget || 
      e.target.classList.contains('canvas-background') ||
      e.target.tagName === 'svg' ||
      e.target.tagName === 'path'
    ) {
      console.log('🎯 Canvas clickeado - deseleccionando');
      setSelectedImage(null);
    }
  };

  // ========== EVENTOS DE MOUSE ==========
  const handleMouseDown = (e, imageId) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖱️ Mouse down en imagen:', imageId);
    
    setDragState({
      isDragging: true,
      imageId,
      lastX: e.clientX,
      lastY: e.clientY,
      hasMoved: false  // Resetear el flag de movimiento
    });
    
    // NO seleccionar aquí, esperar al click o al drag
  };

  const handleMouseMove = (e) => {
    if (!dragState.isDragging || !dragState.imageId) return;
    
    e.preventDefault();
    
    // Calcular el movimiento real del mouse
    const deltaX = e.clientX - dragState.lastX;
    const deltaY = e.clientY - dragState.lastY;
    
    // Si se mueve más de 3 pixeles, considerarlo como drag
    const threshold = 3;
    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      if (!dragState.hasMoved) {
        console.log('🏃 Iniciando drag real');
        setSelectedImage(dragState.imageId); // Seleccionar cuando empiece a moverse
      }
      
      setDragState(prev => ({ ...prev, hasMoved: true }));
      
      console.log('🏃 Mouse move delta:', { deltaX, deltaY });
      
      // Aplicar el movimiento directamente
      setImagePositions(prev => ({
        ...prev,
        [dragState.imageId]: {
          ...prev[dragState.imageId],
          x: (prev[dragState.imageId]?.x || 0) + deltaX,
          y: (prev[dragState.imageId]?.y || 0) + deltaY
        }
      }));
    }
    
    // Actualizar la última posición
    setDragState(prev => ({
      ...prev,
      lastX: e.clientX,
      lastY: e.clientY
    }));
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      console.log('🛑 Mouse up - parando arrastre. Se movió:', dragState.hasMoved);
      setDragState({
        isDragging: false,
        imageId: null,
        lastX: 0,
        lastY: 0,
        hasMoved: false
      });
    }
  };

  const handleWheel = (e, imageId) => {
    // ZOOM DIRECTO - No necesita selección previa
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    
    // Seleccionar automáticamente al hacer zoom
    setSelectedImage(imageId);
    
    setImagePositions(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        scale: Math.max(0.1, Math.min(5, (prev[imageId]?.scale || 1) + delta))
      }
    }));
  };

  // ========== EVENTOS TÁCTILES ==========
  const handleTouchStart = (e, imageId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touches = Array.from(e.touches);
    console.log('👆 Touch start con', touches.length, 'dedos en imagen:', imageId);
    
    if (touches.length === 1) {
      // Un dedo - preparar para drag o selección
      setDragState({
        isDragging: true,
        imageId,
        lastX: touches[0].clientX,
        lastY: touches[0].clientY,
        hasMoved: false
      });
    } else if (touches.length === 2) {
      // Dos dedos - zoom/rotate
      const distance = getTouchDistance(touches[0], touches[1]);
      const angle = getTouchAngle(touches[0], touches[1]);
      const currentPos = imagePositions[imageId] || {};
      
      setSelectedImage(imageId); // Seleccionar inmediatamente para gestos
      
      setTouchState({
        isGesturing: true,
        initialDistance: distance,
        initialAngle: angle,
        startScale: currentPos.scale || 1,
        startRotation: currentPos.rotation || 0
      });
      
      // Detener arrastre
      setDragState(prev => ({ ...prev, isDragging: false }));
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touches = Array.from(e.touches);
    
    if (touches.length === 1 && dragState.isDragging && dragState.imageId) {
      // Arrastrar con un dedo
      const deltaX = touches[0].clientX - dragState.lastX;
      const deltaY = touches[0].clientY - dragState.lastY;
      
      // Si se mueve más de 5 pixeles, considerarlo como drag
      const threshold = 5;
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        if (!dragState.hasMoved) {
          console.log('👆 Iniciando drag táctil');
          setSelectedImage(dragState.imageId);
        }
        
        setDragState(prev => ({ ...prev, hasMoved: true }));
        
        setImagePositions(prev => ({
          ...prev,
          [dragState.imageId]: {
            ...prev[dragState.imageId],
            x: (prev[dragState.imageId]?.x || 0) + deltaX,
            y: (prev[dragState.imageId]?.y || 0) + deltaY
          }
        }));
      }
      
      setDragState(prev => ({
        ...prev,
        lastX: touches[0].clientX,
        lastY: touches[0].clientY
      }));
      
    } else if (touches.length === 2 && touchState.isGesturing && selectedImage) {
      // Zoom/rotate con dos dedos
      const currentDistance = getTouchDistance(touches[0], touches[1]);
      const currentAngle = getTouchAngle(touches[0], touches[1]);
      
      const scaleRatio = currentDistance / touchState.initialDistance;
      const newScale = Math.max(0.1, Math.min(5, touchState.startScale * scaleRatio));
      
      let angleDelta = currentAngle - touchState.initialAngle;
      if (angleDelta > 180) angleDelta -= 360;
      if (angleDelta < -180) angleDelta += 360;
      
      const newRotation = (touchState.startRotation + angleDelta) % 360;
      
      setImagePositions(prev => ({
        ...prev,
        [selectedImage]: {
          ...prev[selectedImage],
          scale: newScale,
          rotation: newRotation
        }
      }));
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touches = Array.from(e.touches);
    console.log('👆 Touch end, quedan', touches.length, 'dedos. Se movió:', dragState.hasMoved);
    
    if (touches.length === 0) {
      // Si no se movió, fue un tap para seleccionar
      if (dragState.isDragging && !dragState.hasMoved && dragState.imageId) {
        console.log('👆 Tap para seleccionar:', dragState.imageId);
        setSelectedImage(prev => {
          const newSelected = prev === dragState.imageId ? null : dragState.imageId;
          console.log('✅ Nueva selección táctil:', newSelected);
          return newSelected;
        });
      }
      
      // No quedan dedos
      setDragState({
        isDragging: false,
        imageId: null,
        lastX: 0,
        lastY: 0,
        hasMoved: false
      });
      
      setTouchState({
        isGesturing: false,
        initialDistance: 0,
        initialAngle: 0,
        startScale: 1,
        startRotation: 0
      });
    }
  };

  // Event listeners globales para mouse y resize
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (dragState.isDragging) {
        handleMouseMove(e);
      } else if (resizeState.isResizing) {
        handleResizeMove(e);
      }
    };
    
    const handleGlobalMouseUp = () => {
      if (dragState.isDragging) {
        handleMouseUp();
      } else if (resizeState.isResizing) {
        handleResizeEnd();
      }
    };
    
    if (dragState.isDragging || resizeState.isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [dragState.isDragging, dragState.lastX, dragState.lastY, dragState.imageId, dragState.hasMoved, resizeState.isResizing]);

  // Controles manuales
  const handleControl = (action) => {
    if (!selectedImage) return;
    
    console.log('🎛️ Control activado:', action, 'en imagen:', selectedImage);
    
    setImagePositions(prev => {
      const current = prev[selectedImage] || {};
      let updates = {};
      
      switch (action) {
        case 'move-up':
          updates = { y: (current.y || 0) - 20 };
          break;
        case 'move-down':
          updates = { y: (current.y || 0) + 20 };
          break;
        case 'move-left':
          updates = { x: (current.x || 0) - 20 };
          break;
        case 'move-right':
          updates = { x: (current.x || 0) + 20 };
          break;
        case 'zoom-in':
          const newScaleIn = Math.min(5, (current.scale || 1) + 0.2);
          console.log('🔍 Zoom in - escala actual:', current.scale, 'nueva:', newScaleIn);
          updates = { scale: newScaleIn };
          break;
        case 'zoom-out':
          const newScaleOut = Math.max(0.1, (current.scale || 1) - 0.2);
          console.log('🔍 Zoom out - escala actual:', current.scale, 'nueva:', newScaleOut);
          updates = { scale: newScaleOut };
          break;
        case 'rotate':
          const newRotation = ((current.rotation || 0) + 15) % 360;
          console.log('🔄 Rotar - rotación actual:', current.rotation, 'nueva:', newRotation);
          updates = { rotation: newRotation };
          break;
        case 'reset':
          updates = { x: 0, y: 0, scale: 1, rotation: 0 };
          break;
        default:
          console.log('❌ Acción no reconocida:', action);
          return prev;
      }
      
      console.log('✅ Aplicando updates:', updates);
      
      return {
        ...prev,
        [selectedImage]: { ...current, ...updates }
      };
    });
  };

  const getImageStyle = (imageId, index) => {
    const position = imagePositions[imageId] || {};
    const baseLeft = position.initialX || (20 + (index % 2) * 40);
    const baseTop = position.initialY || (20 + Math.floor(index / 2) * 40);
    
    return {
      left: `${baseLeft}%`,
      top: `${baseTop}%`,
      transform: `translate(${position.x || 0}px, ${position.y || 0}px) scale(${position.scale || 1}) rotate(${position.rotation || 0}deg)`,
      transformOrigin: 'center center',
      transition: (dragState.isDragging || touchState.isGesturing || resizeState.isResizing) ? 'none' : 'transform 0.1s ease',
      cursor: selectedImage === imageId ? (dragState.isDragging ? 'grabbing' : resizeState.isResizing ? 'crosshair' : 'grab') : 'pointer',
      zIndex: selectedImage === imageId ? 30 : 10,
      // Tamaño base proporcional
      maxWidth: '120px',
      maxHeight: '120px',
      minWidth: '40px',
      minHeight: '40px'
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
          onClick={handleCanvasClick}
          style={{ touchAction: 'none', userSelect: 'none' }}
        >
          {/* Shin Guard Shape */}
          <div className="absolute inset-4 canvas-background">
            <div className="relative w-full h-full">
              {/* SVG Shin Guard Shape */}
              <svg
                viewBox="0 0 200 300"
                className="absolute inset-0 w-full h-full canvas-background pointer-events-none"
                style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))' }}
              >
                <defs>
                  <linearGradient id={`shinGuardGradient-${guardType}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.9 }} />
                    <stop offset="50%" style={{ stopColor: '#f8fafc', stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: '#e2e8f0', stopOpacity: 0.7 }} />
                  </linearGradient>
                </defs>
                
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
                  className="canvas-background pointer-events-none"
                />
              </svg>
              
              {/* Content Area */}
              <div className="absolute inset-0 flex items-center justify-center canvas-background pointer-events-none">
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
                    className="absolute select-none transition-all duration-200"
                    style={{
                      touchAction: 'none',
                      ...getImageStyle(image.id, index)
                    }}
                    onClick={(e) => handleImageClick(image.id, e)}
                    onMouseDown={(e) => handleMouseDown(e, image.id)}
                    onWheel={(e) => handleWheel(e, image.id)}
                    onTouchStart={(e) => handleTouchStart(e, image.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* Contenedor de imagen con forma original */}
                    <div className="relative inline-block bg-white shadow-lg overflow-visible">
                      <img
                        src={image.url}
                        alt={`Imagen ${index + 1}`}
                        className="block pointer-events-none"
                        draggable={false}
                        style={{
                          width: 'auto',
                          height: 'auto',
                          maxWidth: '100px',
                          maxHeight: '100px',
                          minWidth: '40px',
                          minHeight: '40px',
                          display: 'block'
                        }}
                        onLoad={(e) => {
                          // Ajustar tamaño base según proporción de la imagen
                          const img = e.target;
                          const aspectRatio = img.naturalWidth / img.naturalHeight;
                          
                          if (aspectRatio > 1) {
                            // Imagen horizontal
                            img.style.width = '80px';
                            img.style.height = 'auto';
                          } else {
                            // Imagen vertical
                            img.style.height = '80px';
                            img.style.width = 'auto';
                          }
                        }}
                      />
                      
                      {/* Controles solo cuando está seleccionada */}
                      {selectedImage === image.id && (
                        <>
                          {/* Borde de selección */}
                          <div className="absolute inset-0 border border-blue-500 pointer-events-none"></div>
                          
                          {/* Handles de las esquinas - RESIZE DINÁMICO */}
                          <div 
                            className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize z-30 hover:bg-blue-600"
                            onMouseDown={(e) => handleResizeStart(e, image.id, 'nw')}
                            title="Resize desde esquina superior izquierda"
                          ></div>
                          <div 
                            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize z-30 hover:bg-blue-600"
                            onMouseDown={(e) => handleResizeStart(e, image.id, 'ne')}
                            title="Resize desde esquina superior derecha"
                          ></div>
                          <div 
                            className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize z-30 hover:bg-blue-600"
                            onMouseDown={(e) => handleResizeStart(e, image.id, 'sw')}
                            title="Resize desde esquina inferior izquierda"
                          ></div>
                          <div 
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize z-30 hover:bg-blue-600"
                            onMouseDown={(e) => handleResizeStart(e, image.id, 'se')}
                            title="Resize desde esquina inferior derecha"
                          ></div>
                          
                          {/* Handles de los lados */}
                          <div 
                            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white cursor-n-resize z-30 hover:bg-blue-600"
                            onMouseDown={(e) => handleResizeStart(e, image.id, 'n')}
                            title="Resize desde lado superior"
                          ></div>
                          <div 
                            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white cursor-s-resize z-30 hover:bg-blue-600"
                            onMouseDown={(e) => handleResizeStart(e, image.id, 's')}
                            title="Resize desde lado inferior"
                          ></div>
                          <div 
                            className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white cursor-w-resize z-30 hover:bg-blue-600"
                            onMouseDown={(e) => handleResizeStart(e, image.id, 'w')}
                            title="Resize desde lado izquierdo"
                          ></div>
                          <div 
                            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white cursor-e-resize z-30 hover:bg-blue-600"
                            onMouseDown={(e) => handleResizeStart(e, image.id, 'e')}
                            title="Resize desde lado derecho"
                          ></div>
                          
                          {/* Control de rotación */}
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-30">
                            <div 
                              className="w-5 h-5 cursor-pointer flex items-center justify-center hover:bg-blue-50 rounded bg-white border border-gray-300"
                              onMouseDown={(e) => { 
                                e.stopPropagation(); 
                                e.preventDefault();
                                console.log('🔄 Rotate click');
                                handleControl('rotate'); 
                              }}
                              title="Rotar 15°"
                            >
                              <RotateCw className="h-3 w-3 text-blue-500" />
                            </div>
                          </div>
                          
                          {/* Número identificador */}
                          <div className="absolute -top-6 -right-6 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg z-20">
                            {index + 1}
                          </div>
                        </>
                      )}
                    </div>
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
          <h4 className="text-sm font-semibold text-blue-800">💡 Instrucciones:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-700">
            <div className="flex items-center justify-center gap-1">
              <span>👆</span>
              <span>Clic = Seleccionar</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span>🚀</span>
              <span>Arrastra imagen = Mover</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span>📐</span>
              <span>Arrastra handles = Resize</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 pt-1">
            <span>✨ Arrastra los cuadraditos azules para cambiar tamaño dinámicamente | Rueda = zoom directo</span>
          </div>
        </div>
      </Card>

      {/* Image Controls */}
      {selectedImage && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex flex-col space-y-3">
            <div className="text-sm font-medium text-blue-800 mb-2 flex items-center justify-between">
              <span>Imagen #{images.findIndex(img => img.id === selectedImage) + 1} Seleccionada</span>
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
              <Button size="sm" variant="outline" onClick={() => handleControl('move-up')} className="h-10 font-bold">↑</Button>
              <div></div>
              
              <Button size="sm" variant="outline" onClick={() => handleControl('move-left')} className="h-10 font-bold">←</Button>
              <div className="flex items-center justify-center text-xs font-medium">MOVER</div>
              <Button size="sm" variant="outline" onClick={() => handleControl('move-right')} className="h-10 font-bold">→</Button>
              
              <div></div>
              <Button size="sm" variant="outline" onClick={() => handleControl('move-down')} className="h-10 font-bold">↓</Button>
              <div></div>
            </div>

            {/* Transform Controls */}
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" onClick={() => handleControl('zoom-out')} className="flex items-center gap-1">
                <ZoomOut className="h-4 w-4" />
                <span>Alejar</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleControl('rotate')} className="flex items-center gap-1">
                <RotateCw className="h-4 w-4" />
                <span>Rotar</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleControl('zoom-in')} className="flex items-center gap-1">
                <ZoomIn className="h-4 w-4" />
                <span>Acercar</span>
              </Button>
            </div>

            {/* Info */}
            <div className="text-xs text-center text-gray-600 bg-white p-3 rounded border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold">Zoom</div>
                  <div className="text-lg font-mono text-blue-600">
                    {Math.round(((imagePositions[selectedImage]?.scale || 1) * 100))}%
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Rotación</div>
                  <div className="text-lg font-mono text-green-600">
                    {Math.round(imagePositions[selectedImage]?.rotation || 0)}°
                  </div>
                </div>
              </div>
            </div>

            {/* Reset */}
            <Button size="sm" variant="destructive" onClick={() => handleControl('reset')} className="text-sm">
              🔄 Resetear Posición
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ShinGuardCanvas;