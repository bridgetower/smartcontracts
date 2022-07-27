// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISecuritizeRegistryProxy {
    function setSecuritizeRegistry(address newSecuritizeRegistry) external;

    function isWhitelistedWallet(address wallet) external view returns (bool);
}
