"use client"

import { MoralisProvider } from "react-moralis"
import { NotificationProvider } from "@web3uikit/core"
import Header from "@/components/Header"
import LotteryEntrance from "@/components/LotteryEntrance"
import SafeConnectButton from "@/components/SafeConnectButton"
import { useState, useEffect } from "react"
import LoadingOverlay from "@/components/LoadingOverlay"

function PageContent() {
	const [stylesReady, setStylesReady] = useState(false)

	useEffect(() => {
		// 等待样式加载完成，或者用 setTimeout 模拟
		const timeout = setTimeout(() => setStylesReady(true), 100)
		return () => clearTimeout(timeout)
	}, [])

	const isAppReady = stylesReady

	if (!isAppReady) {
		return <LoadingOverlay message="Loading Web3 UI..." />
	}

	return (
		<>
			<Header />
			<SafeConnectButton />
			<LotteryEntrance />
		</>
	)
}

export default function Home() {
	return (
		<MoralisProvider initializeOnMount={false}>
			<NotificationProvider>
				<main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-6 pt-24">
					<PageContent />
				</main>
			</NotificationProvider>
		</MoralisProvider>
	)
}
