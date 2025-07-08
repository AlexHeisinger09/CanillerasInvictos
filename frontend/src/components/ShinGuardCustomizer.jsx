import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import ShinGuardCanvas from "./ShinGuardCanvas";
import PhotoUploader from "./PhotoUploader";
import { mockData } from "../data/mockData";
import { useToast } from "../hooks/use-toast";
import { Download, Save, RotateCcw, Palette } from "lucide-react";

const ShinGuardCustomizer = () => {
  const [leftGuardImages, setLeftGuardImages] = useState([]);
  const [rightGuardImages, setRightGuardImages] = useState([]);
  const [activeGuard, setActiveGuard] = useState('left');
  const [designs, setDesigns] = useState(mockData.designs);
  const { toast } = useToast();

  const handleImageUpload = (guard, images) => {
    if (guard === 'left') {
      setLeftGuardImages(images);
    } else {
      setRightGuardImages(images);
    }
    
    toast({
      title: "Imágenes cargadas",
      description: `Se han cargado ${images.length} imágenes para la canillera ${guard === 'left' ? 'izquierda' : 'derecha'}`,
    });
  };

  const handleSaveDesign = () => {
    const newDesign = {
      id: Date.now().toString(),
      name: `Diseño ${designs.length + 1}`,
      leftImages: leftGuardImages,
      rightImages: rightGuardImages,
      createdAt: new Date().toLocaleDateString()
    };
    
    setDesigns([...designs, newDesign]);
    toast({
      title: "Diseño guardado",
      description: "Tu diseño personalizado ha sido guardado exitosamente",
    });
  };

  const handleExportDesign = () => {
    toast({
      title: "Exportando diseño",
      description: "Tu diseño se está preparando para descarga...",
    });
  };

  const handleReset = () => {
    if (activeGuard === 'left') {
      setLeftGuardImages([]);
    } else {
      setRightGuardImages([]);
    }
    
    toast({
      title: "Diseño reiniciado",
      description: `Se han eliminado las imágenes de la canillera ${activeGuard === 'left' ? 'izquierda' : 'derecha'}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Personalizador de Canilleras
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Crea diseños únicos para tus canilleras de fútbol con hasta 4 imágenes por canillera
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Controles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Guard Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Canillera Activa</label>
                  <div className="flex gap-2">
                    <Button
                      variant={activeGuard === 'left' ? 'default' : 'outline'}
                      onClick={() => setActiveGuard('left')}
                      className="flex-1"
                    >
                      Izquierda
                    </Button>
                    <Button
                      variant={activeGuard === 'right' ? 'default' : 'outline'}
                      onClick={() => setActiveGuard('right')}
                      className="flex-1"
                    >
                      Derecha
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Photo Uploader */}
                <PhotoUploader
                  onImagesChange={(images) => handleImageUpload(activeGuard, images)}
                  maxImages={4}
                  currentImages={activeGuard === 'left' ? leftGuardImages : rightGuardImages}
                />

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button onClick={handleReset} variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reiniciar
                  </Button>
                  <Button onClick={handleSaveDesign} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Diseño
                  </Button>
                  <Button onClick={handleExportDesign} variant="secondary" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Saved Designs */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle>Diseños Guardados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {designs.map((design) => (
                    <div key={design.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{design.name}</h4>
                        <Badge variant="secondary">{design.createdAt}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Izq: {design.leftImages?.length || 0} imgs | Der: {design.rightImages?.length || 0} imgs
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Canvas */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">
                  Canilleras de Fútbol
                </CardTitle>
                <p className="text-gray-600">
                  Arrastra y posiciona tus imágenes para crear el diseño perfecto
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Canillera Izquierda</h3>
                      <Badge variant={activeGuard === 'left' ? 'default' : 'secondary'}>
                        {leftGuardImages.length}/4 imágenes
                      </Badge>
                    </div>
                    <ShinGuardCanvas
                      images={leftGuardImages}
                      guardType="left"
                      isActive={activeGuard === 'left'}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Canillera Derecha</h3>
                      <Badge variant={activeGuard === 'right' ? 'default' : 'secondary'}>
                        {rightGuardImages.length}/4 imágenes
                      </Badge>
                    </div>
                    <ShinGuardCanvas
                      images={rightGuardImages}
                      guardType="right"
                      isActive={activeGuard === 'right'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShinGuardCustomizer;