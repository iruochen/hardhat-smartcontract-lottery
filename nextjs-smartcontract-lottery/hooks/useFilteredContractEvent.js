import { useEffect } from "react"
import { ethers } from "ethers"
import { useMoralis } from "react-moralis"

export default function useFilteredContractEvent({
	eventName,
	contractAddress,
	abi,
	enabled = true,
	onEvent,
}) {
	const { provider } = useMoralis()
	useEffect(() => {
		if (!enabled || !contractAddress || !abi || !provider) return

		const ethersProvider = new ethers.providers.Web3Provider(provider)
		const contract = new ethers.Contract(contractAddress, abi, ethersProvider)

		contract.on(eventName, onEvent)

		return () => {
			contract.off(eventName, onEvent)
		}
	}, [eventName, contractAddress, abi, enabled, provider])
}
