// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISecuritizeRegistry {
    function isWhitelisted(address wallet) external view returns (bool);
}
