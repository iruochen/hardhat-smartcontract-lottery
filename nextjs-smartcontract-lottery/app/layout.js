import "./globals.css"

export const metadata = {
	title: "Smart Contract Lottery",
	description: "Our Smart Contract Lottery",
}

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	)
}
