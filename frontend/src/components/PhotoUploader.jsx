import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Upload, X, Image, Plus } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const PhotoUploader = ({ onImagesChange, maxImages, currentImages }) => {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona solo archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    const remainingSlots = maxImages - currentImages.length;
    if (imageFiles.length > remainingSlots) {
      toast({
        title: "Límite excedido",
        description: `Solo puedes subir ${remainingSlots} imágenes más`,
        variant: "destructive",
      });
      return;
    }

    // Convert files to URLs for preview (in real app, this would be base64 or upload to server)
    const newImages = imageFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file: file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    onImagesChange([...currentImages, ...newImages]);
  };

  const removeImage = (imageId) => {
    const updatedImages = currentImages.filter(img => img.id !== imageId);
    onImagesChange(updatedImages);
  };

  const canUploadMore = currentImages.length < maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Subir Imágenes</h3>
        <Badge variant="outline">
          {currentImages.length}/{maxImages}
        </Badge>
      </div>

      {/* Upload Area */}
      {canUploadMore && (
        <Card
          className={`border-2 border-dashed transition-all duration-300 ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                Arrastra imágenes aquí
              </p>
              <p className="text-sm text-gray-500 mb-4">
                o haz clic para seleccionar archivos
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Seleccionar Imágenes
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Previews */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {currentImages.map((image) => (
            <div key={image.id} className="relative group">
              <Card className="overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Upload Tips */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 Consejos:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Usa imágenes de alta resolución para mejor calidad</li>
          <li>Formatos compatibles: JPG, PNG, GIF, WebP</li>
          <li>Máximo {maxImages} imágenes por canillera</li>
        </ul>
      </div>
    </div>
  );
};

export default PhotoUploader;