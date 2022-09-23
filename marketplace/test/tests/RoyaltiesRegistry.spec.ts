/* eslint-disable node/no-missing-import */

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract, BigNumber } from "ethers";

import { Part } from "../utils/types";

import { ethers } from "hardhat";

import { expect } from "chai";

const { constants } = require("@openzeppelin/test-helpers");

describe("RoyaltiesRegistry", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  let SecuritizeRegistryProxy: ContractFactory;
  let ContractsRegistryProxy: ContractFactory;
  let SecuritizeRegistry: ContractFactory;
  let ContractsRegistry: ContractFactory;
  let RoyaltiesRegistry: ContractFactory;
  let ERC721Mock: ContractFactory;

  let securitizeRegistryProxy: Contract;
  let contractsRegistryProxy: Contract;
  let securitizeRegistry: Contract;
  let contractsRegistry: Contract;
  let royaltiesRegistry: Contract;
  let erc721Mock: Contract;

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

    ContractsRegistry = await ethers.getContractFactory("ContractsRegistry");
    contractsRegistry = await ContractsRegistry.deploy(
      securitizeRegistryProxy.address
    );

    ContractsRegistryProxy = await ethers.getContractFactory(
      "ContractsRegistryProxy"
    );
    contractsRegistryProxy = await ContractsRegistryProxy.deploy(
      securitizeRegistryProxy.address,
      contractsRegistry.address
    );

    RoyaltiesRegistry = await ethers.getContractFactory("RoyaltiesRegistry");
    royaltiesRegistry = await RoyaltiesRegistry.deploy();

    await royaltiesRegistry.__RoyaltiesRegistry_init(
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address
    );

    ERC721Mock = await ethers.getContractFactory("ERC721Mock");
    erc721Mock = await ERC721Mock.deploy();

    await erc721Mock.mintBatch(alice.address, 5, "");
  });

  describe("__RoyaltiesRegistry_init", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        royaltiesRegistry
          .connect(alice)
          .__RoyaltiesRegistry_init(
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address
          )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("setProviderByToken", () => {
    it("should fail if not whitelisted wallet is trying to set provider by token", async () => {
      await expect(
        royaltiesRegistry
          .connect(alice)
          .setProviderByToken(erc721Mock.address, bob.address)
      )
        .to.be.revertedWithCustomError(royaltiesRegistry, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if not owner is trying to set provider by token", async () => {
      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await expect(
        royaltiesRegistry
          .connect(bob)
          .setProviderByToken(erc721Mock.address, bob.address)
      ).to.be.revertedWith("RoyaltiesRegistry: token owner not detected");
    });

    it("should set provider by token by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await royaltiesRegistry
        .connect(alice)
        .setProviderByToken(erc721Mock.address, alice.address);
    });
  });

  describe("forceSetRoyaltiesType", () => {
    it("should fail if not whitelisted wallet is trying to force set royalties type", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        royaltiesRegistry
          .connect(alice)
          .forceSetRoyaltiesType(erc721Mock.address, BigNumber.from(4))
      )
        .to.be.revertedWithCustomError(royaltiesRegistry, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if not owner is trying to force set royalties type", async () => {
      await expect(
        royaltiesRegistry
          .connect(bob)
          .forceSetRoyaltiesType(erc721Mock.address, BigNumber.from(4))
      ).to.be.revertedWith("RoyaltiesRegistry: token owner not detected");
    });

    it("should force set royalties type by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await royaltiesRegistry
        .connect(alice)
        .forceSetRoyaltiesType(erc721Mock.address, BigNumber.from(5));
    });
  });

  describe("clearRoyaltiesType", () => {
    it("should fail if not whitelisted wallet is trying to clear royalties type", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        royaltiesRegistry.connect(alice).clearRoyaltiesType(erc721Mock.address)
      )
        .to.be.revertedWithCustomError(royaltiesRegistry, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if not owner is trying to clear royalties type", async () => {
      await expect(
        royaltiesRegistry.connect(bob).clearRoyaltiesType(erc721Mock.address)
      ).to.be.revertedWith("RoyaltiesRegistry: token owner not detected");
    });

    it("should clear royalties type by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await royaltiesRegistry
        .connect(alice)
        .clearRoyaltiesType(erc721Mock.address);
    });
  });

  describe("setRoyaltiesByToken", () => {
    it("should fail if not whitelisted wallet is trying to set royalties by token", async () => {
      const royalties: Part[] = [
        {
          account: alice.address,
          value: BigNumber.from(100),
        },
      ];

      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        royaltiesRegistry
          .connect(alice)
          .setRoyaltiesByToken(erc721Mock.address, royalties)
      )
        .to.be.revertedWithCustomError(royaltiesRegistry, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if not owner is trying to set royalties by token", async () => {
      const royalties: Part[] = [
        {
          account: alice.address,
          value: BigNumber.from(100),
        },
      ];

      await expect(
        royaltiesRegistry
          .connect(bob)
          .setRoyaltiesByToken(erc721Mock.address, royalties)
      ).to.be.revertedWith("RoyaltiesRegistry: token owner not detected");
    });

    it("should set royalties by token by a whitelisted owner", async () => {
      const royalties: Part[] = [
        {
          account: alice.address,
          value: BigNumber.from(100),
        },
      ];

      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await royaltiesRegistry
        .connect(alice)
        .setRoyaltiesByToken(erc721Mock.address, royalties);
    });
  });

  describe("getRoyalties", () => {
    it("should fail if not whitelisted wallet is trying to get royalties", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        royaltiesRegistry
          .connect(alice)
          .getRoyalties(erc721Mock.address, BigNumber.from(1))
      )
        .to.be.revertedWithCustomError(royaltiesRegistry, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should get royalties by a whitelisted wallet", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await royaltiesRegistry
        .connect(alice)
        .getRoyalties(erc721Mock.address, BigNumber.from(1));
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        royaltiesRegistry.connect(alice).transferOwnership(bob.address)
      )
        .to.be.revertedWithCustomError(royaltiesRegistry, "NotWhitelisted")
        .withArgs(alice.address);
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        royaltiesRegistry.connect(alice).transferOwnership(carol.address)
      )
        .to.be.revertedWithCustomError(royaltiesRegistry, "NotWhitelisted")
        .withArgs(carol.address);
    });

    it("should transfer ownership", async () => {
      expect(await royaltiesRegistry.connect(alice).owner()).to.be.equal(
        alice.address
      );

      await royaltiesRegistry.connect(alice).transferOwnership(bob.address);

      expect(await royaltiesRegistry.connect(alice).owner()).to.be.equal(
        bob.address
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(royaltiesRegistry.connect(bob).renounceOwnership())
        .to.be.revertedWithCustomError(royaltiesRegistry, "NotWhitelisted")
        .withArgs(bob.address);
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(await royaltiesRegistry.connect(bob).owner()).to.be.equal(
        bob.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await royaltiesRegistry.connect(bob).renounceOwnership();

      expect(await royaltiesRegistry.connect(bob).owner()).to.be.equal(
        constants.ZERO_ADDRESS
      );
    });
  });
});
