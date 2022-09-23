/* eslint-disable node/no-missing-import */

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract, BigNumber } from "ethers";

import { ethers } from "hardhat";

import { expect } from "chai";

const { constants } = require("@openzeppelin/test-helpers");

describe("ERC1155BridgeTowerFactoryC2", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  let ERC1155LazyMintTransferProxy: ContractFactory;
  let ERC1155BridgeTowerFactoryC2: ContractFactory;
  let ERC1155BridgeTowerBeacon: ContractFactory;
  let SecuritizeRegistryProxy: ContractFactory;
  let ContractsRegistryProxy: ContractFactory;
  let ERC1155BridgeTower: ContractFactory;
  let SecuritizeRegistry: ContractFactory;
  let ContractsRegistry: ContractFactory;
  let TransferProxy: ContractFactory;

  let erc1155LazyMintTransferProxy: Contract;
  let erc1155BridgeTowerFactoryC2: Contract;
  let erc1155BridgeTowerBeacon: Contract;
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
    erc1155BridgeTowerProxy = await ERC1155BridgeTower.deploy();

    ERC1155BridgeTowerBeacon = await ethers.getContractFactory(
      "ERC1155BridgeTowerBeacon"
    );
    erc1155BridgeTowerBeacon = await ERC1155BridgeTowerBeacon.deploy(
      erc1155BridgeTowerProxy.address,
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address
    );

    ERC1155BridgeTowerFactoryC2 = await ethers.getContractFactory(
      "ERC1155BridgeTowerFactoryC2"
    );
    erc1155BridgeTowerFactoryC2 = await ERC1155BridgeTowerFactoryC2.deploy(
      erc1155BridgeTowerBeacon.address,
      transferProxy.address,
      erc1155LazyMintTransferProxy.address,
      securitizeRegistryProxy.address,
      contractsRegistryProxy.address
    );

    await securitizeRegistry.addWallet(alice.address);

    await contractsRegistry.addContract(securitizeRegistry.address);
    await contractsRegistry.addContract(securitizeRegistryProxy.address);
    await contractsRegistry.addContract(contractsRegistry.address);
    await contractsRegistry.addContract(contractsRegistryProxy.address);
    await contractsRegistry.addContract(transferProxy.address);
    await contractsRegistry.addContract(erc1155LazyMintTransferProxy.address);
    await contractsRegistry.addContract(erc1155BridgeTowerProxy.address);
    await contractsRegistry.addContract(erc1155BridgeTowerBeacon.address);
    await contractsRegistry.addContract(erc1155BridgeTowerFactoryC2.address);

    await contractsRegistry.setERC1155BridgeTowerFactoryC2(
      erc1155BridgeTowerFactoryC2.address
    );
  });

  describe("PartnerAccessControl", () => {
    describe("addPartner", () => {
      it("should fail if not a whitelisted wallet is trying to add a new partner", async () => {
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerFactoryC2.connect(alice).addPartner(alice.address)
        )
          .to.be.revertedWithCustomError(
            erc1155BridgeTowerFactoryC2,
            "NotWhitelisted"
          )
          .withArgs(alice.address);
      });

      it("should fail if not an owner is trying to add a new partner", async () => {
        await securitizeRegistry.connect(alice).addWallet(bob.address);
        await expect(
          erc1155BridgeTowerFactoryC2.connect(bob).addPartner(bob.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should add a new partner by a whitelisted owner", async () => {
        expect(
          await erc1155BridgeTowerFactoryC2
            .connect(alice)
            .isPartner(bob.address)
        ).to.be.equal(false);

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await expect(
          erc1155BridgeTowerFactoryC2.connect(alice).addPartner(bob.address)
        )
          .to.emit(erc1155BridgeTowerFactoryC2, "PartnerStatusChanged")
          .withArgs(bob.address, true);

        expect(
          await erc1155BridgeTowerFactoryC2
            .connect(alice)
            .isPartner(bob.address)
        ).to.be.equal(true);
      });
    });

    describe("isPartner", () => {
      it("should return true", async () => {
        expect(
          await erc1155BridgeTowerFactoryC2
            .connect(alice)
            .isPartner(bob.address)
        ).to.be.equal(true);
      });

      it("should return false", async () => {
        expect(
          await erc1155BridgeTowerFactoryC2
            .connect(alice)
            .isPartner(alice.address)
        ).to.be.equal(false);
      });
    });

    describe("removePartner", () => {
      it("should fail if not a whitelisted wallet is trying to remove a partner", async () => {
        await securitizeRegistry.connect(alice).removeWallet(alice.address);
        await expect(
          erc1155BridgeTowerFactoryC2
            .connect(alice)
            .removePartner(alice.address)
        )
          .to.be.revertedWithCustomError(
            erc1155BridgeTowerFactoryC2,
            "NotWhitelisted"
          )
          .withArgs(alice.address);
      });

      it("should fail if not an owner is trying to remove a partner", async () => {
        await expect(
          erc1155BridgeTowerFactoryC2.connect(bob).removePartner(bob.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should remove a partner by a whitelisted owner", async () => {
        expect(
          await erc1155BridgeTowerFactoryC2
            .connect(alice)
            .isPartner(bob.address)
        ).to.be.equal(true);

        await securitizeRegistry.connect(alice).addWallet(alice.address);
        await expect(
          erc1155BridgeTowerFactoryC2.connect(alice).removePartner(bob.address)
        )
          .to.emit(erc1155BridgeTowerFactoryC2, "PartnerStatusChanged")
          .withArgs(bob.address, false);

        expect(
          await erc1155BridgeTowerFactoryC2
            .connect(alice)
            .isPartner(bob.address)
        ).to.be.equal(false);
      });
    });
  });

  describe("constructor", () => {
    it("should deploy a new factory properly", async () => {
      const factory: Contract = await ERC1155BridgeTowerFactoryC2.deploy(
        erc1155BridgeTowerBeacon.address,
        transferProxy.address,
        erc1155LazyMintTransferProxy.address,
        securitizeRegistryProxy.address,
        contractsRegistryProxy.address
      );

      expect(await factory.connect(alice).beacon()).to.be.equal(
        erc1155BridgeTowerBeacon.address
      );
      expect(
        await factory.connect(alice).securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
      expect(await factory.connect(alice).contractsRegistryProxy()).to.be.equal(
        contractsRegistryProxy.address
      );
    });
  });

  describe("addPartner", () => {
    it("should fail if not a whitelisted owner is trying to add a new partner", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        erc1155BridgeTowerFactoryC2.connect(alice).addPartner(carol.address)
      )
        .to.be.revertedWithCustomError(
          erc1155BridgeTowerFactoryC2,
          "NotWhitelisted"
        )
        .withArgs(alice.address);
    });

    it("should add a new partner by a whitelisted owner", async () => {
      expect(
        await erc1155BridgeTowerFactoryC2
          .connect(alice)
          .isPartner(carol.address)
      ).to.be.equal(false);

      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await erc1155BridgeTowerFactoryC2
        .connect(alice)
        .addPartner(carol.address);

      expect(
        await erc1155BridgeTowerFactoryC2
          .connect(alice)
          .isPartner(carol.address)
      ).to.be.equal(true);
    });
  });

  describe("removePartner", () => {
    it("should fail if not a whitelisted owner is trying to remove a partner", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        erc1155BridgeTowerFactoryC2.connect(alice).removePartner(carol.address)
      )
        .to.be.revertedWithCustomError(
          erc1155BridgeTowerFactoryC2,
          "NotWhitelisted"
        )
        .withArgs(alice.address);
    });

    it("should remove a partner by a whitelisted owner", async () => {
      expect(
        await erc1155BridgeTowerFactoryC2
          .connect(alice)
          .isPartner(carol.address)
      ).to.be.equal(true);

      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await erc1155BridgeTowerFactoryC2
        .connect(alice)
        .removePartner(carol.address);

      expect(
        await erc1155BridgeTowerFactoryC2
          .connect(alice)
          .isPartner(carol.address)
      ).to.be.equal(false);
    });
  });

  describe("createToken", () => {
    it("should fail if not a partner is trying to create a new token", async () => {
      const name: string = "Test Token";
      const symbol: string = "TT";
      const baseURI: string = "";
      const contractURI: string = "";
      const lockPeriod: BigNumber = BigNumber.from(0);
      const salt: number = await alice.getTransactionCount();

      await expect(
        erc1155BridgeTowerFactoryC2
          .connect(alice)
          .functions[
            "createToken(string,string,string,string,uint256,uint256)"
          ](name, symbol, baseURI, contractURI, lockPeriod, salt)
      ).to.be.revertedWith("PartnerAccessControl: caller is not a partner");
    });

    it("should fail if not a whitelisted partner is trying to create a new token", async () => {
      const name: string = "Test Token";
      const symbol: string = "TT";
      const baseURI: string = "";
      const contractURI: string = "";
      const lockPeriod: BigNumber = BigNumber.from(0);
      const salt: number = await alice.getTransactionCount();

      await erc1155BridgeTowerFactoryC2
        .connect(alice)
        .addPartner(alice.address);
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        erc1155BridgeTowerFactoryC2
          .connect(alice)
          .functions[
            "createToken(string,string,string,string,uint256,uint256)"
          ](name, symbol, baseURI, contractURI, lockPeriod, salt)
      )
        .to.be.revertedWithCustomError(
          erc1155BridgeTowerFactoryC2,
          "NotWhitelisted"
        )
        .withArgs(alice.address);
    });

    it("should create a new token by a whitelisted partner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);

      const name: string = "Test Token";
      const symbol: string = "TT";
      const baseURI: string = "";
      const contractURI: string = "";
      const lockPeriod: BigNumber = BigNumber.from(0);
      const salt: number = await alice.getTransactionCount();
      const fututreTokenAddress: string = (
        await erc1155BridgeTowerFactoryC2
          .connect(alice)
          .functions["getAddress(string,string,string,string,uint256,uint256)"](
            name,
            symbol,
            baseURI,
            contractURI,
            lockPeriod,
            salt
          )
      )[0];

      await expect(
        erc1155BridgeTowerFactoryC2
          .connect(alice)
          .functions[
            "createToken(string,string,string,string,uint256,uint256)"
          ](name, symbol, baseURI, contractURI, lockPeriod, salt)
      )
        .to.emit(erc1155BridgeTowerFactoryC2, "CreateERC1155BridgeTowerProxy")
        .withArgs(alice.address, fututreTokenAddress);

      const erc1155BridgeTowerProxy: Contract =
        ERC1155BridgeTower.attach(fututreTokenAddress);

      expect(await erc1155BridgeTowerProxy.connect(alice).owner()).to.be.equal(
        alice.address
      );
      expect(
        await contractsRegistry
          .connect(alice)
          .isWhitelisted(erc1155BridgeTowerProxy.address)
      ).to.be.equal(true);
    });
  });

  describe("createToken", () => {
    it("should fail if not a partner is trying to create a new token", async () => {
      const name: string = "Test Token";
      const symbol: string = "TT";
      const baseURI: string = "";
      const contractURI: string = "";
      const operators: string[] = [];
      const lockPeriod: BigNumber = BigNumber.from(0);
      const salt: number = await alice.getTransactionCount();

      await erc1155BridgeTowerFactoryC2
        .connect(alice)
        .removePartner(alice.address);
      await expect(
        erc1155BridgeTowerFactoryC2
          .connect(alice)
          .functions[
            "createToken(string,string,string,string,address[],uint256,uint256)"
          ](name, symbol, baseURI, contractURI, operators, lockPeriod, salt)
      ).to.be.revertedWith("PartnerAccessControl: caller is not a partner");
    });

    it("should fail if not a whitelisted partner is trying to create a new token", async () => {
      const name: string = "Test Token";
      const symbol: string = "TT";
      const baseURI: string = "";
      const contractURI: string = "";
      const operators: string[] = [];
      const lockPeriod: BigNumber = BigNumber.from(0);
      const salt: number = await alice.getTransactionCount();

      await erc1155BridgeTowerFactoryC2
        .connect(alice)
        .addPartner(alice.address);
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        erc1155BridgeTowerFactoryC2
          .connect(alice)
          .functions[
            "createToken(string,string,string,string,address[],uint256,uint256)"
          ](name, symbol, baseURI, contractURI, operators, lockPeriod, salt)
      )
        .to.be.revertedWithCustomError(
          erc1155BridgeTowerFactoryC2,
          "NotWhitelisted"
        )
        .withArgs(alice.address);
    });

    it("should create a new token by a whitelisted partner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);

      const name: string = "Test Token";
      const symbol: string = "TT";
      const baseURI: string = "";
      const contractURI: string = "";
      const operators: string[] = [];
      const lockPeriod: BigNumber = BigNumber.from(0);
      const salt: number = await alice.getTransactionCount();
      const fututreTokenAddress: string = (
        await erc1155BridgeTowerFactoryC2
          .connect(alice)
          .functions[
            "getAddress(string,string,string,string,address[],uint256,uint256)"
          ](name, symbol, baseURI, contractURI, operators, lockPeriod, salt)
      )[0];

      await expect(
        erc1155BridgeTowerFactoryC2
          .connect(alice)
          .functions[
            "createToken(string,string,string,string,address[],uint256,uint256)"
          ](name, symbol, baseURI, contractURI, operators, lockPeriod, salt)
      )
        .to.emit(
          erc1155BridgeTowerFactoryC2,
          "CreateERC1155BridgeTowerUserProxy"
        )
        .withArgs(alice.address, fututreTokenAddress);

      const erc1155BridgeTowerProxy: Contract =
        ERC1155BridgeTower.attach(fututreTokenAddress);

      expect(await erc1155BridgeTowerProxy.connect(alice).owner()).to.be.equal(
        alice.address
      );
      expect(
        await contractsRegistry
          .connect(alice)
          .isWhitelisted(erc1155BridgeTowerProxy.address)
      ).to.be.equal(true);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        erc1155BridgeTowerFactoryC2
          .connect(alice)
          .transferOwnership(bob.address)
      )
        .to.be.revertedWithCustomError(
          erc1155BridgeTowerFactoryC2,
          "NotWhitelisted"
        )
        .withArgs(alice.address);
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        erc1155BridgeTowerFactoryC2
          .connect(alice)
          .transferOwnership(carol.address)
      )
        .to.be.revertedWithCustomError(
          erc1155BridgeTowerFactoryC2,
          "NotWhitelisted"
        )
        .withArgs(carol.address);
    });

    it("should transfer ownership", async () => {
      expect(
        await erc1155BridgeTowerFactoryC2.connect(alice).owner()
      ).to.be.equal(alice.address);

      await erc1155BridgeTowerFactoryC2
        .connect(alice)
        .transferOwnership(bob.address);

      expect(
        await erc1155BridgeTowerFactoryC2.connect(alice).owner()
      ).to.be.equal(bob.address);
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(erc1155BridgeTowerFactoryC2.connect(bob).renounceOwnership())
        .to.be.revertedWithCustomError(
          erc1155BridgeTowerFactoryC2,
          "NotWhitelisted"
        )
        .withArgs(bob.address);
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(
        await erc1155BridgeTowerFactoryC2.connect(bob).owner()
      ).to.be.equal(bob.address);

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await erc1155BridgeTowerFactoryC2.connect(bob).renounceOwnership();

      expect(
        await erc1155BridgeTowerFactoryC2.connect(bob).owner()
      ).to.be.equal(constants.ZERO_ADDRESS);
    });
  });
});
