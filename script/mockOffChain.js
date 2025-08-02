const { time, mine } = require('@nomicfoundation/hardhat-network-helpers')
const { deployments, ethers, network } = require('hardhat')

async function mockKeepers() {
	const raffleDeployment = await deployments.get('Raffle')
	const raffle = await ethers.getContractAt(
		raffleDeployment.abi,
		raffleDeployment.address,
	)

	const interval = await raffle.getInterval()
	await time.increase(Number(interval) + 1)
	await mine()
	const checkData = ethers.keccak256(ethers.toUtf8Bytes(''))
	const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(checkData)
	if (upkeepNeeded) {
		const tx = await raffle.performUpkeep(checkData)
		const txReceipt = await tx.wait(1)
		const requestId = txReceipt.logs[1].args.requestId
		console.log(`Performed upkeep with RequestId: ${requestId}`)
		if (network.config.chainId == 31337) {
			await mockVrf(requestId, raffle)
		}
	} else {
		console.log('No upkeep needed!')
	}
}

async function mockVrf(requestId, raffle) {
	console.log("We on a local network? Ok let's pretend...")
	try {
		const vrfCoordinatorV2_5MockDeployment = await deployments.get(
			'VRFCoordinatorV2_5Mock',
		)
		console.log(vrfCoordinatorV2_5MockDeployment.address)
		const vrfCoordinatorV2_5Mock = await ethers.getContractAt(
			'VRFCoordinatorV2_5Mock',
			vrfCoordinatorV2_5MockDeployment.address,
		)

		console.log('→ Calling fulfillRandomWords with:')
		console.log('  requestId:', requestId.toString())
		console.log('  raffle:', raffle.target)

		const tx = await vrfCoordinatorV2_5Mock.fulfillRandomWords(
			requestId,
			raffle.target,
		)
		await tx.wait(1)

		console.log('✅ fulfillRandomWords responded!')

		const recentWinner = await raffle.getRecentWinner()
		console.log(`🏆 The winner is ${recentWinner}`)
	} catch (e) {
		console.error('❌ fulfillRandomWords threw an error:')
		console.error(e)
	}
}

mockKeepers()
	.then(() => process.exit(0))
	.catch((e) => {
		console.log(e)
		process.exit(1)
	})
