import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, BigNumber, Contract } from "ethers";

import { ethers, upgrades } from "hardhat";

import { expect } from "chai";

const { constants } = require("@openzeppelin/test-helpers");

describe("AggregatorUpgradeable", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let SecuritizeRegistryProxy: ContractFactory;
  let ContractsRegistryProxy: ContractFactory;
  let SecuritizeRegistry: ContractFactory;
  let ContractsRegistry: ContractFactory;
  let AggregatorProxy: ContractFactory;

  let securitizeRegistryProxy: Contract;
  let contractsRegistryProxy: Contract;
  let securitizeRegistry: Contract;
  let contractsRegistry: Contract;
  let aggregatorProxy: Contract;

  before("setup", async () => {
    [alice, bob] = await ethers.getSigners();

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

    AggregatorProxy = await ethers.getContractFactory("AggregatorUpgradeable");
    aggregatorProxy = await upgrades.deployProxy(
      AggregatorProxy,
      [
        securitizeRegistryProxy.address,
        contractsRegistryProxy.address,
        BigNumber.from(0),
      ],
      {
        initializer: "__Aggregator_init",
      }
    );

    await aggregatorProxy.deployed();

    await securitizeRegistry.addWallet(alice.address);

    await contractsRegistry.addContract(securitizeRegistry.address);
    await contractsRegistry.addContract(securitizeRegistryProxy.address);
    await contractsRegistry.addContract(contractsRegistry.address);
    await contractsRegistry.addContract(contractsRegistryProxy.address);
    await contractsRegistry.addContract(aggregatorProxy.address);
  });

  describe("__Aggregator_init", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        aggregatorProxy
          .connect(alice)
          .__Aggregator_init(
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address,
            BigNumber.from(0)
          )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("__Aggregator_init_unchained", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        aggregatorProxy
          .connect(alice)
          .__Aggregator_init_unchained(BigNumber.from(0))
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("setTotalStakedAmount", () => {
    it("should fail if not an owner is trying to set a total staked amount", async () => {
      await expect(
        aggregatorProxy.connect(bob).setTotalStakedAmount(BigNumber.from(100))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to set a total staked amount", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        aggregatorProxy.connect(alice).setTotalStakedAmount(BigNumber.from(100))
      )
        .to.be.revertedWithCustomError(aggregatorProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should set a new total staked amount by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);

      let response: any = await aggregatorProxy
        .connect(alice)
        .latestRoundData();

      expect(response.answer).to.be.equal(BigNumber.from(0));

      const newTotalStakedAmount: BigNumber = BigNumber.from(100);

      await aggregatorProxy
        .connect(alice)
        .setTotalStakedAmount(newTotalStakedAmount);

      response = await aggregatorProxy.connect(alice).latestRoundData();

      expect(response.answer).to.be.equal(newTotalStakedAmount);
    });
  });

  describe("latestRoundData", () => {
    it("should return proper latest round data", async () => {
      const response: any = await aggregatorProxy
        .connect(alice)
        .latestRoundData();

      expect(response.roundId).to.be.equal(BigNumber.from(0));
      expect(response.answer).to.be.equal(BigNumber.from(100));
      expect(response.startedAt).to.be.equal(BigNumber.from(0));
      expect(response.updatedAt).to.be.equal(BigNumber.from(0));
      expect(response.answeredInRound).to.be.equal(BigNumber.from(0));
    });
  });

  describe("securitizeRegistryProxy", () => {
    it("should return proper securitize registry proxy", async () => {
      expect(
        await aggregatorProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
    });
  });

  describe("contractsRegistryProxy", () => {
    it("should return proper contracts registry proxy", async () => {
      expect(
        await aggregatorProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);
    });
  });

  describe("setSecuritizeRegistryProxy", () => {
    it("should fail if not an owner is trying to set a new securitize registry proxy", async () => {
      await expect(
        aggregatorProxy
          .connect(bob)
          .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to set a new securitize registry proxy", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        aggregatorProxy
          .connect(alice)
          .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
      )
        .to.be.revertedWithCustomError(aggregatorProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a new securitize registry proxy is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        aggregatorProxy.connect(alice).setSecuritizeRegistryProxy(alice.address)
      ).to.be.revertedWith("Whitelistable: not contract address");
    });

    it("should set a new securitize registry proxy by a whitelisted owner", async () => {
      const newSecuritizeRegistryProxy: Contract =
        await SecuritizeRegistryProxy.deploy(securitizeRegistry.address);

      await newSecuritizeRegistryProxy.deployed();

      expect(
        await aggregatorProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);

      await aggregatorProxy
        .connect(alice)
        .setSecuritizeRegistryProxy(newSecuritizeRegistryProxy.address);

      expect(
        await aggregatorProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(newSecuritizeRegistryProxy.address);

      await aggregatorProxy
        .connect(alice)
        .setSecuritizeRegistryProxy(securitizeRegistryProxy.address);

      expect(
        await aggregatorProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
    });
  });

  describe("setContractsRegistryProxy", () => {
    it("should fail if not an owner is trying to set a new contracts registry proxy", async () => {
      await expect(
        aggregatorProxy
          .connect(bob)
          .setContractsRegistryProxy(contractsRegistryProxy.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to set a new contracts registry proxy", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        aggregatorProxy
          .connect(alice)
          .setContractsRegistryProxy(contractsRegistryProxy.address)
      )
        .to.be.revertedWithCustomError(aggregatorProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a new contracts registry proxy is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        aggregatorProxy.connect(alice).setContractsRegistryProxy(bob.address)
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
        await aggregatorProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);

      await aggregatorProxy
        .connect(alice)
        .setContractsRegistryProxy(newContractsRegistryProxy.address);

      expect(
        await aggregatorProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(newContractsRegistryProxy.address);

      await aggregatorProxy
        .connect(alice)
        .setContractsRegistryProxy(contractsRegistryProxy.address);

      expect(
        await aggregatorProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);
    });
  });

  describe("onlyWhitelistedAddress", () => {
    it("should not revert - 1", async () => {
      await aggregatorProxy
        .connect(alice)
        .onlyWhitelistedAddress(alice.address);
    });

    it("should not revert - 2", async () => {
      await aggregatorProxy
        .connect(alice)
        .onlyWhitelistedAddress(aggregatorProxy.address);
    });

    it("should revert - 1", async () => {
      await expect(
        aggregatorProxy.connect(alice).onlyWhitelistedAddress(bob.address)
      )
        .to.be.revertedWithCustomError(aggregatorProxy, "NotWhitelisted")
        .withArgs(bob.address);
    });

    it("should revert - 2", async () => {
      await contractsRegistry
        .connect(alice)
        .removeContract(aggregatorProxy.address);
      await expect(
        aggregatorProxy.connect(alice).onlyWhitelistedAddress(bob.address)
      )
        .to.be.revertedWithCustomError(aggregatorProxy, "NotWhitelisted")
        .withArgs(bob.address);
      await contractsRegistry
        .connect(alice)
        .addContract(aggregatorProxy.address);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        aggregatorProxy.connect(alice).transferOwnership(bob.address)
      )
        .to.be.revertedWithCustomError(aggregatorProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        aggregatorProxy.connect(alice).transferOwnership(bob.address)
      )
        .to.be.revertedWithCustomError(aggregatorProxy, "NotWhitelisted")
        .withArgs(bob.address);
    });

    it("should transfer ownership", async () => {
      expect(await aggregatorProxy.connect(alice).owner()).to.be.equal(
        alice.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await aggregatorProxy.connect(alice).transferOwnership(bob.address);

      expect(await aggregatorProxy.connect(alice).owner()).to.be.equal(
        bob.address
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(aggregatorProxy.connect(bob).renounceOwnership())
        .to.be.revertedWithCustomError(aggregatorProxy, "NotWhitelisted")
        .withArgs(bob.address);
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(await aggregatorProxy.connect(bob).owner()).to.be.equal(
        bob.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await aggregatorProxy.connect(bob).renounceOwnership();

      expect(await aggregatorProxy.connect(bob).owner()).to.be.equal(
        constants.ZERO_ADDRESS
      );
    });
  });
});
