# Saver

Saver is a Claude Code mod that keeps you from paying for your biggest model when a smaller one is enough.
It reads each prompt you send. Short, simple asks such as a typo fix, a rename, a translation or "what does this do" go to Haiku. Medium ones go to Sonnet. Anything that looks like design, refactoring, debugging or a long brief stays on your own model. It only ever moves to a cheaper model, never to a dearer one, and it leaves subagents alone.

A line above the prompt shows what you have spent and an estimate of what you saved this session, with a button to turn Saver off or on. `/saver` prints the same numbers.

Prices in `hooks/register.tsx` (`PRICES`) are estimates. Edit them to match your plan. The savings figure compares the tokens actually used with what the same tokens would have cost on your original model.

Install: copy this folder into a plugin directory and start Claude Code with `--plugin-dir <path>`, or ask Claude to load it as a mod.
