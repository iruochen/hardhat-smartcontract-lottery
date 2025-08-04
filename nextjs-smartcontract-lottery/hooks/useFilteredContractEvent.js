import { useEffect } from "react"
import { ethers } from "ethers"

export default function useFilteredContractEvent({
	eventName,
	contractAddress,
	abi,
	enabled = true,
	onEvent,
	// wsRpcUrl,
}) {
	useEffect(() => {
		if (!enabled || !contractAddress || !abi) return

		const provider = new ethers.providers.WebSocketProvider(wsRpcUrl)
		const contract = new ethers.Contract(contractAddress, abi, provider)

		contract.on(eventName, onEvent)
		console.log(`[${eventName}]监听已注册`)

		return () => {
			console.log(`[${eventName}]监听已取消`)
			contract.removeAllListeners(eventName)
			provider.destroy()
		}
	}, [eventName, contractAddress, abi, enabled])
}
