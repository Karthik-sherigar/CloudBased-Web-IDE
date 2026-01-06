import { io } from 'socket.io-client'

// Resolve server URL intelligently:
// 1. If running in a browser, connect back to the host that served the page on port 9000
//    (this makes the app work when you open http://localhost:5173 in your browser).
// 2. Otherwise fall back to VITE_SERVER_URL (set in Docker compose) or localhost.
let SERVER_URL = 'http://localhost:9000'
try {
	if (typeof window !== 'undefined' && window.location && window.location.hostname) {
		const proto = window.location.protocol || 'http:'
		SERVER_URL = `${proto}//${window.location.hostname}:9000`
	} else if (import.meta?.env?.VITE_SERVER_URL) {
		SERVER_URL = import.meta.env.VITE_SERVER_URL
	}
} catch (e) {
	// silent fallback to localhost
}

const socket = io(SERVER_URL)

export default socket