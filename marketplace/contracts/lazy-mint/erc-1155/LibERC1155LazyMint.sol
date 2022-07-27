// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../royalties/LibPart.sol";

library LibERC1155LazyMint {
    /**
     * keccak256("Mint1155(uint256 tokenId,uint256 supply,string tokenURI,Part[] creators,Part[] royalties)Part(address account,uint96 value)")
     */
    bytes32 public constant MINT_AND_TRANSFER_TYPEHASH =
        0xfb988707ebb338694f318760b0fd5cfe756d00a2ade251fda110b80c336a3c7f;

    /**
     * bytes4(keccak256("ERC1155_LAZY")) == 0x1cdfaa40
     */
    bytes4 public constant ERC1155_LAZY_ASSET_CLASS = 0x1cdfaa40;
    bytes4 internal constant _INTERFACE_ID_MINT_AND_TRANSFER = 0x6db15a0f;

    struct Mint1155Data {
        uint256 tokenId;
        string tokenURI;
        uint256 supply;
        LibPart.Part[] creators;
        LibPart.Part[] royalties;
        bytes[] signatures;
    }

    function hash(Mint1155Data memory data) internal pure returns (bytes32) {
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
                    data.supply,
                    keccak256(bytes(data.tokenURI)),
                    keccak256(abi.encodePacked(creatorsBytes)),
                    keccak256(abi.encodePacked(royaltiesBytes))
                )
            );
    }
}
