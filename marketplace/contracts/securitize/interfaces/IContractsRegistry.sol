// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IContractsRegistry {
    function addContract(address addr) external;

    function removeContract(address addr) external;

    function setSecuritizeRegistryProxy(address newSecuritizeRegistryProxy)
        external;

    function isWhitelisted(address addr) external view returns (bool);
}
