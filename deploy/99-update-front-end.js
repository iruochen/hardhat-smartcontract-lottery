const { deployments, network } = require('hardhat')
const { UPDATE_FRONT_END } = require('../helper-hardhat-config')
const fs = require('fs')
const path = require('path')

const ADDRESS_FILE = path.resolve(
	__dirname,
	'../nextjs-smartcontract-lottery/constants/contractAddress.json',
)
const ABI_FILE = path.resolve(
	__dirname,
	'../nextjs-smartcontract-lottery/constants/abi.json',
)

module.exports = async () => {
	if (UPDATE_FRONT_END) {
		console.log('Updating front end contract info...')
		try {
			await updateContractAddress()
		} catch (error) {
			console.error('Error updating contract address:', error)
		}

		try {
			await updateAbi()
		} catch (error) {
			console.error('Error updating ABI:', error)
		}
	}
}

async function updateAbi() {
	const raffleDeployment = await deployments.get('Raffle')
	const raffleAbi = raffleDeployment.abi

	let abiJson = {}
	try {
		abiJson = JSON.parse(fs.readFileSync(ABI_FILE, 'utf-8'))
	} catch (e) {
		if (e.code === 'ENOENT') {
			console.log('abi.json not found, will create a new one.')
		} else {
			throw e
		}
	}

	const chainId = network.config.chainId.toString()
	abiJson[chainId] = raffleAbi

	fs.writeFileSync(ABI_FILE, JSON.stringify(abiJson, null, 2))
	console.log('ABI updated successfully!')
}

async function updateContractAddress() {
	const raffleDeployment = await deployments.get('Raffle')
	const chainId = network.config.chainId.toString()
	let addressJson = {}

	try {
		addressJson = JSON.parse(fs.readFileSync(ADDRESS_FILE, 'utf-8'))
	} catch (e) {
		if (e.code === 'ENOENT') {
			console.log('contractAddress.json not found, will create a new one.')
		} else {
			throw e
		}
	}

	const raffleAddress = raffleDeployment.address
	addressJson[chainId] = raffleAddress
	// if (!addressJson[chainId]) {
	// 	addressJson[chainId] = []
	// }
	// if (!addressJson[chainId].includes(raffleAddress)) {
	// 	addressJson[chainId].push(raffleAddress)
	// }

	fs.writeFileSync(ADDRESS_FILE, JSON.stringify(addressJson, null, 2))
	console.log('Contract address updated successfully!')
}

module.exports.tags = ['all', 'frontend']
