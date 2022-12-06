// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../openzeppelin-upgradeable/utils/math/SafeMathUpgradeable.sol";

import "../../openzeppelin-upgradeable/proxy/utils/Initializable.sol";

abstract contract ERC1155Lockable is Initializable {
    using SafeMathUpgradeable for uint256;

    struct LocksInfo {
        uint256 totalLockedAmount;
        uint256 indexToCheck;
        Lock[] locks;
    }

    struct Lock {
        uint256 amount;
        uint256 start;
        uint256 end;
    }

    uint256 public lockPeriod;

    mapping(address => mapping(uint256 => LocksInfo)) internal locksInfo;

    event Locked(address indexed user, uint256 indexed id, uint256 amount);
    event Unlocked(address indexed user, uint256 indexed id, uint256 amount);

    function __ERC1155Lockable_init_unchained(uint256 initialLockPeriod)
        internal
        initializer
    {
        _setLockPeriod(initialLockPeriod);
    }

    function _setLockPeriod(uint256 newLockPeriod) internal {
        lockPeriod = newLockPeriod;
    }

    function lock(
        address user,
        uint256 id,
        uint256 amount
    ) internal {
        Lock memory newLock = Lock({
            amount: amount,
            start: block.timestamp,
            end: block.timestamp.add(lockPeriod)
        });

        locksInfo[user][id].locks.push(newLock);
        locksInfo[user][id].totalLockedAmount = locksInfo[user][id]
            .totalLockedAmount
            .add(amount);

        emit Locked(user, id, amount);
    }

    function unlock(address user, uint256 id) public virtual {
        for (
            uint256 i = locksInfo[user][id].indexToCheck;
            i < locksInfo[user][id].locks.length;
            i++
        ) {
            if (locksInfo[user][id].locks[i].end <= block.timestamp) {
                locksInfo[user][id].indexToCheck = i + 1;
                locksInfo[user][id].totalLockedAmount = locksInfo[user][id]
                    .totalLockedAmount
                    .sub(locksInfo[user][id].locks[i].amount);

                emit Unlocked(user, id, locksInfo[user][id].locks[i].amount);

                delete locksInfo[user][id].locks[i];
            } else {
                break;
            }
        }
    }

    function getLockedAmount(address user, uint256 id)
        public
        view
        returns (uint256)
    {
        return locksInfo[user][id].totalLockedAmount;
    }

    function getUnlockableAmount(address user, uint256 id)
        public
        view
        returns (uint256)
    {
        uint256 unlockableAmount = 0;

        for (
            uint256 i = locksInfo[user][id].indexToCheck;
            i < locksInfo[user][id].locks.length;
            i++
        ) {
            if (locksInfo[user][id].locks[i].end <= block.timestamp) {
                unlockableAmount = unlockableAmount.add(
                    locksInfo[user][id].locks[i].amount
                );
            } else {
                break;
            }
        }

        return unlockableAmount;
    }

    function getLocksInfo(address user, uint256 id)
        public
        view
        returns (uint256, Lock[] memory)
    {
        return (locksInfo[user][id].indexToCheck, locksInfo[user][id].locks);
    }
}
