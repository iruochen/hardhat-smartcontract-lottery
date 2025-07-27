const { network, ethers } = require('hardhat')
const { developmentChains, networkConfig } = require('../helper-hardhat-config')
const { verify } = require('../utils/verify')

const VRF_SUB_FUND_AMOUNT = ethers.parseEther('100')

module.exports = async function ({ getNamedAccounts, deployments }) {
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	const chainId = network.config.chainId
	let vrfCoordinatorV2_5Address, subscriptionId, vrfCoordinatorV2_5Mock

	if (developmentChains.includes(network.name)) {
		const vrfDeployment = await deployments.get('VRFCoordinatorV2_5Mock')
		vrfCoordinatorV2_5Mock = await ethers.getContractAt(
			'VRFCoordinatorV2_5Mock',
			vrfDeployment.address,
		)
		vrfCoordinatorV2_5Address = vrfCoordinatorV2_5Mock.target
		// Call the createSubscription function (which VRFCoordinatorV2_5Mock inherits) to create a new subscription.
		const transactionResponse =
			await vrfCoordinatorV2_5Mock.createSubscription()
		const transactionReceipt = await transactionResponse.wait(1)
		subscriptionId = transactionReceipt.logs[0].args.subId
		// Call the VRFCoordinatorV2_5Mock fundSubscription function to fund your newly created subscription. Note: You can fund with an arbitrary amount.
		await vrfCoordinatorV2_5Mock.fundSubscription(
			subscriptionId,
			VRF_SUB_FUND_AMOUNT,
		)
	} else {
		vrfCoordinatorV2_5Address = networkConfig[chainId].vrfCoordinatorV2_5
		subscriptionId = networkConfig[chainId].subscriptionId
	}

	const entranceFee = networkConfig[chainId].entranceFee
	const gasLine = networkConfig[chainId].gasLine
	const callbackGasLimit = networkConfig[chainId].callbackGasLimit
	const interval = networkConfig[chainId].interval

	const args = [
		vrfCoordinatorV2_5Address,
		entranceFee,
		gasLine,
		subscriptionId,
		callbackGasLimit,
		interval,
	]
	const raffle = await deploy('Raffle', {
		from: deployer,
		args: args,
		log: true,
		waitConfirmations: network.config.blockConfirmations || 1,
	})

	if (developmentChains.includes(network.name)) {
		await vrfCoordinatorV2_5Mock.addConsumer(subscriptionId, raffle.address)
	}

	// verify the contract if not on a local chain
	if (
		!developmentChains.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		log('Verifying contract...')
		await verify(raffle.address, args)
	}

	log('----------------------------------')
}

module.exports.tags = ['all', 'raffle']
