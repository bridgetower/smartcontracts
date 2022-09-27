import {
  SnapshotRestorer,
  takeSnapshot,
} from "@nomicfoundation/hardhat-network-helpers";

import { PRECISION } from "./constants";

import hre, { ethers } from "hardhat";

import { BigNumber } from "ethers";

let snapshot: SnapshotRestorer;

export const increaseTime = async (seconds: number): Promise<void> => {
  await hre.network.provider.send("evm_increaseTime", [seconds]);
};

export const mineBlocks = async (amount: number): Promise<void> => {
  for (let i = 0; i < amount; i++) {
    await hre.network.provider.send("evm_mine");
  }
};

export const getPreviousBlockTimestamp = async (): Promise<BigNumber> => {
  return BigNumber.from(
    (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
      .timestamp
  );
};

export const makeSnapshot = async (): Promise<void> => {
  snapshot = await takeSnapshot();
};

export const restoreSnapshot = async (): Promise<void> => {
  await snapshot.restore();
};

export const calculateClaimeableAmount = (
  cumulativeRewardPerStake: BigNumber,
  accountCumulativeRewardPerStake: BigNumber,
  stakedBuUser: BigNumber
): BigNumber => {
  const amountOwnedPerToken: BigNumber = cumulativeRewardPerStake.sub(
    accountCumulativeRewardPerStake
  );

  return stakedBuUser.mul(amountOwnedPerToken).div(PRECISION);
};
