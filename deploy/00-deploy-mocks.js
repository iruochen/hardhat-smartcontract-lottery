const { ethers, network } = require('hardhat')
const { developmentChains } = require('../helper-hardhat-config')

const BASE_FEE = ethers.parseEther('0.1')
const GAS_PRICE_LINK = 1e9
const WEI_PER_UNIT_LINK = 49e14

module.exports = async function ({ getNamedAccounts, deployments }) {
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	const args = [BASE_FEE, GAS_PRICE_LINK, WEI_PER_UNIT_LINK]

	if (developmentChains.includes(network.name)) {
		log('Local network detected! Deploying mocks...')
		// deploy a mock VRF Coordinator
		await deploy('VRFCoordinatorV2_5Mock', {
			from: deployer,
			log: true,
			args: args,
		})
		log('Mocks deployed!')
		log('----------------------------------------------------')
	}
}

module.exports.tags = ['all', 'mocks']
