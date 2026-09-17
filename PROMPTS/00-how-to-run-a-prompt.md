# How to run a prompt

1. Open a terminal in the project folder and start Claude Code with the kit's settings:
   ```bash
   claude
   ```
   The first time, Claude Code asks whether you trust this folder. Answer **Yes**. That switches on the folder's
   `.claude/settings.json`, which pins the model to Claude Opus, pre-approves the commands the prompts need, and blocks
   the ones they never need. After that you should not see permission questions. If you do, answer "yes, and don't ask again".

   Already use Claude Code? Your own `~/.claude/CLAUDE.md` (your personal memory file) still applies here, next to the
   kit's `CLAUDE.md`. That is fine: the kit lives in its own folder, and its file says what to do in this folder. You
   do not need to edit your memory file. If your memory file tells Claude to ask before running commands, the prompts
   will pause for a "yes"; answer yes and it continues.
2. Open the prompt file for the block, copy everything under **Paste this**, paste it into Claude Code, press Enter.
3. Walk away. Each prompt is written to run without you: Claude will not ask questions, will run the tests, and will
   stop at the checkpoint. Come back when the concept slides end.
4. Read the last message Claude wrote. It names what changed, which test proved it, and what to look at.
5. Do the **Check** at the bottom of the prompt file. Green sticky note on your laptop if it matches, red if not.

If something goes wrong, paste the error back into the same Claude Code session with the words "fix this and rerun the
tests". That is the whole engineering loop: build, test, fix, until green.
