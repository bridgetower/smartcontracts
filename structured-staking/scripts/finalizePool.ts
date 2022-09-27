import { ethers } from "hardhat";

import * as dotenv from "dotenv";

import {
  ContractTransaction,
  ContractFactory,
  BigNumber,
  Contract,
} from "ethers";

dotenv.config();

async function main() {
  const StructuredStakingProxy: ContractFactory =
    await ethers.getContractFactory("StructuredStakingUpgradeable");
  const structuredStakingProxy: Contract = StructuredStakingProxy.attach(
    (process.env.F_STRUCTURED_STAKING_PROXY || "").trim()
  );

  const poolId: BigNumber = BigNumber.from(
    (process.env.F_POOL_ID || "").trim()
  );
  const rewardsAmount: BigNumber = BigNumber.from(
    (process.env.F_REWARDS_AMOUNT || "").trim()
  );
  const totalStaked: BigNumber = (
    await structuredStakingProxy.stakingPools(poolId)
  ).totalStaked;
  const tx: ContractTransaction =
    await structuredStakingProxy.finalizeStakingPool(poolId, rewardsAmount, {
      value: totalStaked.add(rewardsAmount),
    });

  await tx.wait();
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
