'use client';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
}

interface NFTCardProps {
  metadata: NFTMetadata;
}

const resolveIpfsUrl = (ipfsUrl: string): string => {
  if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl;
  }
  const hash = ipfsUrl.replace('ipfs://', '');
  return `https://ipfs.io/ipfs/${hash}`;
};

export function NFTCard({ metadata }: NFTCardProps) {
  if (!metadata) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group">
      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-purple-600 animate-gradient-x opacity-90"></div>

      <div className="relative z-10 bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
        <img
          src={resolveIpfsUrl(metadata.image)}
          alt={metadata.name}
          className="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="p-4">
          <h3 className="text-xl font-bold mb-2 text-white">{metadata.name}</h3>
          <p className="text-gray-300 text-sm mb-4 line-clamp-3">{metadata.description}</p>
          <div className="flex flex-wrap gap-2">
            {metadata.attributes.map((attr, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md"
              >
                <strong>{attr.trait_type}:</strong> {attr.value}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
