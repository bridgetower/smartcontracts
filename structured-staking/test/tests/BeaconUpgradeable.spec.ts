import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract } from "ethers";

import { ethers, upgrades } from "hardhat";

import { expect } from "chai";

const { constants } = require("@openzeppelin/test-helpers");

describe("BeaconUpgradeable", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let ValidationNodesProvider: ContractFactory;
  let SecuritizeRegistryProxy: ContractFactory;
  let ContractsRegistryProxy: ContractFactory;
  let SecuritizeRegistry: ContractFactory;
  let ContractsRegistry: ContractFactory;
  let BeaconProxy: ContractFactory;

  let validationNodesProvider: Contract;
  let securitizeRegistryProxy: Contract;
  let contractsRegistryProxy: Contract;
  let securitizeRegistry: Contract;
  let contractsRegistry: Contract;
  let beaconProxy: Contract;

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

    await securitizeRegistry.addWallet(alice.address);

    await contractsRegistry.addContract(securitizeRegistry.address);
    await contractsRegistry.addContract(securitizeRegistryProxy.address);
    await contractsRegistry.addContract(contractsRegistry.address);
    await contractsRegistry.addContract(contractsRegistryProxy.address);
    await contractsRegistry.addContract(validationNodesProvider.address);
    await contractsRegistry.addContract(beaconProxy.address);
  });

  describe("__Beacon_init", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        beaconProxy
          .connect(alice)
          .__Beacon_init(
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address,
            validationNodesProvider.address
          )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("__Beacon_init_unchained", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        beaconProxy
          .connect(alice)
          .__Beacon_init_unchained(validationNodesProvider.address)
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("upgradeTo", () => {
    it("should fail if not an owner is trying to upgrade implementation", async () => {
      await expect(
        beaconProxy.connect(bob).upgradeTo(validationNodesProvider.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to upgrade implementation", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        beaconProxy.connect(alice).upgradeTo(validationNodesProvider.address)
      )
        .to.be.revertedWithCustomError(beaconProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a new implementation is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        beaconProxy.connect(alice).upgradeTo(bob.address)
      ).to.be.revertedWith("Beacon: implementation is not a contract");
    });

    it("should upgrade to a new implementation by a whitelisted owner", async () => {
      const newValidationNodesProvider: Contract =
        await ValidationNodesProvider.deploy();

      await newValidationNodesProvider.deployed();

      expect(
        await beaconProxy
          .connect(alice)
          .upgradeTo(newValidationNodesProvider.address)
      )
        .to.emit(beaconProxy, "Upgraded")
        .withArgs(newValidationNodesProvider.address);

      expect(await beaconProxy.connect(alice).implementation()).to.be.equal(
        newValidationNodesProvider.address
      );

      expect(
        await beaconProxy
          .connect(alice)
          .upgradeTo(validationNodesProvider.address)
      )
        .to.emit(beaconProxy, "Upgraded")
        .withArgs(validationNodesProvider.address);

      expect(await beaconProxy.connect(alice).implementation()).to.be.equal(
        validationNodesProvider.address
      );
    });
  });

  describe("implementation", () => {
    it("should return proper implementation", async () => {
      expect(await beaconProxy.connect(alice).implementation()).to.be.equal(
        validationNodesProvider.address
      );
    });
  });

  describe("securitizeRegistryProxy", () => {
    it("should return proper securitize registry proxy", async () => {
      expect(
        await beaconProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
    });
  });

  describe("contractsRegistryProxy", () => {
    it("should return proper contracts registry proxy", async () => {
      expect(
        await beaconProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);
    });
  });

  describe("setSecuritizeRegistryProxy", () => {
    it("should fail if not an owner is trying to set a new securitize registry proxy", async () => {
      await expect(
        beaconProxy
          .connect(bob)
          .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to set a new securitize registry proxy", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        beaconProxy
          .connect(alice)
          .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
      )
        .to.be.revertedWithCustomError(beaconProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a new securitize registry proxy is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        beaconProxy.connect(alice).setSecuritizeRegistryProxy(alice.address)
      ).to.be.revertedWith("Whitelistable: not contract address");
    });

    it("should set a new securitize registry proxy by a whitelisted owner", async () => {
      const newSecuritizeRegistryProxy: Contract =
        await SecuritizeRegistryProxy.deploy(securitizeRegistry.address);

      await newSecuritizeRegistryProxy.deployed();

      expect(
        await beaconProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);

      await beaconProxy
        .connect(alice)
        .setSecuritizeRegistryProxy(newSecuritizeRegistryProxy.address);

      expect(
        await beaconProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(newSecuritizeRegistryProxy.address);

      await beaconProxy
        .connect(alice)
        .setSecuritizeRegistryProxy(securitizeRegistryProxy.address);

      expect(
        await beaconProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
    });
  });

  describe("setContractsRegistryProxy", () => {
    it("should fail if not an owner is trying to set a new contracts registry proxy", async () => {
      await expect(
        beaconProxy
          .connect(bob)
          .setContractsRegistryProxy(contractsRegistryProxy.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to set a new contracts registry proxy", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        beaconProxy
          .connect(alice)
          .setContractsRegistryProxy(contractsRegistryProxy.address)
      )
        .to.be.revertedWithCustomError(beaconProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a new contracts registry proxy is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        beaconProxy.connect(alice).setContractsRegistryProxy(bob.address)
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
        await beaconProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);

      await beaconProxy
        .connect(alice)
        .setContractsRegistryProxy(newContractsRegistryProxy.address);

      expect(
        await beaconProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(newContractsRegistryProxy.address);

      await beaconProxy
        .connect(alice)
        .setContractsRegistryProxy(contractsRegistryProxy.address);

      expect(
        await beaconProxy.connect(alice).contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);
    });
  });

  describe("onlyWhitelistedAddress", () => {
    it("should not revert - 1", async () => {
      await beaconProxy.connect(alice).onlyWhitelistedAddress(alice.address);
    });

    it("should not revert - 2", async () => {
      await beaconProxy
        .connect(alice)
        .onlyWhitelistedAddress(beaconProxy.address);
    });

    it("should revert - 1", async () => {
      await expect(
        beaconProxy.connect(alice).onlyWhitelistedAddress(bob.address)
      )
        .to.be.revertedWithCustomError(beaconProxy, "NotWhitelisted")
        .withArgs(bob.address);
    });

    it("should revert - 2", async () => {
      await contractsRegistry
        .connect(alice)
        .removeContract(beaconProxy.address);
      await expect(
        beaconProxy.connect(alice).onlyWhitelistedAddress(bob.address)
      )
        .to.be.revertedWithCustomError(beaconProxy, "NotWhitelisted")
        .withArgs(bob.address);
      await contractsRegistry.connect(alice).addContract(beaconProxy.address);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(beaconProxy.connect(alice).transferOwnership(bob.address))
        .to.be.revertedWithCustomError(beaconProxy, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(beaconProxy.connect(alice).transferOwnership(bob.address))
        .to.be.revertedWithCustomError(beaconProxy, "NotWhitelisted")
        .withArgs(bob.address);
    });

    it("should transfer ownership", async () => {
      expect(await beaconProxy.connect(alice).owner()).to.be.equal(
        alice.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await beaconProxy.connect(alice).transferOwnership(bob.address);

      expect(await beaconProxy.connect(alice).owner()).to.be.equal(bob.address);
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(beaconProxy.connect(bob).renounceOwnership())
        .to.be.revertedWithCustomError(beaconProxy, "NotWhitelisted")
        .withArgs(bob.address);
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(await beaconProxy.connect(bob).owner()).to.be.equal(bob.address);

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await beaconProxy.connect(bob).renounceOwnership();

      expect(await beaconProxy.connect(bob).owner()).to.be.equal(
        constants.ZERO_ADDRESS
      );
    });
  });
});
