# How to run a prompt

Everything today happens inside this one folder. Your own Claude setup, if you have one, is not changed by anything here.

1. Open the Claude app and go to the Code tab. Choose **Select folder** and pick your `dealer-ask` folder.
   - Choose **Local**, not Cloud. Your settings file and your database are on this laptop.
   - Set the permission mode to **Auto**, so it does not stop and ask while you are away from the desk.
   - The folder brings its own `CLAUDE.md` and its own `.claude/settings.json`: the model, the rules, and the list of
     commands the prompts are allowed to run. They apply in this folder only.
2. Open the prompt file for the block. The `PROMPTS` folder is in this folder; any text editor opens it, and so does
   the app. Copy everything under **Paste this**, paste it into the app as one message, and press Enter.
3. Walk away. Each prompt is written to run without you: Claude will not ask questions, will run the tests, and will
   stop at the checkpoint. Come back when the concept slides end.
4. Read the last message Claude wrote. It names what changed, which test proved it, and what to look at.
5. **Publish it.** Claude does not run git; you do this yourself and it takes two clicks. Open GitHub Desktop: the
   files Claude changed are listed on the left. Type the commit message Claude gave you, click **Commit to main**, then
   click **Push origin**. About a minute later your live site has rebuilt with the change.
6. Do the **Check** at the bottom of the prompt file. Green sticky note on your laptop if it matches, red if not.

If something goes wrong, paste the error back into the same conversation with the words "fix this and rerun the tests".
That is the whole engineering loop: build, test, fix, until green.

## Two things that are not Claude's job

- **The five settings.** `npm run setup` is a plain program you run yourself in the app's terminal (the Views menu, or
  Control and the backtick key). What you type goes straight into `.env.local`, which Claude is blocked from reading.
  Never type a key into the chat.
- **Publishing.** Claude never runs a git command; this laptop may not have git at all, and it does not need it. You
  commit and push in GitHub Desktop, which is also how you can see exactly what changed before it goes live.
- **Your own Claude setup.** If you already use Claude Code, your personal instructions still load, exactly as always.
  This folder's rules sit beside yours and apply only here. Nothing is written to your global settings. If your own
  rules make Claude ask before running a command, allow it and it carries on.
