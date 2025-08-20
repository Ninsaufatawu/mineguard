import React, { useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface IncidentDetailsProps {
  threatLevel: number[];
  setThreatLevel: (value: number[]) => void;
  miningType: string;
  setMiningType: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  miningTypeError: boolean;
}

export default function IncidentDetails({ 
  threatLevel, 
  setThreatLevel,
  miningType,
  setMiningType,
  description,
  setDescription,
  miningTypeError
}: IncidentDetailsProps) {
  useEffect(() => {
    console.log('Mining type changed to:', miningType);
  }, [miningType]);

  useEffect(() => {
    console.log('Description changed to:', description ? 'has content' : 'empty');
  }, [description]);

  const handleMiningTypeChange = (value: string) => {
    console.log('Setting mining type to:', value);
    setMiningType(value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('Setting description to:', e.target.value ? 'has content' : 'empty');
    setDescription(e.target.value);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Incident Details</h2>
      <div className="space-y-3">
        <div>
          <Label htmlFor="mining-type" className="text-sm font-medium flex items-center">
            Type of Mining Activity <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select value={miningType} onValueChange={handleMiningTypeChange}>
            <SelectTrigger 
              id="mining-type" 
              className={`w-full mt-1 ${miningTypeError ? 'border-red-500' : ''}`}
            >
              <SelectValue placeholder="Select mining activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Common Types</SelectLabel>
                <SelectItem value="riverbed">Riverbed Mining</SelectItem>
                <SelectItem value="forest">Forest Clearing for Mining</SelectItem>
                <SelectItem value="openpit">Open-pit Mining</SelectItem>
                <SelectItem value="underground">Underground Mining</SelectItem>
                <SelectItem value="other">Other (Specify in Description)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {miningTypeError && (
            <p className="text-red-500 text-xs mt-1">Please select a mining activity type</p>
          )}
        </div>
        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            Describe what you saw
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Provide as much detail as possible about the activity, equipment used, number of people involved, etc."
            className="min-h-[120px] mt-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-sm font-medium flex items-center">
              Threat Level <span className="text-red-500 ml-1">*</span>
            </Label>
            <span className="text-xs font-medium">
              {threatLevel[0] === 0 && "Very Low"}
              {threatLevel[0] === 1 && "Low"}
              {threatLevel[0] === 2 && "Medium"}
              {threatLevel[0] === 3 && "High"}
              {threatLevel[0] === 4 && "Very High"}
            </span>
          </div>
          <Slider
            defaultValue={[2]}
            max={4}
            step={1}
            value={threatLevel}
            onValueChange={setThreatLevel}
            className="py-3"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span className="text-green-500">Very Low</span>
            <span className="text-green-400">Low</span>
            <span className="text-yellow-500">Medium</span>
            <span className="text-orange-500">High</span>
            <span className="text-red-500">Very High</span>
          </div>
        </div>
      </div>
    </div>
  );
} 