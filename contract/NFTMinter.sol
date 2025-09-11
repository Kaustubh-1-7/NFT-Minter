// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMint is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;

    constructor() ERC721("StudentNFT", "SNFT") Ownable(msg.sender) {}

    function mintNFT(string memory tokenURI) public {
        uint256 newId = tokenCounter;
        _safeMint(msg.sender, newId);
        _setTokenURI(newId, tokenURI);
        tokenCounter += 1;
    }
}
