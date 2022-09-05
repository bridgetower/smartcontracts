/* eslint-disable node/no-missing-import */

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract, BigNumber } from "ethers";

import { MintERC1155Data, Order } from "../utils/types";

import { ethers, upgrades } from "hardhat";

import { solidity } from "ethereum-waffle";

import chai, { expect } from "chai";

import {
  generateTokenID,
  encodeAssetData,
  keccak256Hash,
  getRightOrder,
  getLeftOrder,
  bytes4,
  sign,
} from "../utils/helpers";

const { constants } = require("@openzeppelin/test-helpers");

chai.use(solidity);

describe("ExchangeV2", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;
  let ted: SignerWithAddress;

  let ERC1155LazyMintTransferProxy: ContractFactory;
  let SecuritizeRegistryProxy: ContractFactory;
  let ContractsRegistryProxy: ContractFactory;
  let ERC1155BridgeTower: ContractFactory;
  let ERC20TransferProxy: ContractFactory;
  let SecuritizeRegistry: ContractFactory;
  let ContractsRegistry: ContractFactory;
  let RoyaltiesRegistry: ContractFactory;
  let ExchangeV2Proxy: ContractFactory;
  let TransferProxy: ContractFactory;
  let ERC20Mock: ContractFactory;

  let erc1155LazyMintTransferProxy: Contract;
  let erc1155BridgeTowerProxy: Contract;
  let securitizeRegistryProxy: Contract;
  let contractsRegistryProxy: Contract;
  let erc20TransferProxy: Contract;
  let securitizeRegistry: Contract;
  let contractsRegistry: Contract;
  let royaltiesRegistry: Contract;
  let exchangeV2Proxy: Contract;
  let transferProxy: Contract;
  let erc20Mock1: Contract;
  let erc20Mock2: Contract;

  let tokenID: BigNumber;

  before("setup", async () => {
    [alice, bob, carol, ted] = await ethers.getSigners();

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

    ERC20TransferProxy = await ethers.getContractFactory("ERC20TransferProxy");
    erc20TransferProxy = await ERC20TransferProxy.deploy();

    await erc20TransferProxy.__ERC20TransferProxy_init(
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

    RoyaltiesRegistry = await ethers.getContractFactory("RoyaltiesRegistry");
    royaltiesRegistry = await RoyaltiesRegistry.deploy();

    await royaltiesRegistry.__RoyaltiesRegistry_init(
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address
    );

    const protocolFee: BigNumber = BigNumber.from(300);
    const defaultFeeReceiver: string = carol.address;

    ExchangeV2Proxy = await ethers.getContractFactory("ExchangeV2");
    exchangeV2Proxy = await upgrades.deployProxy(
      ExchangeV2Proxy,
      [
        transferProxy.address,
        erc20TransferProxy.address,
        protocolFee,
        defaultFeeReceiver,
        royaltiesRegistry.address,
        securitizeRegistryProxy.address,
        contractsRegistryProxy.address,
      ],
      {
        initializer: "__ExchangeV2_init",
      }
    );

    await exchangeV2Proxy.deployed();

    await securitizeRegistry.addWallet(alice.address);

    await erc20TransferProxy.addOperator(exchangeV2Proxy.address);
    await transferProxy.addOperator(exchangeV2Proxy.address);

    await contractsRegistry.addContract(securitizeRegistry.address);
    await contractsRegistry.addContract(securitizeRegistryProxy.address);
    await contractsRegistry.addContract(contractsRegistry.address);
    await contractsRegistry.addContract(contractsRegistryProxy.address);
    await contractsRegistry.addContract(transferProxy.address);
    await contractsRegistry.addContract(erc20TransferProxy.address);
    await contractsRegistry.addContract(erc1155LazyMintTransferProxy.address);
    await contractsRegistry.addContract(erc1155BridgeTowerProxy.address);
    await contractsRegistry.addContract(royaltiesRegistry.address);
    await contractsRegistry.addContract(exchangeV2Proxy.address);

    ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    erc20Mock1 = await ERC20Mock.deploy(BigNumber.from(10000000));
    erc20Mock2 = await ERC20Mock.deploy(BigNumber.from(10000000));

    await erc20Mock1.transfer(bob.address, 10000);

    const tokenId: BigNumber = generateTokenID(alice.address);

    tokenID = tokenId;

    const data: MintERC1155Data = {
      tokenId: tokenId,
      tokenURI: "",
      supply: BigNumber.from(1000),
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
    const amount: BigNumber = BigNumber.from(1000);

    await erc1155BridgeTowerProxy
      .connect(alice)
      .mintAndTransfer(data, to, amount);
  });

  describe("__ExchangeV2_init", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        exchangeV2Proxy
          .connect(alice)
          .__ExchangeV2_init(
            transferProxy.address,
            erc20TransferProxy.address,
            BigNumber.from(300),
            alice.address,
            royaltiesRegistry.address,
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address
          )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("whitelistPaymentToken", () => {
    it("should fail if not whitelisted wallet is trying to whitelist a payment token", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        exchangeV2Proxy
          .connect(alice)
          .whitelistPaymentToken(erc20Mock1.address, true)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if not owner is trying to whitelist a payment token", async () => {
      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await expect(
        exchangeV2Proxy
          .connect(bob)
          .whitelistPaymentToken(erc20Mock1.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if the whitelisted owner is trying to whitelist not contract address", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        exchangeV2Proxy
          .connect(alice)
          .whitelistPaymentToken(alice.address, true)
      ).to.be.revertedWith("ExchangeV2Core: not contract address");
    });

    it("should whitelist payment token by a whitelisted owner", async () => {
      expect(
        await exchangeV2Proxy
          .connect(alice)
          .isWhitelistedPaymentToken(erc20Mock1.address)
      ).to.be.equal(false);

      await expect(
        exchangeV2Proxy
          .connect(alice)
          .whitelistPaymentToken(erc20Mock1.address, true)
      )
        .to.emit(exchangeV2Proxy, "WhitelistedPaymentToken")
        .withArgs(erc20Mock1.address, true);

      expect(
        await exchangeV2Proxy
          .connect(alice)
          .isWhitelistedPaymentToken(erc20Mock1.address)
      ).to.be.equal(true);
    });

    it("should un whitelist payment token by a whitelisted owner", async () => {
      expect(
        await exchangeV2Proxy
          .connect(alice)
          .isWhitelistedPaymentToken(erc20Mock1.address)
      ).to.be.equal(true);

      await expect(
        exchangeV2Proxy
          .connect(alice)
          .whitelistPaymentToken(erc20Mock1.address, false)
      )
        .to.emit(exchangeV2Proxy, "WhitelistedPaymentToken")
        .withArgs(erc20Mock1.address, false);

      expect(
        await exchangeV2Proxy
          .connect(alice)
          .isWhitelistedPaymentToken(erc20Mock1.address)
      ).to.be.equal(false);
    });
  });

  describe("whitelistNativePaymentToken", () => {
    it("should fail if not whitelisted wallet is trying to whitelist a native payment token", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        exchangeV2Proxy.connect(alice).whitelistNativePaymentToken(true)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if not owner is trying to whitelist a native payment token", async () => {
      await expect(
        exchangeV2Proxy.connect(bob).whitelistNativePaymentToken(true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should whitelist native payment token by a whitelisted owner", async () => {
      expect(
        await exchangeV2Proxy.connect(alice).isWhitelistedNativePaymentToken()
      ).to.be.equal(false);

      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        exchangeV2Proxy.connect(alice).whitelistNativePaymentToken(true)
      )
        .to.emit(exchangeV2Proxy, "WhitelistedNativePaymentToken")
        .withArgs(true);

      expect(
        await exchangeV2Proxy.connect(alice).isWhitelistedNativePaymentToken()
      ).to.be.equal(true);
    });

    it("should un whitelist native payment token by a whitelisted owner", async () => {
      expect(
        await exchangeV2Proxy.connect(alice).isWhitelistedNativePaymentToken()
      ).to.be.equal(true);

      await expect(
        exchangeV2Proxy.connect(alice).whitelistNativePaymentToken(false)
      )
        .to.emit(exchangeV2Proxy, "WhitelistedNativePaymentToken")
        .withArgs(false);

      expect(
        await exchangeV2Proxy.connect(alice).isWhitelistedNativePaymentToken()
      ).to.be.equal(false);
    });
  });

  describe("isWhitelistedPaymentToken", () => {
    it("should be whitelisted", async () => {
      await exchangeV2Proxy
        .connect(alice)
        .whitelistPaymentToken(erc20Mock1.address, true);

      expect(
        await exchangeV2Proxy
          .connect(alice)
          .isWhitelistedPaymentToken(erc20Mock1.address)
      ).to.be.equal(true);
    });

    it("should not be whitelisted", async () => {
      expect(
        await exchangeV2Proxy
          .connect(alice)
          .isWhitelistedPaymentToken(erc20Mock2.address)
      ).to.be.equal(false);
    });
  });

  describe("cancel", () => {
    it("should fail if not whitelisted wallet is trying to cancel an order", async () => {
      const leftOrder: Order = getLeftOrder(alice.address);

      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        exchangeV2Proxy.connect(alice).cancel(leftOrder)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should cancel an order by a whitelisted wallet", async () => {
      const leftOrder: Order = getLeftOrder(alice.address);

      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(exchangeV2Proxy.connect(alice).cancel(leftOrder)).to.emit(
        exchangeV2Proxy,
        "Cancel"
      );
    });
  });

  describe("matchOrders", () => {
    it("should fail if not whitelisted wallet is trying to match orders", async () => {
      const leftOrder: Order = getLeftOrder(alice.address);
      const rightOrder: Order = getRightOrder(bob.address);

      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        exchangeV2Proxy
          .connect(alice)
          .matchOrders(
            leftOrder,
            sign(leftOrder, alice, exchangeV2Proxy.address),
            rightOrder,
            sign(rightOrder, bob, exchangeV2Proxy.address)
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if a maker of a left order is not a whitelisted wallet", async () => {
      const leftOrder: Order = getLeftOrder(alice.address);
      const rightOrder: Order = getRightOrder(bob.address);

      await securitizeRegistry.connect(alice).addWallet(carol.address);
      await expect(
        exchangeV2Proxy
          .connect(carol)
          .matchOrders(
            leftOrder,
            sign(leftOrder, alice, exchangeV2Proxy.address),
            rightOrder,
            sign(rightOrder, bob, exchangeV2Proxy.address)
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if a maker of a right order is not a whitelisted wallet", async () => {
      const leftOrder: Order = getLeftOrder(alice.address);
      const rightOrder: Order = getRightOrder(bob.address);

      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        exchangeV2Proxy
          .connect(carol)
          .matchOrders(
            leftOrder,
            sign(leftOrder, alice, exchangeV2Proxy.address),
            rightOrder,
            sign(rightOrder, bob, exchangeV2Proxy.address)
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if a taker of a left order is not a whitelisted wallet", async () => {
      const leftOrder: Order = getLeftOrder(alice.address);
      const rightOrder: Order = getRightOrder(bob.address);

      leftOrder.taker = ted.address;

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await expect(
        exchangeV2Proxy
          .connect(carol)
          .matchOrders(
            leftOrder,
            sign(leftOrder, alice, exchangeV2Proxy.address),
            rightOrder,
            sign(rightOrder, bob, exchangeV2Proxy.address)
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if a taker of a right order is not a whitelisted wallet", async () => {
      const leftOrder: Order = getLeftOrder(alice.address);
      const rightOrder: Order = getRightOrder(bob.address);

      rightOrder.taker = ted.address;

      await expect(
        exchangeV2Proxy
          .connect(carol)
          .matchOrders(
            leftOrder,
            sign(leftOrder, alice, exchangeV2Proxy.address),
            rightOrder,
            sign(rightOrder, bob, exchangeV2Proxy.address)
          )
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if one of the payment assets from the left order isn't supported", async () => {
      const leftOrder: Order = getLeftOrder(
        alice.address,
        encodeAssetData(erc1155BridgeTowerProxy.address, tokenID),
        encodeAssetData(erc20Mock2.address)
      );
      const rightOrder: Order = getRightOrder(
        bob.address,
        encodeAssetData(erc20Mock1.address),
        encodeAssetData(erc1155BridgeTowerProxy.address, tokenID)
      );

      await expect(
        exchangeV2Proxy
          .connect(carol)
          .matchOrders(
            leftOrder,
            sign(leftOrder, alice, exchangeV2Proxy.address),
            rightOrder,
            sign(rightOrder, bob, exchangeV2Proxy.address)
          )
      ).to.be.revertedWith(
        "ExchangeV2: orderLeft - one of the payment asset isn't supported"
      );
    });

    it("should fail if one of the payment assets from the right order isn't supported", async () => {
      const leftOrder: Order = getLeftOrder(
        alice.address,
        encodeAssetData(erc1155BridgeTowerProxy.address, tokenID),
        encodeAssetData(erc20Mock1.address)
      );
      const rightOrder: Order = getRightOrder(
        bob.address,
        encodeAssetData(erc20Mock2.address),
        encodeAssetData(erc1155BridgeTowerProxy.address, tokenID)
      );

      await expect(
        exchangeV2Proxy
          .connect(carol)
          .matchOrders(
            leftOrder,
            sign(leftOrder, alice, exchangeV2Proxy.address),
            rightOrder,
            sign(rightOrder, bob, exchangeV2Proxy.address)
          )
      ).to.be.revertedWith(
        "ExchangeV2: orderRight - one of the payment asset isn't supported"
      );
    });

    it("should match orders (ERC1155 <=> ERC20)", async () => {
      const leftOrder: Order = getLeftOrder(
        alice.address,
        encodeAssetData(erc1155BridgeTowerProxy.address, tokenID),
        encodeAssetData(erc20Mock1.address)
      );
      const rightOrder: Order = getRightOrder(
        bob.address,
        encodeAssetData(erc20Mock1.address),
        encodeAssetData(erc1155BridgeTowerProxy.address, tokenID)
      );
      const prevAliceERC1155Balance: BigNumber = await erc1155BridgeTowerProxy
        .connect(alice)
        .balanceOf(alice.address, tokenID);
      const prevBobERC1155Balance: BigNumber = await erc1155BridgeTowerProxy
        .connect(alice)
        .balanceOf(bob.address, tokenID);
      const prevAliceERC20Balance: BigNumber = await erc20Mock1
        .connect(alice)
        .balanceOf(alice.address);
      const prevBobERC20Balance: BigNumber = await erc20Mock1
        .connect(alice)
        .balanceOf(bob.address);

      await erc1155BridgeTowerProxy
        .connect(alice)
        .setApprovalForAll(transferProxy.address, true);
      await erc20Mock1
        .connect(bob)
        .approve(erc20TransferProxy.address, BigNumber.from(206)); // 200 + 3% protocol fee from a maker
      await exchangeV2Proxy
        .connect(carol)
        .matchOrders(
          leftOrder,
          sign(leftOrder, alice, exchangeV2Proxy.address),
          rightOrder,
          sign(rightOrder, bob, exchangeV2Proxy.address)
        );

      const currAliceERC1155Balance: BigNumber = await erc1155BridgeTowerProxy
        .connect(alice)
        .balanceOf(alice.address, tokenID);
      const currBobERC1155Balance: BigNumber = await erc1155BridgeTowerProxy
        .connect(alice)
        .balanceOf(bob.address, tokenID);
      const currAliceERC20Balance: BigNumber = await erc20Mock1
        .connect(alice)
        .balanceOf(alice.address);
      const currBobERC20Balance: BigNumber = await erc20Mock1
        .connect(alice)
        .balanceOf(bob.address);
      const currCarolERC20Balance: BigNumber = await erc20Mock1
        .connect(alice)
        .balanceOf(carol.address);

      expect(currAliceERC1155Balance).to.be.equal(
        prevAliceERC1155Balance.sub(BigNumber.from(1))
      );
      expect(currBobERC1155Balance).to.be.equal(
        prevBobERC1155Balance.add(BigNumber.from(1))
      );
      expect(currCarolERC20Balance).to.be.equal(BigNumber.from(12)); // 3% from a maker (6) + 3% form a taker (6) = 6% protocol fee (12)
      expect(currAliceERC20Balance).to.be.equal(
        prevAliceERC20Balance.add(BigNumber.from(194)) // 200 - 3% protocol fee (6) = 194
      );
      expect(currBobERC20Balance).to.be.equal(
        prevBobERC20Balance.sub(BigNumber.from(206)) // 200 + 3% protocol fee (6) = 206
      );
    });
  });

  describe("setAssetMatcher", () => {
    it("should fail if not whitelisted wallet is trying to set asset matcher", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        exchangeV2Proxy
          .connect(alice)
          .setAssetMatcher(bytes4(keccak256Hash("AVAX")), alice.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if not owner is trying to set asset matcher", async () => {
      await expect(
        exchangeV2Proxy
          .connect(bob)
          .setAssetMatcher(bytes4(keccak256Hash("AVAX")), alice.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should set asset matcher by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        exchangeV2Proxy
          .connect(alice)
          .setAssetMatcher(bytes4(keccak256Hash("AVAX")), alice.address)
      )
        .to.emit(exchangeV2Proxy, "MatcherChange")
        .withArgs(bytes4(keccak256Hash("AVAX")), alice.address);
    });
  });

  describe("setDefaultFeeReceiver", () => {
    it("should fail if not whitelisted wallet is trying to set default fee receiver", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        exchangeV2Proxy.connect(alice).setDefaultFeeReceiver(alice.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if not owner is trying to set a default fee receiver", async () => {
      await expect(
        exchangeV2Proxy.connect(bob).setDefaultFeeReceiver(alice.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should set default fee receiver by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await exchangeV2Proxy.connect(alice).setDefaultFeeReceiver(bob.address);

      expect(
        await exchangeV2Proxy.connect(alice).defaultFeeReceiver()
      ).to.be.equal(bob.address);
    });
  });

  describe("setFeeReceiver", () => {
    it("should fail if not whitelisted wallet is trying to set fee receiver", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        exchangeV2Proxy
          .connect(alice)
          .setFeeReceiver(erc1155BridgeTowerProxy.address, alice.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if not owner is trying to set a fee receiver", async () => {
      await expect(
        exchangeV2Proxy
          .connect(bob)
          .setFeeReceiver(erc1155BridgeTowerProxy.address, alice.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should set fee receiver by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await exchangeV2Proxy
        .connect(alice)
        .setFeeReceiver(erc1155BridgeTowerProxy.address, bob.address);

      expect(
        await exchangeV2Proxy
          .connect(alice)
          .feeReceivers(erc1155BridgeTowerProxy.address)
      ).to.be.equal(bob.address);
    });
  });

  describe("setProtocolFee", () => {
    it("should fail if not whitelisted wallet is trying to set protocol fee", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        exchangeV2Proxy.connect(alice).setProtocolFee(BigNumber.from(100))
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if not owner is trying to set a protocol fee", async () => {
      await expect(
        exchangeV2Proxy.connect(bob).setProtocolFee(BigNumber.from(100))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should set protocol fee by a whitelisted owner", async () => {
      const oldProtocolFee: BigNumber = BigNumber.from(300);
      const newProtocolFee: BigNumber = BigNumber.from(100);

      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        exchangeV2Proxy.connect(alice).setProtocolFee(newProtocolFee)
      )
        .to.emit(exchangeV2Proxy, "ProtocolFeeChanged")
        .withArgs(oldProtocolFee, newProtocolFee);

      expect(await exchangeV2Proxy.connect(alice).protocolFee()).to.be.equal(
        newProtocolFee
      );
    });
  });

  describe("setRoyaltiesRegistry", () => {
    it("should fail if not whitelisted wallet is trying to set royalties registry", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        exchangeV2Proxy.connect(alice).setRoyaltiesRegistry(alice.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if not owner is trying to set a royalties registry", async () => {
      await expect(
        exchangeV2Proxy.connect(bob).setRoyaltiesRegistry(alice.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should set royalties registry by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await exchangeV2Proxy.connect(alice).setRoyaltiesRegistry(alice.address);

      expect(
        await exchangeV2Proxy.connect(alice).royaltiesRegistry()
      ).to.be.equal(alice.address);
    });
  });

  describe("setTransferProxy", () => {
    it("should fail if not whitelisted wallet is trying to set transfer proxy", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        exchangeV2Proxy
          .connect(alice)
          .setTransferProxy(bytes4(keccak256Hash("AVAX")), alice.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if not owner is trying to set transfer proxy", async () => {
      await expect(
        exchangeV2Proxy
          .connect(bob)
          .setTransferProxy(bytes4(keccak256Hash("AVAX")), alice.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should set transfer proxy by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        exchangeV2Proxy
          .connect(alice)
          .setTransferProxy(bytes4(keccak256Hash("AVAX")), alice.address)
      )
        .to.emit(exchangeV2Proxy, "ProxyChange")
        .withArgs(bytes4(keccak256Hash("AVAX")), alice.address);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        exchangeV2Proxy.connect(alice).transferOwnership(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await securitizeRegistry.connect(alice).removeWallet(carol.address);
      await expect(
        exchangeV2Proxy.connect(alice).transferOwnership(carol.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should transfer ownership", async () => {
      expect(await exchangeV2Proxy.connect(alice).owner()).to.be.equal(
        alice.address
      );

      await exchangeV2Proxy.connect(alice).transferOwnership(bob.address);

      expect(await exchangeV2Proxy.connect(alice).owner()).to.be.equal(
        bob.address
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        exchangeV2Proxy.connect(bob).renounceOwnership()
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(await exchangeV2Proxy.connect(bob).owner()).to.be.equal(
        bob.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await exchangeV2Proxy.connect(bob).renounceOwnership();

      expect(await exchangeV2Proxy.connect(bob).owner()).to.be.equal(
        constants.ZERO_ADDRESS
      );
    });
  });
});
