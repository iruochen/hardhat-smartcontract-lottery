const { assert, expect } = require('chai')
const { getNamedAccounts, deployments, ethers, network } = require('hardhat')
const { developmentChains } = require('../../helper-hardhat-config')

developmentChains.includes(network.name)
	? describe.skip
	: describe('Raffle', () => {
			let raffle, raffleEntranceFee, deployer

			beforeEach(async () => {
				const accounts = await getNamedAccounts()
				deployer = accounts.deployer
				const raffleDeployment = await deployments.get('Raffle')
				raffle = await ethers.getContractAt(
					raffleDeployment.abi,
					raffleDeployment.address,
				)
				raffleEntranceFee = await raffle.getEntranceFee()
			})

			describe('fulfillRandomWords', async () => {
				it('works with live Chainlink Keepers and Chainlink VRF, we get a random winner', async () => {
					console.log('Setting up test...')
					// enter the raffle
					const startingTimeStamp = await raffle.getLatestTimeStamp()
					const deployAccount = await ethers.getSigner(deployer)
					let winnerStartingBalance

					console.log('Setting up listener...')
					// setup listener before we enter the raffle
					// Just in case the blockchain moves really fast
					await new Promise(async (resolve, reject) => {
						raffle.once('WinnerPicked', async () => {
							console.log('WinnerPicked event fired!')
							try {
								const recentWinner = await raffle.getRecentWinner()
								const raffleState = await raffle.getRaffleState()
								const winnerEndingBalance =
									await ethers.provider.getBalance(recentWinner)
								const endingTimeStamp = await raffle.getLatestTimeStamp()

								await expect(raffle.getPlayers(0)).to.be.reverted
								expect(recentWinner).to.equal(deployAccount.address)
								expect(raffleState, 0)
								expect(winnerEndingBalance).to.equal(
									winnerStartingBalance + BigInt(raffleEntranceFee),
								)
								expect(endingTimeStamp).to.be.gt(startingTimeStamp)
								resolve()
							} catch (e) {
								console.log(e)
								reject(e)
							}
						})

						// Then entering the raffle
						console.log('Entering Raffle...')
						try {
							const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
							await tx.wait(1)
							winnerStartingBalance =
								await ethers.provider.getBalance(deployAccount)
						} catch (e) {
							console.log(e)
							reject(e)
						}
						// and this code wont complete until our listener has finished listening
					})
				})
			})
		})
