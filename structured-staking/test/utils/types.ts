import { BigNumber } from "ethers";

export type StakingPool = {
  poolId: BigNumber;
  totalStaked: BigNumber;
  stakingPeriodEnd: BigNumber;
  cumulativeRewardPerStake: BigNumber;
  validationNodesProvider: string;
  aggregator: string;
  finalized: boolean;
};
