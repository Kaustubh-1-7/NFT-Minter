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
    <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white">
      <img
        src={resolveIpfsUrl(metadata.image)}
        alt={metadata.name}
        className="w-full h-56 object-cover"
        loading="lazy"
      />
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{metadata.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{metadata.description}</p>
        <div className="flex flex-wrap gap-2">
          {metadata.attributes.map((attr, index) => (
            <div key={index} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              <strong>{attr.trait_type}:</strong> {attr.value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}