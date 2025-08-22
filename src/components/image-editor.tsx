"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { generateEditDescription } from '@/ai/flows/generate-edit-description';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  RotateCcw,
  Loader2,
  SlidersHorizontal,
  Image as ImageIcon,
  Save,
  Trash2,
  Undo2,
} from 'lucide-react';
import type { GenerateEditDescriptionInput } from '@/ai/flows/generate-edit-description';

type Filter = {
  id: keyof typeof defaultFilterValues;
  name: string;
  unit: string;
  min: number;
  max: number;
};

const defaultFilterValues = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  'hue-rotate': 0,
  blur: 0,
  invert: 0,
  opacity: 100,
  vignette: 0,
};

const AVAILABLE_FILTERS: Filter[] = [
  { id: 'brightness', name: 'Brightness', unit: '%', min: 0, max: 200 },
  { id: 'contrast', name: 'Contrast', unit: '%', min: 0, max: 200 },
  { id: 'saturate', name: 'Saturation', unit: '%', min: 0, max: 200 },
  { id: 'opacity', name: 'Opacity', unit: '%', min: 0, max: 100 },
  { id: 'grayscale', name: 'Grayscale', unit: '%', min: 0, max: 100 },
  { id: 'sepia', name: 'Sepia', unit: '%', min: 0, max: 100 },
  { id: 'hue-rotate', name: 'Hue Rotate', unit: 'deg', min: 0, max: 360 },
  { id: 'blur', name: 'Blur', unit: 'px', min: 0, max: 20 },
  { id: 'invert', name: 'Invert', unit: '%', min: 0, max: 100 },
];

const PRESET_FILTERS = [
    { name: 'Vintage', values: { sepia: 60, brightness: 110, contrast: 110, saturate: 110 } },
    { name: 'Cool', values: { 'hue-rotate': 220, saturate: 30, brightness: 120 } },
    { name: 'Warm', values: { sepia: 40, saturate: 120, brightness: 105 } },
    { name: 'Grayscale+', values: { grayscale: 100, contrast: 120, brightness: 95 } },
    { name: 'Dramatic', values: { contrast: 150, brightness: 80, saturate: 130 } },
    { name: 'Summer', values: { saturate: 140, brightness: 110, 'hue-rotate': 350 } },
    { name: 'Faded', values: { opacity: 75, contrast: 90, brightness: 110 } },
]

