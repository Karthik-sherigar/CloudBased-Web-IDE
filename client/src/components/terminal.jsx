import { Terminal as XTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useEffect, useRef } from "react";
import socket from "../socket";

import "@xterm/xterm/css/xterm.css";

const Terminal = ({ onReady }) => {
  const terminalRef = useRef();
  const termInstanceRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    // Don't initialize if already initialized
    if (termInstanceRef.current) {
      console.log('Terminal already initialized, skipping');
      return;
    }

    // Ensure the ref is available
    if (!terminalRef.current) {
      console.error('Terminal ref not available');
      return;
    }

    console.log('Initializing XTerm terminal...');

    try {
      const term = new XTerminal({
        rows: 20,
        cols: 80,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#ffffff',
          selection: '#264f78',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5'
        },
        fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", "Consolas", monospace',
        fontSize: 13,
        fontWeight: 'normal',
        fontWeightBold: 'bold',
        lineHeight: 1.2,
        letterSpacing: 0,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 1000,
        tabStopWidth: 4,
        bellStyle: 'none',
        allowTransparency: false,
        allowProposedApi: true
      });

      console.log('XTerm instance created');
      termInstanceRef.current = term;

      // Add FitAddon to properly size terminal
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      fitAddonRef.current = fitAddon;
      console.log('FitAddon loaded');

      term.open(terminalRef.current);
      console.log('Terminal opened in DOM');

      // Fit terminal to container with a small delay
      setTimeout(() => {
        try {
          fitAddon.fit();
          console.log('Terminal fitted to container');
        } catch (e) {
          console.warn('Failed to fit terminal:', e);
        }
      }, 100);

      // Handle window resize
      const handleResize = () => {
        try {
          if (fitAddonRef.current) {
            fitAddonRef.current.fit();
          }
        } catch (e) {
          console.warn('Failed to fit terminal on resize:', e);
        }
      };
      window.addEventListener('resize', handleResize);

      term.onData((data) => {
        socket.emit("terminal:write", data);
      });

      // Regex for bash prompt: root@xxxx:/path#
      function colorizePrompt(data) {
        return data.replace(/^(root@[\w\d-]+:[^#\n]+#)/gm, '\x1b[38;2;236;74;4m$1\x1b[0m');
      }

      function onTerminalData(data) {
        console.log('Terminal received data:', data.substring(0, 50));
        const colored = colorizePrompt(data);
        if (termInstanceRef.current) {
          termInstanceRef.current.write(colored);
        }
      }

      socket.on("terminal:data", onTerminalData);

      // Request initial prompt when terminal is ready
      const onConnect = () => {
        console.log("Terminal: Socket connected, requesting initial prompt");
        socket.emit("terminal:write", "\n");
      };

      socket.on("connect", onConnect);

      // Notify parent that terminal is ready
      if (onReady) {
        onReady(true);
      }

      // If already connected, request prompt immediately
      if (socket.connected) {
        console.log("Terminal: Already connected, requesting initial prompt");
        socket.emit("terminal:write", "\n");
      }

      // Cleanup function - only runs on unmount
      return () => {
        console.log('Cleaning up terminal...');
        window.removeEventListener('resize', handleResize);
        socket.off("terminal:data", onTerminalData);
        socket.off("connect", onConnect);
        if (termInstanceRef.current) {
          termInstanceRef.current.dispose();
          termInstanceRef.current = null;
        }
        fitAddonRef.current = null;
      };
    } catch (error) {
      console.error('Error initializing terminal:', error);
    }
  }, []); // Empty dependency array - only run once

  return <div ref={terminalRef} id="terminal" style={{ height: '100%', width: '100%' }} />;
};

export default Terminal;

