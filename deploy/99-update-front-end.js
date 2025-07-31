const { deployments, network } = require('hardhat')
const { UPDATE_FRONT_END } = require('../helper-hardhat-config')
const fs = require('fs')
const path = require('path')

const FRONT_END_ADDRESS_FILE = path.resolve(
	__dirname,
	'../nextjs-smartcontract-lottery/constants/contractAddress.json',
)
const FRONT_END_ABI_FILE = path.resolve(
	__dirname,
	'../nextjs-smartcontract-lottery/constants/abi.json',
)

module.exports = async () => {
	if (UPDATE_FRONT_END) {
		console.log('Updating front end...')
		updateContractAddress()
		updateAbi()
	}
}

async function updateAbi() {
	const raffleDeployment = await deployments.get('Raffle')
	const raffleAbi = raffleDeployment.abi
	fs.writeFileSync(FRONT_END_ABI_FILE, JSON.stringify(raffleAbi, null, 2))
}

async function updateContractAddress() {
	const raffleDeployment = await deployments.get('Raffle')
	const chainId = network.config.chainId.toString()
	let currentAddress = {}
	try {
		currentAddress = JSON.parse(
			fs.readFileSync(FRONT_END_ADDRESS_FILE, 'utf-8'),
		)
	} catch (e) {
		console.log(e)
	}
	const raffleAddress = raffleDeployment.address
	if (chainId in currentAddress) {
		if (!currentAddress[chainId].includes(raffleAddress)) {
			currentAddress[chainId].push(raffleAddress)
		}
	} else {
		currentAddress[chainId] = [raffleAddress]
	}
	fs.writeFileSync(FRONT_END_ADDRESS_FILE, JSON.stringify(currentAddress))
}

module.exports.tags = ['all', 'frontend']
