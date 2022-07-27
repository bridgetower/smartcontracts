// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library LibAsset {
    /**
     * keccak256("AssetType(bytes4 assetClass,bytes data)")
     */
    bytes32 internal constant ASSET_TYPE_TYPEHASH =
        0x452a0dc408cb0d27ffc3b3caff933a5208040a53a9dbecd8d89cad2c0d40e00c;
    /**
     * keccak256("Asset(AssetType assetType,uint256 value)AssetType(bytes4 assetClass,bytes data)")
     */
    bytes32 internal constant ASSET_TYPEHASH =
        0xdb6f72e915676cfc289da13bc4ece054fd17b1df6d77ffc4a60510718c236b08;

    /**
     * bytes4(keccak256("ETH")) == 0xaaaebeba
     */
    bytes4 public constant ETH_ASSET_CLASS = 0xaaaebeba;
    /**
     * bytes4(keccak256("ERC20")) == 0x8ae85d84
     */
    bytes4 public constant ERC20_ASSET_CLASS = 0x8ae85d84;
    /**
     * bytes4(keccak256("ERC721")) == 0x73ad2146
     */
    bytes4 public constant ERC721_ASSET_CLASS = 0x73ad2146;
    /**
     * bytes4(keccak256("ERC1155")) == 0x973bb640
     */
    bytes4 public constant ERC1155_ASSET_CLASS = 0x973bb640;
    /**
     * bytes4(keccak256("COLLECTION")) == 0xf63c2825
     */
    bytes4 public constant COLLECTION = 0xf63c2825;

    struct AssetType {
        bytes4 assetClass;
        bytes data;
    }

    struct Asset {
        AssetType assetType;
        uint256 value;
    }

    function hash(AssetType memory assetType) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    ASSET_TYPE_TYPEHASH,
                    assetType.assetClass,
                    keccak256(assetType.data)
                )
            );
    }

    function hash(Asset memory asset) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(ASSET_TYPEHASH, hash(asset.assetType), asset.value)
            );
    }
}
