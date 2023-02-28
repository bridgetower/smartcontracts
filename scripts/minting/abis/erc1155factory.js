export const ERC1155FactoryAbi =  [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_beacon',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_transferProxy',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_lazyTransferProxy',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'securitizeRegistryProxy',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'contractsRegistryProxy',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'deployer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'proxy',
        type: 'address',
      },
    ],
    name: 'CreateERC1155BridgeTowerProxy',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'deployer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'proxy',
        type: 'address',
      },
    ],
    name: 'CreateERC1155BridgeTowerUserProxy',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint8',
        name: 'version',
        type: 'uint8',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'partner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'bool',
        name: 'status',
        type: 'bool',
      },
    ],
    name: 'PartnerStatusChanged',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'partner',
        type: 'address',
      },
    ],
    name: 'addPartner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'beacon',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contractsRegistryProxy',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_symbol',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'baseURI',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'contractURI',
        type: 'string',
      },
      {
        internalType: 'address[]',
        name: 'operators',
        type: 'address[]',
      },
      {
        internalType: 'uint256',
        name: 'lockPeriod',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'salt',
        type: 'uint256',
      },
    ],
    name: 'createToken',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_symbol',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'baseURI',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'contractURI',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'lockPeriod',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'salt',
        type: 'uint256',
      },
    ],
    name: 'createToken',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_symbol',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'baseURI',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'contractURI',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'lockPeriod',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_salt',
        type: 'uint256',
      },
    ],
    name: 'getAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_symbol',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'baseURI',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'contractURI',
        type: 'string',
      },
      {
        internalType: 'address[]',
        name: 'operators',
        type: 'address[]',
      },
      {
        internalType: 'uint256',
        name: 'lockPeriod',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_salt',
        type: 'uint256',
      },
    ],
    name: 'getAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'isPartner',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'addr',
        type: 'address',
      },
    ],
    name: 'onlyWhitelistedAddress',
    outputs: [],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'partner',
        type: 'address',
      },
    ],
    name: 'removePartner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'securitizeRegistryProxy',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newContractsRegistryProxy',
        type: 'address',
      },
    ],
    name: 'setContractsRegistryProxy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newSecuritizeRegistryProxy',
        type: 'address',
      },
    ],
    name: 'setSecuritizeRegistryProxy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
