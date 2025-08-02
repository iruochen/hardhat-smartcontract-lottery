import { useWeb3Contract } from "react-moralis"
import { abi, contractAddress } from "@/constants"
import { useMoralis, useMoralisSubscription } from "react-moralis"
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

	const { runContractFunction: enterRaffle } = useWeb3Contract({
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
		<div>
			Hi from lottery entrance!
			{raffleAddress ? (
				<div>
					<button
						className="bg-blue-500"
						onClick={async () => {
							await enterRaffle({
								onSuccess: handleSuccess,
								onError: (error) => console.log(error),
							})
						}}
					>
						Enter Raffle
					</button>
					Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH
					<div>Number Of Players: {numPlayers}</div>
					<div>Recent Winner: {recentWinner}</div>
				</div>
			) : (
				<div>No Raffle Address Detected</div>
			)}
		</div>
	)
}
