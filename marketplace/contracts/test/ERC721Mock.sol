//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721Mock is
    ERC721URIStorage,
    ERC721PresetMinterPauserAutoId,
    Ownable
{
    constructor()
        ERC721PresetMinterPauserAutoId(
            "ERC721 Mock Token",
            "ERC721MT",
            "ipfs:/"
        )
    {}

    function mintBatch(
        address to,
        uint8 count,
        string calldata uri
    ) public {
        for (uint8 i = 0; i < count; i++) {
            super.mint(to);
            super._setTokenURI(i, uri);
        }
    }

    function _baseURI()
        internal
        view
        override(ERC721, ERC721PresetMinterPauserAutoId)
        returns (string memory)
    {
        return super._baseURI();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721PresetMinterPauserAutoId) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721PresetMinterPauserAutoId)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
