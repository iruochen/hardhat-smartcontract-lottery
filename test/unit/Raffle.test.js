const { time, mine } = require('@nomicfoundation/hardhat-network-helpers')
const { assert, expect } = require('chai')
const { getNamedAccounts, deployments, ethers, network } = require('hardhat')
const {
	developmentChains,
	networkConfig,
} = require('../../helper-hardhat-config')

!developmentChains.includes(network.name)
	? describe.skip
	: describe('Raffle', () => {
			let raffle, vrfCoordinatorV2_5Mock, raffleEntranceFee, deployer, interval
			const chainId = network.config.chainId

			beforeEach(async () => {
				const accounts = await getNamedAccounts()
				deployer = accounts.deployer
				await deployments.fixture('all')
				const raffleDeployment = await deployments.get('Raffle')
				raffle = await ethers.getContractAt(
					raffleDeployment.abi,
					raffleDeployment.address,
				)
				const vrfCoordinatorV2_5MockDeployment = await deployments.get(
					'VRFCoordinatorV2_5Mock',
				)
				vrfCoordinatorV2_5Mock = await ethers.getContractAt(
					'VRFCoordinatorV2_5Mock',
					vrfCoordinatorV2_5MockDeployment.address,
				)
				raffleEntranceFee = await raffle.getEntranceFee()
				interval = await raffle.getInterval()
			})

			describe('constructor', () => {
				it('initializes the raffle correctly', async () => {
					const raffleState = await raffle.getRaffleState()
					assert.equal(raffleState.toString(), '0')
					assert.equal(interval.toString(), networkConfig[chainId].interval)
				})
			})

			describe('enterRaff', () => {
				it("reverts when you don't pay enough", async () => {
					await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
						raffle,
						'Raffle__NotEnoughETHEntered',
					)
				})
				it('records players when they enter', async () => {
					await raffle.enterRaffle({ value: raffleEntranceFee })
					const playerFromContract = await raffle.getPlayers(0)
					assert.equal(playerFromContract, deployer)
				})
				it('emits event on enter', async () => {
					await expect(raffle.enterRaffle({ value: raffleEntranceFee }))
						.to.emit(raffle, 'RaffleEntered')
						.withArgs(deployer)
				})
				it("doesn't allow entrance when raffle is calculating", async () => {
					await raffle.enterRaffle({ value: raffleEntranceFee })
					await time.increase(Number(interval) + 1)
					await mine()
					// await network.provider.send('evm_increaseTime', [interval + 1])
					// await network.provider.request()
					await raffle.performUpkeep('0x')
					await expect(
						raffle.enterRaffle({ value: raffleEntranceFee }),
					).to.be.revertedWithCustomError(raffle, 'Raffle__NotOpen')
				})
			})

			describe('checkUpkeep', () => {
				it("returns false if people haven't sent any ETH", async () => {
					await time.increase(Number(interval) + 1)
					await mine()
					const { upkeepNeeded } = await raffle.checkUpkeep.staticCall('0x')
					assert(!upkeepNeeded)
				})
				it("returns false if raffle isn't open", async () => {
					await raffle.enterRaffle({ value: raffleEntranceFee })
					await time.increase(Number(interval) + 1)
					await mine()
					await raffle.performUpkeep('0x')
					const raffleState = await raffle.getRaffleState()
					const { upkeepNeeded } = await raffle.checkUpkeep.staticCall('0x')
					assert.equal(raffleState, '1')
					assert.equal(upkeepNeeded, false)
				})
				it("returns false if enough time hasn't passed", async () => {
					await raffle.enterRaffle({ value: raffleEntranceFee })
					await time.increase(Number(interval) - 1)
					await mine()
					await raffle.performUpkeep('0x')
					const { upkeepNeeded } = await raffle.checkUpkeep.staticCall('0x')
					assert.equal(upkeepNeeded, false)
				})
				it('returns true if enough time has passed, has players, eth, and is open', async () => {
					await raffle.enterRaffle({ value: raffleEntranceFee })
					await time.increase(Number(interval) + 1)
					await mine()
					const { upkeepNeeded } = await raffle.checkUpkeep.staticCall('0x')
					assert(upkeepNeeded)
				})
			})

			describe('performUpkeep', () => {
				it('it can only run if checkUpkeep is true', async () => {
					await raffle.enterRaffle({ value: raffleEntranceFee })
					await time.increase(Number(interval) + 1)
					await mine()
					const tx = raffle.performUpkeep('0x')
					assert(tx)
				})
				it('reverts when checkUpkeep is false', async () => {
					await expect(
						raffle.performUpkeep('0x'),
					).to.be.revertedWithCustomError(raffle, 'Raffle_UpKeepNotNeeded')
				})
				it('updates the raffle state, emits and event, and calls the vrf coordinator', async () => {
					await raffle.enterRaffle({ value: raffleEntranceFee })
					await time.increase(Number(interval) + 1)
					await mine()
					const txResponse = await raffle.performUpkeep('0x')
					const txReceipt = await txResponse.wait(1)
					const requestId = txReceipt.logs[1].args.requestId
					const raffleState = await raffle.getRaffleState()
					assert(Number(requestId) > 0)
					assert(raffleState.toString() == '1')
				})
			})

			describe('fulfillRandomWords', () => {
				beforeEach(async () => {
					await raffle.enterRaffle({ value: raffleEntranceFee })
					await time.increase(Number(interval) + 1)
					await mine()
				})
				it('can only be called after performUpkeep', async () => {
					await expect(
						vrfCoordinatorV2_5Mock.fulfillRandomWords(
							0,
							await raffle.getAddress(),
						),
					).to.be.revertedWithCustomError(
						vrfCoordinatorV2_5Mock,
						'InvalidRequest',
					)
				})
				it('picks a winner, resets the lottery, and sends money', async () => {
					const accounts = await ethers.getSigners()
					const additionalEntrants = 3
					const startingAccountIndex = 1 // deploy = 0
					const participantAccounts = [await ethers.getSigner(deployer)]
					for (
						let i = startingAccountIndex;
						i < startingAccountIndex + additionalEntrants;
						i++
					) {
						const account = accounts[i]
						await raffle
							.connect(account)
							.enterRaffle({ value: raffleEntranceFee })
						participantAccounts.push(account)
					}
					console.log(participantAccounts.map((i) => i.address))

					const balanceBefore = {}
					for (const acc of participantAccounts) {
						balanceBefore[acc.address] = await ethers.provider.getBalance(
							acc.address,
						)
					}

					const startingTimeStamp = await raffle.getLatestTimeStamp()

					// performUpkeep (mock being chainlink keepers)
					// fulfillRandomWords (mock being chainlink VRF)
					await new Promise(async (resolve, reject) => {
						raffle.once('WinnerPicked', async () => {
							console.log('Found the event!')
							try {
								const recentWinner = await raffle.getRecentWinner()
								console.log('🎉 Winner picked:', recentWinner)

								const winner = accounts.find((a) => a.address === recentWinner)
								const winnerStartingBalance = balanceBefore[winner.address]
								const winnerEndingBalance =
									await ethers.provider.getBalance(winner)
								const raffleState = await raffle.getRaffleState()
								const endingTimeStamp = await raffle.getLatestTimeStamp()
								const numPlayers = await raffle.getNumberOfPlayers()

								expect(numPlayers).to.equal(0)
								expect(raffleState).to.equal(0)
								expect(endingTimeStamp).to.be.gt(startingTimeStamp)

								const totalPrize =
									BigInt(raffleEntranceFee) * BigInt(additionalEntrants + 1)
								const expectedBalance = winnerStartingBalance + totalPrize
								expect(winnerEndingBalance).to.equal(expectedBalance)
								resolve()
							} catch (e) {
								reject(e)
							}
						})

						try {
							const tx = await raffle.performUpkeep('0x')
							const txReceipt = await tx.wait(1)

							await vrfCoordinatorV2_5Mock.fulfillRandomWords(
								txReceipt.logs[1].args.requestId,
								await raffle.getAddress(),
							)
						} catch (e) {
							reject(e)
						}
					})
				})
			})
		})
