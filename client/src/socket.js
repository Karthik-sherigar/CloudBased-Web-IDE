import { io } from 'socket.io-client'

// Resolve server URL intelligently:
// 1. If running in a browser, connect back to the host that served the page on port 9000
//    (this makes the app work when you open http://localhost:5173 in your browser).
// 2. Otherwise fall back to VITE_SERVER_URL (set in Docker compose) or localhost.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:9000'

const socket = io(SERVER_URL)

export default socket