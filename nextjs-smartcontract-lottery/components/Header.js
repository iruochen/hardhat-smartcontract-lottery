"use client"

export default function Header() {
	return (
		<header
			className="
        fixed top-0 left-0 right-0 
        flex justify-between items-center 
        p-5 bg-white/10 backdrop-blur-sm 
        border-b border-white/20 
      "
			style={{ maxHeight: "none", overflow: "visible" }}
		>
			<h1 className="text-2xl font-semibold text-white drop-shadow-md">
				🎰 Decentralized Lottery
			</h1>
		</header>
	)
}
