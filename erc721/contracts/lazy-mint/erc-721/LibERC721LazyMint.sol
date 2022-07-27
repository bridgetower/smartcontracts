// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../royalties/LibPart.sol";

library LibERC721LazyMint {
    /**
     * keccak256("Mint721(uint256 tokenId,string tokenURI,Part[] creators,Part[] royalties)Part(address account,uint96 value)")
     */
    bytes32 public constant MINT_AND_TRANSFER_TYPEHASH =
        0xf64326045af5fd7e15297ba939f85b550474d3899daa47d2bc1ffbdb9ced344e;

    /**
     * bytes4(keccak256("ERC721_LAZY"))
     */
    bytes4 public constant ERC721_LAZY_ASSET_CLASS = 0xd8f960c1;
    bytes4 internal constant _INTERFACE_ID_MINT_AND_TRANSFER = 0x8486f69f;

    struct Mint721Data {
        uint256 tokenId;
        string tokenURI;
        LibPart.Part[] creators;
        LibPart.Part[] royalties;
        bytes[] signatures;
    }

    function hash(Mint721Data memory data) internal pure returns (bytes32) {
        bytes32[] memory royaltiesBytes = new bytes32[](data.royalties.length);

        for (uint256 i = 0; i < data.royalties.length; i++) {
            royaltiesBytes[i] = LibPart.hash(data.royalties[i]);
        }

        bytes32[] memory creatorsBytes = new bytes32[](data.creators.length);

        for (uint256 i = 0; i < data.creators.length; i++) {
            creatorsBytes[i] = LibPart.hash(data.creators[i]);
        }

        return
            keccak256(
                abi.encode(
                    MINT_AND_TRANSFER_TYPEHASH,
                    data.tokenId,
                    keccak256(bytes(data.tokenURI)),
                    keccak256(abi.encodePacked(creatorsBytes)),
                    keccak256(abi.encodePacked(royaltiesBytes))
                )
            );
    }
}
