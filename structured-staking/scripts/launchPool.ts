import { ethers, upgrades } from "hardhat";

import * as dotenv from "dotenv";

import {
  ContractTransaction,
  ContractFactory,
  ContractReceipt,
  BigNumber,
  Contract,
  Event,
} from "ethers";

dotenv.config();

async function main() {
  const StructuredStakingProxy: ContractFactory =
    await ethers.getContractFactory("StructuredStakingUpgradeable");
  const structuredStakingProxy: Contract = StructuredStakingProxy.attach(
    (process.env.L_STRUCTURED_STAKING_PROXY || "").trim()
  );

  const stakingPeriodEnd: BigNumber = BigNumber.from(
    (process.env.L_STAKING_PERIOD_END || "0").trim()
  );
  const tokenURI: string = (process.env.L_TOKEN_URI || "").trim();
  const validationNodes: string[] = process.env.L_VALIDATION_NODES
    ? process.env.L_VALIDATION_NODES.split(",").map((validationNode) =>
        validationNode.trim()
      )
    : [];

  let tx: ContractTransaction = await structuredStakingProxy.launchStakingPool(
    stakingPeriodEnd,
    tokenURI,
    validationNodes
  );
  const receipt: ContractReceipt = await tx.wait();
  const events: Event[] | undefined = receipt.events?.filter((event) => {
    return event.event === "StakingPoolLaunched";
  });
  const poolId: BigNumber = BigNumber.from(
    events?.length && events[0].args?.length && events[0].args[0]
  );

  console.log(
    poolId
      ? `Pool ID: ${poolId.toString()}`
      : "Something went wrong. Staking pool isn't launched. Please, try again"
  );
  console.log(
    `ValidatioNodesProviderProxy: ${
      (await structuredStakingProxy.stakingPools(poolId))
        .validationNodesProvider
    }`
  );

  const totalStakedAmount: BigNumber = BigNumber.from(
    (process.env.L_TOTAL_STAKED_AMOUNT || "0").trim()
  );

  const AggregatorProxy: ContractFactory = await ethers.getContractFactory(
    "AggregatorUpgradeable"
  );
  const aggregatorProxy: Contract = await upgrades.deployProxy(
    AggregatorProxy,
    [
      process.env.L_SECURITIZE_REGISTRY_PROXY,
      process.env.L_CONTRACTS_REGISTRY_PROXY,
      totalStakedAmount,
    ],
    {
      initializer: "__Aggregator_init",
    }
  );

  await aggregatorProxy.deployed();

  console.log("AggregatorProxy: ", aggregatorProxy.address);

  tx = await structuredStakingProxy.setAggregator(
    poolId,
    aggregatorProxy.address
  );

  await tx.wait();
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
