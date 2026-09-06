import React from "react";
import { PackageSummary } from "./types";
import { Clock, MapPin, ExternalLink, Sparkles } from "lucide-react";

interface PackageCardProps {
  packageData: PackageSummary;
  domain?: string;
  onClick?: (pkg: PackageSummary) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ packageData, domain = "traveally.com", onClick }) => {
  const sym = packageData.currency_symbol || "₹";
  const priceFormatted =
    packageData.price && packageData.price > 0
      ? `${sym}${packageData.price.toLocaleString()}`
      : "Price on request";

  const cleanDomain = domain.replace(/^https?:\/\//, "").split(":")[0].replace(/^www\./, "");
  const targetUrl = packageData.slug
    ? `https://${cleanDomain}/packages/${packageData.slug}`
    : `https://${cleanDomain}/packages`;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(packageData);
    }
  };

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="traveally-cb-package-card"
      onClick={handleClick}
      title={`View ${packageData.package_name} details`}
    >
      <div className="traveally-cb-pkg-header">
        <div className="traveally-cb-pkg-title">{packageData.package_name}</div>
        <div className="traveally-cb-pkg-price">{priceFormatted}</div>
      </div>

      {packageData.package_subtitle && (
        <div className="traveally-cb-pkg-subtitle">{packageData.package_subtitle}</div>
      )}

      <div className="traveally-cb-pkg-meta">
        {packageData.duration && (
          <span className="traveally-cb-pkg-badge">
            <Clock size={11} /> {packageData.duration}
          </span>
        )}
        {packageData.destination && (
          <span className="traveally-cb-pkg-badge">
            <MapPin size={11} /> {packageData.destination}
          </span>
        )}
      </div>

      <div className="traveally-cb-pkg-action">
        <span>View Details & Itinerary</span>
        <ExternalLink size={11} />
      </div>
    </a>
  );
};
