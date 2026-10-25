import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

function osc777(title: string, body: string): string {
  return `\x1b]777;notify;${title};${body}\x07`;
}

function wrapForTmux(sequence: string): string {
  return `\x1bPtmux;${sequence.replaceAll('\x1b', '\x1b\x1b')}\x1b\\`;
}

export default function (pi: ExtensionAPI) {
  const notify = (_event: unknown, ctx: { hasUI: boolean; mode: string }) => {
    if (!ctx.hasUI || ctx.mode !== 'tui') return;
    const sequence = osc777('Pi', 'Ready');
    process.stdout.write(process.env['TMUX'] ? wrapForTmux(sequence) : sequence);
  };
  pi.on('agent_settled', notify);
  pi.on('ui_prompt_start', notify);
}
