// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../openzeppelin-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";

import "../openzeppelin-upgradeable/utils/AddressUpgradeable.sol";
import "../openzeppelin-upgradeable/utils/ContextUpgradeable.sol";

import "../libraries/LibSignature.sol";
import "../libraries/LibOrder.sol";

import "./interfaces/IERC1271.sol";

abstract contract OrderValidator is
    Initializable,
    ContextUpgradeable,
    EIP712Upgradeable
{
    using AddressUpgradeable for address;
    using LibSignature for bytes32;

    bytes4 internal constant MAGICVALUE = 0x1626ba7e;

    function __OrderValidator_init_unchained() internal initializer {
        __EIP712_init_unchained("Exchange", "2");
    }

    /**
        @dev validates order signature
        @param order order object
        @param signature order signature
    */

    function validate(LibOrder.Order memory order, bytes memory signature)
        internal
        view
    {
        if (order.salt == 0) {
            if (order.maker != address(0)) {
                require(
                    _msgSender() == order.maker,
                    "OrderValidator: maker is not tx sender"
                );
            } else {
                order.maker = _msgSender();
            }
        } else {
            if (_msgSender() != order.maker) {
                bytes32 hash = LibOrder.hash(order);
                address signer;

                if (signature.length == 65) {
                    signer = _hashTypedDataV4(hash).recover(signature);
                }

                if (signer != order.maker) {
                    if (order.maker.isContract()) {
                        require(
                            IERC1271(order.maker).isValidSignature(
                                _hashTypedDataV4(hash),
                                signature
                            ) == MAGICVALUE,
                            "OrderValidator: contract order signature verification error"
                        );
                    } else {
                        revert(
                            "OrderValidator: order signature verification error"
                        );
                    }
                } else {
                    require(
                        order.maker != address(0),
                        "OrderValidator: no maker"
                    );
                }
            }
        }
    }

    function isValidPaymentAssetType(LibAsset.AssetType memory assetType)
        internal
        view
        virtual
        returns (bool)
    {}

    uint256[50] private __gap;
}
