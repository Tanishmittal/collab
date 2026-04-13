import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, MapPin, Check, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useManagedOptions } from "@/hooks/useManagedOptions";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LocationMultiPickerProps {
  values: string[];
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const LocationMultiPicker = ({
  values,
  onChange,
  className = "",
  placeholder = "Select multiple locations",
}: LocationMultiPickerProps) => {
  const { citiesByState, loading } = useManagedOptions();
  const [open, setOpen] = useState(false);
  const [activeState, setActiveState] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const states = useMemo(() => Object.keys(citiesByState).sort(), [citiesByState]);

  // Find a smart default active state based on selected values
  useEffect(() => {
    if (open) {
      if (values && values.length > 0) {
        const firstSelected = values[0];
        const foundState = Object.entries(citiesByState).find(([_, districts]) =>
          districts.includes(firstSelected)
        );
        if (foundState) {
          setActiveState(foundState[0]);
          return;
        }
      }
      if (!activeState && states.length > 0) {
        // If not found, default to first state
        setActiveState(states[0]);
      }
    }
  }, [open, values, citiesByState, states, activeState]);

  const displayValue = values.length > 0 ? `${values.length} selected` : placeholder;

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
          className={`flex items-center justify-between px-4 py-2 text-sm rounded-2xl border transition-all ${
            open ? "border-slate-800 bg-slate-50" : "border-gray-200 bg-white hover:bg-gray-50"
          } focus:outline-none focus:ring-2 focus:ring-slate-500/30 ${className}`}
        >
          <span className="truncate flex-1 text-left">{displayValue}</span>
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
              className="w-full bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-slate-500 text-sm pl-9 py-2 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-center text-gray-500 flex flex-col items-center justify-center">
            <div className="h-6 w-6 border-2 border-slate-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            Loading locations...
          </div>
        ) : states.length === 0 ? (
           <div className="p-8 text-sm text-center text-gray-500">No locations found</div>
        ) : (
          <div className="flex h-[320px] bg-white">
            {/* Left Pane - States */}
            <div className="w-2/5 border-r border-gray-100 bg-gray-50/50">
              <ScrollArea className="h-full">
                {states.map(state => {
                  // Count how many selected values belong to this state
                  const districtsInState = citiesByState[state] || [];
                  const selectedCount = districtsInState.filter(d => values.includes(d)).length;
                  
                  return (
                    <div 
                      key={state}
                      className={`px-3 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors border-b border-gray-50 ${
                        activeState === state 
                          ? "bg-white text-slate-800 font-semibold border-l-2 border-l-slate-800" 
                          : "hover:bg-gray-100 text-gray-600"
                      }`}
                      onClick={() => setActiveState(state)}
                    >
                      <span className="truncate pr-2" title={state}>{state}</span>
                      {selectedCount > 0 && (
                        <span className="flex items-center justify-center bg-slate-800 text-white text-[10px] h-4 min-w-[16px] px-1 rounded-full shrink-0">
                          {selectedCount}
                        </span>
                      )}
                    </div>
                  );
                })}
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
                      const isSelected = values.includes(district);
                      return (
                        <div
                          key={district}
                          onClick={() => onChange(district)}
                          className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-md mb-0.5 transition-colors ${
                            isSelected 
                              ? "bg-slate-100 text-slate-800 font-medium" 
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span className="truncate" title={district}>{district}</span>
                          <div className={`flex items-center justify-center h-4 w-4 rounded border shrink-0 ml-2 ${
                            isSelected ? "bg-slate-800 border-slate-800 text-white" : "border-gray-300"
                          }`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
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
