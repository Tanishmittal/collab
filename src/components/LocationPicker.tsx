import React from "react";
import { ChevronDown, MapPin } from "lucide-react";
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

  const displayValue = value === "all" ? "All Cities" : value || placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`flex items-center justify-between text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all ${className}`}>
        <span className="truncate">{displayValue}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[220px] max-h-[350px] overflow-y-auto z-[100] bg-white border-gray-200" align="start">
        {showAllOption && (
          <DropdownMenuItem onClick={() => onChange("all")} className="cursor-pointer">
            All Cities
          </DropdownMenuItem>
        )}
        
        {loading ? (
          <div className="p-4 text-xs text-center text-gray-500">Loading locations...</div>
        ) : Object.keys(citiesByState).length === 0 ? (
           <div className="p-4 text-xs text-center text-gray-500">No locations found</div>
        ) : (
          Object.entries(citiesByState).map(([state, districts]) => (
            <DropdownMenuSub key={state}>
              <DropdownMenuSubTrigger className="cursor-pointer font-medium hover:bg-gray-50">
                <MapPin className="h-3.5 w-3.5 mr-2 text-gray-400" />
                <span className="truncate">{state}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-[200px] max-h-[300px] overflow-y-auto bg-white border-gray-200">
                  {districts.map((district) => (
                    <DropdownMenuItem
                      key={district}
                      onClick={() => onChange(district)}
                      className={`cursor-pointer ${value === district ? "bg-teal-50 text-teal-700 font-medium" : ""}`}
                    >
                      {district}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
