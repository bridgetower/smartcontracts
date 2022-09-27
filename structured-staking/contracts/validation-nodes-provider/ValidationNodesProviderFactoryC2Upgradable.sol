//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "./ValidationNodesProviderUpgradeable.sol";

abstract contract ValidationNodesProviderFactoryC2Upgradable is
    OwnableUpgradeable
{
    address public beacon;

    event ValidationNodesProviderProxyCreated(
        address indexed deployer,
        address indexed proxy
    );

    function __ValidationNodesProviderFactoryC2_init_unchained(
        address initialBeacon
    ) internal initializer {
        require(
            AddressUpgradeable.isContract(initialBeacon),
            "ValidationNodesProviderFactoryC2: not contract address"
        );

        beacon = initialBeacon;
    }

    function createValidationNodesProvider(
        address securitizeRegistryProxy,
        address contractsRegistryProxy,
        string[] memory validationNodes,
        uint256 salt
    ) internal returns (address beaconProxy) {
        beaconProxy = _deployProxy(
            _getData(
                securitizeRegistryProxy,
                contractsRegistryProxy,
                validationNodes
            ),
            salt
        );
        ValidationNodesProviderUpgradeable provider = ValidationNodesProviderUpgradeable(
                address(beaconProxy)
            );

        provider.transferOwnership(_msgSender());

        emit ValidationNodesProviderProxyCreated(_msgSender(), beaconProxy);
    }

    function getAddress(
        address securitizeRegistryProxy,
        address contractsRegistryProxy,
        string[] memory validationNodes,
        uint256 salt
    ) external view returns (address) {
        bytes memory bytecode = _getCreationBytecode(
            _getData(
                securitizeRegistryProxy,
                contractsRegistryProxy,
                validationNodes
            )
        );
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }

    function _deployProxy(bytes memory data, uint256 salt)
        private
        returns (address proxy)
    {
        bytes memory bytecode = _getCreationBytecode(data);

        assembly {
            proxy := create2(0, add(bytecode, 0x20), mload(bytecode), salt)

            if iszero(extcodesize(proxy)) {
                revert(0, 0)
            }
        }
    }

    function _getCreationBytecode(bytes memory _data)
        private
        view
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                type(BeaconProxy).creationCode,
                abi.encode(beacon, _data)
            );
    }

    function _getData(
        address securitizeRegistryProxy,
        address contractsRegistryProxy,
        string[] memory validationNodes
    ) private pure returns (bytes memory) {
        return
            abi.encodeWithSelector(
                ValidationNodesProviderUpgradeable(address(0))
                    .__ValidationNodesProvider_init
                    .selector,
                securitizeRegistryProxy,
                contractsRegistryProxy,
                validationNodes
            );
    }
}
