// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTMinter is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("StudentNFT", "SNFT") Ownable(msg.sender) {}

    function mintNFT(address recipient, string memory tokenURI)
        public
        nonReentrant
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _safeMint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function totalMinted() public view returns (uint256) {
        return _tokenIds.current();
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURI(tokenId);
    }

    function getOwnedTokens(address user) public view returns (uint256[] memory) {
        uint256 supply = _tokenIds.current();
        uint256 count = balanceOf(user);
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= supply; i++) {
            if (ownerOf(i) == user) {
                result[index] = i;
                index++;
            }
        }
        return result;
    }

    function getCollectionDetails() public view returns (string memory, string memory) {
        return (name(), symbol());
    }
}
