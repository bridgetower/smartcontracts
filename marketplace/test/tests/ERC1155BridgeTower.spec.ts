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
  getRightOrder,
  getLeftOrder,
  increaseTime,
  mineBlocks,
  sign,
} from "../utils/helpers";

const { constants } = require("@openzeppelin/test-helpers");

chai.use(solidity);

describe("ERC1155BridgeTower", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

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
  let erc20Mock: Contract;

  let tokenID1: BigNumber;
  let tokenID2: BigNumber;

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
    const defaultFeeReceiver: string = alice.address;

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
    erc20Mock = await ERC20Mock.deploy(BigNumber.from(10000000));

    await erc20Mock.transfer(bob.address, 10000);

    await exchangeV2Proxy
      .connect(alice)
      .whitelistPaymentToken(erc20Mock.address, true);
  });

  describe("PartnerAccessControl", () => {
    describe("addPartner", () => {
      it("should fail if not a whitelisted wallet is trying to add a new partner", async () => {
        await securitizeRegistry.removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).addPartner(alice.address)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if not an owner is trying to add a new partner", async () => {
        await securitizeRegistry.connect(alice).addWallet(bob.address);
        await expect(
          erc1155BridgeTowerProxy.connect(bob).addPartner(bob.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should add a new partner by a whitelisted owner", async () => {
        expect(
          await erc1155BridgeTowerProxy.connect(alice).isPartner(bob.address)
        ).to.be.equal(false);

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).addPartner(bob.address)
        )
          .to.emit(erc1155BridgeTowerProxy, "PartnerStatusChanged")
          .withArgs(bob.address, true);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).isPartner(bob.address)
        ).to.be.equal(true);
      });
    });

    describe("isPartner", () => {
      it("should return true", async () => {
        expect(
          await erc1155BridgeTowerProxy.connect(alice).isPartner(bob.address)
        ).to.be.equal(true);
      });

      it("should return false", async () => {
        expect(
          await erc1155BridgeTowerProxy.connect(alice).isPartner(alice.address)
        ).to.be.equal(false);
      });
    });

    describe("removePartner", () => {
      it("should fail if not a whitelisted wallet is trying to remove a partner", async () => {
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).removePartner(alice.address)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if not an owner is trying to remove a partner", async () => {
        await expect(
          erc1155BridgeTowerProxy.connect(bob).removePartner(bob.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should remove a partner by a whitelisted owner", async () => {
        expect(
          await erc1155BridgeTowerProxy.connect(alice).isPartner(bob.address)
        ).to.be.equal(true);

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).removePartner(bob.address)
        )
          .to.emit(erc1155BridgeTowerProxy, "PartnerStatusChanged")
          .withArgs(bob.address, false);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).isPartner(bob.address)
        ).to.be.equal(false);
      });
    });
  });

  describe("WhitelistableUpgradeable", () => {
    describe("setSecuritizeRegistryProxy", () => {
      it("should fail if not an owner is trying to set a new securitize registry proxy", async () => {
        await expect(
          erc1155BridgeTowerProxy
            .connect(bob)
            .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should fail if an owner is not whitelisted and is trying to set a new securitize registry proxy", async () => {
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if a new securitize registry proxy is not a contract", async () => {
        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .setSecuritizeRegistryProxy(bob.address)
        ).to.be.revertedWith("Whitelistable: not contract address");
      });

      it("should set a new securitize registry proxy by a whitelisted owner", async () => {
        const newSecuritizeRegistryProxy: Contract =
          await SecuritizeRegistryProxy.deploy(securitizeRegistry.address);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).securitizeRegistryProxy()
        ).to.be.equal(securitizeRegistryProxy.address);

        await erc1155BridgeTowerProxy
          .connect(alice)
          .setSecuritizeRegistryProxy(newSecuritizeRegistryProxy.address);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).securitizeRegistryProxy()
        ).to.be.equal(newSecuritizeRegistryProxy.address);

        await erc1155BridgeTowerProxy
          .connect(alice)
          .setSecuritizeRegistryProxy(securitizeRegistryProxy.address);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).securitizeRegistryProxy()
        ).to.be.equal(securitizeRegistryProxy.address);
      });
    });

    describe("setContractsRegistryProxy", () => {
      it("should fail if not an owner is trying to set a new contracts registry proxy", async () => {
        await expect(
          erc1155BridgeTowerProxy
            .connect(bob)
            .setContractsRegistryProxy(contractsRegistryProxy.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should fail if an owner is not whitelisted and is trying to set a new contracts registry proxy", async () => {
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .setContractsRegistryProxy(contractsRegistryProxy.address)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if a new contracts registry proxy is not a contract", async () => {
        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .setContractsRegistryProxy(bob.address)
        ).to.be.revertedWith("Whitelistable: not contract address");
      });

      it("should set a new contracts registry proxy by a whitelisted owner", async () => {
        const newContractsRegistryProxy: Contract =
          await ContractsRegistryProxy.deploy(
            securitizeRegistryProxy.address,
            contractsRegistry.address
          );

        expect(
          await erc1155BridgeTowerProxy.connect(alice).contractsRegistryProxy()
        ).to.be.equal(contractsRegistryProxy.address);

        await erc1155BridgeTowerProxy
          .connect(alice)
          .setContractsRegistryProxy(newContractsRegistryProxy.address);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).contractsRegistryProxy()
        ).to.be.equal(newContractsRegistryProxy.address);

        await erc1155BridgeTowerProxy
          .connect(alice)
          .setContractsRegistryProxy(contractsRegistryProxy.address);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).contractsRegistryProxy()
        ).to.be.equal(contractsRegistryProxy.address);
      });
    });
  });

  describe("ERC1155BridgeTower", () => {
    describe("__ERC1155BridgeTower_init", () => {
      it("should fail if a contract is already initialized", async () => {
        await expect(
          erc1155BridgeTowerProxy.connect(alice).__ERC1155BridgeTower_init(
            "BridgeTower Permissioned Market Token",
            "PMT",
            "",
            "",
            transferProxy.address,
            erc1155LazyMintTransferProxy.address,
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address,
            BigNumber.from(15_552_000) // 6 months in seconds (6 * 30 * 24 * 60 * 60) == 15552000
          )
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });
    });

    describe("__ERC1155BridgeTowerUser_init", () => {
      it("should fail if a contract is already initialized", async () => {
        await expect(
          erc1155BridgeTowerProxy.connect(alice).__ERC1155BridgeTowerUser_init(
            "BridgeTower Permissioned Market Token",
            "PMT",
            "",
            "",
            [],
            transferProxy.address,
            erc1155LazyMintTransferProxy.address,
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address,
            BigNumber.from(15_552_000) // 6 months in seconds (6 * 30 * 24 * 60 * 60) == 15552000
          )
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });
    });

    describe("mintAndTransfer", () => {
      it("should fail if not a partner is trying to mint and transfer tokens", async () => {
        const data: MintERC1155Data = {
          tokenId: generateTokenID(alice.address),
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

        await expect(
          erc1155BridgeTowerProxy.connect(bob).mintAndTransfer(data, to, amount)
        ).to.be.revertedWith("PartnerAccessControl: caller is not a partner");
      });

      it("should fail if not a whitelisted wallet is trying to mint and transfer tokens", async () => {
        const data: MintERC1155Data = {
          tokenId: generateTokenID(alice.address),
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

        await erc1155BridgeTowerProxy.connect(alice).addPartner(alice.address);
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .mintAndTransfer(data, to, amount)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if a whitelisted wallet is trying to mint and transfer tokens to not whitelisted wallet", async () => {
        const data: MintERC1155Data = {
          tokenId: generateTokenID(alice.address),
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
        const to: string = carol.address;
        const amount: BigNumber = BigNumber.from(1000);

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await erc1155BridgeTowerProxy.connect(alice).addPartner(alice.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .mintAndTransfer(data, to, amount)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should mint and transfer tokens by a whitelisted partner", async () => {
        await erc1155BridgeTowerProxy.connect(alice).addPartner(bob.address);

        let tokenId: BigNumber = generateTokenID(bob.address);

        tokenID1 = tokenId;

        const data: MintERC1155Data = {
          tokenId: tokenId,
          tokenURI: "",
          supply: BigNumber.from(1000),
          creators: [
            {
              account: bob.address,
              value: BigNumber.from(10000),
            },
          ],
          royalties: [
            {
              account: bob.address,
              value: BigNumber.from(1000),
            },
          ],
          signatures: [constants.ZERO_ADDRESS],
        };
        const to: string = bob.address;
        const amount: BigNumber = BigNumber.from(1000);

        await erc1155BridgeTowerProxy
          .connect(bob)
          .mintAndTransfer(data, to, amount);

        expect(
          await erc1155BridgeTowerProxy.connect(bob).balanceOf(to, tokenId)
        ).to.be.equal(amount);

        tokenId = generateTokenID(bob.address);

        data.tokenId = tokenId;

        tokenID2 = tokenId;

        await erc1155BridgeTowerProxy
          .connect(bob)
          .mintAndTransfer(data, to, amount);

        expect(
          await erc1155BridgeTowerProxy.connect(bob).balanceOf(to, tokenId)
        ).to.be.equal(amount);
      });
    });

    describe("transferFromOrMint", () => {
      it("should fail if not a partner is trying to transfer or mint tokens", async () => {
        const data: MintERC1155Data = {
          tokenId: generateTokenID(alice.address),
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
        const from: string = alice.address;
        const to: string = alice.address;
        const amount: BigNumber = BigNumber.from(1000);

        await erc1155BridgeTowerProxy.connect(alice).removePartner(bob.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(bob)
            .transferFromOrMint(data, from, to, amount)
        ).to.be.revertedWith("PartnerAccessControl: caller is not a partner");
      });

      it("should fail if not a whitelisted wallet is trying to transfer or mint tokens", async () => {
        const data: MintERC1155Data = {
          tokenId: generateTokenID(alice.address),
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
        const from: string = alice.address;
        const to: string = alice.address;
        const amount: BigNumber = BigNumber.from(1000);

        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .transferFromOrMint(data, from, to, amount)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if FROM is not a whitelisted wallet", async () => {
        const data: MintERC1155Data = {
          tokenId: generateTokenID(alice.address),
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
        const from: string = carol.address;
        const to: string = alice.address;
        const amount: BigNumber = BigNumber.from(1000);

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .transferFromOrMint(data, from, to, amount)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if TO is not a whitelisted wallet", async () => {
        const data: MintERC1155Data = {
          tokenId: generateTokenID(alice.address),
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
        const from: string = alice.address;
        const to: string = carol.address;
        const amount: BigNumber = BigNumber.from(1000);

        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .transferFromOrMint(data, from, to, amount)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should transfer or mint tokens by a whitelisted partner", async () => {
        await erc1155BridgeTowerProxy.connect(alice).addPartner(bob.address);

        const tokenId: BigNumber = generateTokenID(bob.address);
        const data: MintERC1155Data = {
          tokenId: tokenId,
          tokenURI: "",
          supply: BigNumber.from(1000),
          creators: [
            {
              account: bob.address,
              value: BigNumber.from(10000),
            },
          ],
          royalties: [
            {
              account: bob.address,
              value: BigNumber.from(1000),
            },
          ],
          signatures: [constants.ZERO_ADDRESS],
        };
        const from: string = bob.address;
        const to1: string = bob.address;
        const to2: string = alice.address;
        const amount: BigNumber = BigNumber.from(500);

        await erc1155BridgeTowerProxy
          .connect(bob)
          .mintAndTransfer(data, to1, amount);

        expect(
          await erc1155BridgeTowerProxy.connect(bob).balanceOf(to1, tokenId)
        ).to.be.equal(amount);

        await erc1155BridgeTowerProxy
          .connect(bob)
          .transferFromOrMint(data, from, to2, amount.mul(2));

        expect(
          await erc1155BridgeTowerProxy.connect(bob).balanceOf(to2, tokenId)
        ).to.be.equal(amount.mul(2));
      });
    });

    describe("safeTransferFrom", () => {
      it("should fail if not a whitelisted wallet is trying to transfer tokens", async () => {
        const from: string = alice.address;
        const to: string = bob.address;
        const id: BigNumber = tokenID1;
        const amount: BigNumber = BigNumber.from(1000);
        const data: string = "0xf23a6e61";

        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .safeTransferFrom(from, to, id, amount, data)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if FROM is not a whitelisted wallet", async () => {
        const from: string = bob.address;
        const to: string = carol.address;
        const id: BigNumber = tokenID1;
        const amount: BigNumber = BigNumber.from(1000);
        const data: string = "0xf23a6e61";

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await securitizeRegistry.connect(alice).removeWallet(bob.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .safeTransferFrom(from, to, id, amount, data)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if TO is not a whitelisted wallet", async () => {
        const from: string = alice.address;
        const to: string = carol.address;
        const id: BigNumber = tokenID1;
        const amount: BigNumber = BigNumber.from(1000);
        const data: string = "0xf23a6e61";

        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .safeTransferFrom(from, to, id, amount, data)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should transfer tokens", async () => {
        const from: string = bob.address;
        const to: string = alice.address;
        const id: BigNumber = tokenID1;
        const amount: BigNumber = BigNumber.from(100);
        const data: string = "0xf23a6e61";
        const prevAliceBalance: BigNumber = await erc1155BridgeTowerProxy
          .connect(bob)
          .balanceOf(alice.address, id);
        const prevBobBalance: BigNumber = await erc1155BridgeTowerProxy
          .connect(bob)
          .balanceOf(bob.address, id);

        await securitizeRegistry.connect(alice).addWallet(bob.address);
        await erc1155BridgeTowerProxy
          .connect(bob)
          .safeTransferFrom(from, to, id, amount, data);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .balanceOf(alice.address, id)
        ).to.be.equal(prevAliceBalance.add(amount));
        expect(
          await erc1155BridgeTowerProxy.connect(bob).balanceOf(bob.address, id)
        ).to.be.equal(prevBobBalance.sub(amount));
      });

      it("should fail if user is trying to transfer more than unlocked tokens amount", async () => {
        const leftOrder: Order = getLeftOrder(
          alice.address,
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1),
          encodeAssetData(erc20Mock.address)
        );
        const rightOrder: Order = getRightOrder(
          bob.address,
          encodeAssetData(erc20Mock.address),
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1)
        );
        const prevBobBalance: BigNumber = await erc1155BridgeTowerProxy
          .connect(bob)
          .balanceOf(bob.address, tokenID1);

        await erc1155BridgeTowerProxy
          .connect(alice)
          .setApprovalForAll(transferProxy.address, true);
        await erc20Mock
          .connect(bob)
          .approve(erc20TransferProxy.address, BigNumber.from(206)); // 200 + 3% protocol fee from a maker
        await expect(
          exchangeV2Proxy
            .connect(bob)
            .matchOrders(
              leftOrder,
              sign(leftOrder, alice, exchangeV2Proxy.address),
              rightOrder,
              sign(rightOrder, bob, exchangeV2Proxy.address)
            )
        )
          .to.emit(erc1155BridgeTowerProxy, "Locked")
          .withArgs(bob.address, tokenID1, rightOrder.takeAsset.value);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(rightOrder.takeAsset.value);

        const from: string = bob.address;
        const to: string = alice.address;
        const id: BigNumber = tokenID1;
        const amount: BigNumber = prevBobBalance.add(
          rightOrder.takeAsset.value
        );
        const data: string = "0xf23a6e61";

        await expect(
          erc1155BridgeTowerProxy
            .connect(bob)
            .safeTransferFrom(from, to, id, amount, data)
        ).to.be.revertedWith("ERC1155BridgeTower: not enough unlocked tokens");
      });

      it("should lock proper amount of tokens", async () => {
        const leftOrder: Order = getLeftOrder(
          alice.address,
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1),
          encodeAssetData(erc20Mock.address)
        );
        const rightOrder: Order = getRightOrder(
          bob.address,
          encodeAssetData(erc20Mock.address),
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1)
        );
        const prevBobLockedBalance: BigNumber = await erc1155BridgeTowerProxy
          .connect(bob)
          .getLockedAmount(bob.address, tokenID1);

        leftOrder.salt = BigNumber.from(2);
        rightOrder.salt = BigNumber.from(2);
        leftOrder.makeAsset.value = BigNumber.from(4);
        rightOrder.takeAsset.value = BigNumber.from(4);

        await increaseTime(5_184_000); // 2 months in seconds
        await mineBlocks(1);
        await erc20Mock
          .connect(bob)
          .approve(erc20TransferProxy.address, BigNumber.from(206)); // 200 + 3% protocol fee from a maker
        await expect(
          exchangeV2Proxy
            .connect(bob)
            .matchOrders(
              leftOrder,
              sign(leftOrder, alice, exchangeV2Proxy.address),
              rightOrder,
              sign(rightOrder, bob, exchangeV2Proxy.address)
            )
        )
          .to.emit(erc1155BridgeTowerProxy, "Locked")
          .withArgs(bob.address, tokenID1, rightOrder.takeAsset.value);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(prevBobLockedBalance.add(rightOrder.takeAsset.value));
      });

      it("should unlock proper amount of tokens", async () => {
        await increaseTime(10_368_000); // 4 months in seconds
        await mineBlocks(1);

        const from: string = bob.address;
        const to: string = alice.address;
        const id: BigNumber = tokenID1;
        const amount: BigNumber = BigNumber.from(1);
        const data: string = "0xf23a6e61";

        await expect(
          erc1155BridgeTowerProxy
            .connect(bob)
            .safeTransferFrom(from, to, id, amount, data)
        )
          .to.emit(erc1155BridgeTowerProxy, "Unlocked")
          .withArgs(bob.address, tokenID1, BigNumber.from(1));

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(4));
      });
    });

    describe("safeBatchTransferFrom", () => {
      it("should fail if not a whitelisted wallet is trying to transfer tokens in batch", async () => {
        const from: string = alice.address;
        const to: string = bob.address;
        const ids: BigNumber[] = [tokenID1];
        const amounts: BigNumber[] = [BigNumber.from(1000)];
        const data: string = "0xf23a6e61";

        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .safeBatchTransferFrom(from, to, ids, amounts, data)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if FROM is not a whitelisted wallet", async () => {
        const from: string = bob.address;
        const to: string = carol.address;
        const ids: BigNumber[] = [tokenID1];
        const amounts: BigNumber[] = [BigNumber.from(1000)];
        const data: string = "0xf23a6e61";

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await securitizeRegistry.connect(alice).removeWallet(bob.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .safeBatchTransferFrom(from, to, ids, amounts, data)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if TO is not a whitelisted wallet", async () => {
        const from: string = alice.address;
        const to: string = carol.address;
        const ids: BigNumber[] = [tokenID1];
        const amounts: BigNumber[] = [BigNumber.from(1000)];
        const data: string = "0xf23a6e61";

        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .safeBatchTransferFrom(from, to, ids, amounts, data)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should transfer tokens in batch", async () => {
        const from: string = bob.address;
        const to: string = alice.address;
        const ids: BigNumber[] = [tokenID1];
        const amounts: BigNumber[] = [BigNumber.from(400)];
        const data: string = "0xf23a6e61";
        const prevAliceBalance: BigNumber = await erc1155BridgeTowerProxy
          .connect(bob)
          .balanceOf(alice.address, ids[0]);
        const prevBobBalance: BigNumber = await erc1155BridgeTowerProxy
          .connect(bob)
          .balanceOf(bob.address, ids[0]);

        await securitizeRegistry.connect(alice).addWallet(bob.address);
        await erc1155BridgeTowerProxy
          .connect(bob)
          .safeBatchTransferFrom(from, to, ids, amounts, data);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .balanceOf(alice.address, ids[0])
        ).to.be.equal(prevAliceBalance.add(amounts[0]));
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .balanceOf(bob.address, ids[0])
        ).to.be.equal(prevBobBalance.sub(amounts[0]));
      });

      it("should fail if user is trying to transfer more than unlocked tokens amount", async () => {
        const from: string = bob.address;
        const to: string = alice.address;
        const ids: BigNumber[] = [tokenID1];
        const amounts: BigNumber[] = [
          await erc1155BridgeTowerProxy
            .connect(bob)
            .balanceOf(bob.address, tokenID1),
        ];
        const data: string = "0xf23a6e61";

        await expect(
          erc1155BridgeTowerProxy
            .connect(bob)
            .safeBatchTransferFrom(from, to, ids, amounts, data)
        ).to.be.revertedWith("ERC1155BridgeTower: not enough unlocked tokens");
      });

      it("should fail if user is trying to transfer more than unlocked tokens amount in one of transferred tokens in a batch", async () => {
        const from: string = bob.address;
        const to: string = alice.address;
        const ids: BigNumber[] = [tokenID2, tokenID1];
        const amounts: BigNumber[] = [
          await erc1155BridgeTowerProxy
            .connect(bob)
            .balanceOf(bob.address, tokenID2),
          await erc1155BridgeTowerProxy
            .connect(bob)
            .balanceOf(bob.address, tokenID1),
        ];
        const data: string = "0xf23a6e61";

        await expect(
          erc1155BridgeTowerProxy
            .connect(bob)
            .safeBatchTransferFrom(from, to, ids, amounts, data)
        ).to.be.revertedWith("ERC1155BridgeTower: not enough unlocked tokens");
      });

      it("should unlock proper amount of tokens", async () => {
        await increaseTime(5_184_000); // 2 months in seconds
        await mineBlocks(1);

        const from: string = bob.address;
        const to: string = alice.address;
        const ids: BigNumber[] = [tokenID1];
        const amounts: BigNumber[] = [
          await erc1155BridgeTowerProxy
            .connect(bob)
            .balanceOf(bob.address, tokenID1),
        ];
        const data: string = "0xf23a6e61";

        await expect(
          erc1155BridgeTowerProxy
            .connect(bob)
            .safeBatchTransferFrom(from, to, ids, amounts, data)
        )
          .to.emit(erc1155BridgeTowerProxy, "Unlocked")
          .withArgs(bob.address, tokenID1, BigNumber.from(4));

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
      });

      it("should unlock proper amount of tokens in one of transferred tokens in a batch", async () => {
        const leftOrder: Order = getLeftOrder(
          alice.address,
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1),
          encodeAssetData(erc20Mock.address)
        );
        const rightOrder: Order = getRightOrder(
          bob.address,
          encodeAssetData(erc20Mock.address),
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1)
        );
        const prevBobLockedBalance: BigNumber = await erc1155BridgeTowerProxy
          .connect(bob)
          .getLockedAmount(bob.address, tokenID1);

        leftOrder.salt = BigNumber.from(3);
        rightOrder.salt = BigNumber.from(3);
        leftOrder.makeAsset.value = BigNumber.from(5);
        rightOrder.takeAsset.value = BigNumber.from(5);

        await erc20Mock
          .connect(bob)
          .approve(erc20TransferProxy.address, BigNumber.from(206)); // 200 + 3% protocol fee from a maker
        await expect(
          exchangeV2Proxy
            .connect(bob)
            .matchOrders(
              leftOrder,
              sign(leftOrder, alice, exchangeV2Proxy.address),
              rightOrder,
              sign(rightOrder, bob, exchangeV2Proxy.address)
            )
        )
          .to.emit(erc1155BridgeTowerProxy, "Locked")
          .withArgs(bob.address, tokenID1, rightOrder.takeAsset.value);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(prevBobLockedBalance.add(rightOrder.takeAsset.value));

        await increaseTime(15_552_000); // 6 months in seconds
        await mineBlocks(1);

        const from: string = bob.address;
        const to: string = alice.address;
        const ids: BigNumber[] = [tokenID2, tokenID1];
        const amounts: BigNumber[] = [
          await erc1155BridgeTowerProxy
            .connect(bob)
            .balanceOf(bob.address, tokenID2),
          await erc1155BridgeTowerProxy
            .connect(bob)
            .balanceOf(bob.address, tokenID1),
        ];
        const data: string = "0xf23a6e61";

        await expect(
          erc1155BridgeTowerProxy
            .connect(bob)
            .safeBatchTransferFrom(from, to, ids, amounts, data)
        )
          .to.emit(erc1155BridgeTowerProxy, "Unlocked")
          .withArgs(bob.address, tokenID1, rightOrder.takeAsset.value);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
      });
    });

    describe("unlock", () => {
      it("should fail if not a whitelisted wallet is trying to unlock tokens", async () => {
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).unlock(alice.address, tokenID1)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if whitelisted user is trying to unlock tokens for not a whitelisted user", async () => {
        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).unlock(carol.address, tokenID1)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should not unlock tokens if nothing to unlock", async () => {
        const leftOrder: Order = getLeftOrder(
          alice.address,
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1),
          encodeAssetData(erc20Mock.address)
        );
        const rightOrder: Order = getRightOrder(
          bob.address,
          encodeAssetData(erc20Mock.address),
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1)
        );
        const prevBobLockedBalance: BigNumber = await erc1155BridgeTowerProxy
          .connect(bob)
          .getLockedAmount(bob.address, tokenID1);

        leftOrder.salt = BigNumber.from(4);
        rightOrder.salt = BigNumber.from(4);
        leftOrder.makeAsset.value = BigNumber.from(5);
        rightOrder.takeAsset.value = BigNumber.from(5);

        await erc20Mock
          .connect(bob)
          .approve(erc20TransferProxy.address, BigNumber.from(206)); // 200 + 3% protocol fee from a maker
        await expect(
          exchangeV2Proxy
            .connect(bob)
            .matchOrders(
              leftOrder,
              sign(leftOrder, alice, exchangeV2Proxy.address),
              rightOrder,
              sign(rightOrder, bob, exchangeV2Proxy.address)
            )
        )
          .to.emit(erc1155BridgeTowerProxy, "Locked")
          .withArgs(bob.address, tokenID1, rightOrder.takeAsset.value);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(prevBobLockedBalance.add(rightOrder.takeAsset.value));
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getUnlockableAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));

        await increaseTime(7_776_000); // 3 months in seconds
        await mineBlocks(1);
        await erc1155BridgeTowerProxy
          .connect(alice)
          .unlock(bob.address, tokenID1);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(prevBobLockedBalance.add(rightOrder.takeAsset.value));
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getUnlockableAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
      });

      it("should unlock proper amount of tokens", async () => {
        await increaseTime(7_776_000); // 3 months in seconds
        await mineBlocks(1);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getUnlockableAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(5));

        await erc1155BridgeTowerProxy
          .connect(alice)
          .unlock(bob.address, tokenID1);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getUnlockableAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
      });
    });

    describe("getLockedAmount", () => {
      it("should return proper locked amount - 1", async () => {
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(alice.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
      });

      it("should return proper locked amount - 2", async () => {
        const leftOrder: Order = getLeftOrder(
          alice.address,
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1),
          encodeAssetData(erc20Mock.address)
        );
        const rightOrder: Order = getRightOrder(
          bob.address,
          encodeAssetData(erc20Mock.address),
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1)
        );
        const prevBobLockedBalance: BigNumber = await erc1155BridgeTowerProxy
          .connect(bob)
          .getLockedAmount(bob.address, tokenID1);

        leftOrder.salt = BigNumber.from(5);
        rightOrder.salt = BigNumber.from(5);
        leftOrder.makeAsset.value = BigNumber.from(5);
        rightOrder.takeAsset.value = BigNumber.from(5);

        await erc20Mock
          .connect(bob)
          .approve(erc20TransferProxy.address, BigNumber.from(206)); // 200 + 3% protocol fee from a maker
        await expect(
          exchangeV2Proxy
            .connect(bob)
            .matchOrders(
              leftOrder,
              sign(leftOrder, alice, exchangeV2Proxy.address),
              rightOrder,
              sign(rightOrder, bob, exchangeV2Proxy.address)
            )
        )
          .to.emit(erc1155BridgeTowerProxy, "Locked")
          .withArgs(bob.address, tokenID1, rightOrder.takeAsset.value);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(alice.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(prevBobLockedBalance.add(rightOrder.takeAsset.value));
      });

      it("should return proper locked amount - 3", async () => {
        const leftOrder: Order = getLeftOrder(
          alice.address,
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1),
          encodeAssetData(erc20Mock.address)
        );
        const rightOrder: Order = getRightOrder(
          bob.address,
          encodeAssetData(erc20Mock.address),
          encodeAssetData(erc1155BridgeTowerProxy.address, tokenID1)
        );
        const prevBobLockedBalance: BigNumber = await erc1155BridgeTowerProxy
          .connect(bob)
          .getLockedAmount(bob.address, tokenID1);

        leftOrder.salt = BigNumber.from(6);
        rightOrder.salt = BigNumber.from(6);
        leftOrder.makeAsset.value = BigNumber.from(5);
        rightOrder.takeAsset.value = BigNumber.from(5);

        await increaseTime(2_592_000); // 1 months in seconds
        await mineBlocks(1);
        await erc20Mock
          .connect(bob)
          .approve(erc20TransferProxy.address, BigNumber.from(206)); // 200 + 3% protocol fee from a maker
        await expect(
          exchangeV2Proxy
            .connect(bob)
            .matchOrders(
              leftOrder,
              sign(leftOrder, alice, exchangeV2Proxy.address),
              rightOrder,
              sign(rightOrder, bob, exchangeV2Proxy.address)
            )
        )
          .to.emit(erc1155BridgeTowerProxy, "Locked")
          .withArgs(bob.address, tokenID1, rightOrder.takeAsset.value);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(alice.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getLockedAmount(bob.address, tokenID1)
        ).to.be.equal(prevBobLockedBalance.add(rightOrder.takeAsset.value));
      });
    });

    describe("getUnlockableAmount", () => {
      it("should return proper unlockable amount - 1", async () => {
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getUnlockableAmount(alice.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getUnlockableAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
      });

      it("should return proper unlockable amount - 2", async () => {
        await increaseTime(12_960_000); // 5 months in seconds
        await mineBlocks(1);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getUnlockableAmount(alice.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getUnlockableAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(5));
      });

      it("should return proper unlockable amount - 3", async () => {
        await increaseTime(2_592_000); // 1 months in seconds
        await mineBlocks(1);

        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getUnlockableAmount(alice.address, tokenID1)
        ).to.be.equal(BigNumber.from(0));
        expect(
          await erc1155BridgeTowerProxy
            .connect(bob)
            .getUnlockableAmount(bob.address, tokenID1)
        ).to.be.equal(BigNumber.from(10));
      });
    });

    describe("getLocksInfo", () => {
      it("should return proper locks info", async () => {
        const locksInfo: any = await erc1155BridgeTowerProxy
          .connect(bob)
          .getLocksInfo(bob.address, tokenID1);

        expect(locksInfo[0]).to.be.equal(BigNumber.from(4));
        expect(locksInfo[1].length).to.be.equal(6);
        expect(locksInfo[1][4].amount).to.be.equal(BigNumber.from(5));
        expect(locksInfo[1][5].amount).to.be.equal(BigNumber.from(5));
      });
    });

    describe("updateAccount", () => {
      it("should fail if not a whitelisted wallet is trying to update the account", async () => {
        const id: BigNumber = tokenID1;
        const from: string = alice.address;
        const to: string = bob.address;

        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).updateAccount(id, from, to)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should update the account by a whitelisted user", async () => {
        const id: BigNumber = tokenID1;
        const from: string = bob.address;
        const to: string = alice.address;

        expect(
          (
            await erc1155BridgeTowerProxy
              .connect(bob)
              .getBridgeTowerRoyalties(id)
          )[0][0]
        ).to.be.equal(from);

        await erc1155BridgeTowerProxy.connect(bob).updateAccount(id, from, to);

        expect(
          (
            await erc1155BridgeTowerProxy
              .connect(bob)
              .getBridgeTowerRoyalties(id)
          )[0][0]
        ).to.be.equal(to);
      });
    });

    describe("setBaseURI", () => {
      it("should fail if not a whitelisted owner is trying to set a new base URI", async () => {
        await expect(
          erc1155BridgeTowerProxy.connect(alice).setBaseURI("")
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should set a new base URI by a whitelisted owner", async () => {
        const newBaseURI: string = "New base URI";

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await erc1155BridgeTowerProxy.connect(alice).setBaseURI(newBaseURI);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).baseURI()
        ).to.be.equal(newBaseURI);
      });
    });

    describe("setApprovalForAll", () => {
      it("should fail if not a whitelisted user is trying to set approval for all", async () => {
        await expect(
          erc1155BridgeTowerProxy
            .connect(carol)
            .setApprovalForAll(alice.address, true)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should set approval for all by a whitelisted user", async () => {
        await erc1155BridgeTowerProxy
          .connect(alice)
          .setApprovalForAll(bob.address, false);

        expect(
          await erc1155BridgeTowerProxy
            .connect(alice)
            .isApprovedForAll(alice.address, bob.address)
        ).to.be.equal(false);
      });
    });

    describe("addMinter", () => {
      it("should fail if not a whitelisted owner is trying to add a new minter", async () => {
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).addMinter(bob.address)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should add a new minter by a whitelisted owner", async () => {
        expect(
          await erc1155BridgeTowerProxy.connect(alice).isMinter(bob.address)
        ).to.be.equal(false);

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await erc1155BridgeTowerProxy.connect(alice).addMinter(bob.address);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).isMinter(bob.address)
        ).to.be.equal(true);
      });
    });

    describe("removeMinter", () => {
      it("should fail if not a whitelisted owner is trying to remove a minter", async () => {
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).removeMinter(bob.address)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should remove a minter by a whitelisted owner", async () => {
        expect(
          await erc1155BridgeTowerProxy.connect(alice).isMinter(bob.address)
        ).to.be.equal(true);

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await erc1155BridgeTowerProxy.connect(alice).removeMinter(bob.address);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).isMinter(bob.address)
        ).to.be.equal(false);
      });
    });

    describe("addPartner", () => {
      it("should fail if not a whitelisted owner is trying to add a new partner", async () => {
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).addPartner(carol.address)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should add a new partner by a whitelisted owner", async () => {
        expect(
          await erc1155BridgeTowerProxy.connect(alice).isPartner(carol.address)
        ).to.be.equal(false);

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await erc1155BridgeTowerProxy.connect(alice).addPartner(carol.address);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).isPartner(carol.address)
        ).to.be.equal(true);
      });
    });

    describe("removePartner", () => {
      it("should fail if not a whitelisted owner is trying to remove a partner", async () => {
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).removePartner(carol.address)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should remove a partner by a whitelisted owner", async () => {
        expect(
          await erc1155BridgeTowerProxy.connect(alice).isPartner(carol.address)
        ).to.be.equal(true);

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await erc1155BridgeTowerProxy
          .connect(alice)
          .removePartner(carol.address);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).isPartner(carol.address)
        ).to.be.equal(false);
      });
    });

    describe("transferOwnership", () => {
      it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy.connect(alice).transferOwnership(bob.address)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await expect(
          erc1155BridgeTowerProxy
            .connect(alice)
            .transferOwnership(carol.address)
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should transfer ownership", async () => {
        expect(
          await erc1155BridgeTowerProxy.connect(alice).owner()
        ).to.be.equal(alice.address);

        await erc1155BridgeTowerProxy
          .connect(alice)
          .transferOwnership(bob.address);

        expect(
          await erc1155BridgeTowerProxy.connect(alice).owner()
        ).to.be.equal(bob.address);
      });
    });

    describe("renounceOwnership", () => {
      it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
        await securitizeRegistry.connect(alice).removeWallet(bob.address);
        await expect(
          erc1155BridgeTowerProxy.connect(bob).renounceOwnership()
        ).to.be.revertedWith("Whitelistable: address is not whitelisted");
      });

      it("should renounce ownership by a whitelisted owner", async () => {
        expect(await erc1155BridgeTowerProxy.connect(bob).owner()).to.be.equal(
          bob.address
        );

        await securitizeRegistry.connect(alice).addWallet(bob.address);
        await erc1155BridgeTowerProxy.connect(bob).renounceOwnership();

        expect(await erc1155BridgeTowerProxy.connect(bob).owner()).to.be.equal(
          constants.ZERO_ADDRESS
        );
      });
    });
  });
});
