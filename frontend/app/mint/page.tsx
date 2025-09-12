'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { ConnectWallet } from '../components/ConnectWallet';
import { ImageDropzone } from '../components/ImageDropzone';
import { abi } from '../../contract/NFTMinter_ABI.json';

type Attribute = {
  trait_type: string;
  value: string;
};

type MintStatus = "idle" | "uploading" | "confirming" | "error" | "success";

export default function MintPage() {
  const { isConnected, address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [mintStatus, setMintStatus] = useState<MintStatus>("idle");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState<Attribute[]>([
    { trait_type: 'Color', value: '' },
    { trait_type: 'Rarity', value: '' },
  ]);

  const handleAttributeChange = (index: number, field: keyof Attribute, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const handleMint = async () => {
    if (mintStatus !== 'idle' || isPending) {
      return;
    }
    if (!imageFile || !name || !description) {
      alert('Please provide an image, name, and description.');
      return;
    }

    setMintStatus("uploading");

    try {
      const imageFormData = new FormData();
      imageFormData.append('file', imageFile);
      const imageRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}` },
        body: imageFormData,
      });
      const imageData = await imageRes.json();
      if (!imageData.IpfsHash) {
        throw new Error("Failed to upload image to Pinata");
      }
      const imageIpfsHash = imageData.IpfsHash;

      const metadata = {
        name,
        description,
        image: `ipfs://${imageIpfsHash}`,
        attributes,
      };

      const metadataRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
        body: JSON.stringify(metadata),
      });
      const metadataData = await metadataRes.json();
      if (!metadataData.IpfsHash) {
        throw new Error("Failed to upload metadata to Pinata");
      }
      const metadataIpfsHash = metadataData.IpfsHash;

      setMintStatus("confirming");

      const tx = await writeContractAsync({
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'mintNFT',
        args: [address, `ipfs://${metadataIpfsHash}`],
      });

      setMintStatus("success");
      alert('NFT Minted Successfully! Transaction hash: ' + tx);

    } catch (error) {
      console.error('Minting failed:', error);
      alert('An error occurred during minting. See console for details.');
      setMintStatus("error");
    } finally {
      setTimeout(() => {
        setMintStatus("idle");
      }, 3000);
    }
  };

  const getButtonText = () => {
    if (mintStatus === "uploading") return "Uploading to IPFS...";
    if (isPending || mintStatus === "confirming") return "Confirming in wallet...";
    if (mintStatus === "success") return "Minted Successfully!";
    if (mintStatus === "error") return "Minting Failed";
    return "Mint NFT";
  };

  return (
    <main className="container mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Mint a new Student NFT</h1>
        <ConnectWallet />
      </header>

      {isConnected ? (
        <div className="max-w-xl mx-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Image</label>
            <ImageDropzone onFileAccepted={setImageFile} />
          </div>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <h3 className="text-lg font-medium mb-2">Attributes (for filtering)</h3>
          {attributes.map((attr, index) => (
            <div key={index} className="flex gap-4 mb-2">
              <input
                type="text"
                placeholder="Trait Type (e.g., Color)"
                value={attr.trait_type}
                onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Value (e.g., Blue)"
                value={attr.value}
                onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
            </div>
          ))}

          <button
            onClick={handleMint}
            disabled={mintStatus !== 'idle' || isPending}
            className="w-full mt-4 py-3 px-4 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {getButtonText()}
          </button>
        </div>
      ) : (
        <p className="text-center">Please connect your wallet to mint an NFT.</p>
      )}
    </main>
  );
}