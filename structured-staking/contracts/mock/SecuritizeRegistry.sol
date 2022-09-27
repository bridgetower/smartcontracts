// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SecuritizeRegistry is Ownable {
    mapping(address => bool) private _walletToWhitelisted;

    function isWhitelisted(address wallet) external view returns (bool) {
        return _walletToWhitelisted[wallet];
    }

    function addWallet(address wallet) external onlyOwner {
        _walletToWhitelisted[wallet] = true;
    }

    function removeWallet(address wallet) external onlyOwner {
        _walletToWhitelisted[wallet] = false;
    }
}
