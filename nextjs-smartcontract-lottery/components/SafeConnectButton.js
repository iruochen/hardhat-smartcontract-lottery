"use client"
import { useState, useEffect } from "react"
import { ConnectButton } from "@web3uikit/web3"

export default function SafeConnectButton() {
	// const [ready, setReady] = useState(false)

	// useEffect(() => {
	// 	// 等待组件挂载 & CSS加载完毕
	// 	const timeout = setTimeout(() => {
	// 		setReady(true)
	// 	}, 100)

	// 	return () => clearTimeout(timeout)
	// }, [])

	// if (!ready) {
	// 	// Skeleton Loader 或隐藏
	// 	return (
	// 		<div className="fixed top-5 right-5 z-40">
	// 			<div className="w-[180px] h-[42px] rounded-full bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-pulse shadow-md border border-gray-500/30 backdrop-blur-sm"></div>
	// 		</div>
	// 	)
	// }

	return (
		<ConnectButton moralisAuth={false} className="fixed top-5 right-5 z-10" />
	)
}
