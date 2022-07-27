/* eslint-disable node/no-missing-import */

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract, BigNumber } from "ethers";

import { solidity } from "ethereum-waffle";

import chai, { expect } from "chai";

import { ethers } from "hardhat";

const { constants } = require("@openzeppelin/test-helpers");

chai.use(solidity);

describe("ERC20TransferProxy", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  let SecuritizeRegistryProxy: ContractFactory;
  let ContractsRegistryProxy: ContractFactory;
  let ERC20TransferProxy: ContractFactory;
  let SecuritizeRegistry: ContractFactory;
  let ContractsRegistry: ContractFactory;
  let ERC20Mock: ContractFactory;

  let securitizeRegistryProxy: Contract;
  let contractsRegistryProxy: Contract;
  let erc20TransferProxy: Contract;
  let securitizeRegistry: Contract;
  let contractsRegistry: Contract;
  let erc20Mock: Contract;

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

    ERC20TransferProxy = await ethers.getContractFactory("ERC20TransferProxy");
    erc20TransferProxy = await ERC20TransferProxy.deploy();

    await erc20TransferProxy.__ERC20TransferProxy_init(
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address
    );

    ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    erc20Mock = await ERC20Mock.deploy(BigNumber.from(1000));
  });

  describe("__OperatorRole_init", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        erc20TransferProxy.connect(alice).__OperatorRole_init()
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("__ERC20TransferProxy_init", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        erc20TransferProxy
          .connect(alice)
          .__ERC20TransferProxy_init(
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address
          )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("addOperator", () => {
    it("should fail if not whitelisted wallet is trying to add an operator", async () => {
      await expect(
        erc20TransferProxy.connect(alice).addOperator(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should add an operator", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await erc20TransferProxy.connect(alice).addOperator(bob.address);
    });
  });

  describe("removeOperator", () => {
    it("should fail if not whitelisted wallet is trying to remove an operator", async () => {
      await expect(
        erc20TransferProxy.connect(bob).removeOperator(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should remove an operator", async () => {
      await erc20TransferProxy.connect(alice).removeOperator(bob.address);
    });
  });

  describe("erc20safeTransferFrom", () => {
    it("should fail if not whitelisted wallet is trying to transfer", async () => {
      await erc20TransferProxy.connect(alice).addOperator(bob.address);
      await expect(
        erc20TransferProxy
          .connect(bob)
          .erc20safeTransferFrom(
            erc20Mock.address,
            alice.address,
            bob.address,
            BigNumber.from(100)
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if FROM is not a whitelisted wallet", async () => {
      await erc20TransferProxy.connect(alice).addOperator(alice.address);
      await expect(
        erc20TransferProxy
          .connect(alice)
          .erc20safeTransferFrom(
            erc20Mock.address,
            bob.address,
            alice.address,
            BigNumber.from(0)
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if TO is not a whitelisted wallet", async () => {
      await expect(
        erc20TransferProxy
          .connect(alice)
          .erc20safeTransferFrom(
            erc20Mock.address,
            alice.address,
            bob.address,
            BigNumber.from(0)
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should transfer token by a whitelisted operator", async () => {
      const supply: BigNumber = BigNumber.from(1000);
      const amount: BigNumber = BigNumber.from(100);

      expect(
        await erc20Mock.connect(alice).balanceOf(alice.address)
      ).to.be.equal(supply);
      expect(await erc20Mock.connect(alice).balanceOf(bob.address)).to.be.equal(
        BigNumber.from(0)
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await erc20Mock
        .connect(alice)
        .approve(erc20TransferProxy.address, amount);
      await erc20TransferProxy
        .connect(alice)
        .erc20safeTransferFrom(
          erc20Mock.address,
          alice.address,
          bob.address,
          amount
        );

      expect(
        await erc20Mock.connect(alice).balanceOf(alice.address)
      ).to.be.equal(supply.sub(amount));
      expect(await erc20Mock.connect(alice).balanceOf(bob.address)).to.be.equal(
        amount
      );
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        erc20TransferProxy.connect(alice).transferOwnership(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        erc20TransferProxy.connect(alice).transferOwnership(carol.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should transfer ownership", async () => {
      expect(await erc20TransferProxy.connect(alice).owner()).to.be.equal(
        alice.address
      );

      await erc20TransferProxy.connect(alice).transferOwnership(bob.address);

      expect(await erc20TransferProxy.connect(alice).owner()).to.be.equal(
        bob.address
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        erc20TransferProxy.connect(bob).renounceOwnership()
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(await erc20TransferProxy.connect(bob).owner()).to.be.equal(
        bob.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await erc20TransferProxy.connect(bob).renounceOwnership();

      expect(await erc20TransferProxy.connect(bob).owner()).to.be.equal(
        constants.ZERO_ADDRESS
      );
    });
  });
});
