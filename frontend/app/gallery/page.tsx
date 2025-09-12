'use client';

import { useEffect, useState, useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { abi } from '../../contract/NFTMinter_ABI.json';
import { NFTCard, NFTMetadata } from '../components/NFTCard';
import { GalleryFilter } from '../components/GalleryFilter';
import Link from 'next/link';

const resolveIpfsUrl = (ipfsUrl: string): string => {
  if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) return ipfsUrl;
  const hash = ipfsUrl.replace('ipfs://', '');
  return `https://ipfs.io/ipfs/${hash}`;
};

export default function GalleryPage() {
  const [allNfts, setAllNfts] = useState<NFTMetadata[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

  const { data: tokenCounterData } = useReadContracts({
    contracts: [{
      address: contractAddress,
      abi,
      functionName: 'tokenCounter',
    }]
  });
  const tokenCounter = tokenCounterData?.[0].status === 'success' ? Number(tokenCounterData[0].result) : 0;

  const tokenUriContracts = useMemo(() => {
    return Array.from({ length: tokenCounter }, (_, i) => ({
      address: contractAddress,
      abi,
      functionName: 'tokenURI',
      args: [BigInt(i)],
    }));
  }, [tokenCounter, contractAddress]);

  const { data: tokenUrisData } = useReadContracts({
    contracts: tokenUriContracts,
    query: { enabled: tokenCounter > 0 },
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!tokenUrisData || tokenUrisData.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const metadataPromises = tokenUrisData
        .filter(uriData => uriData.status === 'success' && uriData.result)
        .map(uriData => fetch(resolveIpfsUrl(uriData.result as string)).then(res => res.json()));
      
      try {
        const metadatas = await Promise.all(metadataPromises);
        setAllNfts(metadatas);
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [tokenUrisData]);

  const filteredNfts = useMemo(() => {
    if (Object.keys(filters).length === 0) {
      return allNfts;
    }

    return allNfts.filter(nft => {
      return Object.entries(filters).every(([traitType, value]) => {
        if (!value) return true; 
        return nft.attributes.some(attr => attr.trait_type === traitType && attr.value === value);
      });
    });
  }, [allNfts, filters]);

  const handleFilterChange = (newFilter: Record<string, string>) => {
    const traitType = Object.keys(newFilter)[0];
    const value = Object.values(newFilter)[0];
    
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters };
      if (value) {
        updatedFilters[traitType] = value;
      } else {
        delete updatedFilters[traitType];
      }
      return updatedFilters;
    });
  };

  return (
    <main className="container mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">NFT Gallery</h1>
        <Link href="/mint" className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Mint an NFT
        </Link>
      </header>
      
      {isLoading ? (
        <p className="text-center">Loading NFTs...</p>
      ) : allNfts.length > 0 ? (
        <>
          <GalleryFilter nfts={allNfts} onFilterChange={handleFilterChange} />
          {filteredNfts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredNfts.map((nft, index) => (
                <NFTCard key={index} metadata={nft} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No NFTs match the current filters.</p>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500">No NFTs have been minted yet.</p>
      )}
    </main>
  );
}