export function ImageEditor() {
  const { toast } = useToast();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, number>>(defaultFilterValues);
  const [history, setHistory] = useState<Record<string, number>[]>([]);
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [showSliders, setShowSliders] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const drawImageWithFilters = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = originalImageSize.width;
    canvas.height = originalImageSize.height;

    const filterString = AVAILABLE_FILTERS
      .map(filter => {
        const value = appliedFilters[filter.id];
        const defaultValue = defaultFilterValues[filter.id];
        return value !== defaultValue ? `${filter.id}(${value}${filter.unit})` : '';
      }).join(' ').trim();

    ctx.filter = filterString;
    ctx.drawImage(image, 0, 0, originalImageSize.width, originalImageSize.height);

  }, [appliedFilters, originalImageSize]);

  useEffect(() => {
    if (imageSrc && imageRef.current) {
      drawImageWithFilters();
    }
  }, [imageSrc, appliedFilters, drawImageWithFilters]);
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsImageLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = new window.Image();
        newImage.onload = () => {
          imageRef.current = newImage;
          setOriginalImageSize({width: newImage.naturalWidth, height: newImage.naturalHeight});
          setImageSrc(e.target?.result as string);
          resetFilters();
          setShowSliders(false);
          setIsImageLoading(false);
        };
        newImage.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  }

  const handleFilterChange = (filterId: string, value: number) => {
    setHistory(prev => [...prev, appliedFilters]);
    setAppliedFilters(prev => ({ ...prev, [filterId]: value }));
  };
  
  const applyPreset = (presetValues: Partial<Record<string, number>>) => {
    setHistory(prev => [...prev, appliedFilters]);
    setAppliedFilters({ ...defaultFilterValues, ...presetValues });
  }

  const resetFilters = () => {
    setHistory(prev => [...prev, appliedFilters]);
    setAppliedFilters(defaultFilterValues);
  };
  
  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setAppliedFilters(lastState);
    setHistory(prev => prev.slice(0, prev.length - 1));
  }

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  const clearImage = () => {
    setImageSrc(null);
    setHistory([]);
    imageRef.current = null;
    setShowSliders(false);
  }

  const loadSampleImage = useCallback(async () => {
    setIsImageLoading(true);
    try {
        const response = await fetch('https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?q=80&w=1480&auto=format&fit=crop');
        if (!response.ok) throw new Error("Image fetch failed");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = new window.Image();
          newImage.onload = () => {
            imageRef.current = newImage;
            setOriginalImageSize({width: newImage.naturalWidth, height: newImage.naturalHeight});
            setImageSrc(e.target?.result as string);
            resetFilters();
            setShowSliders(false);
          };
          newImage.src = e.target?.result as string;
        };
        reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to load sample image", error);
      toast({
          title: "Error",
          description: "Could not load sample cat image.",
          variant: "destructive"
      })
    } finally {
        setIsImageLoading(false);
    }
  }, [toast]);

  return (
    <div className={`grid h-full bg-black ${imageSrc ? 'grid-cols-1 lg:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>
      <input
        type="file"
        ref={uploadInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/*"
      />
      <div className="flex items-center justify-center p-4 md:p-8 bg-black">
        {imageSrc ? (
          <div className="relative rounded-lg overflow-hidden shadow-2xl bg-white">
            <canvas ref={canvasRef} className="max-w-full max-h-[80vh] object-contain" />
          </div>
        ) : (
          <Card className="w-full max-w-md h-[450px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed">
            {isImageLoading ? (
              <>
                <Loader2 className="mx-auto h-16 w-16 animate-spin" />
                <h3 className="mt-4 text-xl font-medium">Loading Image...</h3>
              </>
            ) : (
              <>
                <ImageIcon className="h-24 w-24 text-muted-foreground" />
                <h3 className="mt-4 text-2xl font-semibold">Upload an Image</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click the button below to upload an image from your device.
                </p>
                <Button className="mt-6" onClick={handleUploadClick}>
                  <Upload className="mr-2" />
                  Upload Image
                </Button>
                <p className="text-xs text-muted-foreground my-4">OR</p>
                <Button variant="outline" onClick={loadSampleImage}>Try a Demo Image</Button>
              </>
            )}
          </Card>
        )}
      </div>

      {imageSrc && (
        <Card className="lg:col-start-2 flex flex-col bg-card border-l rounded-none">
          <CardHeader>
              <CardTitle className="text-2xl text-center">Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden flex flex-col p-4 pt-0">
            <Button 
              onClick={handleUploadClick}
              disabled={isImageLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6 mb-4"
            >
              Change Image
            </Button>

            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold">Filters</h3>
              <Button variant="outline" size="sm" onClick={() => setShowSliders(s => !s)}>
                  {showSliders ? 'Go to Presets Filter' : 'Access Sliders Control'}
              </Button>
            </div>
            <hr className="border-dashed border-gray-600 mb-4" />

            {showSliders ? (
              <ScrollArea className="flex-grow pr-4 -mr-4">
                  <div className="space-y-4">
                      {AVAILABLE_FILTERS.map((filter) => (
                      <div key={filter.id} className="space-y-3">
                          <div className="flex justify-between items-center">
                              <Label htmlFor={filter.id} className="text-sm font-medium flex items-center gap-2">
                                  {filter.name}
                              </Label>
                              <span className="text-xs font-mono text-muted-foreground">{appliedFilters[filter.id]}{filter.unit}</span>
                          </div>
                          <Slider
                          id={filter.id}
                          min={filter.min}
                          max={filter.max}
                          value={[appliedFilters[filter.id]]}
                          onValueChange={([val]) => handleFilterChange(filter.id, val)}
                          disabled={!imageSrc}
                          />
                      </div>
                      ))}
                  </div>
              </ScrollArea>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-4">
                  {PRESET_FILTERS.map((preset) => (
                      <Button 
                          key={preset.name}
                          variant="outline"
                          className="h-16 text-md border-gray-700 hover:border-accent hover:bg-gray-800 hover:text-accent-foreground transition-colors"
                          onClick={() => applyPreset(preset.values)}
                          disabled={!imageSrc}
                      >
                          {preset.name}
                      </Button>
                  ))}
              </div>
            )}

            <div className="mt-auto pt-4">
              <h3 className="text-xl font-semibold mb-2">Utilities</h3>
              <div className="space-y-2">
                  <Button 
                      onClick={resetFilters} 
                      disabled={!imageSrc}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6"
                  >
                      <RotateCcw className="mr-2" /> Reset Filters
                  </Button>
                  <Button 
                      onClick={clearImage}
                      disabled={!imageSrc}
                      className="w-full bg-red-500 hover:bg-red-600 text-white text-lg py-6"
                  >
                      <Trash2 className="mr-2" /> Clear Image
                  </Button>
                  <Button 
                      onClick={handleDownload}
                      disabled={!imageSrc}
                      className="w-full bg-green-500 hover:bg-green-600 text-white text-lg py-6"
                  >
                      <Save className="mr-2" /> Save Image
                  </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
