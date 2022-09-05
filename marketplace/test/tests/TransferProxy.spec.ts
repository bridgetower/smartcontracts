/* eslint-disable node/no-missing-import */

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract, BigNumber } from "ethers";

import { generateTokenID } from "../utils/helpers";
import { MintERC1155Data } from "../utils/types";

import { solidity } from "ethereum-waffle";

import { ethers, upgrades } from "hardhat";

import chai, { expect } from "chai";

const { constants } = require("@openzeppelin/test-helpers");

chai.use(solidity);

describe("TransferProxy", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  let ERC1155LazyMintTransferProxy: ContractFactory;
  let SecuritizeRegistryProxy: ContractFactory;
  let ContractsRegistryProxy: ContractFactory;
  let ERC1155BridgeTower: ContractFactory;
  let SecuritizeRegistry: ContractFactory;
  let ContractsRegistry: ContractFactory;
  let TransferProxy: ContractFactory;
  let ERC721Mock: ContractFactory;

  let erc1155LazyMintTransferProxy: Contract;
  let erc1155BridgeTowerProxy: Contract;
  let securitizeRegistryProxy: Contract;
  let contractsRegistryProxy: Contract;
  let securitizeRegistry: Contract;
  let contractsRegistry: Contract;
  let transferProxy: Contract;
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

    TransferProxy = await ethers.getContractFactory("TransferProxy");
    transferProxy = await TransferProxy.deploy();

    await transferProxy.__TransferProxy_init(
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address
    );

    ERC1155LazyMintTransferProxy = await ethers.getContractFactory(
      "ERC1155LazyMintTransferProxy"
    );
    erc1155LazyMintTransferProxy = await ERC1155LazyMintTransferProxy.deploy(
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address
    );

    await erc1155LazyMintTransferProxy.__OperatorRole_init();

    ERC1155BridgeTower = await ethers.getContractFactory("ERC1155BridgeTower");
    erc1155BridgeTowerProxy = await upgrades.deployProxy(
      ERC1155BridgeTower,
      [
        "BridgeTower Permissioned Market Token",
        "PMT",
        "",
        "",
        transferProxy.address,
        erc1155LazyMintTransferProxy.address,
        securitizeRegistryProxy.address,
        contractsRegistryProxy.address,
        BigNumber.from(15_552_000), // 6 months in seconds (6 * 30 * 24 * 60 * 60) == 15552000
      ],
      { initializer: "__ERC1155BridgeTower_init" }
    );

    await erc1155BridgeTowerProxy.deployed();

    ERC721Mock = await ethers.getContractFactory("ERC721Mock");
    erc721Mock = await ERC721Mock.deploy();

    await erc721Mock.mintBatch(alice.address, 5, "");
  });

  describe("__OperatorRole_init", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        transferProxy.connect(alice).__OperatorRole_init()
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("__TransferProxy_init", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        transferProxy
          .connect(alice)
          .__TransferProxy_init(
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address
          )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("addOperator", () => {
    it("should fail if not whitelisted wallet is trying to add an operator", async () => {
      await expect(
        transferProxy.connect(alice).addOperator(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should add an operator", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await transferProxy.connect(alice).addOperator(bob.address);
    });
  });

  describe("removeOperator", () => {
    it("should fail if not whitelisted wallet is trying to remove an operator", async () => {
      await expect(
        transferProxy.connect(bob).removeOperator(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should remove an operator", async () => {
      await transferProxy.connect(alice).removeOperator(bob.address);
    });
  });

  describe("erc721safeTransferFrom", () => {
    it("should fail if not whitelisted wallet is trying to transfer", async () => {
      await transferProxy.connect(alice).addOperator(bob.address);
      await expect(
        transferProxy
          .connect(bob)
          .erc721safeTransferFrom(
            erc721Mock.address,
            alice.address,
            bob.address,
            BigNumber.from(0)
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if FROM is not a whitelisted wallet", async () => {
      await transferProxy.connect(alice).addOperator(alice.address);
      await expect(
        transferProxy
          .connect(alice)
          .erc721safeTransferFrom(
            erc721Mock.address,
            bob.address,
            alice.address,
            BigNumber.from(0)
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if TO is not a whitelisted wallet", async () => {
      await expect(
        transferProxy
          .connect(alice)
          .erc721safeTransferFrom(
            erc721Mock.address,
            alice.address,
            bob.address,
            BigNumber.from(0)
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should transfer token by a whitelisted operator", async () => {
      expect(
        await erc721Mock.connect(alice).balanceOf(alice.address)
      ).to.be.equal(BigNumber.from(5));
      expect(
        await erc721Mock.connect(alice).balanceOf(bob.address)
      ).to.be.equal(BigNumber.from(0));

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await erc721Mock
        .connect(alice)
        .approve(transferProxy.address, BigNumber.from(0));
      await transferProxy
        .connect(alice)
        .erc721safeTransferFrom(
          erc721Mock.address,
          alice.address,
          bob.address,
          BigNumber.from(0)
        );

      expect(
        await erc721Mock.connect(alice).balanceOf(alice.address)
      ).to.be.equal(BigNumber.from(4));
      expect(
        await erc721Mock.connect(alice).balanceOf(bob.address)
      ).to.be.equal(BigNumber.from(1));
    });
  });

  describe("erc1155safeTransferFrom", () => {
    it("should fail if not whitelisted wallet is trying to transfer", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        transferProxy
          .connect(bob)
          .erc1155safeTransferFrom(
            erc1155BridgeTowerProxy.address,
            alice.address,
            bob.address,
            BigNumber.from(0),
            BigNumber.from(1),
            constants.ZERO_ADDRESS
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if FROM is not a whitelisted wallet", async () => {
      await expect(
        transferProxy
          .connect(alice)
          .erc1155safeTransferFrom(
            erc1155BridgeTowerProxy.address,
            bob.address,
            alice.address,
            BigNumber.from(0),
            BigNumber.from(1),
            constants.ZERO_ADDRESS
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if TO is not a whitelisted wallet", async () => {
      await expect(
        transferProxy
          .connect(alice)
          .erc1155safeTransferFrom(
            erc1155BridgeTowerProxy.address,
            alice.address,
            bob.address,
            BigNumber.from(0),
            BigNumber.from(1),
            constants.ZERO_ADDRESS
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should transfer token by a whitelisted operator", async () => {
      const tokenId: BigNumber = generateTokenID(alice.address);
      const supply: BigNumber = BigNumber.from(100);
      const amount: BigNumber = BigNumber.from(50);
      const data: MintERC1155Data = {
        tokenId: tokenId,
        tokenURI: "",
        supply: supply,
        creators: [
          {
            account: alice.address,
            value: BigNumber.from(10000),
          },
        ],
        royalties: [
          {
            account: alice.address,
            value: BigNumber.from(1000),
          },
        ],
        signatures: [constants.ZERO_ADDRESS],
      };
      const to: string = alice.address;

      await erc1155BridgeTowerProxy
        .connect(alice)
        .mintAndTransfer(data, to, supply);

      expect(
        await erc1155BridgeTowerProxy
          .connect(alice)
          .balanceOf(alice.address, tokenId)
      ).to.be.equal(supply);
      expect(
        await erc1155BridgeTowerProxy
          .connect(alice)
          .balanceOf(bob.address, tokenId)
      ).to.be.equal(BigNumber.from(0));

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await contractsRegistry.connect(alice).addContract(transferProxy.address);
      await transferProxy
        .connect(alice)
        .erc1155safeTransferFrom(
          erc1155BridgeTowerProxy.address,
          alice.address,
          bob.address,
          tokenId,
          amount,
          constants.ZERO_ADDRESS
        );

      expect(
        await erc1155BridgeTowerProxy
          .connect(alice)
          .balanceOf(alice.address, tokenId)
      ).to.be.equal(supply.sub(amount));
      expect(
        await erc1155BridgeTowerProxy
          .connect(alice)
          .balanceOf(bob.address, tokenId)
      ).to.be.equal(amount);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        transferProxy.connect(alice).transferOwnership(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        transferProxy.connect(alice).transferOwnership(carol.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should transfer ownership", async () => {
      expect(await transferProxy.connect(alice).owner()).to.be.equal(
        alice.address
      );

      await transferProxy.connect(alice).transferOwnership(bob.address);

      expect(await transferProxy.connect(alice).owner()).to.be.equal(
        bob.address
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        transferProxy.connect(bob).renounceOwnership()
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(await transferProxy.connect(bob).owner()).to.be.equal(bob.address);

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await transferProxy.connect(bob).renounceOwnership();

      expect(await transferProxy.connect(bob).owner()).to.be.equal(
        constants.ZERO_ADDRESS
      );
    });
  });
});
