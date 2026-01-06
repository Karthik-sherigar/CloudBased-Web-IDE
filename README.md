# Cloud-Based Web IDE

A powerful, containerized web-based Integrated Development Environment (IDE) that allows you to write, run, and manage code directly in your browser.

## Features

- **Multi-Terminal Support**: Access multiple terminal instances directly from the browser.
- **File Management**: Create, edit, and navigate files in a dedicated workspace.
- **Language Support**: Built-in support for multiple programming languages.
- **Containerized Environment**: Isolated execution using Docker.
- **Real-time Synchronization**: Instant updates between the editor and the server.

---

## 🚀 Quick Start with Docker

The easiest way to get started is using Docker Compose.

### Prerequisites
- [Docker](https://www.docker.com/get-started) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) installed.

### Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Karthik-sherigar/CloudBased-Web-IDE.git
   cd CloudBased-Web-IDE
   ```

2. **Run the application**:
   ```bash
   docker-compose up --build
   ```

3. **Access the IDE**:
   - Web Interface: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:9000](http://localhost:9000)

---

## 🛠️ Local Development Setup

If you prefer to run the project without Docker, follow these steps:

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```text
cloud-ide/
├── client/          # Vite/React Frontend
├── server/          # Node.js/Express Backend
├── docker-compose.yml
└── README.md
```

## 📜 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
