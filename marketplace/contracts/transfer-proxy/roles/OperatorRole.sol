// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../openzeppelin-upgradeable/access/OwnableUpgradeable.sol";

contract OperatorRole is OwnableUpgradeable {
    mapping(address => bool) internal operators;

    modifier onlyOperator() {
        require(
            operators[_msgSender()],
            "OperatorRole: caller is not the operator"
        );
        _;
    }

    function __OperatorRole_init() external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
    }

    function addOperator(address operator) public virtual onlyOwner {
        operators[operator] = true;
    }

    function removeOperator(address operator) public virtual onlyOwner {
        operators[operator] = false;
    }
}
