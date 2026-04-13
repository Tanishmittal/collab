import React from "react";
import { ChevronDown, MapPin, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useManagedOptions } from "@/hooks/useManagedOptions";

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

  const displayValue = values.length > 0 ? `${values.length} selected` : placeholder;

  // Prevent dropdown from closing immediately upon multi-selection
  const handleSelect = (e: React.MouseEvent, district: string) => {
    e.preventDefault();
    onChange(district);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`flex items-center justify-between px-4 py-2 text-sm rounded-2xl border bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500/30 transition-all ${className}`}>
        <span className="truncate">{displayValue}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px] max-h-[350px] overflow-y-auto z-[100] bg-white" align="start">
        {loading ? (
          <div className="p-4 text-xs text-center text-gray-500">Loading locations...</div>
        ) : Object.keys(citiesByState).length === 0 ? (
           <div className="p-4 text-xs text-center text-gray-500">No locations found</div>
        ) : (
          Object.entries(citiesByState).map(([state, districts]) => (
            <DropdownMenuSub key={state}>
              <DropdownMenuSubTrigger className="cursor-pointer font-medium hover:bg-slate-50">
                <MapPin className="h-3.5 w-3.5 mr-2 text-gray-400" />
                <span className="truncate">{state}</span>
                {districts.some(d => values.includes(d)) && (
                   <span className="ml-auto w-2 h-2 rounded-full bg-slate-800" />
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-[220px] max-h-[300px] overflow-y-auto bg-white border-slate-200">
                  {districts.map((district) => {
                    const isSelected = values.includes(district);
                    return (
                      <DropdownMenuItem
                        key={district}
                        onClick={(e) => handleSelect(e as any, district)}
                        className={`cursor-pointer flex items-center justify-between ${isSelected ? "bg-slate-100 font-medium" : ""}`}
                      >
                        <span className="truncate">{district}</span>
                        {isSelected && <Check className="h-4 w-4 text-slate-800 ml-2 shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
