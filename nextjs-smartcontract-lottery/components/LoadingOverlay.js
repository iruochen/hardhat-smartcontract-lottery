"use client"

export default function LoadingOverlay({ message = "Loading..." }) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="flex flex-col items-center space-y-4 text-white">
				<div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
				<p className="text-lg font-semibold">{message}</p>
			</div>
		</div>
	)
}
