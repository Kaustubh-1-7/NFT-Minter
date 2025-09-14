"use client";

import { useState, useEffect } from "react";
import { useWriteContract } from "wagmi";
import { ImageDropzone } from "../components/ImageDropzone";
import { abi } from "../../contract/NFTMinter_ABI.json";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import type { Abi } from 'viem';

type Attribute = {
  trait_type: string;
  value: string;
};

type MintStatus = "idle" | "uploading" | "confirming" | "error" | "success";

export default function MintPage() {
  // We use `useAccount`'s isPending state to know when wagmi is working with the wallet.
  const { isPending } = useWriteContract();
  const { ready, authenticated, user, login, logout } = usePrivy();

  // CHANGE 1: Get the user's wallet address from Privy and store it in state
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  useEffect(() => {
    if (user?.wallet?.address) {
      setAddress(user.wallet.address as `0x${string}`);
    } else {
      setAddress(undefined);
    }
  }, [user]);

  const { writeContractAsync } = useWriteContract();
  const [mintStatus, setMintStatus] = useState<MintStatus>("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([
    { trait_type: "Branch", value: "" },
    { trait_type: "Roll No", value: "" },
  ]);

  const handleAttributeChange = (
    index: number,
    field: keyof Attribute,
    value: string
  ) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const handleMint = async () => {
    // CHANGE 2: Add a check to ensure we have the recipient's address.
    if (!address) {
      alert("Could not find your wallet address. Please ensure it's connected.");
      return;
    }
    if (mintStatus !== "idle" || isPending) {
      return;
    }
    if (!imageFile || !name || !description) {
      alert("Please provide an image, name, and description.");
      return;
    }

    setMintStatus("uploading");

    try {
      const imageFormData = new FormData();
      imageFormData.append("file", imageFile);
      const imageRes = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
          body: imageFormData,
        }
      );
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

      const metadataRes = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
          body: JSON.stringify(metadata),
        }
      );
      const metadataData = await metadataRes.json();
      if (!metadataData.IpfsHash) {
        throw new Error("Failed to upload metadata to Pinata");
      }
      const metadataIpfsHash = metadataData.IpfsHash;

      setMintStatus("confirming");

      // CHANGE 3: Update the arguments array to match the contract.
      // The contract expects: mintNFT(address recipient, string memory tokenURI)
      const tx = await writeContractAsync({
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi: abi as Abi, // Cast abi to Abi type for type safety
        functionName: "mintNFT",
        args: [address, `ipfs://${metadataIpfsHash}`],
      });

      setMintStatus("success");
      alert("NFT Minted Successfully! Transaction hash: " + tx);
    } catch (error) {
      console.error("Minting failed:", error);
      alert("An error occurred during minting. See console for details.");
      setMintStatus("error");
    } finally {
      setTimeout(() => {
        setMintStatus("idle");
      }, 3000);
    }
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </main>
    );
  }

  const getButtonText = () => {
    if (mintStatus === "uploading") return "Uploading to IPFS...";
    if (isPending || mintStatus === "confirming") return "Confirming in wallet...";
    if (mintStatus === "success") return "Minted Successfully!";
    if (mintStatus === "error") return "Minting Failed";
    return "Mint NFT";
  };

  return (
    <>
      <main className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white gap-8">
        <div className="flex-1 flex items-center justify-center">
          {authenticated && user ? (
            <div className="w-full max-w-2xl">
              <div className="flex items-center justify-between pb-6 border-b border-gray-700">
                <Link
                  href="/gallery"
                  className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Explore NFT Gallery
                </Link>
                <h1 className="text-3xl font-bold">
                  Logged in through Privy
                </h1>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-base font-semibold text-white transition hover:bg-gray-600"
                >
                  <span>Logout</span>
                </button>
              </div>
              <div className="mt-8 rounded-2xl bg-gray-800 bg-opacity-50 p-8 shadow-lg backdrop-blur-lg">
                <h2 className="mb-6 text-xl font-semibold text-white">
                  User Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      User ID
                    </p>
                    <pre className="mt-1 max-w-full overflow-x-auto rounded-md bg-gray-900 p-3 font-mono text-sm text-gray-300">
                      {user.id}
                    </pre>
                  </div>
                  {user.wallet && (
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        Wallet Address
                      </p>
                      <pre className="mt-1 max-w-full overflow-x-auto rounded-md bg-gray-900 p-3 font-mono text-sm text-gray-300">
                        {user.wallet.address}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md rounded-2xl bg-gray-800 bg-opacity-50 p-8 text-center shadow-lg backdrop-blur-lg">
              <h1 className="mb-4 text-4xl font-bold">
                Welcome to the Nft Minter
              </h1>
              <h2 className="mb-8 text-lg text-gray-400">
                First, securely log in using Privy.
              </h2>
              <button
                onClick={login}
                className="w-full rounded-lg bg-violet-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-violet-700"
              >
                Log In
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center">
          <header className="w-full text-center mb-8">
            <h1 className="text-4xl font-bold">Mint a new Student NFT</h1>
          </header>

          {authenticated ? (
            <div className="max-w-xl w-full">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  Image
                </label>
                <ImageDropzone onFileAccepted={setImageFile} />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  placeholder="Enter your name"
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-600 rounded-md bg-gray-900 text-white"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  placeholder="desc."
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full p-2 border border-gray-600 rounded-md bg-gray-900 text-white"
                />
              </div>
              <h3 className="text-lg font-medium mb-2">Attributes</h3>
              {attributes.map((attr, index) => (
                <div key={index} className="flex gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Trait Type (e.g., Color)"
                    value={attr.trait_type}
                    onChange={(e) =>
                      handleAttributeChange(index, "trait_type", e.target.value)
                    }
                    className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-900 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={attr.value}
                    onChange={(e) =>
                      handleAttributeChange(index, "value", e.target.value)
                    }
                    className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-900 text-white"
                  />
                </div>
              ))}

              <button
                onClick={handleMint}
                disabled={mintStatus !== "idle" || isPending}
                className="w-full mt-4 py-3 px-4 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {getButtonText()}
              </button>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-center text-gray-400">
                Please log in to mint an NFT.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}