import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { PRECISION, SECONDS_IN_A_DAY } from "../utils/constants";

import { ContractFactory, Contract, BigNumber } from "ethers";

import { StakingPool } from "../utils/types";

import { ethers, upgrades } from "hardhat";

import { expect } from "chai";

import {
  getPreviousBlockTimestamp,
  calculateClaimeableAmount,
  increaseTime,
} from "../utils/helpers";

const { constants } = require("@openzeppelin/test-helpers");

describe("StructuredStakingUpgradeable", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  let SecuritizeRegistryProxy: ContractFactory;
  let ValidationNodesProvider: ContractFactory;
  let ContractsRegistryProxy: ContractFactory;
  let StructuredStakingProxy: ContractFactory;
  let SecuritizeRegistry: ContractFactory;
  let ContractsRegistry: ContractFactory;
  let AggregatorProxy: ContractFactory;
  let BeaconProxy: ContractFactory;

  let securitizeRegistryProxy: Contract;
  let validationNodesProvider: Contract;
  let contractsRegistryProxy: Contract;
  let structuredStakingProxy: Contract;
  let securitizeRegistry: Contract;
  let contractsRegistry: Contract;
  let beaconProxy: Contract;

  before("setup", async () => {
    [alice, bob, carol] = await ethers.getSigners();

    SecuritizeRegistry = await ethers.getContractFactory("SecuritizeRegistry");
    securitizeRegistry = await SecuritizeRegistry.deploy();

    await securitizeRegistry.deployed();

    SecuritizeRegistryProxy = await ethers.getContractFactory(
      "SecuritizeRegistryProxy"
    );
    securitizeRegistryProxy = await SecuritizeRegistryProxy.deploy(
      securitizeRegistry.address
    );

    await securitizeRegistryProxy.deployed();

    ContractsRegistry = await ethers.getContractFactory("ContractsRegistry");
    contractsRegistry = await ContractsRegistry.deploy(
      securitizeRegistryProxy.address
    );

    await contractsRegistry.deployed();

    ContractsRegistryProxy = await ethers.getContractFactory(
      "ContractsRegistryProxy"
    );
    contractsRegistryProxy = await ContractsRegistryProxy.deploy(
      securitizeRegistryProxy.address,
      contractsRegistry.address
    );

    await contractsRegistryProxy.deployed();

    ValidationNodesProvider = await ethers.getContractFactory(
      "ValidationNodesProviderUpgradeable"
    );
    validationNodesProvider = await ValidationNodesProvider.deploy();

    await validationNodesProvider.deployed();

    BeaconProxy = await ethers.getContractFactory("BeaconUpgradeable");
    beaconProxy = await upgrades.deployProxy(
      BeaconProxy,
      [
        securitizeRegistryProxy.address,
        contractsRegistryProxy.address,
        validationNodesProvider.address,
      ],
      {
        initializer: "__Beacon_init",
      }
    );

    await beaconProxy.deployed();

    StructuredStakingProxy = await ethers.getContractFactory(
      "StructuredStakingUpgradeable"
    );
    structuredStakingProxy = await upgrades.deployProxy(
      StructuredStakingProxy,
      [
        securitizeRegistryProxy.address,
        contractsRegistryProxy.address,
        beaconProxy.address,
        alice.address,
      ],
      {
        initializer: "__StructuredStaking_init",
      }
    );

    await structuredStakingProxy.deployed();

    AggregatorProxy = await ethers.getContractFactory("AggregatorUpgradeable");

    await securitizeRegistry.addWallet(alice.address);

    await contractsRegistry.addContract(securitizeRegistry.address);
    await contractsRegistry.addContract(securitizeRegistryProxy.address);
    await contractsRegistry.addContract(contractsRegistry.address);
    await contractsRegistry.addContract(contractsRegistryProxy.address);
    await contractsRegistry.addContract(validationNodesProvider.address);
    await contractsRegistry.addContract(beaconProxy.address);
    await contractsRegistry.addContract(structuredStakingProxy.address);
  });

  describe("__StructuredStaking_init", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        structuredStakingProxy
          .connect(alice)
          .__StructuredStaking_init(
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address,
            beaconProxy.address,
            alice.address
          )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("__StructuredStaking_init_unchained", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        structuredStakingProxy
          .connect(alice)
          .__StructuredStaking_init_unchained(alice.address)
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("updateCentralBTWallet", () => {
    it("should fail if not an owner is trying to update a central BT wallet", async () => {
      await expect(
        structuredStakingProxy.connect(bob).updateCentralBTWallet(bob.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to update a central BT wallet", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        structuredStakingProxy.connect(alice).updateCentralBTWallet(bob.address)
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should update a central BT wallet by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);

      expect(
        await structuredStakingProxy.connect(alice).centralBTWallet()
      ).to.be.equal(alice.address);

      const newCentralBTWallet: string = bob.address;

      await structuredStakingProxy
        .connect(alice)
        .updateCentralBTWallet(newCentralBTWallet);

      expect(
        await structuredStakingProxy.connect(alice).centralBTWallet()
      ).to.be.equal(newCentralBTWallet);
    });
  });

  describe("centralBTWallet", () => {
    it("should return proper central BT wallet", async () => {
      expect(
        await structuredStakingProxy.connect(alice).centralBTWallet()
      ).to.be.equal(bob.address);
    });
  });

  describe("beacon", () => {
    it("should return proper beacon", async () => {
      expect(await structuredStakingProxy.connect(alice).beacon()).to.be.equal(
        beaconProxy.address
      );
    });
  });

  describe("PRECISION", () => {
    it("should return proper precision", async () => {
      expect(
        await structuredStakingProxy.connect(alice).PRECISION()
      ).to.be.equal(PRECISION);
    });
  });

  describe("launchStakingPool", () => {
    it("should fail if not an owner is trying to launch a new staking pool", async () => {
      await expect(
        structuredStakingProxy
          .connect(bob)
          .launchStakingPool(BigNumber.from(0), "", [])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to launch a new staking pool", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        structuredStakingProxy
          .connect(alice)
          .launchStakingPool(BigNumber.from(0), "", [])
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a staking period end timestamp is less than or equal to the current block timestamp", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        structuredStakingProxy
          .connect(alice)
          .launchStakingPool(BigNumber.from(0), "", [])
      ).to.be.revertedWith("Staking: wrong staking period end");
    });

    it("should launch a new staking pool by a whitelisted owner", async () => {
      const stakingPeriodEnd: BigNumber = (
        await getPreviousBlockTimestamp()
      ).add(SECONDS_IN_A_DAY);
      const tokenURI: string = "Token URI 1";
      const validationNodes: string[] = ["node1", "node2", "node3"];

      const expectedStakingPoolId: BigNumber = await structuredStakingProxy
        .connect(alice)
        .stakingPoolsCount();
      const expectedValidationNodesProviderAddress: string =
        await structuredStakingProxy
          .connect(alice)
          .getAddress(
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address,
            validationNodes,
            expectedStakingPoolId
          );

      await expect(
        structuredStakingProxy
          .connect(alice)
          .launchStakingPool(stakingPeriodEnd, tokenURI, validationNodes)
      )
        .to.emit(structuredStakingProxy, "StakingPoolLaunched")
        .withArgs(expectedStakingPoolId);

      expect(
        await structuredStakingProxy.connect(alice).stakingPoolsCount()
      ).to.be.equal(expectedStakingPoolId.add(1));
      expect(
        await structuredStakingProxy.connect(alice).uri(expectedStakingPoolId)
      ).to.be.equal(tokenURI);

      const stakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(expectedStakingPoolId);

      expect(stakingPool.poolId).to.be.equal(expectedStakingPoolId);
      expect(stakingPool.totalStaked).to.be.equal(BigNumber.from(0));
      expect(stakingPool.stakingPeriodEnd).to.be.equal(stakingPeriodEnd);
      expect(stakingPool.cumulativeRewardPerStake).to.be.equal(
        BigNumber.from(0)
      );
      expect(stakingPool.validationNodesProvider).to.be.equal(
        expectedValidationNodesProviderAddress
      );
      expect(stakingPool.aggregator).to.be.equal(constants.ZERO_ADDRESS);
      expect(stakingPool.finalized).to.be.equal(false);
    });
  });

  describe("setAggregator", () => {
    it("should fail if not an owner is trying to set an aggregator", async () => {
      await expect(
        structuredStakingProxy
          .connect(bob)
          .setAggregator(BigNumber.from(0), constants.ZERO_ADDRESS)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if an owner is trying to set an aggregator for non-existent staking pool", async () => {
      await expect(
        structuredStakingProxy
          .connect(alice)
          .setAggregator(BigNumber.from(1), constants.ZERO_ADDRESS)
      ).to.be.revertedWith("Staking: staking pool doesn't exist");
    });

    it("should fail if an owner is trying to set an aggregator that is not a contract", async () => {
      await expect(
        structuredStakingProxy
          .connect(alice)
          .setAggregator(BigNumber.from(0), constants.ZERO_ADDRESS)
      ).to.be.revertedWith("Staking: not contract address");
    });

    it("should fail if not a whitelisted owner is trying to set an aggregator", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        structuredStakingProxy
          .connect(alice)
          .setAggregator(BigNumber.from(0), securitizeRegistry.address)
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should set an aggregator by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);

      const aggregatorProxy: Contract = await upgrades.deployProxy(
        AggregatorProxy,
        [
          securitizeRegistryProxy.address,
          contractsRegistryProxy.address,
          BigNumber.from(25000).mul(PRECISION),
        ],
        {
          initializer: "__Aggregator_init",
        }
      );

      await aggregatorProxy.deployed();

      const stakingPoolId: BigNumber = BigNumber.from(0);

      await structuredStakingProxy
        .connect(alice)
        .setAggregator(stakingPoolId, aggregatorProxy.address);

      const stakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);

      expect(stakingPool.aggregator).to.be.equal(aggregatorProxy.address);
    });
  });

  describe("getAddress", () => {
    it("should return proper address for the future validation nodes provider", async () => {
      const stakingPeriodEnd: BigNumber = (
        await getPreviousBlockTimestamp()
      ).add(SECONDS_IN_A_DAY);
      const tokenURI: string = "Token URI 2";
      const validationNodes: string[] = [
        "node1",
        "node2",
        "node3",
        "node4",
        "node5",
      ];

      const expectedStakingPoolId: BigNumber = await structuredStakingProxy
        .connect(alice)
        .stakingPoolsCount();
      const expectedValidationNodesProviderAddress: string =
        await structuredStakingProxy
          .connect(alice)
          .getAddress(
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address,
            validationNodes,
            expectedStakingPoolId
          );

      await structuredStakingProxy
        .connect(alice)
        .launchStakingPool(stakingPeriodEnd, tokenURI, validationNodes);

      const stakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(expectedStakingPoolId);

      expect(stakingPool.validationNodesProvider).to.be.equal(
        expectedValidationNodesProviderAddress
      );
    });
  });

  describe("stakingPoolsCount", () => {
    it("should return proper staking pools count", async () => {
      expect(
        await structuredStakingProxy.connect(alice).stakingPoolsCount()
      ).to.be.equal(BigNumber.from(2));
    });
  });

  describe("stakingPools", () => {
    it("should return proper staking pool info - 1", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(0);
      const stakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);

      expect(stakingPool.poolId).to.be.equal(stakingPoolId);
      expect(stakingPool.totalStaked).to.be.equal(BigNumber.from(0));
      expect(stakingPool.stakingPeriodEnd).to.be.greaterThan(BigNumber.from(0));
      expect(stakingPool.cumulativeRewardPerStake).to.be.equal(
        BigNumber.from(0)
      );
      expect(stakingPool.validationNodesProvider).to.not.be.equal(
        constants.ZERO_ADDRESS
      );
      expect(stakingPool.aggregator).to.not.be.equal(constants.ZERO_ADDRESS);
      expect(stakingPool.finalized).to.be.equal(false);
    });

    it("should return proper staking pool info - 2", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(1);
      const stakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);

      expect(stakingPool.poolId).to.be.equal(stakingPoolId);
      expect(stakingPool.totalStaked).to.be.equal(BigNumber.from(0));
      expect(stakingPool.stakingPeriodEnd).to.be.greaterThan(BigNumber.from(0));
      expect(stakingPool.cumulativeRewardPerStake).to.be.equal(
        BigNumber.from(0)
      );
      expect(stakingPool.validationNodesProvider).to.not.be.equal(
        constants.ZERO_ADDRESS
      );
      expect(stakingPool.aggregator).to.be.equal(constants.ZERO_ADDRESS);
      expect(stakingPool.finalized).to.be.equal(false);
    });
  });

  describe("uri", () => {
    it("should return proper URI - 1", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(0);
      const expectedURI: string = "Token URI 1";

      expect(
        await structuredStakingProxy.connect(alice).uri(stakingPoolId)
      ).to.be.equal(expectedURI);
    });

    it("should return proper URI - 2", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(1);
      const expectedURI: string = "Token URI 2";

      expect(
        await structuredStakingProxy.connect(alice).uri(stakingPoolId)
      ).to.be.equal(expectedURI);
    });
  });

  describe("stake", () => {
    it("should fail if a user is trying to stake to non-existent staking pool", async () => {
      await expect(
        structuredStakingProxy
          .connect(alice)
          .stake(BigNumber.from(2), BigNumber.from(0))
      ).to.be.revertedWith("Staking: staking pool doesn't exist");
    });

    it("should fail if not a whitelisted user is trying to stake into a staking pool", async () => {
      await expect(
        structuredStakingProxy
          .connect(carol)
          .stake(BigNumber.from(0), BigNumber.from(2))
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(carol.address);
    });

    it("should fail if a user is trying to stake to a finished staking pool", async () => {
      await increaseTime(
        (
          await structuredStakingProxy
            .connect(alice)
            .stakingPools(BigNumber.from(0))
        ).stakingPeriodEnd.toNumber()
      );
      await expect(
        structuredStakingProxy
          .connect(alice)
          .stake(BigNumber.from(0), BigNumber.from(0))
      ).to.be.revertedWith("Staking: staking pool is finished");
    });

    it("should fail if a user is trying to stake a zero amount", async () => {
      const stakingPeriodEnd: BigNumber = (
        await getPreviousBlockTimestamp()
      ).add(SECONDS_IN_A_DAY);
      const tokenURI: string = "Token URI 3";
      const validationNodes: string[] = ["node1"];

      await structuredStakingProxy
        .connect(alice)
        .launchStakingPool(stakingPeriodEnd, tokenURI, validationNodes);

      const aggregatorProxy: Contract = await upgrades.deployProxy(
        AggregatorProxy,
        [
          securitizeRegistryProxy.address,
          contractsRegistryProxy.address,
          BigNumber.from(25000).mul(PRECISION),
        ],
        {
          initializer: "__Aggregator_init",
        }
      );

      await aggregatorProxy.deployed();

      const stakingPoolId: BigNumber = BigNumber.from(2);

      await structuredStakingProxy
        .connect(alice)
        .setAggregator(stakingPoolId, aggregatorProxy.address);

      await expect(
        structuredStakingProxy
          .connect(alice)
          .stake(stakingPoolId, BigNumber.from(0))
      ).to.be.revertedWith("Staking: amount to stake must be greater than 0");
    });

    it("should fail if a user is trying to stake more than available to stake", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const availableToStakeAmount: BigNumber = await structuredStakingProxy
        .connect(alice)
        .getAvailableToStakeAmount(stakingPoolId);

      await expect(
        structuredStakingProxy
          .connect(alice)
          .stake(stakingPoolId, availableToStakeAmount.add(1))
      ).to.be.revertedWith("Staking: amount to stake is too big");
    });

    it("should fail if a user is trying to provide a wrong amount of tokens to stake", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const amountToStake: BigNumber = BigNumber.from(100);

      await expect(
        structuredStakingProxy
          .connect(alice)
          .stake(stakingPoolId, amountToStake, { value: amountToStake.sub(1) })
      ).to.be.revertedWith("Staking: provided wrong amount of tokens");
      await expect(
        structuredStakingProxy
          .connect(alice)
          .stake(stakingPoolId, amountToStake, { value: amountToStake.add(1) })
      ).to.be.revertedWith("Staking: provided wrong amount of tokens");
    });

    it("should stake by a whitelisted user - 1", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const amountToStake: BigNumber = BigNumber.from(100);

      await expect(
        structuredStakingProxy
          .connect(alice)
          .stake(stakingPoolId, amountToStake, { value: amountToStake })
      )
        .to.emit(structuredStakingProxy, "Staked")
        .withArgs(stakingPoolId, alice.address, amountToStake);

      const stakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);
      const stakedByUserAmount: BigNumber = await structuredStakingProxy
        .connect(alice)
        .getStakedByUserAmount(stakingPoolId, alice.address);

      expect(stakingPool.totalStaked).to.be.equal(amountToStake);
      expect(stakedByUserAmount).to.be.equal(amountToStake);
      expect(
        await structuredStakingProxy
          .connect(alice)
          .getAccountCumulativeRewardPerStake(stakingPoolId, alice.address)
      ).to.be.equal(
        stakedByUserAmount.mul(
          stakingPool.stakingPeriodEnd.sub(await getPreviousBlockTimestamp())
        )
      );
    });

    it("should stake by a whitelisted user - 2", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const amountToStake: BigNumber = BigNumber.from(500);

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await expect(
        structuredStakingProxy
          .connect(bob)
          .stake(stakingPoolId, amountToStake, { value: amountToStake })
      )
        .to.emit(structuredStakingProxy, "Staked")
        .withArgs(stakingPoolId, bob.address, amountToStake);

      const stakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);
      const stakedByUserAmount: BigNumber = await structuredStakingProxy
        .connect(alice)
        .getStakedByUserAmount(stakingPoolId, bob.address);

      expect(stakingPool.totalStaked).to.be.equal(amountToStake.add(100));
      expect(stakedByUserAmount).to.be.equal(amountToStake);
      expect(
        await structuredStakingProxy
          .connect(alice)
          .getAccountCumulativeRewardPerStake(stakingPoolId, bob.address)
      ).to.be.equal(
        stakedByUserAmount.mul(
          stakingPool.stakingPeriodEnd.sub(await getPreviousBlockTimestamp())
        )
      );
    });

    it("should stake by a whitelisted user - 3", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const amountToStake: BigNumber = BigNumber.from(100);

      await securitizeRegistry.connect(alice).addWallet(carol.address);
      await expect(
        structuredStakingProxy
          .connect(carol)
          .stake(stakingPoolId, amountToStake, { value: amountToStake })
      )
        .to.emit(structuredStakingProxy, "Staked")
        .withArgs(stakingPoolId, carol.address, amountToStake);

      const stakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);
      const stakedByUserAmount: BigNumber = await structuredStakingProxy
        .connect(alice)
        .getStakedByUserAmount(stakingPoolId, carol.address);

      expect(stakingPool.totalStaked).to.be.equal(amountToStake.add(600));
      expect(stakedByUserAmount).to.be.equal(amountToStake);
      expect(
        await structuredStakingProxy
          .connect(alice)
          .getAccountCumulativeRewardPerStake(stakingPoolId, carol.address)
      ).to.be.equal(
        stakedByUserAmount.mul(
          stakingPool.stakingPeriodEnd.sub(await getPreviousBlockTimestamp())
        )
      );
    });

    it("should mint NFTs to a user in time of stake in 1 to 1 proportion", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const amountToStake: BigNumber = BigNumber.from(100);
      const prevUserNFTBalance: BigNumber = await structuredStakingProxy
        .connect(alice)
        .balanceOf(alice.address, stakingPoolId);

      await structuredStakingProxy
        .connect(alice)
        .stake(stakingPoolId, amountToStake, { value: amountToStake });

      const currUserNFTBalance: BigNumber = await structuredStakingProxy
        .connect(alice)
        .balanceOf(alice.address, stakingPoolId);

      expect(currUserNFTBalance).to.be.equal(
        prevUserNFTBalance.add(amountToStake)
      );
    });

    it("should transfer staked tokens to a central BT wallet in time of stake", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const amountToStake: BigNumber = BigNumber.from(100);
      const centralBTWallet: string = await structuredStakingProxy
        .connect(alice)
        .centralBTWallet();
      const prevCentralBTWalletBalance: BigNumber =
        await ethers.provider.getBalance(centralBTWallet);

      await structuredStakingProxy
        .connect(alice)
        .stake(stakingPoolId, amountToStake, { value: amountToStake });

      const currCentralBTWalletBalance: BigNumber =
        await ethers.provider.getBalance(centralBTWallet);

      expect(currCentralBTWalletBalance).to.be.equal(
        prevCentralBTWalletBalance.add(amountToStake)
      );
    });
  });

  describe("finalizeStakingPool", () => {
    it("should fail if not an owner is trying to finalize a staking pool", async () => {
      await expect(
        structuredStakingProxy
          .connect(bob)
          .finalizeStakingPool(BigNumber.from(0), BigNumber.from(0))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if an owner is trying to finalize non-existent staking pool", async () => {
      await expect(
        structuredStakingProxy.finalizeStakingPool(
          BigNumber.from(3),
          BigNumber.from(0)
        )
      ).to.be.revertedWith("Staking: staking pool doesn't exist");
    });

    it("should fail if not a whitelisted owner is trying to finalize a staking pool", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        structuredStakingProxy
          .connect(alice)
          .finalizeStakingPool(BigNumber.from(0), BigNumber.from(0))
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if an owner is trying to provide a wrong amount of tokens in time of finalizing of a staking pool", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);

      const rewardsAmount: BigNumber = BigNumber.from(100);

      await expect(
        structuredStakingProxy.finalizeStakingPool(
          BigNumber.from(0),
          rewardsAmount,
          { value: rewardsAmount.sub(1) }
        )
      ).to.be.revertedWith("Staking: provided wrong amount of tokens");
      await expect(
        structuredStakingProxy.finalizeStakingPool(
          BigNumber.from(0),
          rewardsAmount,
          { value: rewardsAmount.add(1) }
        )
      ).to.be.revertedWith("Staking: provided wrong amount of tokens");
      await expect(
        structuredStakingProxy.finalizeStakingPool(
          BigNumber.from(2),
          rewardsAmount,
          { value: rewardsAmount }
        )
      ).to.be.revertedWith("Staking: provided wrong amount of tokens");
    });

    it("should fail if an owner is trying to finalize a staking pool when it isn't finished yet", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const rewardsAmount: BigNumber = BigNumber.from(100);
      const stakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);

      await expect(
        structuredStakingProxy.finalizeStakingPool(
          stakingPoolId,
          rewardsAmount,
          { value: rewardsAmount.add(stakingPool.totalStaked) }
        )
      ).to.be.revertedWith("Staking: staking pool isn't finished");
    });

    it("should finalize a staking pool by a whitelisted owner", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(0);
      const rewardsAmount: BigNumber = BigNumber.from(100);
      const prevStakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);

      expect(prevStakingPool.finalized).to.be.equal(false);

      await expect(
        structuredStakingProxy.finalizeStakingPool(
          stakingPoolId,
          rewardsAmount,
          { value: rewardsAmount.add(prevStakingPool.totalStaked) }
        )
      )
        .to.emit(structuredStakingProxy, "StakingPoolFinalized")
        .withArgs(stakingPoolId, rewardsAmount);

      const currStakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);

      expect(currStakingPool.finalized).to.be.equal(true);
    });

    it("should fail if an owner is trying to finalize already finalized staking pool", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(0);
      const rewardsAmount: BigNumber = BigNumber.from(100);
      const stakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);

      await expect(
        structuredStakingProxy.finalizeStakingPool(
          stakingPoolId,
          rewardsAmount,
          { value: rewardsAmount.add(stakingPool.totalStaked) }
        )
      ).to.be.revertedWith("Staking: staking pool is already finalized");
    });

    it("should transfer rewards back to a tx sender if no one staked into a staking pool", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(1);
      const rewardsAmount: BigNumber = BigNumber.from(100);
      const prevStakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);
      const centralBTWallet: string = await structuredStakingProxy
        .connect(alice)
        .centralBTWallet();
      const prevCentralBTBalance: BigNumber = await ethers.provider.getBalance(
        centralBTWallet
      );

      await structuredStakingProxy.finalizeStakingPool(
        stakingPoolId,
        rewardsAmount,
        { value: rewardsAmount.add(prevStakingPool.totalStaked) }
      );

      const currCentralBTBalance: BigNumber = await ethers.provider.getBalance(
        centralBTWallet
      );

      expect(currCentralBTBalance).to.be.equal(prevCentralBTBalance);
    });

    it("should calculate cumulative reward per stake in time of finalizing of a staking pool", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const rewardsAmount: BigNumber = BigNumber.from(500);

      await increaseTime(
        (
          await structuredStakingProxy
            .connect(alice)
            .stakingPools(stakingPoolId)
        ).stakingPeriodEnd.toNumber()
      );

      const prevStakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);

      await structuredStakingProxy.finalizeStakingPool(
        stakingPoolId,
        rewardsAmount,
        { value: rewardsAmount.add(prevStakingPool.totalStaked) }
      );

      const currStakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);

      expect(currStakingPool.cumulativeRewardPerStake).to.be.equal(
        rewardsAmount.mul(PRECISION).div(prevStakingPool.totalStaked)
      );
    });
  });

  describe("getStakedByUserAmount", () => {
    it("should return proper amount of staked by user tokens", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);

      expect(
        await structuredStakingProxy
          .connect(alice)
          .getStakedByUserAmount(stakingPoolId, alice.address)
      ).to.be.equal(BigNumber.from(300));
      expect(
        await structuredStakingProxy
          .connect(alice)
          .getStakedByUserAmount(stakingPoolId, bob.address)
      ).to.be.equal(BigNumber.from(500));
      expect(
        await structuredStakingProxy
          .connect(alice)
          .getStakedByUserAmount(stakingPoolId, carol.address)
      ).to.be.equal(BigNumber.from(100));
    });
  });

  describe("getAvailableToStakeAmount", () => {
    it("should return proper amount of available to stake tokens", async () => {
      const stakingPeriodEnd: BigNumber = (
        await getPreviousBlockTimestamp()
      ).add(SECONDS_IN_A_DAY);
      const tokenURI: string = "Token URI 4";
      const validationNodes: string[] = ["node1", "node2", "node3"];

      await structuredStakingProxy
        .connect(alice)
        .launchStakingPool(stakingPeriodEnd, tokenURI, validationNodes);

      const totalStakedByNodesAmount: BigNumber =
        BigNumber.from(25000).mul(PRECISION);
      const aggregatorProxy: Contract = await upgrades.deployProxy(
        AggregatorProxy,
        [
          securitizeRegistryProxy.address,
          contractsRegistryProxy.address,
          totalStakedByNodesAmount,
        ],
        {
          initializer: "__Aggregator_init",
        }
      );

      await aggregatorProxy.deployed();

      expect(
        await structuredStakingProxy
          .connect(alice)
          .getAvailableToStakeAmount(BigNumber.from(3))
      ).to.be.equal(BigNumber.from(0));

      await structuredStakingProxy
        .connect(alice)
        .setAggregator(BigNumber.from(3), aggregatorProxy.address);

      expect(
        await structuredStakingProxy
          .connect(alice)
          .getAvailableToStakeAmount(BigNumber.from(3))
      ).to.be.equal(totalStakedByNodesAmount);
      expect(
        await structuredStakingProxy
          .connect(alice)
          .getAvailableToStakeAmount(BigNumber.from(0))
      ).to.be.equal(BigNumber.from(0));
    });
  });

  describe("claim", () => {
    it("should fail if a user is trying to claim from non-existent staking pool", async () => {
      await expect(
        structuredStakingProxy.connect(alice).claim(BigNumber.from(4))
      ).to.be.revertedWith("Staking: staking pool doesn't exist");
    });

    it("should fail if not a whitelisted user is trying to claim from a staking pool", async () => {
      await securitizeRegistry.connect(alice).removeWallet(carol.address);
      await expect(
        structuredStakingProxy.connect(carol).claim(BigNumber.from(0))
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(carol.address);
    });

    it("should fail if a user is trying to claim from not finilized staking pool", async () => {
      await expect(
        structuredStakingProxy.connect(alice).claim(BigNumber.from(3))
      ).to.be.revertedWith("Staking: staking pool isn't finalized");
    });

    it("should claim rewards from a finalized staking pool by a whitelisted user", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const prevStakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);
      const prevStakedByAlice: BigNumber = await structuredStakingProxy
        .connect(alice)
        .getStakedByUserAmount(stakingPoolId, alice.address);
      const prevEarnedByAlice: BigNumber = await structuredStakingProxy
        .connect(alice)
        .getEarnedByUserAmount(stakingPoolId, alice.address);

      const expectedClaimeableAmount: BigNumber = calculateClaimeableAmount(
        prevStakingPool.cumulativeRewardPerStake,
        await structuredStakingProxy
          .connect(alice.address)
          .getAccountCumulativeRewardPerStake(stakingPoolId, alice.address),
        prevStakedByAlice
      );

      await expect(structuredStakingProxy.connect(alice).claim(stakingPoolId))
        .to.emit(structuredStakingProxy, "Claimed")
        .withArgs(stakingPoolId, alice.address, expectedClaimeableAmount);

      const currStakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);
      const currStakedByAlice: BigNumber = await structuredStakingProxy
        .connect(alice)
        .getStakedByUserAmount(stakingPoolId, alice.address);
      const currEarnedByAlice: BigNumber = await structuredStakingProxy
        .connect(alice)
        .getEarnedByUserAmount(stakingPoolId, alice.address);

      expect(currStakingPool.totalStaked).to.be.equal(
        prevStakingPool.totalStaked.sub(prevStakedByAlice)
      );
      expect(currStakedByAlice).to.be.equal(BigNumber.from(0));
      expect(prevEarnedByAlice).to.be.equal(BigNumber.from(0));
      expect(currEarnedByAlice).to.be.equal(expectedClaimeableAmount);
    });

    it("should burn user's NFTs in time of claiming", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const prevUserNFTBalance: BigNumber = await structuredStakingProxy
        .connect(alice)
        .balanceOf(bob.address, stakingPoolId);

      await structuredStakingProxy.connect(bob).claim(stakingPoolId);

      const currUserNFTBalance: BigNumber = await structuredStakingProxy
        .connect(alice)
        .balanceOf(bob.address, stakingPoolId);

      expect(prevUserNFTBalance).to.be.equal(BigNumber.from(500));
      expect(currUserNFTBalance).to.be.equal(BigNumber.from(0));
    });

    it("should transfer back rewards and staked by user amount to a user in time of claiming", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);
      const prevStakingPool: StakingPool = await structuredStakingProxy
        .connect(alice)
        .stakingPools(stakingPoolId);
      const prevStakedByCarol: BigNumber = await structuredStakingProxy
        .connect(alice)
        .getStakedByUserAmount(stakingPoolId, carol.address);
      const prevStructuredStakingProxyBalance: BigNumber =
        await ethers.provider.getBalance(structuredStakingProxy.address);

      const claimeableAmount: BigNumber = calculateClaimeableAmount(
        prevStakingPool.cumulativeRewardPerStake,
        await structuredStakingProxy
          .connect(alice.address)
          .getAccountCumulativeRewardPerStake(stakingPoolId, carol.address),
        prevStakedByCarol
      );

      await securitizeRegistry.connect(alice).addWallet(carol.address);
      await structuredStakingProxy.connect(carol).claim(stakingPoolId);
      await securitizeRegistry.connect(alice).removeWallet(carol.address);

      const currStructuredStakingProxyBalance: BigNumber =
        await ethers.provider.getBalance(structuredStakingProxy.address);

      expect(currStructuredStakingProxyBalance).to.be.equal(
        prevStructuredStakingProxyBalance
          .sub(prevStakedByCarol)
          .sub(claimeableAmount)
      );
    });
  });

  describe("safeTransferFrom", () => {
    it("should revert", async () => {
      await expect(
        structuredStakingProxy
          .connect(alice)
          .safeTransferFrom(
            alice.address,
            bob.address,
            BigNumber.from(0),
            BigNumber.from(0),
            0x0
          )
      ).to.be.revertedWith("Transfer is not allowed");
    });
  });

  describe("safeBatchTransferFrom", () => {
    it("should revert", async () => {
      await expect(
        structuredStakingProxy
          .connect(alice)
          .safeBatchTransferFrom(
            alice.address,
            bob.address,
            [BigNumber.from(0)],
            [BigNumber.from(0)],
            0x0
          )
      ).to.be.revertedWith("Batched transfer is not allowed");
    });
  });

  describe("setApprovalForAll", () => {
    it("should revert", async () => {
      await expect(
        structuredStakingProxy
          .connect(alice)
          .setApprovalForAll(bob.address, true)
      ).to.be.revertedWith("Approval is not allowed");
    });
  });

  describe("getEarnedByUserAmount", () => {
    it("should return proper amount of earned by user tokens", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);

      expect(
        await structuredStakingProxy
          .connect(alice)
          .getEarnedByUserAmount(stakingPoolId, alice.address)
      ).to.be.equal(BigNumber.from(166));
      expect(
        await structuredStakingProxy
          .connect(alice)
          .getEarnedByUserAmount(stakingPoolId, bob.address)
      ).to.be.equal(BigNumber.from(277));
      expect(
        await structuredStakingProxy
          .connect(alice)
          .getEarnedByUserAmount(stakingPoolId, carol.address)
      ).to.be.equal(BigNumber.from(55));
    });
  });

  describe("getAccountCumulativeRewardPerStake", () => {
    it("should return proper account cumulative reward per stake", async () => {
      const stakingPoolId: BigNumber = BigNumber.from(2);

      expect(
        await structuredStakingProxy
          .connect(alice)
          .getAccountCumulativeRewardPerStake(stakingPoolId, alice.address)
      ).to.be.equal(BigNumber.from(51832400));
      expect(
        await structuredStakingProxy
          .connect(alice)
          .getAccountCumulativeRewardPerStake(stakingPoolId, bob.address)
      ).to.be.equal(BigNumber.from(43195000));
      expect(
        await structuredStakingProxy
          .connect(alice)
          .getAccountCumulativeRewardPerStake(stakingPoolId, carol.address)
      ).to.be.equal(BigNumber.from(8638800));
    });
  });

  describe("securitizeRegistryProxy", () => {
    it("should return proper securitize registry proxy", async () => {
      expect(
        await structuredStakingProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
    });
  });

  describe("contractsRegistryProxy", () => {
    it("should return proper contracts registry proxy", async () => {
      expect(
        await structuredStakingProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);
    });
  });

  describe("setSecuritizeRegistryProxy", () => {
    it("should fail if not an owner is trying to set a new securitize registry proxy", async () => {
      await expect(
        structuredStakingProxy
          .connect(bob)
          .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to set a new securitize registry proxy", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        structuredStakingProxy
          .connect(alice)
          .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a new securitize registry proxy is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        structuredStakingProxy
          .connect(alice)
          .setSecuritizeRegistryProxy(alice.address)
      ).to.be.revertedWith("Whitelistable: not contract address");
    });

    it("should set a new securitize registry proxy by a whitelisted owner", async () => {
      const newSecuritizeRegistryProxy: Contract =
        await SecuritizeRegistryProxy.deploy(securitizeRegistry.address);

      await newSecuritizeRegistryProxy.deployed();

      expect(
        await structuredStakingProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);

      await structuredStakingProxy
        .connect(alice)
        .setSecuritizeRegistryProxy(newSecuritizeRegistryProxy.address);

      expect(
        await structuredStakingProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(newSecuritizeRegistryProxy.address);

      await structuredStakingProxy
        .connect(alice)
        .setSecuritizeRegistryProxy(securitizeRegistryProxy.address);

      expect(
        await structuredStakingProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
    });
  });

  describe("setContractsRegistryProxy", () => {
    it("should fail if not an owner is trying to set a new contracts registry proxy", async () => {
      await expect(
        structuredStakingProxy
          .connect(bob)
          .setContractsRegistryProxy(contractsRegistryProxy.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to set a new contracts registry proxy", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        structuredStakingProxy
          .connect(alice)
          .setContractsRegistryProxy(contractsRegistryProxy.address)
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a new contracts registry proxy is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        structuredStakingProxy
          .connect(alice)
          .setContractsRegistryProxy(bob.address)
      ).to.be.revertedWith("Whitelistable: not contract address");
    });

    it("should set a new contracts registry proxy by a whitelisted owner", async () => {
      const newContractsRegistryProxy: Contract =
        await ContractsRegistryProxy.deploy(
          securitizeRegistryProxy.address,
          contractsRegistry.address
        );

      await newContractsRegistryProxy.deployed();

      expect(
        await structuredStakingProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);

      await structuredStakingProxy
        .connect(alice)
        .setContractsRegistryProxy(newContractsRegistryProxy.address);

      expect(
        await structuredStakingProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(newContractsRegistryProxy.address);

      await structuredStakingProxy
        .connect(alice)
        .setContractsRegistryProxy(contractsRegistryProxy.address);

      expect(
        await structuredStakingProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);
    });
  });

  describe("onlyWhitelistedAddress", () => {
    it("should not revert - 1", async () => {
      await structuredStakingProxy
        .connect(alice)
        .onlyWhitelistedAddress(alice.address);
    });

    it("should not revert - 2", async () => {
      await structuredStakingProxy
        .connect(alice)
        .onlyWhitelistedAddress(structuredStakingProxy.address);
    });

    it("should revert - 1", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        structuredStakingProxy
          .connect(alice)
          .onlyWhitelistedAddress(bob.address)
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(bob.address);
    });

    it("should revert - 2", async () => {
      await contractsRegistry
        .connect(alice)
        .removeContract(structuredStakingProxy.address);
      await expect(
        structuredStakingProxy
          .connect(alice)
          .onlyWhitelistedAddress(bob.address)
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(bob.address);
      await contractsRegistry
        .connect(alice)
        .addContract(structuredStakingProxy.address);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        structuredStakingProxy.connect(alice).transferOwnership(bob.address)
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        structuredStakingProxy.connect(alice).transferOwnership(bob.address)
      )
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(bob.address);
    });

    it("should transfer ownership", async () => {
      expect(await structuredStakingProxy.connect(alice).owner()).to.be.equal(
        alice.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await structuredStakingProxy
        .connect(alice)
        .transferOwnership(bob.address);

      expect(await structuredStakingProxy.connect(alice).owner()).to.be.equal(
        bob.address
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(structuredStakingProxy.connect(bob).renounceOwnership())
        .to.be.revertedWithCustomError(structuredStakingProxy, "NotWhitelisted")
        .withArgs(bob.address);
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(await structuredStakingProxy.connect(bob).owner()).to.be.equal(
        bob.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await structuredStakingProxy.connect(bob).renounceOwnership();

      expect(await structuredStakingProxy.connect(bob).owner()).to.be.equal(
        constants.ZERO_ADDRESS
      );
    });
  });
});
