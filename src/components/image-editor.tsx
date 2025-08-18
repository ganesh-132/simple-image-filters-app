"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { generateEditDescription } from '@/ai/flows/generate-edit-description';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sun,
  Droplets,
  Contrast,
  Palette,
  Camera,
  Layers,
  WandSparkles,
  Download,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  Loader2,
  SlidersHorizontal,
  FlipHorizontal,
  Eye,
} from 'lucide-react';
import type { GenerateEditDescriptionInput } from '@/ai/flows/generate-edit-description';

type Filter = {
  id: keyof typeof defaultFilterValues;
  name: string;
  icon: React.ElementType;
  unit: string;
  min: number;
  max: number;
};

const defaultFilterValues = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  'hue-rotate': 0,
  opacity: 100,
};

const AVAILABLE_FILTERS: Filter[] = [
  { id: 'brightness', name: 'Brightness', icon: Sun, unit: '%', min: 0, max: 200 },
  { id: 'contrast', name: 'Contrast', icon: Contrast, unit: '%', min: 0, max: 200 },
  { id: 'saturate', name: 'Saturation', icon: Palette, unit: '%', min: 0, max: 200 },
  { id: 'grayscale', name: 'Grayscale', icon: Layers, unit: '%', min: 0, max: 100 },
  { id: 'sepia', name: 'Sepia', icon: Camera, unit: '%', min: 0, max: 100 },
  { id: 'hue-rotate', name: 'Hue', icon: WandSparkles, unit: 'deg', min: 0, max: 360 },
  { id: 'invert', name: 'Invert', icon: FlipHorizontal, unit: '%', min: 0, max: 100 },
  { id: 'blur', name: 'Blur', icon: Droplets, unit: 'px', min: 0, max: 20 },
  { id: 'opacity', name: 'Opacity', icon: Eye, unit: '%', min: 0, max: 100 },
];

export function ImageEditor() {
  const { toast } = useToast();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, number>>(defaultFilterValues);
  const [editDescription, setEditDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });

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

    const filterString = AVAILABLE_FILTERS.map(filter => {
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
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = new window.Image();
        newImage.onload = () => {
          imageRef.current = newImage;
          setOriginalImageSize({width: newImage.width, height: newImage.height});
          setImageSrc(e.target?.result as string);
          resetFilters();
        };
        newImage.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFilterChange = (filterId: string, value: number) => {
    setAppliedFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const resetFilters = () => {
    setAppliedFilters(defaultFilterValues);
    setEditDescription('');
  };

  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    setEditDescription('');
    try {
      const filtersToDescribe: GenerateEditDescriptionInput = {
        filtersApplied: Object.entries(appliedFilters)
          .map(([id, value]) => {
            const filterInfo = AVAILABLE_FILTERS.find(f => f.id === id);
            if (!filterInfo || value === defaultFilterValues[id as keyof typeof defaultFilterValues]) return null;
            return `${filterInfo.name} applied at ${value}${filterInfo.unit}`;
          })
          .filter((item): item is string => item !== null),
      };

      if (filtersToDescribe.filtersApplied.length === 0) {
        setEditDescription('No filters have been applied to the image.');
        return;
      }
      
      const result = await generateEditDescription(filtersToDescribe);
      setEditDescription(result.description);
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate edit description. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No image to download.',
      });
      return;
    }
    const link = document.createElement('a');
    link.download = 'filterforge-edit.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-8 p-4 md:p-8 h-full">
      <div className="lg:col-span-3 bg-card/50 rounded-lg flex items-center justify-center p-4 border border-dashed aspect-video relative overflow-hidden">
        {imageSrc ? (
          <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="text-center text-muted-foreground p-8">
            <ImageIcon className="mx-auto h-16 w-16" />
            <h3 className="mt-4 text-xl font-medium">Image Editor</h3>
            <p className="mt-2 text-sm">Upload an image to start applying filters.</p>
          </div>
        )}
      </div>

      <Card className="lg:col-span-2 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <SlidersHorizontal className="mr-2 h-6 w-6 text-primary" />
            Controls
          </CardTitle>
          <CardDescription>Adjust filters and see your image update in real-time.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden flex flex-col">
          <div className="mb-4">
            <input
              type="file"
              ref={uploadInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <Button className="w-full" variant={imageSrc ? 'outline' : 'default'} onClick={() => uploadInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {imageSrc ? 'Change Image' : 'Upload Image'}
            </Button>
          </div>

          <div className="flex-grow overflow-hidden">
            <ScrollArea className="h-full pr-4 -mr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {AVAILABLE_FILTERS.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <Label htmlFor={filter.id} className="flex items-center text-sm">
                      <filter.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {filter.name}
                      <span className="ml-auto text-xs text-muted-foreground">{appliedFilters[filter.id]}{filter.unit}</span>
                    </Label>
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
          </div>
        </CardContent>
        <CardFooter className="flex-col !items-stretch space-y-4 pt-6">
            <div className="space-y-2">
                <Button className="w-full" onClick={handleGenerateDescription} disabled={!imageSrc || isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                    Generate Description
                </Button>
                {editDescription && (
                    <Textarea value={editDescription} readOnly rows={2} className="bg-muted mt-2 text-sm" />
                )}
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={resetFilters} disabled={!imageSrc}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
              <Button onClick={handleDownload} disabled={!imageSrc}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
