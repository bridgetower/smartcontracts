# Collection and NFTs minting

## Getting started

1. Run `yarn` to install dependencies
2. Fill in the `.env` with all the variables except `BT_MINTER_COLLECTION_ADDRESS` (description is in `.env.schema` and there is the
   copy below)
3. Don’t forget to add absolute paths of `cover` and `logo` pictures to `BT_MINTER_COLLECTION_COVER_PATH`
   and `BT_MINTER_COLLECTION_LOGO_PATH` accordingly
4. Run `yarn mint:collection`
5. You will get the collection address and its ABI in following messages in terminal

```
✨ Collection created!
✨ Collection address: 0x4357f8a6012F0635F874E67dF92D8Db79AaaE859
🚀🚀🚀🚀 NOW YOU SHOULD ADD THIS COLLECTION ---> 0x4357f8a6012F0635F874E67dF92D8Db79AaaE859 <--- TO CYBAVO WHITELIST 🚀🚀🚀🚀
🚀🚀🚀🚀 CYBAVO WHITELIST === CONTRACT LIST AND DELEGATED AVAX WALLET CONTRACT INTERACTION POLICY (METHODS 'mintAndTransfer'/'setApprovalForAll')) 🚀🚀🚀🚀
🚀🚀🚀🚀 YOU CAN FIND ABI HERE (ERC1155 PROXY) ---> https://gist.github.com/torbiievskyi-ideasoft/cddc36062300a418e047fd7c12675322 🚀🚀🚀🚀
```

6. Add contract address and its ABI to the Cybavo contracts list
7. Add this contract to avalanche delegated wallet policy allowing calls of `mintAndTransfer`/`setApprovalForAll`
   functions
8. Set `BT_MINTER_COLLECTION_ADDRESS` to the collection address that you'll get from `mint:collection` script
9. Change NFT list (nfts.json) to preferred one
10. Run `yarn mint:nfts`
11. Done!

## Environment variables

| Should be changed | Environment variable                         | Default value / Example                                                                    | Purpose                                                                                                                                      |
|-------------------|----------------------------------------------|--------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| YES               | BT_MINTER_DB_HOST                            | Example: `localhost`                                                                       | Database host (you can tunnel if you want)                                                                                                   |
| YES               | BT_MINTER_DB_USER                            | Example: `root`                                                                            | Database user                                                                                                                                |
| YES               | BT_MINTER_DB_PASSWORD                        | Example: `bridge`                                                                          | Database password                                                                                                                            |
| YES               | BT_MINTER_DB_SCHEMA                          | Example: `bridge_Db`                                                                       | Database schema                                                                                                                              |
| YES               | BT_MINTER_DB_PORT                            | Example: `3306`                                                                            | Database port                                                                                                                                |
| YES               | BT_MINTER_AVAX_NODE_URL                      | Example: `https://nd-927-860-543.p2pify.com/c808ffb978332ba7e99704f6c41a22bf/ext/bc/C/rpc` | Avalanche Node URL                                                                                                                           |
| YES               | BT_MINTER_AVAX_CHAIN_ID                      | Example: `43113`                                                                           | Avalanche chain Id (43113 - testnet, 43114 - mainnet)                                                                                        |
| YES               | BT_MINTER_FACTORY_CONTRACT_ADDRESS           | Example: `0x847ed9db8FD0753dd244408932312A624b1E14C1`                                      | ERC1155 factory contract address                                                                                                             |
| YES               | BT_MINTER_FACTORY_CONTRACT_OWNER_PRIVATE_KEY | Example: `--------`                                                                        | Private key of ERC1155 factory contract owner (private key of wallet, that can push transaction with `addPartner` call)                      |
| YES               | BT_MINTER_TARGET_USER_EMAIL                  | Example: `test2cory@proton.me`                                                             | Securitize email of user that we will mint NFTs from the wallet of                                                                           |
| YES               | BT_MINTER_JWT_SECRET                         | Example: `test`                                                                            | JWT secret of the environment (used to sign token, to avoid going through authorization flow)                                                |
| YES               | BT_MINTER_API_BASE_URL                       | Example: ``                                                                                | API base url of the environment                                                                                                              |
| NO                | BT_MINTER_API_ENDPOINT_ADD_COLLECTION        | Default: `api/v1/collection`                                                               | Add collection endpoint of the API                                                                                                           |
| NO                | BT_MINTER_SOCKET_PARTNER_UTILS_NAMESPACE     | Default: `partner-utils`                                                                   | Socket.IO namespace of minting utils on the API                                                                                              |
| NO                | BT_MINTER_SOCKET_MINT_COLLECTION_EVENT       | Default: `mint-collection`                                                                 | Socket.IO collection minting event inside of minting utils namespace on the API                                                              |
| NO                | BT_MINTER_SOCKET_MINT_NFT_EVENT              | Default: `mint-nft`                                                                        | Socket.IO NFT minting event inside of minting utils namespace on the API                                                                     |
| YES               | BT_MINTER_COLLECTION_NAME                    | Example: `testcollection_BT202302262026`                                                   | Name of the collection that we minting                                                                                                       |
| YES               | BT_MINTER_COLLECTION_SYMBOL                  | Example: `BT202302262026`                                                                  | Symbol of the collection that we minting                                                                                                     |
| YES               | BT_MINTER_COLLECTION_LOCK_PERIOD             | Example: `10`                                                                              | Lock period of the collection that we minting                                                                                                |
| YES               | BT_MINTER_COLLECTION_COVER_PATH              | Example: `/Volumes/Data/Development/BridgeTower/test/cover/cover.jpg`                      | Cover path (absolute, local FS) of the collection that we minting                                                                            |
| YES               | BT_MINTER_COLLECTION_LOGO_PATH               | Example: `/Volumes/Data/Development/BridgeTower/test/cover/profile.png`                    | Logo path (absolute, local FS) of the collection that we minting                                                                             |
| YES               | BT_MINTER_COLLECTION_DESCRIPTION             | Example: `test collection #1`                                                              | Description of the collection that we minting                                                                                                |
| NO                | BT_MINTER_COLLECTION_ABI_GIST                | Default: `https://gist.github.com/torbiievskyi-ideasoft/cddc36062300a418e047fd7c12675322`  | Gist that contains ABI of the minted collection (used to call collection methods or to whitelist collection at Cybavo)                       |
| YES               | BT_MINTER_NFT_COLLECTION_ADDRESS             | Example: `0x4357f8a6012F0635F874E67dF92D8Db79AaaE859`                                      | Collection address to which NFTs would be minted (used in `mint:nfts` script), usually it is result of the previous step (`mint:collection`) |
