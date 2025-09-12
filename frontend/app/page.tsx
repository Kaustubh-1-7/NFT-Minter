
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link"; 
import { SquarePen, Sparkles } from "lucide-react";
import { Inter, Poppins } from "next/font/google";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ['400', '500'],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ['600', '700'],
});

const images: string[] = [
  "/ape1.jpeg",
  "/ape2.jpeg",
  "/ape3.jpeg",
];

const Logo: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
  </svg>
);


const HomePage: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 h-screen bg-black text-white font-sans ${inter.variable} ${poppins.variable}`}>
      <div className="flex flex-col justify-center px-10 gap-10">
        <h1 className="text-5xl font-bold flex items-center gap-2 font-heading">
          <Logo />
          Create
        </h1>

       
        <Link href="/mint" className="animated-border-box group">
          <span className="border-span border-top"></span>
          <span className="border-span border-right"></span>
          <span className="border-span border-bottom"></span>
          <span className="border-span border-left"></span>
          <div className="content-wrapper bg-[#1a1a1a] p-6 rounded-xl cursor-pointer w-full">
            <h2 className="text-2xl font-semibold pb-5 font-heading flex items-center gap-3">
              <SquarePen className="w-6 h-6 text-blue-400" />
              Create NFT
            </h2>
            <p className="text-md text-white font-sans">
              Upload your artwork, add unique details, and customize every aspect of your NFT. Take full control of your creative process.
            </p>
          </div>
        </Link>

        <Link href="/gallery" className="animated-border-box group">
          <span className="border-span border-top"></span>
          <span className="border-span border-right"></span>
          <span className="border-span border-bottom"></span>
          <span className="border-span border-left"></span>
          <div className="content-wrapper bg-[#1a1a1a] p-6 rounded-xl cursor-pointer w-full">
            <h2 className="text-2xl font-semibold pb-5 font-heading flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Explore Marketplace
            </h2>
            <p className="text-md text-white font-sans">
              Discover and browse a vibrant collection of unique digital assets created by our community. Filter and find your next favorite NFT.
            </p>
          </div>
        </Link>
      </div>

      <div className="relative hidden md:flex items-center justify-center h-screen overflow-hidden bg-[#1a14c6]">
        <img
          src={images[currentImage]}
          alt="Featured NFT"
          className="h-full w-full object-cover object-center transition-opacity duration-500"
        />
      </div>
    </div>
  );
}

export default HomePage;