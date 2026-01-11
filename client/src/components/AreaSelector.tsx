/**
 * PHASE 3: AREA SELECTOR COMPONENT
 * 
 * Shows dropdown when area detection fails (fallback mode)
 * Allows users to manually select their delivery area
 */

import React, { useEffect, useState } from "react";
import { getDeliveryAreas } from "@/lib/deliveryAreas";
import { ChevronDown } from "lucide-react";

interface AreaSelectorProps {
  selectedArea: string | null;
  onAreaChange: (area: string) => void;
}

export function AreaSelector({ selectedArea, onAreaChange }: AreaSelectorProps) {
  const [areas, setAreas] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load available areas on mount
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const availableAreas = await getDeliveryAreas();
        setAreas(availableAreas);
        console.log(`📍 AreaSelector loaded ${availableAreas.length} areas`);
      } catch (error) {
        console.warn("Failed to load areas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAreas();
  }, []);

  const handleSelect = (area: string) => {
    onAreaChange(area);
    setIsOpen(false);
    console.log(`📍 User selected area: ${area}`);
  };

  return (
    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        📍 Select Your Delivery Area
      </label>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
          disabled={isLoading}
        >
          <span className={selectedArea ? "text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
            {selectedArea ? selectedArea : "Choose your area..."}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        
        {isOpen && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {areas.length > 0 ? (
              areas.map((area) => (
                <button
                  key={area}
                  onClick={() => handleSelect(area)}
                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${
                    selectedArea === area 
                      ? "bg-blue-100 dark:bg-blue-900 font-semibold text-blue-900 dark:text-blue-100" 
                      : "text-gray-700 dark:text-gray-300"
                  } border-b border-gray-200 dark:border-gray-700 last:border-0`}
                >
                  {area}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
                No areas available
              </div>
            )}
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
        💡 Select your area to see accurate chefs and prices
      </p>
    </div>
  );
}
