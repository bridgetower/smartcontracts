import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract } from "ethers";

import { ethers } from "hardhat";

import { expect } from "chai";

const { constants } = require("@openzeppelin/test-helpers");

describe("SecuritizeRegistryProxy", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  let SecuritizeRegistryProxy: ContractFactory;
  let SecuritizeRegistry: ContractFactory;

  let securitizeRegistryProxy: Contract;
  let securitizeRegistry: Contract;

  before("setup", async () => {
    [alice, bob, carol] = await ethers.getSigners();

    SecuritizeRegistry = await ethers.getContractFactory("SecuritizeRegistry");
    securitizeRegistry = await SecuritizeRegistry.deploy();

    SecuritizeRegistryProxy = await ethers.getContractFactory(
      "SecuritizeRegistryProxy"
    );
    securitizeRegistryProxy = await SecuritizeRegistryProxy.deploy(
      securitizeRegistry.address
    );
  });

  describe("constructor", () => {
    it("should fail if the initial securitize registry is not a contract", async () => {
      await expect(
        SecuritizeRegistryProxy.deploy(bob.address)
      ).to.be.revertedWith("SecuritizeRegistryProxy: not contract address");
    });

    it("should deploy a new securitize registry proxy contract", async () => {
      const securitizeRegistryProxy: Contract =
        await SecuritizeRegistryProxy.deploy(securitizeRegistry.address);

      expect(
        await securitizeRegistryProxy.connect(alice).securitizeRegistry()
      ).to.be.equal(securitizeRegistry.address);
    });
  });

  describe("isWhitelistedWallet", () => {
    it("should be whitelisted", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);

      expect(
        await securitizeRegistryProxy
          .connect(alice)
          .isWhitelistedWallet(alice.address)
      ).to.be.equal(true);
    });

    it("should not be whitelisted", async () => {
      expect(
        await securitizeRegistryProxy
          .connect(alice)
          .isWhitelistedWallet(bob.address)
      ).to.be.equal(false);
    });
  });

  describe("setSecuritizeRegistry", () => {
    it("should fail if not a whitelisted owner is trying to set a new securitize registry", async () => {
      await expect(
        securitizeRegistryProxy
          .connect(bob)
          .setSecuritizeRegistry(securitizeRegistry.address)
      ).to.be.revertedWith(
        "SecuritizeRegistryProxy: wallet is not whitelisted"
      );
    });

    it("should fail if not an owner is trying to set a new securitize registry", async () => {
      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await expect(
        securitizeRegistryProxy
          .connect(bob)
          .setSecuritizeRegistry(securitizeRegistry.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if a new securitize registry is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        securitizeRegistryProxy
          .connect(alice)
          .setSecuritizeRegistry(alice.address)
      ).to.be.revertedWith("SecuritizeRegistryProxy: not contract address");
    });

    it("should set a new securitize registry by a whitelisted owner", async () => {
      expect(
        await securitizeRegistryProxy.connect(alice).securitizeRegistry()
      ).to.be.equal(securitizeRegistry.address);

      const newSecuritizeRegistry: Contract = await SecuritizeRegistry.deploy();

      await securitizeRegistryProxy
        .connect(alice)
        .setSecuritizeRegistry(newSecuritizeRegistry.address);

      expect(
        await securitizeRegistryProxy.connect(alice).securitizeRegistry()
      ).to.be.equal(newSecuritizeRegistry.address);

      await newSecuritizeRegistry.connect(alice).addWallet(alice.address);
      await securitizeRegistryProxy
        .connect(alice)
        .setSecuritizeRegistry(securitizeRegistry.address);

      expect(
        await securitizeRegistryProxy.connect(alice).securitizeRegistry()
      ).to.be.equal(securitizeRegistry.address);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        securitizeRegistryProxy.connect(alice).transferOwnership(bob.address)
      ).to.be.revertedWith(
        "SecuritizeRegistryProxy: wallet is not whitelisted"
      );
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        securitizeRegistryProxy.connect(alice).transferOwnership(carol.address)
      ).to.be.revertedWith(
        "SecuritizeRegistryProxy: wallet is not whitelisted"
      );
    });

    it("should transfer ownership", async () => {
      expect(await securitizeRegistryProxy.connect(alice).owner()).to.be.equal(
        alice.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await securitizeRegistryProxy
        .connect(alice)
        .transferOwnership(bob.address);

      expect(await securitizeRegistryProxy.connect(alice).owner()).to.be.equal(
        bob.address
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        securitizeRegistryProxy.connect(bob).renounceOwnership()
      ).to.be.revertedWith(
        "SecuritizeRegistryProxy: wallet is not whitelisted"
      );
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(await securitizeRegistryProxy.connect(bob).owner()).to.be.equal(
        bob.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await securitizeRegistryProxy.connect(bob).renounceOwnership();

      expect(await securitizeRegistryProxy.connect(bob).owner()).to.be.equal(
        constants.ZERO_ADDRESS
      );
    });
  });
});
