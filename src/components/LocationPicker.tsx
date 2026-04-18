import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, MapPin, Check, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useManagedOptions } from "@/hooks/useManagedOptions";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  showAllOption?: boolean;
}

export const LocationPicker = ({
  value,
  onChange,
  className = "",
  placeholder = "Select City",
  showAllOption = false,
}: LocationPickerProps) => {
  const { citiesByState, loading } = useManagedOptions();
  const [open, setOpen] = useState(false);
  const [activeState, setActiveState] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const states = useMemo(() => Object.keys(citiesByState).sort(), [citiesByState]);

  // Find which state the currently selected district belongs to
  useEffect(() => {
    if (open) {
      if (value && value !== "all") {
        const foundState = Object.entries(citiesByState).find(([_, districts]) =>
          districts.includes(value)
        );
        if (foundState) {
          setActiveState(foundState[0]);
          return;
        }
      }
      if (!activeState && states.length > 0) {
        // If not found or value is "all", default to first state
        setActiveState(states[0]);
      }
    }
  }, [open, value, citiesByState, states]);

  const displayValue = value === "all" ? "All Cities" : value || placeholder;

  const currentDistricts = useMemo(() => {
    if (!activeState || !citiesByState[activeState]) return [];
    
    let districts = citiesByState[activeState];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      districts = districts.filter(d => d.toLowerCase().includes(q));
    }
    return districts;
  }, [activeState, citiesByState, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className={`flex items-center justify-between text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all border ${
            open ? "border-teal-500 bg-teal-50/10" : "border-gray-200 bg-white"
          } px-3 py-2 ${className}`}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronDown className={`h-4 w-4 opacity-50 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[320px] md:w-[480px] p-0 z-[100] border-gray-200 overflow-hidden shadow-xl" 
        align="start"
      >
        <div className="flex border-b border-gray-100 p-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search districts..."
              className="w-full bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-teal-500 text-sm pl-9 py-2 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-center text-gray-500 flex flex-col items-center justify-center">
            <div className="h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            Loading locations...
          </div>
        ) : states.length === 0 ? (
           <div className="p-8 text-sm text-center text-gray-500">No locations found</div>
        ) : (
          <div className="flex h-[320px] bg-white">
            {/* Left Pane - States */}
            <div className="w-2/5 border-r border-gray-100 bg-gray-50/50">
              <ScrollArea className="h-full">
                {showAllOption && (
                  <div 
                    className={`px-3 py-2.5 text-sm cursor-pointer flex items-center transition-colors border-b border-gray-100 ${
                      value === "all" ? "bg-teal-50 text-teal-700 font-semibold" : "hover:bg-gray-100 text-gray-700 font-medium"
                    }`}
                    onClick={() => {
                      onChange("all");
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">All Cities</span>
                  </div>
                )}
                
                {states.map(state => (
                  <div 
                    key={state}
                    className={`px-3 py-2.5 text-sm cursor-pointer flex items-center transition-colors border-b border-gray-50 ${
                      activeState === state 
                        ? "bg-white text-teal-700 font-semibold border-l-2 border-l-teal-500" 
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                    onClick={() => setActiveState(state)}
                  >
                    <span className="truncate" title={state}>{state}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Right Pane - Districts */}
            <div className="w-3/5 bg-white">
              <ScrollArea className="h-full">
                {currentDistricts.length === 0 ? (
                  <div className="p-4 text-xs text-center text-gray-500 mt-10">
                    No districts found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="p-1">
                    {currentDistricts.map(district => {
                      const isSelected = value === district;
                      return (
                        <div
                          key={district}
                          onClick={() => {
                            onChange(district);
                            setOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-md mb-0.5 transition-colors ${
                            isSelected 
                              ? "bg-teal-50 text-teal-700 font-medium" 
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span className="truncate" title={district}>{district}</span>
                          {isSelected && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
