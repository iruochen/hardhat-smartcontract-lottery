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

	const handleSuccess = async (tx) => {
		await tx.wait(1)
		handleNewNotification(tx)
	}

	const handleNewNotification = () => {
		dispatch({
			type: "info",
			message: "Transaction Complete!",
			title: "Tx Notification",
			position: "topR",
			icon: <Bell/>
		})
	}

	useEffect(() => {
		if (isWeb3Enabled) {
			async function updateUI() {
				const entranceFeeFromCall = await getEntranceFee()
				setEntranceFee(entranceFeeFromCall)
			}
			updateUI()
		}
	}, [isWeb3Enabled])
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
				</div>
			) : (
				<div>No Raffle Address Detected</div>
			)}
		</div>
	)
}
