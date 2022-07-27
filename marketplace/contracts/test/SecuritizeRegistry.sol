// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SecuritizeRegistry is Ownable {
    mapping(address => bool) private _walletToWhitelisted;

    function isWhitelisted(address wallet) public view returns (bool) {
        return _walletToWhitelisted[wallet];
    }

    function addWallet(address wallet) public onlyOwner {
        _walletToWhitelisted[wallet] = true;
    }

    function removeWallet(address wallet) public onlyOwner {
        _walletToWhitelisted[wallet] = false;
    }
}
