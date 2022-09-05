/* eslint-disable node/no-missing-import */

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract } from "ethers";

import { solidity } from "ethereum-waffle";

import chai, { expect } from "chai";

import { ethers } from "hardhat";

const { constants } = require("@openzeppelin/test-helpers");

chai.use(solidity);

describe("ERC1155BridgeTowerBeacon", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  let ERC1155BridgeTowerBeacon: ContractFactory;
  let SecuritizeRegistryProxy: ContractFactory;
  let ContractsRegistryProxy: ContractFactory;
  let ERC1155BridgeTower: ContractFactory;
  let SecuritizeRegistry: ContractFactory;
  let ContractsRegistry: ContractFactory;

  let erc1155BridgeTowerBeacon: Contract;
  let erc1155BridgeTowerProxy: Contract;
  let securitizeRegistryProxy: Contract;
  let contractsRegistryProxy: Contract;
  let securitizeRegistry: Contract;
  let contractsRegistry: Contract;

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

    await securitizeRegistry.addWallet(alice.address);

    await contractsRegistry.addContract(securitizeRegistry.address);
    await contractsRegistry.addContract(securitizeRegistryProxy.address);
    await contractsRegistry.addContract(contractsRegistry.address);
    await contractsRegistry.addContract(contractsRegistryProxy.address);
    await contractsRegistry.addContract(erc1155BridgeTowerProxy.address);
    await contractsRegistry.addContract(erc1155BridgeTowerBeacon.address);
  });

  describe("constructor", () => {
    it("should deploy a new beacon properly", async () => {
      const beacon: Contract = await ERC1155BridgeTowerBeacon.deploy(
        erc1155BridgeTowerProxy.address,
        securitizeRegistryProxy.address,
        contractsRegistryProxy.address
      );

      expect(await beacon.connect(alice).implementation()).to.be.equal(
        erc1155BridgeTowerProxy.address
      );
      expect(await beacon.connect(alice).securitizeRegistryProxy()).to.be.equal(
        securitizeRegistryProxy.address
      );
      expect(await beacon.connect(alice).contractsRegistryProxy()).to.be.equal(
        contractsRegistryProxy.address
      );
    });
  });

  describe("upgradeTo", () => {
    it("should fail if not a whitelisted owner is trying to upgrade an implementation address", async () => {
      await expect(
        erc1155BridgeTowerBeacon.connect(bob).upgradeTo(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if not an owner is trying to upgrade an implementation address", async () => {
      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await expect(
        erc1155BridgeTowerBeacon.connect(bob).upgradeTo(bob.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should upgrade to a new implementation properly", async () => {
      await expect(
        erc1155BridgeTowerBeacon
          .connect(alice)
          .upgradeTo(securitizeRegistry.address)
      )
        .to.emit(erc1155BridgeTowerBeacon, "Upgraded")
        .withArgs(securitizeRegistry.address);

      expect(
        await erc1155BridgeTowerBeacon.connect(alice).implementation()
      ).to.be.equal(securitizeRegistry.address);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        erc1155BridgeTowerBeacon.connect(alice).transferOwnership(bob.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        erc1155BridgeTowerBeacon.connect(alice).transferOwnership(carol.address)
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should transfer ownership", async () => {
      expect(await erc1155BridgeTowerBeacon.connect(alice).owner()).to.be.equal(
        alice.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await erc1155BridgeTowerBeacon
        .connect(alice)
        .transferOwnership(bob.address);

      expect(await erc1155BridgeTowerBeacon.connect(alice).owner()).to.be.equal(
        bob.address
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        erc1155BridgeTowerBeacon.connect(bob).renounceOwnership()
      ).to.be.revertedWith("Whitelistable: address is not whitelisted");
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(await erc1155BridgeTowerBeacon.connect(bob).owner()).to.be.equal(
        bob.address
      );

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await erc1155BridgeTowerBeacon.connect(bob).renounceOwnership();

      expect(await erc1155BridgeTowerBeacon.connect(bob).owner()).to.be.equal(
        constants.ZERO_ADDRESS
      );
    });
  });
});
