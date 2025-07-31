"use client"

// import ManualHeader from "@/components/ManualHeader"
import { MoralisProvider } from "react-moralis"
import Header from "@/components/Header"
import LotteryEntrance from "@/components/LotteryEntrance"

export default function Home() {
	return (
		<MoralisProvider initializeOnMount={false}>
			<main className="bg-violet-100 min-h-screen ">
				<Header />
				321321
				<LotteryEntrance />
			</main>
		</MoralisProvider>
	)
}
