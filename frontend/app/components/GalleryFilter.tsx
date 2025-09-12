'use client';

import { NFTMetadata } from './NFTCard';

interface GalleryFilterProps {
  nfts: NFTMetadata[];
  onFilterChange: (filters: Record<string, string>) => void;
}

export function GalleryFilter({ nfts, onFilterChange }: GalleryFilterProps) {
  const filterOptions = nfts.reduce((acc, nft) => {
    nft.attributes.forEach(attr => {
      if (!acc[attr.trait_type]) {
        acc[attr.trait_type] = new Set();
      }
      acc[attr.trait_type].add(attr.value);
    });
    return acc;
  }, {} as Record<string, Set<string>>);

  const handleSelectChange = (traitType: string, value: string) => {
    onFilterChange({ [traitType]: value });
  };

  return (
    <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-100 rounded-lg">
      {Object.entries(filterOptions).map(([traitType, values]) => (
        <div key={traitType}>
          <label htmlFor={traitType} className="block text-sm font-medium text-gray-700 mb-1">
            {traitType}
          </label>
          <select
            id={traitType}
            onChange={(e) => handleSelectChange(traitType, e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="">All</option>
            {Array.from(values).map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}