import { Terminal as XTerminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import socket from "../socket";

import "@xterm/xterm/css/xterm.css";

const Terminal = () => {
  const terminalRef = useRef();
  const isRendered = useRef(false);

  useEffect(() => {
    if (isRendered.current) return;
    isRendered.current = true;

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

    term.open(terminalRef.current);

    term.onData((data) => {
      socket.emit("terminal:write", data);
    });



    // Regex for bash prompt: root@xxxx:/path#
    function colorizePrompt(data) {
      // Only colorize prompt at the start of a line
      // Use ANSI 24-bit color: \x1b[38;2;236;74;4m ... \x1b[0m
      return data.replace(/^(root@[\w\d-]+:[^#\n]+#)/gm, '\x1b[38;2;236;74;4m$1\x1b[0m');
    }

    function onTerminalData(data) {
      // Colorize bash prompt with #EC4A04 (236,74,4)
      const colored = colorizePrompt(data);
      term.write(colored);
    }

    socket.on("terminal:data", onTerminalData);
  }, []);

  return <div ref={terminalRef} id="terminal" style={{ height: '100%', width: '100%' }} />;
};

export default Terminal;
