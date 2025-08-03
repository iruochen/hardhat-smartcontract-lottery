import { useMoralis } from "react-moralis"

const SUPPORTED_NETWORKS = {
	11155111: "Sepolia",
	31337: "Hardhat Local",
}

export default function useIsSupportedNetwork() {
	const { chainId: chainIdHex } = useMoralis()
	const chainId = parseInt(chainIdHex)

	const isSupported = chainId in SUPPORTED_NETWORKS
	const networkName = isSupported ? SUPPORTED_NETWORKS[chainId] : "Unsupported"

	return {
		isSupported,
		networkName,
		supportedNetworks: SUPPORTED_NETWORKS,
	}
}
