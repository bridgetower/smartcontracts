// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IContractsRegistryProxy {
    function setContractsRegistry(address newContractsRegistry) external;

    function setSecuritizeRegistryProxy(address newSecuritizeRegistryProxy)
        external;

    function isWhitelistedContract(address addr) external view returns (bool);
}
