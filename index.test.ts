import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import extension from './index.ts';

type Ctx = { mode: string; isIdle: () => boolean };
type Handler = (event: unknown, ctx: Ctx) => unknown;

function settle(
  env: Record<string, string | undefined>,
  event = 'agent_settled',
  mode = 'tui',
  idle = false,
  payload: Record<string, unknown> = {},
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
    handlers.get(event)?.({ type: event, ...payload }, { mode, isIdle: () => idle });
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
  for (const mode of ['print', 'json']) {
    assert.equal(settle({}, 'agent_settled', mode), '', mode);
  }
});

test('sends an OSC 777 notification when a UI prompt starts', () => {
  assert.equal(settle({}, 'ui_prompt_start'), '\x1b]777;notify;Pi;Ready\x07');
});

test('does not notify in RPC mode', () => {
  assert.equal(settle({}, 'agent_settled', 'rpc'), '');
});

test('does not notify when the user aborts the run', () => {
  assert.equal(settle({}, 'agent_settled', 'tui', false, { aborted: true }), '');
});

test('does not notify when a UI prompt starts while the agent is idle', () => {
  assert.equal(settle({}, 'ui_prompt_start', 'tui', true), '');
});
