"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { generateEditDescription } from '@/ai/flows/generate-edit-description';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sun,
  Contrast,
  Palette,
  Layers,
  Camera,
  WandSparkles,
  Download,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  Loader2,
  SlidersHorizontal,
  FlipHorizontal,
  Droplets,
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
};

const AVAILABLE_FILTERS: Filter[] = [
  { id: 'brightness', name: 'Brightness', unit: '%', min: 0, max: 200 },
  { id: 'contrast', name: 'Contrast', unit: '%', min: 0, max: 200 },
  { id: 'saturate', name: 'Saturation', unit: '%', min: 0, max: 200 },
  { id: 'grayscale', name: 'Grayscale', unit: '%', min: 0, max: 100 },
  { id: 'sepia', name: 'Sepia', unit: '%', min: 0, max: 100 },
  { id: 'hue-rotate', name: 'Hue Rotate', unit: 'deg', min: 0, max: 360 },
  { id: 'blur', name: 'Blur', unit: 'px', min: 0, max: 20 },
  { id: 'invert', name: 'Invert', unit: '%', min: 0, max: 100 },
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
  
    useEffect(() => {
    const loadSampleImage = async () => {
      try {
        const response = await fetch('https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?q=80&w=1480&auto=format&fit=crop');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = new window.Image();
          newImage.onload = () => {
            imageRef.current = newImage;
            const aspectRatio = newImage.width / newImage.height;
            const container = document.querySelector('.image-container');
            if(container) {
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                let width, height;
                if (containerWidth / containerHeight > aspectRatio) {
                    height = containerHeight;
                    width = height * aspectRatio;
                } else {
                    width = containerWidth;
                    height = width / aspectRatio;
                }
                setOriginalImageSize({width: newImage.naturalWidth, height: newImage.naturalHeight});
                setImageSrc(e.target?.result as string);
                resetFilters();
            }
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
      }
    };
    loadSampleImage();
  }, [toast]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] h-screen bg-black">
        <div className="flex items-center justify-center p-4 md:p-8 image-container">
            {imageSrc ? (
            <div className="relative rounded-lg overflow-hidden shadow-2xl bg-white">
                <canvas ref={canvasRef} className="max-w-full max-h-[80vh] object-contain" />
            </div>
            ) : (
            <div className="text-center text-muted-foreground p-8">
                <Loader2 className="mx-auto h-16 w-16 animate-spin" />
                <h3 className="mt-4 text-xl font-medium">Loading Image...</h3>
            </div>
            )}
        </div>

      <Card className="lg:col-start-2 flex flex-col bg-card border-l rounded-none">
        <CardContent className="flex-grow overflow-hidden flex flex-col p-0">
          <Tabs defaultValue="custom" className="flex flex-col h-full">
            <div className="p-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="presets"><WandSparkles className="mr-2" /> Presets</TabsTrigger>
                    <TabsTrigger value="custom"><SlidersHorizontal className="mr-2" /> Custom</TabsTrigger>
                </TabsList>
            </div>
            
            <TabsContent value="presets" className="flex-grow p-4 pt-0">
                <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                    <p>Preset filters coming soon!</p>
                </div>
            </TabsContent>

            <TabsContent value="custom" className="flex-grow overflow-hidden flex flex-col p-4 pt-0 mt-0">
                <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full pr-4 -mr-4">
                    <div className="space-y-6">
                        {AVAILABLE_FILTERS.map((filter) => (
                        <div key={filter.id} className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label htmlFor={filter.id} className="text-sm font-medium">
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
                            />
                        </div>
                        ))}
                    </div>
                    </ScrollArea>
                </div>
                <div className="pt-4 mt-auto">
                    <Button variant="outline" className="w-full" onClick={resetFilters}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset Filters
                    </Button>
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
