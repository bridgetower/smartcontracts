// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../openzeppelin-upgradeable/access/OwnableUpgradeable.sol";

import "../openzeppelin-upgradeable/proxy/utils/Initializable.sol";

import "../interfaces/IAssetMatcher.sol";

abstract contract AssetMatcher is Initializable, OwnableUpgradeable {
    bytes internal constant EMPTY = "";

    mapping(bytes4 => address) internal matchers;

    event MatcherChange(bytes4 indexed assetType, address matcher);

    function setAssetMatcher(bytes4 assetType, address matcher)
        public
        virtual
        onlyOwner
    {
        matchers[assetType] = matcher;

        emit MatcherChange(assetType, matcher);
    }

    function matchAssets(
        LibAsset.AssetType memory leftAssetType,
        LibAsset.AssetType memory rightAssetType
    ) internal view returns (LibAsset.AssetType memory) {
        LibAsset.AssetType memory result = matchAssetOneSide(
            leftAssetType,
            rightAssetType
        );

        if (result.assetClass == 0) {
            return matchAssetOneSide(rightAssetType, leftAssetType);
        } else {
            return result;
        }
    }

    function matchAssetOneSide(
        LibAsset.AssetType memory leftAssetType,
        LibAsset.AssetType memory rightAssetType
    ) private view returns (LibAsset.AssetType memory) {
        bytes4 classLeft = leftAssetType.assetClass;
        bytes4 classRight = rightAssetType.assetClass;

        if (classLeft == LibAsset.AVAX_ASSET_CLASS) {
            if (classRight == LibAsset.AVAX_ASSET_CLASS) {
                return leftAssetType;
            }

            return LibAsset.AssetType(0, EMPTY);
        }

        if (classLeft == LibAsset.ERC20_ASSET_CLASS) {
            if (classRight == LibAsset.ERC20_ASSET_CLASS) {
                return simpleMatch(leftAssetType, rightAssetType);
            }

            return LibAsset.AssetType(0, EMPTY);
        }

        if (classLeft == LibAsset.ERC721_ASSET_CLASS) {
            if (classRight == LibAsset.ERC721_ASSET_CLASS) {
                return simpleMatch(leftAssetType, rightAssetType);
            }

            return LibAsset.AssetType(0, EMPTY);
        }

        if (classLeft == LibAsset.ERC1155_ASSET_CLASS) {
            if (classRight == LibAsset.ERC1155_ASSET_CLASS) {
                return simpleMatch(leftAssetType, rightAssetType);
            }

            return LibAsset.AssetType(0, EMPTY);
        }

        address matcher = matchers[classLeft];

        if (matcher != address(0)) {
            return
                IAssetMatcher(matcher).matchAssets(
                    leftAssetType,
                    rightAssetType
                );
        }

        if (classLeft == classRight) {
            return simpleMatch(leftAssetType, rightAssetType);
        }

        revert("IAssetMatcher not found");
    }

    function simpleMatch(
        LibAsset.AssetType memory leftAssetType,
        LibAsset.AssetType memory rightAssetType
    ) private pure returns (LibAsset.AssetType memory) {
        bytes32 leftHash = keccak256(leftAssetType.data);
        bytes32 rightHash = keccak256(rightAssetType.data);

        if (leftHash == rightHash) {
            return leftAssetType;
        }

        return LibAsset.AssetType(0, EMPTY);
    }

    uint256[49] private __gap;
}
