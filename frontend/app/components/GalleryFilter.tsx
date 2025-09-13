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
    <div className="flex flex-wrap gap-6 mb-8 p-6 rounded-2xl relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-cyan-400 to-purple-700 animate-gradient-x opacity-90"></div>

      {/* Glass container */}
      <div className="relative z-10 flex flex-wrap gap-6 w-full bg-black/70 backdrop-blur-md rounded-2xl border border-white/20 p-6">
        {Object.entries(filterOptions).map(([traitType, values]) => (
          <div key={traitType} className="flex flex-col w-48">
            <label
              htmlFor={traitType}
              className="block text-sm font-semibold text-white mb-2 tracking-wide"
            >
              {traitType}
            </label>
            <div className="relative">
              <select
                id={traitType}
                onChange={(e) => handleSelectChange(traitType, e.target.value)}
                className="appearance-none w-full px-4 py-2.5 pr-10 rounded-lg text-white font-medium
                           bg-gradient-to-r from-purple-600/80 to-indigo-700/80
                           border border-white/30 shadow-md
                           focus:outline-none focus:ring-2 focus:ring-cyan-400
                           transition-all duration-300"
              >
                <option value="">All</option>
                {Array.from(values).map(value => (
                  <option key={value} value={value} className="bg-black text-white">
                    {value}
                  </option>
                ))}
              </select>

              {/* Custom dropdown arrow */}
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white">
                ▼
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
