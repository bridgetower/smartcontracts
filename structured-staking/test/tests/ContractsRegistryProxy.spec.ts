import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract } from "ethers";

import { ethers } from "hardhat";

import { expect } from "chai";

const { constants } = require("@openzeppelin/test-helpers");

describe("ContractsRegistryProxy", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  let ContractsRegistryProxy: ContractFactory;

  let securitizeRegistryProxy: Contract;
  let contractsRegistryProxy: Contract;
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

    const ContractsRegistry: ContractFactory = await ethers.getContractFactory(
      "ContractsRegistry"
    );

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
  });

  describe("constructor", () => {
    it("should fail if the initial securitize registry proxy is not a contract", async () => {
      await expect(
        ContractsRegistryProxy.deploy(bob.address, contractsRegistry.address)
      ).to.be.revertedWith("ContractsRegistryProxy: not contract address");
    });

    it("should fail if the initial contracts registry is not a contract", async () => {
      await expect(
        ContractsRegistryProxy.deploy(
          securitizeRegistryProxy.address,
          bob.address
        )
      ).to.be.revertedWith("ContractsRegistryProxy: not contract address");
    });

    it("should deploy a new contracts registry proxy contract", async () => {
      const contractsRegistryProxy: Contract =
        await ContractsRegistryProxy.deploy(
          securitizeRegistryProxy.address,
          contractsRegistry.address
        );

      await contractsRegistryProxy.deployed();

      expect(
        await contractsRegistryProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
      expect(
        await contractsRegistryProxy.connect(alice).contractsRegistry()
      ).to.be.equal(contractsRegistry.address);
    });
  });

  describe("isWhitelistedContract", () => {
    it("should be whitelisted", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await contractsRegistry
        .connect(alice)
        .addContract(contractsRegistry.address);

      expect(
        await contractsRegistryProxy
          .connect(alice)
          .isWhitelistedContract(contractsRegistry.address)
      ).to.be.equal(true);
    });

    it("should not be whitelisted", async () => {
      expect(
        await contractsRegistryProxy
          .connect(alice)
          .isWhitelistedContract(securitizeRegistryProxy.address)
      ).to.be.equal(false);
    });
  });

  describe("setContractsRegistry", () => {
    it("should fail if not a whitelisted owner is trying to set a new contracts registry", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        contractsRegistryProxy
          .connect(alice)
          .setContractsRegistry(contractsRegistry.address)
      ).to.be.revertedWith("ContractsRegistryProxy: wallet is not whitelisted");
    });

    it("should fail if not an owner is trying to set a new contracts registry", async () => {
      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await expect(
        contractsRegistryProxy
          .connect(bob)
          .setContractsRegistry(contractsRegistry.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if a new contracts registry is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        contractsRegistryProxy.connect(alice).setContractsRegistry(bob.address)
      ).to.be.revertedWith("ContractsRegistryProxy: not contract address");
    });

    it("should set a new contracts registry by a whitelisted owner", async () => {
      expect(
        await contractsRegistryProxy.connect(alice).contractsRegistry()
      ).to.be.equal(contractsRegistry.address);

      await contractsRegistryProxy
        .connect(alice)
        .setContractsRegistry(securitizeRegistry.address);

      expect(
        await contractsRegistryProxy.connect(alice).contractsRegistry()
      ).to.be.equal(securitizeRegistry.address);
    });
  });

  describe("setSecuritizeRegistryProxy", () => {
    it("should fail if not a whitelisted owner is trying to set a new securitize registry proxy", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        contractsRegistryProxy
          .connect(alice)
          .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
      ).to.be.revertedWith("ContractsRegistryProxy: wallet is not whitelisted");
    });

    it("should fail if not an owner is trying to set a new securitize registry proxy", async () => {
      await expect(
        contractsRegistryProxy
          .connect(bob)
          .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if a new securitize registry proxy is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        contractsRegistryProxy
          .connect(alice)
          .setSecuritizeRegistryProxy(bob.address)
      ).to.be.revertedWith("ContractsRegistryProxy: not contract address");
    });

    it("should set a new securitize registry proxy by a whitelisted owner", async () => {
      expect(
        await contractsRegistryProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);

      await contractsRegistryProxy
        .connect(alice)
        .setSecuritizeRegistryProxy(securitizeRegistryProxy.address);

      expect(
        await contractsRegistryProxy.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        contractsRegistryProxy.connect(alice).transferOwnership(bob.address)
      ).to.be.revertedWith("ContractsRegistryProxy: wallet is not whitelisted");
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        contractsRegistryProxy.connect(alice).transferOwnership(carol.address)
      ).to.be.revertedWith("ContractsRegistryProxy: wallet is not whitelisted");
    });

    it("should transfer ownership", async () => {
      expect(await contractsRegistryProxy.connect(alice).owner()).to.be.equal(
        alice.address
      );

      await contractsRegistryProxy
        .connect(alice)
        .transferOwnership(bob.address);

      expect(await contractsRegistryProxy.connect(alice).owner()).to.be.equal(
        bob.address
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        contractsRegistryProxy.connect(bob).renounceOwnership()
      ).to.be.revertedWith("ContractsRegistryProxy: wallet is not whitelisted");
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(await contractsRegistryProxy.connect(bob).owner()).to.be.equal(
        bob.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await contractsRegistryProxy.connect(bob).renounceOwnership();

      expect(await contractsRegistryProxy.connect(bob).owner()).to.be.equal(
        constants.ZERO_ADDRESS
      );
    });
  });
});
