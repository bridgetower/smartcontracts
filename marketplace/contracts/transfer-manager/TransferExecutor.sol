// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../openzeppelin-upgradeable/access/OwnableUpgradeable.sol";

import "../openzeppelin-upgradeable/proxy/utils/Initializable.sol";

import "../transfer-manager/lib/LibTransfer.sol";

import "../interfaces/IERC20TransferProxy.sol";
import "../interfaces/INftTransferProxy.sol";
import "../interfaces/ITransferExecutor.sol";
import "../interfaces/ITransferProxy.sol";

abstract contract TransferExecutor is
    Initializable,
    OwnableUpgradeable,
    ITransferExecutor
{
    using LibTransfer for address;

    mapping(bytes4 => address) internal proxies;

    event ProxyChange(bytes4 indexed assetType, address proxy);

    function __TransferExecutor_init_unchained(
        address transferProxy,
        address erc20TransferProxy
    ) internal {
        proxies[LibAsset.ERC20_ASSET_CLASS] = erc20TransferProxy;
        proxies[LibAsset.ERC721_ASSET_CLASS] = transferProxy;
        proxies[LibAsset.ERC1155_ASSET_CLASS] = transferProxy;
    }

    function setTransferProxy(bytes4 assetType, address proxy)
        public
        virtual
        onlyOwner
    {
        proxies[assetType] = proxy;

        emit ProxyChange(assetType, proxy);
    }

    function transfer(
        LibAsset.Asset memory asset,
        address from,
        address to,
        address proxy
    ) internal override {
        if (asset.assetType.assetClass == LibAsset.ERC721_ASSET_CLASS) {
            // Not using transfer proxy when transfering from this contract
            (address token, uint256 tokenId) = abi.decode(
                asset.assetType.data,
                (address, uint256)
            );

            require(asset.value == 1, "TransferExecutor: erc721 value error");

            if (from == address(this)) {
                IERC721Upgradeable(token).safeTransferFrom(
                    address(this),
                    to,
                    tokenId
                );
            } else {
                INftTransferProxy(proxy).erc721safeTransferFrom(
                    IERC721Upgradeable(token),
                    from,
                    to,
                    tokenId
                );
            }
        } else if (asset.assetType.assetClass == LibAsset.ERC20_ASSET_CLASS) {
            // Not using transfer proxy when transfering from this contract
            address token = abi.decode(asset.assetType.data, (address));

            if (from == address(this)) {
                IERC20Upgradeable(token).transfer(to, asset.value);
            } else {
                IERC20TransferProxy(proxy).erc20safeTransferFrom(
                    IERC20Upgradeable(token),
                    from,
                    to,
                    asset.value
                );
            }
        } else if (asset.assetType.assetClass == LibAsset.ERC1155_ASSET_CLASS) {
            // Not using transfer proxy when transfering from this contract
            (address token, uint256 tokenId) = abi.decode(
                asset.assetType.data,
                (address, uint256)
            );

            if (from == address(this)) {
                IERC1155Upgradeable(token).safeTransferFrom(
                    address(this),
                    to,
                    tokenId,
                    asset.value,
                    ""
                );
            } else {
                INftTransferProxy(proxy).erc1155safeTransferFrom(
                    IERC1155Upgradeable(token),
                    from,
                    to,
                    tokenId,
                    asset.value,
                    ""
                );
            }
        } else if (asset.assetType.assetClass == LibAsset.AVAX_ASSET_CLASS) {
            if (to != address(this)) {
                to.transferAvax(asset.value);
            }
        } else {
            ITransferProxy(proxy).transfer(asset, from, to);
        }
    }

    uint256[49] private __gap;
}
