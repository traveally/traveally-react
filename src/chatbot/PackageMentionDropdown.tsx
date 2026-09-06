import React from "react";
import { PackageSummary } from "./types";
import { Clock, MapPin, Loader2 } from "lucide-react";

interface PackageMentionDropdownProps {
  packages: PackageSummary[];
  isLoading: boolean;
  query: string;
  onSelect: (pkg: PackageSummary) => void;
  onClose?: () => void;
}

export const PackageMentionDropdown: React.FC<PackageMentionDropdownProps> = ({
  packages,
  isLoading,
  query,
  onSelect,
}) => {
  return (
    <div className="traveally-cb-mention-dropdown" role="listbox" aria-label="Available packages">
      <div className="traveally-cb-mention-header">
        <span>Packages {query ? `matching "${query}"` : "available"}</span>
        {isLoading && <Loader2 size={12} className="traveally-cb-spin" />}
      </div>

      {isLoading && packages.length === 0 ? (
        <div className="traveally-cb-mention-empty">
          <Loader2 size={16} className="traveally-cb-spin" style={{ margin: "0 auto 4px auto" }} />
          <div>Searching packages...</div>
        </div>
      ) : packages.length === 0 ? (
        <div className="traveally-cb-mention-empty">
          <div style={{ fontWeight: 600 }}>Not available</div>
          <div style={{ fontSize: "11px", opacity: 0.75, marginTop: "2px" }}>
            No packages match "@{query}"
          </div>
        </div>
      ) : (
        <div style={{ maxHeight: "210px", overflowY: "auto" }}>
          {packages.slice(0, 4).map((pkg) => {
            const sym = pkg.currency_symbol || "₹";
            const priceText = pkg.price && pkg.price > 0 ? `${sym}${pkg.price.toLocaleString()}` : "Price on request";

            return (
              <button
                key={pkg.id}
                type="button"
                className="traveally-cb-mention-item"
                onClick={() => onSelect(pkg)}
              >
                <div className="traveally-cb-mention-title-row">
                  <span className="traveally-cb-mention-name" title={pkg.package_name}>
                    {pkg.package_name}
                  </span>
                  <span className="traveally-cb-mention-price">{priceText}</span>
                </div>

                <div className="traveally-cb-mention-details">
                  {pkg.duration && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", marginRight: "8px" }}>
                      <Clock size={11} /> {pkg.duration}
                    </span>
                  )}
                  {pkg.destination && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <MapPin size={11} /> {pkg.destination}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
