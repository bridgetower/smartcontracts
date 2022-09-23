// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

pragma abicoder v2;

import "../../securitize/interfaces/IContractsRegistryProxy.sol";
import "../../securitize/interfaces/IContractsRegistry.sol";

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "../../securitize/WhitelistableUpgradeable.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "../erc-1155/ERC1155BridgeTower.sol";

import "../access/PartnerAccessControl.sol";

/**
 * @dev This contract is for creating proxy to access ERC1155BridgeTower token.
 *
 * The beacon should be initialized before call ERC1155BridgeTowerFactoryC2 constructor.
 */
contract ERC1155BridgeTowerFactoryC2 is
    PartnerAccessControl,
    WhitelistableUpgradeable
{
    address public beacon;
    address internal transferProxy;
    address internal lazyTransferProxy;

    event CreateERC1155BridgeTowerProxy(address deployer, address proxy);
    event CreateERC1155BridgeTowerUserProxy(address deployer, address proxy);

    constructor(
        address _beacon,
        address _transferProxy,
        address _lazyTransferProxy,
        address securitizeRegistryProxy,
        address contractsRegistryProxy
    ) {
        beacon = _beacon;
        transferProxy = _transferProxy;
        lazyTransferProxy = _lazyTransferProxy;

        __PartnerAccessControl_init();
        __Whitelistable_init_unchained(
            securitizeRegistryProxy,
            contractsRegistryProxy
        );
    }

    function createToken(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        uint256 lockPeriod,
        uint256 salt
    ) external onlyPartner(_msgSender()) returns (address) {
        onlyWhitelistedAddress(_msgSender());

        address beaconProxy = deployProxy(
            getData(_name, _symbol, baseURI, contractURI, lockPeriod),
            salt
        );
        ERC1155BridgeTower token = ERC1155BridgeTower(beaconProxy);

        token.transferOwnership(_msgSender());

        IContractsRegistry(
            IContractsRegistryProxy(contractsRegistryProxy).contractsRegistry()
        ).addContract(beaconProxy);

        emit CreateERC1155BridgeTowerProxy(_msgSender(), beaconProxy);

        return beaconProxy;
    }

    function createToken(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        address[] memory operators,
        uint256 lockPeriod,
        uint256 salt
    ) external onlyPartner(_msgSender()) returns (address) {
        onlyWhitelistedAddress(_msgSender());

        address beaconProxy = deployProxy(
            getData(
                _name,
                _symbol,
                baseURI,
                contractURI,
                operators,
                lockPeriod
            ),
            salt
        );
        ERC1155BridgeTower token = ERC1155BridgeTower(address(beaconProxy));

        token.transferOwnership(_msgSender());

        IContractsRegistry(
            IContractsRegistryProxy(contractsRegistryProxy).contractsRegistry()
        ).addContract(beaconProxy);

        emit CreateERC1155BridgeTowerUserProxy(_msgSender(), beaconProxy);

        return beaconProxy;
    }

    function addPartner(address partner) public override {
        onlyWhitelistedAddress(_msgSender());

        super.addPartner(partner);
    }

    function removePartner(address partner) public override {
        onlyWhitelistedAddress(_msgSender());

        super.removePartner(partner);
    }

    function transferOwnership(address newOwner) public override {
        onlyWhitelistedAddress(_msgSender());
        onlyWhitelistedAddress(newOwner);

        super.transferOwnership(newOwner);
    }

    function renounceOwnership() public override {
        onlyWhitelistedAddress(_msgSender());

        super.renounceOwnership();
    }

    // Deploying BeaconProxy contract with create2
    function deployProxy(bytes memory data, uint256 salt)
        internal
        returns (address proxy)
    {
        bytes memory bytecode = getCreationBytecode(data);

        assembly {
            proxy := create2(0, add(bytecode, 0x20), mload(bytecode), salt)

            if iszero(extcodesize(proxy)) {
                revert(0, 0)
            }
        }
    }

    // Adding constructor arguments to BeaconProxy bytecode
    function getCreationBytecode(bytes memory _data)
        internal
        view
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                type(BeaconProxy).creationCode,
                abi.encode(beacon, _data)
            );
    }

    // Returns address that contract with such arguments will be deployed on
    function getAddress(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        uint256 lockPeriod,
        uint256 _salt
    ) public view returns (address) {
        bytes memory bytecode = getCreationBytecode(
            getData(_name, _symbol, baseURI, contractURI, lockPeriod)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                _salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }

    function getData(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        uint256 lockPeriod
    ) internal view returns (bytes memory) {
        return
            abi.encodeWithSelector(
                ERC1155BridgeTower(address(0))
                    .__ERC1155BridgeTower_init
                    .selector,
                _name,
                _symbol,
                baseURI,
                contractURI,
                transferProxy,
                lazyTransferProxy,
                securitizeRegistryProxy,
                contractsRegistryProxy,
                lockPeriod
            );
    }

    // Returns address that contract with such arguments will be deployed on
    function getAddress(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        address[] memory operators,
        uint256 lockPeriod,
        uint256 _salt
    ) public view returns (address) {
        bytes memory bytecode = getCreationBytecode(
            getData(_name, _symbol, baseURI, contractURI, operators, lockPeriod)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                _salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }

    function getData(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI,
        address[] memory operators,
        uint256 lockPeriod
    ) internal view returns (bytes memory) {
        return
            abi.encodeWithSelector(
                ERC1155BridgeTower(address(0))
                    .__ERC1155BridgeTowerUser_init
                    .selector,
                _name,
                _symbol,
                baseURI,
                contractURI,
                operators,
                transferProxy,
                lazyTransferProxy,
                securitizeRegistryProxy,
                contractsRegistryProxy,
                lockPeriod
            );
    }
}
