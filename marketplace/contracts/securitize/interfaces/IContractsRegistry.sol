// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IContractsRegistry {
    function addContract(address addr) external;

    function removeContract(address addr) external;

    function setSecuritizeRegistryProxy(address newSecuritizeRegistryProxy)
        external;

    function setERC1155BridgeTowerFactoryC2(
        address newERC1155BridgeTowerFactoryC2
    ) external;

    function isWhitelisted(address addr) external view returns (bool);

    function securitizeRegistryProxy() external view returns (address);

    function erc1155BridgeTowerFactoryC2() external view returns (address);
}
