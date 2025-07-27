require('@nomicfoundation/hardhat-toolbox')
require('@chainlink/env-enc').config()
require('hardhat-deploy')

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: '0.8.28',
	defaultNetwork: 'hardhat',
	networks: {
		hardhat: {
			chainId: 31337,
			blockConfirmations: 1,
		},
		sepolia: {
			chainId: 11155111,
			blockConfirmations: 6,
			url: SEPOLIA_RPC_URL,
			accounts: [PRIVATE_KEY, PRIVATE_KEY_1],
		},
	},
	etherscan: {
		apiKey: {
			sepolia: ETHERSCAN_API_KEY,
		},
	},
	namedAccounts: {
		deployer: {
			default: 0,
		},
		player: {
			default: 1,
		},
	},
	gasReporter: {
		enabled: false,
		currency: 'USD',
		outputFile: 'gas-report.txt',
		noColors: true,
		// coinmarketcap: process.env.COINMARKETCAP_API_KEY
	},
	mocha: {
		// 200 s
		timeout: 200000,
	},
}
