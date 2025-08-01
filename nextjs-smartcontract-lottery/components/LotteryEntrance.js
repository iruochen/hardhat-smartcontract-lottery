import { useWeb3Contract } from "react-moralis"
import { abi, contractAddress } from "@/constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"

export default function LotteryEntrance() {
	const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
	const chainId = parseInt(chainIdHex)
	const [entranceFee, setEntranceFee] = useState("0")

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
						onClick={() => {
							enterRaffle()
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
