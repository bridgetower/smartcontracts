import { BigNumber } from "ethers";

export type StakingPool = {
  poolId: BigNumber;
  totalStaked: BigNumber;
  totalShares: BigNumber;
  stakingPeriodEnd: BigNumber;
  rewardsAmount: BigNumber;
  validationNodesProvider: string;
  aggregator: string;
  finalized: boolean;
};
