import { useWeb3Contract } from "react-moralis"
import { contractAbi, contractAddress } from "@/constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "@web3uikit/core"
import { Bell } from "@web3uikit/icons"
import useIsSupportedNetwork from "@/hooks/useIsSupportedNetwork"
import useFilteredContractEvent from "@/hooks/useFilteredContractEvent"

export default function LotteryEntrance() {
	const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
	const chainId = parseInt(chainIdHex)
	const { isSupported } = useIsSupportedNetwork()
	const [entranceFee, setEntranceFee] = useState("0")
	const [numPlayers, setNumPlayers] = useState("0")
	const [recentWinner, setRecentWinner] = useState("0")
	const [contractBalance, setContractBalance] = useState("0")

	const dispatch = useNotification()
	const raffleAddress =
		chainId in contractAddress ? contractAddress[chainId] : null
	const abi = chainId in contractAbi ? contractAbi[chainId] : null

	const {
		runContractFunction: enterRaffle,
		isLoading,
		isFetching,
	} = useWeb3Contract({
		abi,
		contractAddress: raffleAddress,
		functionName: "enterRaffle",
		params: {},
		msgValue: entranceFee,
	})

	const { runContractFunction: getEntranceFee } = useWeb3Contract({
		abi,
		contractAddress: raffleAddress,
		functionName: "getEntranceFee",
		params: {},
	})

	const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
		abi,
		contractAddress: raffleAddress,
		functionName: "getNumberOfPlayers",
		params: {},
	})

	const { runContractFunction: getRecentWinner } = useWeb3Contract({
		abi,
		contractAddress: raffleAddress,
		functionName: "getRecentWinner",
		params: {},
	})

	const { runContractFunction: getBalance } = useWeb3Contract({
		abi,
		contractAddress: raffleAddress,
		functionName: "getBalance",
		params: {},
	})

	const handleSuccess = async (tx) => {
		await tx.wait(1)
		handleNewNotification(tx)
		updateUI()
	}

	const handleNewNotification = () => {
		dispatch({
			type: "info",
			message: "Transaction Complete!",
			title: "Tx Notification",
			position: "topR",
			icon: <Bell />,
		})
	}

	async function updateUI() {
		console.log("updating UI ....")
		try {
			const entranceFeeFromCall = (await getEntranceFee())?.toString() || "0"
			console.log("entranceFeeFromCall: ", entranceFeeFromCall)
			const numPlayersFromCall = (await getNumberOfPlayers())?.toString() || "0"
			console.log("numPlayersFromCall: ", numPlayersFromCall)
			const recentWinnerFromCall = await getRecentWinner()
			console.log("recentWinnerFromCall: ", recentWinnerFromCall)
			const contractBalanceFromCall = (await getBalance())?.toString() || "0"
			console.log("contractBalanceFromCall: ", contractBalanceFromCall)
			setEntranceFee(entranceFeeFromCall)
			setNumPlayers(numPlayersFromCall)
			setRecentWinner(recentWinnerFromCall)
			setContractBalance(contractBalanceFromCall)
		} catch (e) {
			console.error("updateUI failed: ", e)
		}
	}

	useEffect(() => {
		if (isWeb3Enabled) updateUI()
	}, [isWeb3Enabled, chainId])

	useFilteredContractEvent({
		eventName: "WinnerPicked",
		contractAddress: raffleAddress,
		abi,
		enabled: true,
		onEvent: (winner) => {
			console.log("📣 WinnerPicked event fired!", winner)
			// let retry = 0
			// const pollUpdatedState = async () => {
			// 	try {
			// 		const players = await getNumberOfPlayers()
			// 		if (players.toString() === "0") {
			// 			console.log("✅ players reset, updating UI")
			// 			updateUI()
			// 		} else if (retry < 10) {
			// 			setTimeout(pollUpdatedState, 1000)
			// 			retry++
			// 		} else {
			// 			console.warn("⏰ Timed out waiting for state update")
			// 		}
			// 	} catch (e) {
			// 		console.error("Error polling state", e)
			// 	}
			// }
			// setTimeout(pollUpdatedState, 2000)
		},
		// wsRpcUrl: "ws://127.0.0.1:8545",
	})

	return (
		<div className="max-w-2xl mx-auto mt-12 p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg text-white space-y-6">
			<h2 className="text-3xl font-bold text-center drop-shadow-md">
				🎟️ Lottery Entrance
			</h2>
			{!isSupported && (
				<p className="text-yellow-300 font-semibold text-center">
					⚠️ Please connect to the Sepolia network to participate in the lottery
				</p>
			)}

			{raffleAddress ? (
				<>
					<button
						className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
						onClick={async () => {
							await enterRaffle({
								onSuccess: handleSuccess,
								onError: (error) => console.log(error),
							})
						}}
						disabled={isLoading || isFetching}
					>
						{isLoading || isFetching ? (
							<div className="flex justify-center">
								<div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
							</div>
						) : (
							"Enter Raffle"
						)}
					</button>
					<p>
						<span className="font-mono font-semibold">Entrance Fee:</span>{" "}
						{entranceFee && ethers.utils.formatUnits(entranceFee, "ether")} ETH
					</p>
					<p>
						<span className="font-mono font-semibold">Number Of Players:</span>{" "}
						{numPlayers}
					</p>
					<p>
						<span className="font-mono font-semibold">Contract Balance:</span>{" "}
						{contractBalance &&
							ethers.utils.formatUnits(contractBalance, "ether")}{" "}
						ETH
					</p>
					<p className="break-all">
						<span className="font-mono font-semibold">Recent Winner:</span>{" "}
						{recentWinner}
					</p>
				</>
			) : (
				<p className="text-red-400 text-center font-semibold">
					No Raffle Address Detected
				</p>
			)}
		</div>
	)
}
