STAKING WITH UPGRADEABLE SMART CONTRACT with APR rewards

This Project is regarding the representation of the staking and it manages the data from two contracts and also stakes and calculates all the perks and rewards.

What we will achieve by this:
Create a Upgradeable Smart Contract with Following Details:
- Create a Staking Contract for Stable Coin Staking  for 1 month, 6months, and 12 months with 5,10, 15% APR rewards w.r.t (your token) ERC 20 respectively, After 1 year it will be stable at 15%
- Get the Price of Stable Coin using Chainlink Aggregator.
- Also create a logic for Perks if the USD value of stable coins staked is more than $100 user gets extra 2% APR, more than $500 gets extra 5%, more than $1000 get 10% extra APR.

Technology addons and Uses

- [Hardhat](https://github.com/nomiclabs/hardhat): compile and run the smart contracts on a local development network
- [Ethers](https://github.com/ethers-io/ethers.js/): renowned Ethereum library and wallet implementation
- [Waffle](https://github.com/EthWorks/Waffle): tooling for writing comprehensive smart contract tests
- [Solhint](https://github.com/protofire/solhint): linter

## Usage

### Pre Requisites

Before running any command, make sure to install dependencies:

```sh
$ npm install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ npx hardhat compile
```

### Test

Run the Mocha tests on rinkeby:

```sh
$ npx hardhat test -- network rinkeby
```

### Deploy contract to netowrk (requires Mnemonic and infura API key)

```
npx hardhat run --network rinkeby ./scripts/deploy.js
```

### Validate a contract with etherscan (requires API ke)

```
npx hardhat verify --network <network> <DEPLOYED_CONTRACT_ADDRESS> "Constructor argument 1"
```


### Screenshots

Deploying the contracts in remix
<img width="1440" alt="Screenshot 2022-06-29 at 3 42 25 PM" src="https://user-images.githubusercontent.com/86094155/176412168-4fc306f9-ae6f-4a0d-8ac8-258b58b4ac95.png">

After Transfering the tokens in the staking contract
<img width="1440" alt="Screenshot 2022-06-29 at 4 26 43 PM" src="https://user-images.githubusercontent.com/86094155/176420508-8222c95b-3c5e-493b-a3e0-95e1b7c2773a.png">

Initialising the contract as upgradeable
<img width="1440" alt="Screenshot 2022-06-29 at 6 41 04 PM" src="https://user-images.githubusercontent.com/86094155/176444605-c6ba6694-13f8-4c46-88a9-88232aa0a429.png">

Showcasing the Upgrade function
<img width="1440" alt="Screenshot 2022-06-29 at 6 47 13 PM" src="https://user-images.githubusercontent.com/86094155/176445735-0d87b247-9014-4f7f-b6e0-3abefeeb7dff.png">

Deploying the Contract on a proxy address
<img width="1440" alt="Screenshot 2022-07-01 at 6 06 56 AM" src="https://user-images.githubusercontent.com/86094155/176800241-038bb4dd-e47b-4040-8d74-6dfbaf179b70.png">






### Transaction Hashes
Contract is deployed on 0xc12dc9161bC03A67BF7cB6f52D928EfA2daDfb08
 
 The Tranasction of the rinkeby etherscan
 https://rinkeby.etherscan.io/tx/0xe1ca579ac9f705f5f281ae138d5188165ea341bd6504ca21b91e1f9091abea66

### Added plugins

- Gas reporter [hardhat-gas-reporter](https://hardhat.org/plugins/hardhat-gas-reporter.html)
- Etherscan [hardhat-etherscan](https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html)



## License

UNKNOWN
