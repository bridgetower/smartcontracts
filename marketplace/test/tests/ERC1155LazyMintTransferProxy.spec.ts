/* eslint-disable node/no-missing-import */

import { bytes4, generateTokenID, keccak256Hash } from "../utils/helpers";
import { Asset, MintERC1155Data } from "../utils/types";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract, BigNumber } from "ethers";

import { AbiCoder } from "ethers/lib/utils";

import { solidity } from "ethereum-waffle";

import { ethers, upgrades } from "hardhat";

import chai, { expect } from "chai";

const { constants } = require("@openzeppelin/test-helpers");

chai.use(solidity);

describe("ERC1155LazyMintTransferProxy", () => {
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

  let erc1155LazyMintTransferProxy: Contract;
  let erc1155BridgeTowerProxy: Contract;
  let securitizeRegistryProxy: Contract;
  let contractsRegistryProxy: Contract;
  let securitizeRegistry: Contract;
  let contractsRegistry: Contract;
  let transferProxy: Contract;

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
  });

  describe("__OperatorRole_init", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        erc1155LazyMintTransferProxy.connect(alice).__OperatorRole_init()
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("addOperator", () => {
    it("should fail if not whitelisted wallet is trying to add an operator", async () => {
      await expect(
        erc1155LazyMintTransferProxy.connect(alice).addOperator(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should add an operator", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await erc1155LazyMintTransferProxy
        .connect(alice)
        .addOperator(bob.address);
    });
  });

  describe("removeOperator", () => {
    it("should fail if not whitelisted wallet is trying to remove an operator", async () => {
      await expect(
        erc1155LazyMintTransferProxy.connect(bob).removeOperator(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should remove an operator", async () => {
      await erc1155LazyMintTransferProxy
        .connect(alice)
        .removeOperator(bob.address);
    });
  });

  describe("transfer", () => {
    it("should fail if not whitelisted wallet is trying to transfer", async () => {
      const asset: Asset = {
        assetType: {
          assetClass: bytes4(keccak256Hash("ERC1155")),
          data: constants.ZERO_ADDRESS,
        },
        value: BigNumber.from(100),
      };

      await erc1155LazyMintTransferProxy
        .connect(alice)
        .addOperator(bob.address);
      await expect(
        erc1155LazyMintTransferProxy
          .connect(bob)
          .transfer(asset, alice.address, bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if FROM is not a whitelisted wallet", async () => {
      const asset: Asset = {
        assetType: {
          assetClass: bytes4(keccak256Hash("ERC1155")),
          data: constants.ZERO_ADDRESS,
        },
        value: BigNumber.from(100),
      };

      await erc1155LazyMintTransferProxy
        .connect(alice)
        .addOperator(alice.address);
      await expect(
        erc1155LazyMintTransferProxy
          .connect(alice)
          .transfer(asset, bob.address, alice.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if TO is not a whitelisted wallet", async () => {
      const asset: Asset = {
        assetType: {
          assetClass: bytes4(keccak256Hash("ERC1155")),
          data: constants.ZERO_ADDRESS,
        },
        value: BigNumber.from(100),
      };

      await expect(
        erc1155LazyMintTransferProxy
          .connect(alice)
          .transfer(asset, alice.address, bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should transfer token by a whitelisted operator", async () => {
      const abiCoder: AbiCoder = new ethers.utils.AbiCoder();
      const tokenId: BigNumber = generateTokenID(alice.address);
      const amount: BigNumber = BigNumber.from(500);
      const mint1155Data: MintERC1155Data = {
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
      const asset: Asset = {
        assetType: {
          assetClass: bytes4(keccak256Hash("ERC1155")),
          data: abiCoder.encode(
            [
              "address",
              "tupple(uint256, string, uint256, tupple(address, uint96)[], tupple(address, uint96)[], bytes[])",
            ],
            [
              erc1155BridgeTowerProxy.address,
              [
                mint1155Data.tokenId.toString(),
                mint1155Data.tokenURI,
                mint1155Data.supply.toString(),
                [
                  [
                    mint1155Data.creators[0].account,
                    mint1155Data.creators[0].value.toString(),
                  ],
                ],
                [
                  [
                    mint1155Data.royalties[0].account,
                    mint1155Data.royalties[0].value.toString(),
                  ],
                ],
                [mint1155Data.signatures[0]],
              ],
            ]
          ),
        },
        value: BigNumber.from(100),
      };

      await erc1155BridgeTowerProxy
        .connect(alice)
        .mintAndTransfer(mint1155Data, alice.address, amount);

      expect(
        await erc1155BridgeTowerProxy
          .connect(alice)
          .balanceOf(alice.address, tokenId)
      ).to.be.equal(amount);

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await contractsRegistry
        .connect(alice)
        .addContract(erc1155LazyMintTransferProxy.address);
      await erc1155LazyMintTransferProxy
        .connect(alice)
        .transfer(asset, alice.address, bob.address);

      expect(
        await erc1155BridgeTowerProxy
          .connect(alice)
          .balanceOf(alice.address, tokenId)
      ).to.be.equal(amount.sub(asset.value));
      expect(
        await erc1155BridgeTowerProxy
          .connect(alice)
          .balanceOf(bob.address, tokenId)
      ).to.be.equal(asset.value);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        erc1155LazyMintTransferProxy
          .connect(alice)
          .transferOwnership(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        erc1155LazyMintTransferProxy
          .connect(alice)
          .transferOwnership(carol.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should transfer ownership", async () => {
      expect(
        await erc1155LazyMintTransferProxy.connect(alice).owner()
      ).to.be.equal(alice.address);

      await erc1155LazyMintTransferProxy
        .connect(alice)
        .transferOwnership(bob.address);

      expect(
        await erc1155LazyMintTransferProxy.connect(alice).owner()
      ).to.be.equal(bob.address);
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        erc1155LazyMintTransferProxy.connect(bob).renounceOwnership()
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(
        await erc1155LazyMintTransferProxy.connect(bob).owner()
      ).to.be.equal(bob.address);

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await erc1155LazyMintTransferProxy.connect(bob).renounceOwnership();

      expect(
        await erc1155LazyMintTransferProxy.connect(bob).owner()
      ).to.be.equal(constants.ZERO_ADDRESS);
    });
  });
});
