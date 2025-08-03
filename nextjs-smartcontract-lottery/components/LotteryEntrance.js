import { useWeb3Contract } from "react-moralis"
import { abi, contractAddress } from "@/constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "@web3uikit/core"
import { Bell } from "@web3uikit/icons"

export default function LotteryEntrance() {
	const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
	const chainId = parseInt(chainIdHex)
	const [entranceFee, setEntranceFee] = useState("0")
	const [numPlayers, setNumPlayers] = useState("0")
	const [recentWinner, setRecentWinner] = useState("0")

	const dispatch = useNotification()

	const raffleAddress =
		chainId in contractAddress ? contractAddress[chainId][0] : null

	const {
		runContractFunction: enterRaffle,
		isLoading,
		isFetching,
	} = useWeb3Contract({
		abi: abi,
		contractAddress: raffleAddress,
		functionName: "enterRaffle",
		params: {},
		msgValue: entranceFee,
	})

	const { runContractFunction: getEntranceFee } = useWeb3Contract({
		abi: abi,
		contractAddress: raffleAddress,
		functionName: "getEntranceFee",
		params: {},
	})

	const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
		abi: abi,
		contractAddress: raffleAddress,
		functionName: "getNumberOfPlayers",
		params: {},
	})

	const { runContractFunction: getRecentWinner } = useWeb3Contract({
		abi: abi,
		contractAddress: raffleAddress,
		functionName: "getRecentWinner",
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
		const entranceFeeFromCall = (await getEntranceFee()).toString()
		const numPlayersFromCall = (await getNumberOfPlayers()).toString()
		const recentWinnerFromCall = await getRecentWinner()
		setEntranceFee(entranceFeeFromCall)
		setNumPlayers(numPlayersFromCall)
		setRecentWinner(recentWinnerFromCall)
	}

	useEffect(() => {
		if (isWeb3Enabled) {
			updateUI()
		}
	}, [isWeb3Enabled])

	useEffect(() => {
		if (!raffleAddress || !isWeb3Enabled) return
		const provider = new ethers.providers.Web3Provider(window.ethereum)
		const contract = new ethers.Contract(raffleAddress, abi, provider)

		const onWinnerPicked = () => {
			updateUI()
		}

		contract.on("WinnerPicked", onWinnerPicked)
		return () => {
			contract.off("WinnerPicked", onWinnerPicked)
		}
	}, [raffleAddress, isWeb3Enabled])

	return (
		<div className="max-w-2xl mx-auto mt-12 p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg text-white space-y-6">
			<h2 className="text-3xl font-bold text-center drop-shadow-md">
				🎟️ Lottery Entrance
			</h2>
			{raffleAddress ? (
				<div>
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
