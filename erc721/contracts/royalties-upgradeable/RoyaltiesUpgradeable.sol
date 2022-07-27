// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165StorageUpgradeable.sol";

import "../royalties/LibRoyalties.sol";
import "../royalties/IRoyalties.sol";

abstract contract RoyaltiesUpgradeable is ERC165StorageUpgradeable, IRoyalties {
    function __RoyaltiesUpgradeable_init_unchained() internal initializer {
        _registerInterface(LibRoyalties._INTERFACE_ID_ROYALTIES);
    }
}
