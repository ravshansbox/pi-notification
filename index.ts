import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

type Ctx = { mode: string; isIdle: () => boolean };

function osc777(title: string, body: string): string {
  return `\x1b]777;notify;${title};${body}\x07`;
}

function wrapForTmux(sequence: string): string {
  return `\x1bPtmux;${sequence.replaceAll('\x1b', '\x1b\x1b')}\x1b\\`;
}

export default function (pi: ExtensionAPI) {
  const notify = (_event: unknown, ctx: Ctx) => {
    if (ctx.mode !== 'tui') return;
    const sequence = osc777('Pi', 'Ready');
    process.stdout.write(process.env['TMUX'] ? wrapForTmux(sequence) : sequence);
  };
  pi.on('agent_settled', (event, ctx) => {
    if (event.aborted) return;
    notify(event, ctx);
  });
  pi.on('ui_prompt_start', (event, ctx) => {
    if (ctx.isIdle()) return;
    notify(event, ctx);
  });
}
