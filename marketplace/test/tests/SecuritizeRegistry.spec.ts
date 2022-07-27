import { ContractFactory, Contract, ContractTransaction } from "ethers";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ethers } from "hardhat";

import { expect } from "chai";

describe("SecuritizeRegistry", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let securitizeRegistry: Contract;

  before("setup", async () => {
    [alice, bob] = await ethers.getSigners();

    const SecuritizeRegistry: ContractFactory = await ethers.getContractFactory(
      "SecuritizeRegistry"
    );

    securitizeRegistry = await SecuritizeRegistry.deploy();
  });

  describe("addWallet", () => {
    it("should fail if not owner is trying to add a wallet to whitelist", async () => {
      await expect(
        securitizeRegistry.connect(bob).addWallet(bob.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should add a wallet to whitelist by an owner", async () => {
      const addWalletTx: ContractTransaction = await securitizeRegistry
        .connect(alice)
        .addWallet(bob.address);

      await addWalletTx.wait();

      expect(
        await securitizeRegistry.connect(alice).isWhitelisted(bob.address)
      ).to.be.equal(true);
    });
  });

  describe("isWhitelisted", () => {
    it("should be whitelisted", async () => {
      expect(
        await securitizeRegistry.connect(alice).isWhitelisted(bob.address)
      ).to.be.equal(true);
    });

    it("should not be whitelisted", async () => {
      expect(
        await securitizeRegistry.connect(alice).isWhitelisted(alice.address)
      ).to.be.equal(false);
    });
  });

  describe("removeWallet", () => {
    it("should fail if not owner is trying to remove a wallet from whitelist", async () => {
      await expect(
        securitizeRegistry.connect(bob).removeWallet(bob.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should remove a wallet from whitelist by an owner", async () => {
      const removeWalletTx: ContractTransaction = await securitizeRegistry
        .connect(alice)
        .removeWallet(bob.address);

      await removeWalletTx.wait();

      expect(
        await securitizeRegistry.connect(alice).isWhitelisted(bob.address)
      ).to.be.equal(false);
    });
  });
});
