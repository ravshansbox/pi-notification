# pi-notification

OSC 777 terminal notification extension for pi.

## Install

```bash
pi install npm:@ravshansbox/pi-notification
```

Add `-l` to install it in project settings.

## Usage

Pi loads the extension from `./index.ts` and sends an OSC 777 desktop notification (`Pi: Ready`) in interactive mode when the agent has finished or an extension prompt, such as a question, is waiting for input while the agent is running.

OSC 777 works in terminals such as Ghostty, WezTerm, iTerm2 and rxvt-unicode.

Inside tmux, the sequence is wrapped for passthrough. Enable it in your tmux config:

```tmux
set -g allow-passthrough on
```

## Development

```bash
npm install
npm run check
```
