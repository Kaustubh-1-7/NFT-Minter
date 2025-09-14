// app/gallery/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useReadContracts } from 'wagmi';
import { abi as rawAbi } from '../contract/NFTMinter_ABI.json';
import type { Abi } from 'viem';
import { NFTCard, NFTMetadata } from '../components/NFTCard';
import { GalleryFilter } from '../components/GalleryFilter';
import Link from 'next/link';

const abi = rawAbi as Abi;
const BATCH_SIZE = 8; 

const resolveIpfsUrl = (ipfsUrl: string): string => {
  if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) return ipfsUrl;
  const hash = ipfsUrl.replace('ipfs://', '');
  return `https://ipfs.io/ipfs/${hash}`;
};

export default function GalleryPage() {
  const [allTokenUris, setAllTokenUris] = useState<string[]>([]);
  const [displayedNfts, setDisplayedNfts] = useState<NFTMetadata[]>([]);
  
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true); 
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false); 

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

  const { data: totalMintedData, isLoading: isLoadingTotalSupply } = useReadContracts({
    contracts: [{
      address: contractAddress,
      abi,
      functionName: 'totalMinted',
    }]
  });
  const totalMinted = totalMintedData?.[0].status === 'success' ? Number(totalMintedData[0].result) : 0;

  const tokenUriContracts = useMemo(() => {
    if (totalMinted === 0) return [];
    
    const tokenIds = Array.from({ length: totalMinted }, (_, i) => BigInt(i + 1));
    return tokenIds.reverse().map(tokenId => ({
      address: contractAddress,
      abi,
      functionName: 'getTokenURI',
      args: [tokenId],
    }));
  }, [totalMinted, contractAddress]);

  const { data: tokenUrisData } = useReadContracts({
    contracts: tokenUriContracts,
    query: { enabled: totalMinted > 0 },
  });

  const loadMoreMetadata = useCallback(async () => {
    if (isLoadingMore || allTokenUris.length === 0) return;

    setIsLoadingMore(true);
    const currentCount = displayedNfts.length;
    const urisToFetch = allTokenUris.slice(currentCount, currentCount + BATCH_SIZE);

    if (urisToFetch.length === 0) {
      setIsLoadingMore(false);
      return;
    }

    const metadataPromises = urisToFetch.map(uri => fetch(resolveIpfsUrl(uri)).then(res => res.json()));
    
    try {
      const newMetadatas = await Promise.all(metadataPromises);
      setDisplayedNfts(prev => [...prev, ...newMetadatas]);
    } catch (error) {
      console.error("Failed to fetch metadata batch:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [allTokenUris, displayedNfts.length, isLoadingMore]);

 
  useEffect(() => {
    if (tokenUrisData) {
      const validUris = tokenUrisData
        .filter(uri => uri.status === 'success' && uri.result)
        .map(uri => uri.result as string);
        
      if (validUris.length > 0 && allTokenUris.length === 0) {
        setAllTokenUris(validUris);
      }
    }
  }, [tokenUrisData, allTokenUris.length]);

  useEffect(() => {
    if (allTokenUris.length > 0 && displayedNfts.length === 0) {
      loadMoreMetadata().finally(() => setIsLoadingInitial(false));
    } else if (totalMinted === 0 && !isLoadingTotalSupply) {
      setIsLoadingInitial(false);
    }
  }, [allTokenUris, displayedNfts.length, totalMinted, isLoadingTotalSupply, loadMoreMetadata]);

const filteredNfts = useMemo(() => {
  if (Object.keys(filters).length === 0) return displayedNfts;
  
  return displayedNfts.filter(nft => 
    Object.entries(filters).every(([traitType, value]) => {
      if (!value) return true; // If filter is empty, it passes

      // If the trait is "Roll No", use a partial match (.includes())
      if (traitType === 'Roll No') {
        const rollNoAttribute = nft.attributes.find(attr => attr.trait_type === 'Roll No');
        return rollNoAttribute ? rollNoAttribute.value.toLowerCase().includes(value.toLowerCase()) : false;
      }

      return nft.attributes.some(attr => attr.trait_type === traitType && attr.value === value);
    })
  );
}, [displayedNfts, filters]);
  
  const handleFilterChange = (newFilter: Record<string, string>) => {
    const traitType = Object.keys(newFilter)[0];
    const value = Object.values(newFilter)[0];
    setFilters(prev => {
      const updated = { ...prev };
      if (value) updated[traitType] = value;
      else delete updated[traitType];
      return updated;
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
      
      {isLoadingInitial ? (
        <p className="text-center text-lg">Loading Collection...</p>
      ) : displayedNfts.length > 0 ? (
        <>
          <GalleryFilter nfts={displayedNfts} onFilterChange={handleFilterChange} />
          {filteredNfts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredNfts.map((nft, index) => (
                <NFTCard key={nft.name + index} metadata={nft} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No NFTs match the current filters.</p>
          )}

          {displayedNfts.length < allTokenUris.length && (
            <div className="text-center mt-10">
              <button
                onClick={loadMoreMetadata}
                disabled={isLoadingMore}
                className="px-6 py-3 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500">No NFTs have been minted yet.</p>
      )}
    </main>
  );
}