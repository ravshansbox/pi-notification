import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import extension from './index.ts';

type Handler = (event: unknown, ctx: { hasUI: boolean }) => unknown;

function settle(
  env: Record<string, string | undefined>,
  hasUI = true,
  event = 'agent_settled',
): string {
  const handlers = new Map<string, Handler>();
  const pi = {
    on: (event: string, h: Handler) => {
      handlers.set(event, h);
    },
  } as unknown as ExtensionAPI;
  extension(pi);

  const original = { TMUX: process.env['TMUX'] };
  const write = process.stdout.write;
  let output = '';
  process.stdout.write = ((chunk: string) => {
    output += chunk;
    return true;
  }) as typeof process.stdout.write;
  if (env['TMUX'] === undefined) delete process.env['TMUX'];
  else process.env['TMUX'] = env['TMUX'];
  try {
    handlers.get(event)?.({ type: event }, { hasUI });
  } finally {
    process.stdout.write = write;
    if (original.TMUX === undefined) delete process.env['TMUX'];
    else process.env['TMUX'] = original.TMUX;
  }
  return output;
}

test('sends an OSC 777 notification when the agent settles', () => {
  assert.equal(settle({}), '\x1b]777;notify;Pi;Ready\x07');
});

test('wraps the notification for tmux passthrough', () => {
  assert.equal(
    settle({ TMUX: '/tmp/tmux-501/default,1,0' }),
    '\x1bPtmux;\x1b\x1b]777;notify;Pi;Ready\x07\x1b\\',
  );
});

test('does not notify without a UI', () => {
  assert.equal(settle({}, false), '');
});

test('sends an OSC 777 notification when a UI prompt starts', () => {
  assert.equal(settle({}, true, 'ui_prompt_start'), '\x1b]777;notify;Pi;Ready\x07');
});
