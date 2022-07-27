// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../openzeppelin-upgradeable/access/OwnableUpgradeable.sol";

abstract contract PartnerAccessControl is OwnableUpgradeable {
    mapping(address => bool) private _partners;

    event PartnerStatusChanged(address indexed partner, bool indexed status);

    modifier onlyPartner(address account) {
        require(
            isPartner(account),
            "PartnerAccessControl: caller is not a partner"
        );
        _;
    }

    function __PartnerAccessControl_init() internal initializer {
        __Ownable_init_unchained();
        __PartnerAccessControl_init_unchained();
    }

    function __PartnerAccessControl_init_unchained() internal initializer {}

    /**
     * @dev Add `partner` to the list of allowed partners.
     */
    function addPartner(address partner) public virtual onlyOwner {
        _partners[partner] = true;

        emit PartnerStatusChanged(partner, true);
    }

    /**
     * @dev Revoke `partner` from the list of allowed partners.
     */
    function removePartner(address partner) public virtual onlyOwner {
        _partners[partner] = false;

        emit PartnerStatusChanged(partner, false);
    }

    /**
     * @dev Returns `true` if `account` has been granted to partners.
     */
    function isPartner(address account) public view returns (bool) {
        return _partners[account];
    }

    uint256[50] private __gap;
}
