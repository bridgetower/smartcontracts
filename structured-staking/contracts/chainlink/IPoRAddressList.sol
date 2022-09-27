// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

interface IPoRAddressList {
    function getPoRAddressListLength() external view returns (uint256);

    function getPoRAddressList(uint256 startIndex, uint256 endIndex)
        external
        view
        returns (string[] memory);
}
