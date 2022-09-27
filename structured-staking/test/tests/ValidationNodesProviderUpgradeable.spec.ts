import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, Contract, BigNumber } from "ethers";

import { ethers, upgrades } from "hardhat";

import { expect } from "chai";

const { constants } = require("@openzeppelin/test-helpers");

describe("ValidationNodesProviderUpgradeable", () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let ValidationNodesProviderProxy: ContractFactory;
  let SecuritizeRegistryProxy: ContractFactory;
  let ContractsRegistryProxy: ContractFactory;
  let SecuritizeRegistry: ContractFactory;
  let ContractsRegistry: ContractFactory;

  let validationNodesProviderProxy: Contract;
  let securitizeRegistryProxy: Contract;
  let contractsRegistryProxy: Contract;
  let securitizeRegistry: Contract;
  let contractsRegistry: Contract;

  before("setup", async () => {
    [alice, bob] = await ethers.getSigners();

    SecuritizeRegistry = await ethers.getContractFactory("SecuritizeRegistry");
    securitizeRegistry = await SecuritizeRegistry.deploy();

    await securitizeRegistry.deployed();

    SecuritizeRegistryProxy = await ethers.getContractFactory(
      "SecuritizeRegistryProxy"
    );
    securitizeRegistryProxy = await SecuritizeRegistryProxy.deploy(
      securitizeRegistry.address
    );

    await securitizeRegistryProxy.deployed();

    ContractsRegistry = await ethers.getContractFactory("ContractsRegistry");
    contractsRegistry = await ContractsRegistry.deploy(
      securitizeRegistryProxy.address
    );

    await contractsRegistry.deployed();

    ContractsRegistryProxy = await ethers.getContractFactory(
      "ContractsRegistryProxy"
    );
    contractsRegistryProxy = await ContractsRegistryProxy.deploy(
      securitizeRegistryProxy.address,
      contractsRegistry.address
    );

    await contractsRegistryProxy.deployed();

    ValidationNodesProviderProxy = await ethers.getContractFactory(
      "ValidationNodesProviderUpgradeable"
    );
    validationNodesProviderProxy = await upgrades.deployProxy(
      ValidationNodesProviderProxy,
      [securitizeRegistryProxy.address, contractsRegistryProxy.address, []],
      {
        initializer: "__ValidationNodesProvider_init",
      }
    );

    await validationNodesProviderProxy.deployed();

    await securitizeRegistry.addWallet(alice.address);

    await contractsRegistry.addContract(securitizeRegistry.address);
    await contractsRegistry.addContract(securitizeRegistryProxy.address);
    await contractsRegistry.addContract(contractsRegistry.address);
    await contractsRegistry.addContract(contractsRegistryProxy.address);
    await contractsRegistry.addContract(validationNodesProviderProxy.address);
  });

  describe("__ValidationNodesProvider_init", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        validationNodesProviderProxy
          .connect(alice)
          .__ValidationNodesProvider_init(
            securitizeRegistryProxy.address,
            contractsRegistryProxy.address,
            []
          )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("__ValidationNodesProvider_init_unchained", () => {
    it("should fail if a contract is already initialized", async () => {
      await expect(
        validationNodesProviderProxy
          .connect(alice)
          .__ValidationNodesProvider_init_unchained([])
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("setValidationNodes", () => {
    it("should fail if not an owner is trying to set a list of validation nodes", async () => {
      await expect(
        validationNodesProviderProxy.connect(bob).setValidationNodes([])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to set a list of validation nodes", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        validationNodesProviderProxy.connect(alice).setValidationNodes([])
      )
        .to.be.revertedWithCustomError(
          validationNodesProviderProxy,
          "NotWhitelisted"
        )
        .withArgs(alice.address);
    });

    it("should set a new list of validation nodes by a whitelisted owner", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);

      const validationNodes: string[] = ["node1", "node2", "node3"];

      await validationNodesProviderProxy
        .connect(alice)
        .setValidationNodes(validationNodes);

      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .getPoRAddressListLength()
      ).to.be.equal(validationNodes.length);
      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .getPoRAddressList(
            BigNumber.from(0),
            BigNumber.from(validationNodes.length - 1)
          )
      ).to.eql(validationNodes);
    });
  });

  describe("getPoRAddressListLength", () => {
    it("should return proper PoR address list length", async () => {
      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .getPoRAddressListLength()
      ).to.be.equal(BigNumber.from(3));
    });
  });

  describe("getPoRAddressList", () => {
    it("should return proper PoR address list - 1", async () => {
      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .getPoRAddressList(BigNumber.from(0), BigNumber.from(0))
      ).to.eql(["node1"]);
    });

    it("should return proper PoR address list - 2", async () => {
      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .getPoRAddressList(BigNumber.from(0), BigNumber.from(1))
      ).to.eql(["node1", "node2"]);
    });

    it("should return proper PoR address list - 3", async () => {
      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .getPoRAddressList(BigNumber.from(1), BigNumber.from(2))
      ).to.eql(["node2", "node3"]);
    });

    it("should return proper PoR address list - 4", async () => {
      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .getPoRAddressList(BigNumber.from(2), BigNumber.from(2))
      ).to.eql(["node3"]);
    });

    it("should return proper PoR address list - 5", async () => {
      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .getPoRAddressList(BigNumber.from(0), BigNumber.from(10))
      ).to.eql(["node1", "node2", "node3"]);
    });

    it("should return proper PoR address list - 6", async () => {
      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .getPoRAddressList(BigNumber.from(10), BigNumber.from(0))
      ).to.eql([]);
    });
  });

  describe("securitizeRegistryProxy", () => {
    it("should return proper securitize registry proxy", async () => {
      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
    });
  });

  describe("contractsRegistryProxy", () => {
    it("should return proper contracts registry proxy", async () => {
      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);
    });
  });

  describe("setSecuritizeRegistryProxy", () => {
    it("should fail if not an owner is trying to set a new securitize registry proxy", async () => {
      await expect(
        validationNodesProviderProxy
          .connect(bob)
          .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to set a new securitize registry proxy", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        validationNodesProviderProxy
          .connect(alice)
          .setSecuritizeRegistryProxy(securitizeRegistryProxy.address)
      )
        .to.be.revertedWithCustomError(
          validationNodesProviderProxy,
          "NotWhitelisted"
        )
        .withArgs(alice.address);
    });

    it("should fail if a new securitize registry proxy is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        validationNodesProviderProxy
          .connect(alice)
          .setSecuritizeRegistryProxy(alice.address)
      ).to.be.revertedWith("Whitelistable: not contract address");
    });

    it("should set a new securitize registry proxy by a whitelisted owner", async () => {
      const newSecuritizeRegistryProxy: Contract =
        await SecuritizeRegistryProxy.deploy(securitizeRegistry.address);

      await newSecuritizeRegistryProxy.deployed();

      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);

      await validationNodesProviderProxy
        .connect(alice)
        .setSecuritizeRegistryProxy(newSecuritizeRegistryProxy.address);

      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .securitizeRegistryProxy()
      ).to.be.equal(newSecuritizeRegistryProxy.address);

      await validationNodesProviderProxy
        .connect(alice)
        .setSecuritizeRegistryProxy(securitizeRegistryProxy.address);

      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .securitizeRegistryProxy()
      ).to.be.equal(securitizeRegistryProxy.address);
    });
  });

  describe("setContractsRegistryProxy", () => {
    it("should fail if not an owner is trying to set a new contracts registry proxy", async () => {
      await expect(
        validationNodesProviderProxy
          .connect(bob)
          .setContractsRegistryProxy(contractsRegistryProxy.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should fail if not a whitelisted owner is trying to set a new contracts registry proxy", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        validationNodesProviderProxy
          .connect(alice)
          .setContractsRegistryProxy(contractsRegistryProxy.address)
      )
        .to.be.revertedWithCustomError(
          validationNodesProviderProxy,
          "NotWhitelisted"
        )
        .withArgs(alice.address);
    });

    it("should fail if a new contracts registry proxy is not a contract", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        validationNodesProviderProxy
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

      await newContractsRegistryProxy.deployed();

      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);

      await validationNodesProviderProxy
        .connect(alice)
        .setContractsRegistryProxy(newContractsRegistryProxy.address);

      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .contractsRegistryProxy()
      ).to.be.equal(newContractsRegistryProxy.address);

      await validationNodesProviderProxy
        .connect(alice)
        .setContractsRegistryProxy(contractsRegistryProxy.address);

      expect(
        await validationNodesProviderProxy
          .connect(alice)
          .contractsRegistryProxy()
      ).to.be.equal(contractsRegistryProxy.address);
    });
  });

  describe("onlyWhitelistedAddress", () => {
    it("should not revert - 1", async () => {
      await validationNodesProviderProxy
        .connect(alice)
        .onlyWhitelistedAddress(alice.address);
    });

    it("should not revert - 2", async () => {
      await validationNodesProviderProxy
        .connect(alice)
        .onlyWhitelistedAddress(validationNodesProviderProxy.address);
    });

    it("should revert - 1", async () => {
      await expect(
        validationNodesProviderProxy
          .connect(alice)
          .onlyWhitelistedAddress(bob.address)
      )
        .to.be.revertedWithCustomError(
          validationNodesProviderProxy,
          "NotWhitelisted"
        )
        .withArgs(bob.address);
    });

    it("should revert - 2", async () => {
      await contractsRegistry
        .connect(alice)
        .removeContract(validationNodesProviderProxy.address);
      await expect(
        validationNodesProviderProxy
          .connect(alice)
          .onlyWhitelistedAddress(bob.address)
      )
        .to.be.revertedWithCustomError(
          validationNodesProviderProxy,
          "NotWhitelisted"
        )
        .withArgs(bob.address);
      await contractsRegistry
        .connect(alice)
        .addContract(validationNodesProviderProxy.address);
    });
  });

  describe("transferOwnership", () => {
    it("should fail if not a whitelisted owner is trying to transfer ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(alice.address);
      await expect(
        validationNodesProviderProxy
          .connect(alice)
          .transferOwnership(bob.address)
      )
        .to.be.revertedWithCustomError(
          validationNodesProviderProxy,
          "NotWhitelisted"
        )
        .withArgs(alice.address);
    });

    it("should fail if a whitelisted owner is trying to transfer ownership to a non-whitelisted user", async () => {
      await securitizeRegistry.connect(alice).addWallet(alice.address);
      await expect(
        validationNodesProviderProxy
          .connect(alice)
          .transferOwnership(bob.address)
      )
        .to.be.revertedWithCustomError(
          validationNodesProviderProxy,
          "NotWhitelisted"
        )
        .withArgs(bob.address);
    });

    it("should transfer ownership", async () => {
      expect(
        await validationNodesProviderProxy.connect(alice).owner()
      ).to.be.equal(alice.address);

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await validationNodesProviderProxy
        .connect(alice)
        .transferOwnership(bob.address);

      expect(
        await validationNodesProviderProxy.connect(alice).owner()
      ).to.be.equal(bob.address);
    });
  });

  describe("renounceOwnership", () => {
    it("should fail if not a whitelisted owner is trying to renounce ownership", async () => {
      await securitizeRegistry.connect(alice).removeWallet(bob.address);
      await expect(
        validationNodesProviderProxy.connect(bob).renounceOwnership()
      )
        .to.be.revertedWithCustomError(
          validationNodesProviderProxy,
          "NotWhitelisted"
        )
        .withArgs(bob.address);
    });

    it("should renounce ownership by a whitelisted owner", async () => {
      expect(
        await validationNodesProviderProxy.connect(bob).owner()
      ).to.be.equal(bob.address);

      await securitizeRegistry.connect(alice).addWallet(bob.address);
      await validationNodesProviderProxy.connect(bob).renounceOwnership();

      expect(
        await validationNodesProviderProxy.connect(bob).owner()
      ).to.be.equal(constants.ZERO_ADDRESS);
    });
  });
});
