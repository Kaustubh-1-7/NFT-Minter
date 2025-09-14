// app/gallery/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { abi as rawAbi } from '../../contract/NFTMinter_ABI.json';
import type { Abi } from 'viem';
import { NFTCard, NFTMetadata } from '../components/NFTCard';
import { GalleryFilter } from '../components/GalleryFilter';
import Link from 'next/link';

const abi = rawAbi as Abi;

const resolveIpfsUrl = (ipfsUrl: string): string => {
  if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) return ipfsUrl;
  const hash = ipfsUrl.replace('ipfs://', '');
  return `https://ipfs.io/ipfs/${hash}`;
};

export default function GalleryPage() {
  const [allNfts, setAllNfts] = useState<NFTMetadata[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

  // Step 1: Fetch the total number of minted tokens using the correct `totalMinted` function.
  const { data: totalMintedData, isLoading: isLoadingTotalSupply } = useReadContracts({
    contracts: [{
      address: contractAddress,
      abi,
      functionName: 'totalMinted',
    }]
  });
  const totalMinted = totalMintedData?.[0].status === 'success' ? Number(totalMintedData[0].result) : 0;

  // Step 2: Prepare the list of all token URI calls based on the total supply.
  // This uses 1-based indexing as per your new contract (IDs 1, 2, 3, ...).
  const tokenUriContracts = useMemo(() => {
    if (totalMinted === 0) return [];
    
    const tokenIds = Array.from({ length: totalMinted }, (_, i) => BigInt(i + 1));

    return tokenIds.map(tokenId => ({
      address: contractAddress,
      abi,
      functionName: 'getTokenURI', // Use the correct getTokenURI function
      args: [tokenId],
    }));
  }, [totalMinted, contractAddress]);

  // Step 3: Fetch all token URIs at once using the declarative hook.
  // This is much more reliable with providers like Privy.
  const { data: tokenUrisData } = useReadContracts({
    contracts: tokenUriContracts,
    // Only run this query after we have the total count.
    query: { enabled: totalMinted > 0 },
  });

  // Step 4: Process the fetched URIs and get the metadata from IPFS.
  useEffect(() => {
    const fetchMetadata = async () => {
      // Don't proceed if the first hook is still loading.
      if (isLoadingTotalSupply) {
        return;
      }
      
      // If we have a total count, but no URI data yet, wait.
      if (totalMinted > 0 && !tokenUrisData) {
        return;
      }

      // If there are no NFTs, stop the loading process.
      if (totalMinted === 0) {
        setIsLoading(false);
        return;
      }

      // If we have URI data, fetch the metadata for each one.
      if (tokenUrisData) {
        const metadataPromises = tokenUrisData
          .filter(uriData => uriData.status === 'success' && uriData.result)
          .map(uriData => fetch(resolveIpfsUrl(uriData.result as string)).then(res => res.json()));
        
        try {
          const metadatas = await Promise.all(metadataPromises);
          setAllNfts(metadatas);
        } catch (error) {
          console.error("Failed to fetch metadata from IPFS:", error);
        } finally {
          setIsLoading(false); // Stop loading after all processing is done.
        }
      }
    };

    fetchMetadata();
  }, [tokenUrisData, totalMinted, isLoadingTotalSupply]);

  // Filtering logic remains the same.
  const filteredNfts = useMemo(() => {
    if (Object.keys(filters).length === 0) return allNfts;
    return allNfts.filter(nft => 
      Object.entries(filters).every(([traitType, value]) => {
        if (!value) return true; 
        return nft.attributes.some(attr => attr.trait_type === traitType && attr.value === value);
      })
    );
  }, [allNfts, filters]);

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
      
      {isLoading ? (
        <p className="text-center text-lg">Loading NFTs...</p>
      ) : allNfts.length > 0 ? (
        <>
          <GalleryFilter nfts={allNfts} onFilterChange={handleFilterChange} />
          {filteredNfts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredNfts.map((nft, index) => (
                <NFTCard key={nft.name + index} metadata={nft} />
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