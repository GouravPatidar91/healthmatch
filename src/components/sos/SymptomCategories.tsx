
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SymptomCategory } from '@/types';

interface SymptomCategoriesProps {
  categories: SymptomCategory[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedSymptoms: string[];
  onSymptomsChange: (symptoms: string[]) => void;
}

export function SymptomCategories({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedSymptoms,
  onSymptomsChange,
}: SymptomCategoriesProps) {
  const currentCategorySymptoms = categories.find(cat => cat.category === selectedCategory)?.symptoms || [];
  
  const handleSymptomToggle = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      onSymptomsChange(selectedSymptoms.filter(s => s !== symptom));
    } else {
      onSymptomsChange([...selectedSymptoms, symptom]);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Symptom Category</h3>
        <RadioGroup 
          value={selectedCategory} 
          onValueChange={onCategoryChange}
          className="grid grid-cols-2 md:grid-cols-3 gap-2"
        >
          {categories.map((category) => (
            <div key={category.category} className="flex items-center space-x-2">
              <RadioGroupItem value={category.category} id={category.category} />
              <Label htmlFor={category.category}>{category.category}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Symptoms</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {currentCategorySymptoms.map((symptom) => (
            <div key={symptom} className="flex items-center space-x-2">
              <Checkbox 
                id={symptom}
                checked={selectedSymptoms.includes(symptom)}
                onCheckedChange={() => handleSymptomToggle(symptom)}
              />
              <Label htmlFor={symptom}>{symptom}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
