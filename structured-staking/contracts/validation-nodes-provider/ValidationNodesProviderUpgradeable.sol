//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../securitize/WhitelistableUpgradeable.sol";

import "../chainlink/IPoRAddressList.sol";

contract ValidationNodesProviderUpgradeable is
    OwnableUpgradeable,
    WhitelistableUpgradeable,
    IPoRAddressList
{
    string[] private validationNodes;

    function __ValidationNodesProvider_init(
        address initialSecuritizeRegistryProxy,
        address initialContractsRegistryProxy,
        string[] memory initialValidationNodes
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Whitelistable_init_unchained(
            initialSecuritizeRegistryProxy,
            initialContractsRegistryProxy
        );
        __ValidationNodesProvider_init_unchained(initialValidationNodes);
    }

    function __ValidationNodesProvider_init_unchained(
        string[] memory initialValidationNodes
    ) public initializer {
        validationNodes = initialValidationNodes;
    }

    function setValidationNodes(string[] memory newValidationNodes)
        external
        onlyOwner
    {
        onlyWhitelistedAddress(_msgSender());

        validationNodes = newValidationNodes;
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

    function getPoRAddressListLength()
        external
        view
        override
        returns (uint256)
    {
        return validationNodes.length;
    }

    function getPoRAddressList(uint256 startIndex, uint256 endIndex)
        external
        view
        override
        returns (string[] memory)
    {
        if (startIndex > endIndex) {
            return new string[](0);
        }

        endIndex = endIndex > validationNodes.length - 1
            ? validationNodes.length - 1
            : endIndex;

        string[] memory validationNodesList = new string[](
            endIndex - startIndex + 1
        );
        uint256 currIdx = startIndex;
        uint256 nodeIdx = 0;

        while (currIdx <= endIndex) {
            validationNodesList[nodeIdx] = validationNodes[currIdx];

            nodeIdx++;
            currIdx++;
        }

        return validationNodesList;
    }

    uint256[50] private __gap;
}
