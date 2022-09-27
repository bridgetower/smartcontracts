import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract } from "ethers";

import { ethers } from "hardhat";

import { expect } from "chai";

const { constants } = require("@openzeppelin/test-helpers");

describe("ContractsRegistry", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  let ContractsRegistry: ContractFactory;

  let securitizeRegistryProxy: Contract;
  let testContractsRegistry: Contract;
  let securitizeRegistry: Contract;
  let contractsRegistry: Contract;

  before("setup", async () => {
    [alice, bob, carol] = await ethers.getSigners();

    const SecuritizeRegistry: ContractFactory = await ethers.getContractFactory(
      "SecuritizeRegistry"
    );

    securitizeRegistry = await SecuritizeRegistry.deploy();

    await securitizeRegistry.deployed();

    const SecuritizeRegistryProxy: ContractFactory =
      await ethers.getContractFactory("SecuritizeRegistryProxy");

    securitizeRegistryProxy = await SecuritizeRegistryProxy.deploy(
      securitizeRegistry.address
    );

    await securitizeRegistryProxy.deployed();

    ContractsRegistry = await ethers.getContractFactory("ContractsRegistry");

    contractsRegistry = await ContractsRegistry.deploy(
      securitizeRegistryProxy.address
    );

    await contractsRegistry.deployed();

    testContractsRegistry = await ContractsRegistry.deploy(
      securitizeRegistryProxy.address
    );

    await testContractsRegistry.deployed();
  });

  describe("constructor", () => {
    it("should fail if the initial securitize registry is not a contract", async () => {
      await expect(ContractsRegistry.deploy(bob.address)).to.be.revertedWith(
        "ContractsRegistry: not contract address"
      );
    });

    it("should deploy a new contracts registry contract", async () => {
      const contractsRegistry: Contract = await ContractsRegistry.deploy(
        securitizeRegistryProxy.address
      );

      await contractsRegistry.deployed();

      expect(
        await contractsRegistry.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
    });
  });

  describe("addContract", () => {
    it("should fail if not a whitelisted owner is trying to add a contract to the whitelist", async () => {
      await expect(
        contractsRegistry
          .connect(alice)
          .addContract(testContractsRegistry.address)
      ).to.be.revertedWith("ContractsRegistry: wallet is not whitelisted");
    });

    it("should fail if not owner is trying to add a contract to the whitelist", async () => {
      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await expect(
        contractsRegistry
          .connect(bob)
          .addContract(testContractsRegistry.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if the owner is trying to add not a contract to the whitelist", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        contractsRegistry.connect(alice).addContract(bob.address)
      ).to.be.revertedWith("ContractsRegistry: not contract address");
    });

    it("should add a contract to the whitelist by an owner", async () => {
      await contractsRegistry
        .connect(alice)
        .addContract(testContractsRegistry.address);

      expect(
        await contractsRegistry
          .connect(alice)
          .isWhitelisted(testContractsRegistry.address)
      ).to.be.equal(true);
    });
  });

  describe("isWhitelisted", () => {
    it("should be whitelisted", async () => {
      expect(
        await contractsRegistry
          .connect(alice)
          .isWhitelisted(testContractsRegistry.address)
      ).to.be.equal(true);
    });

    it("should not be whitelisted", async () => {
      expect(
        await contractsRegistry.connect(alice).isWhitelisted(alice.address)
      ).to.be.equal(false);
    });
  });

  describe("removeContract", () => {
    it("should fail if not a whitelisted owner is trying to remove a contract from the whitelist", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        contractsRegistry
          .connect(alice)
          .removeContract(testContractsRegistry.address)
      ).to.be.revertedWith("ContractsRegistry: wallet is not whitelisted");
    });

    it("should fail if not owner is trying to remove a contract from the whitelist", async () => {
      await expect(
        contractsRegistry
          .connect(bob)
          .removeContract(testContractsRegistry.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should remove a contract from the whitelist by an owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await contractsRegistry
        .connect(alice)
        .removeContract(testContractsRegistry.address);

      expect(
        await contractsRegistry
          .connect(alice)
          .isWhitelisted(testContractsRegistry.address)
      ).to.be.equal(false);
    });
  });

  describe("setSecuritizeRegistryProxy", () => {
    it("should fail if not a whitelisted owner is trying to set a new securitize registry proxy", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        contractsRegistry
          .connect(alice)
          .setSecuritizeRegistryProxy(testContractsRegistry.address)
      ).to.be.revertedWith("ContractsRegistry: wallet is not whitelisted");
    });

    it("should fail if not an owner is trying to set a new securitize registry proxy", async () => {
      await expect(
        contractsRegistry
          .connect(bob)
          .setSecuritizeRegistryProxy(testContractsRegistry.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if a new securitize registry proxy is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        contractsRegistry.connect(alice).setSecuritizeRegistryProxy(bob.address)
      ).to.be.revertedWith("ContractsRegistry: not contract address");
    });

    it("should set a new securitize registry proxy by a whitelisted owner", async () => {
      expect(
        await contractsRegistry.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);

      await contractsRegistry
        .connect(alice)
        .setSecuritizeRegistryProxy(securitizeRegistryProxy.address);

      expect(
        await contractsRegistry.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        contractsRegistry.connect(alice).transferOwnership(bob.address)
      ).to.be.revertedWith("ContractsRegistry: wallet is not whitelisted");
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        contractsRegistry.connect(alice).transferOwnership(carol.address)
      ).to.be.revertedWith("ContractsRegistry: wallet is not whitelisted");
    });

    it("should transfer ownership", async () => {
      expect(await contractsRegistry.connect(alice).owner()).to.be.equal(
        alice.address
      );

      await contractsRegistry.connect(alice).transferOwnership(bob.address);

      expect(await contractsRegistry.connect(alice).owner()).to.be.equal(
        bob.address
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        contractsRegistry.connect(bob).renounceOwnership()
      ).to.be.revertedWith("ContractsRegistry: wallet is not whitelisted");
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(await contractsRegistry.connect(bob).owner()).to.be.equal(
        bob.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await contractsRegistry.connect(bob).renounceOwnership();

      expect(await contractsRegistry.connect(bob).owner()).to.be.equal(
        constants.ZERO_ADDRESS
      );
    });
  });
});
