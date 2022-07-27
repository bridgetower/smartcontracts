// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../openzeppelin-upgradeable/utils/introspection/ERC165StorageUpgradeable.sol";

import "../royalties/LibRoyaltiesV2.sol";
import "../royalties/IRoyalties.sol";

abstract contract RoyaltiesUpgradeable is ERC165StorageUpgradeable, IRoyalties {
    function __RoyaltiesUpgradeable_init_unchained() internal initializer {
        _registerInterface(LibRoyaltiesV2._INTERFACE_ID_ROYALTIES);
    }
}
