# 01b · Your group's colours (two minutes, right after prompt 01)

Your site should look like your group, not like Ridgeline. Fill in the blank with your dealer group's public website and
paste. Claude reads the site's colours and puts them in `DESIGN.md` and the stylesheet. If you would rather keep the
default look, skip this prompt.

## Paste this (fill in the blank first)

```
My dealer group's website is ___ . Read DESIGN.md. Then, without asking me anything:

1. Fetch that site's home page with WebFetch and find its primary brand colour (the one used for the logo, header, or main buttons) and, if there is one, a second accent colour. Give me the hex values and one line on where each came from. If you cannot fetch the site or cannot tell, keep the defaults, say so, and skip to step 4.
2. In app/globals.css change only --teal to the primary colour and --teal-soft to a light tint of it (about 12% of the colour mixed into white). Keep --ink, --amber, --green and --red exactly as they are; DESIGN.md explains why. Check that white text on --teal reads at a contrast ratio of at least 4.5:1; if it does not, darken the primary until it does and tell me the value you used.
3. Change the brand text in components/Nav.tsx from "Dealer Ask" to my group's name as the site writes it, followed by " Ask".
4. Write the website address and the two colours into the "Brand source" line of DESIGN.md.
5. Run npm run verify. Commit with the message "Brand: colours from our website" and push to origin main.
6. Finish with three lines: the two colours, the contrast ratio, and what I should see change on the live site.
```

## Check

- The live site's header and buttons show your colour within a minute or two of the push.
- The amber "did not report" flag is still amber. Brand never repaints a warning.
