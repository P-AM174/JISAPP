# How to write a Jisapp column in English (for AI)

Used when the admin screen (/admin/columns) copies the English request ("AIに頼む" → English).
Assumes an AI that can read this whole repository (ChatGPT / Claude projects, etc.).
English posts are published at `/en/column/<name>`.

## Facts

- **Check every Jisapp feature in this repository's code before writing about it.** Don't write about things that aren't in the code or are only planned.
  - e.g. saving data (`window.Jisapp.saveData` / `loadData`), group sharing (`window.Jisapp.shared`), Google Drive files (`window.Jisapp.drive`), publishing, adding to the home screen
  - App rules: `lib/agent/prompts.ts`, `lib/playground/prompt-template.ts`. Service description: `lib/seo/llmo.ts`, `lib/seo/site.ts` (the `_EN` texts)
- Pricing and limits: only what the code and `app/[locale]/terms` say
- No unverifiable numbers ("done in 3 seconds", "10,000 users")
- Don't criticize other services
- Names and amounts in examples are fictional — say so
- Write the brand as **Jisapp** (never the katakana name)

## Reader and tone

- People who have never built an app. Avoid jargon (API, deploy, database) or explain it in plain words
- Friendly, conversational, like a personal blog post. Short sentences
- Open with **a moment that happened to someone** ("Every trip ends the same way: someone pulls out a calculator.") — not with an explanation or the answer
- Paragraphs of 2–3 sentences. About 900–1,200 words
- Use examples that make sense outside Japan (WhatsApp group chats, carpools, potlucks, club dues, chores…)

## Structure

0. First, the "In this post" box (3 bullets: the app you'll make, how long it takes, what you need)
   ```
   :::learn In this post
   - How to make an app that settles trip costs in the fewest transfers
   - About 5 minutes
   - Your usual AI and Jisapp (free)
   :::
   ```
   A table of contents is added automatically right after this box
1. The moment (who, which chore, what happened — with a number)
2. What's annoying about it (up to 3 bullets)
3. How an app makes it easier (one main benefit, with a number)
4. The one message to send your AI (a ready-to-use example as a quote `> `). If there is a longer prompt used to build the app, put it right under the app card (`::app[ID]`) with `:::prompt The prompt for this app` … `:::`
5. Pasting it into Jisapp and publishing (mention group sharing if the app is used by a group)
6. Wrap-up
7. The last line: `::button[Make an app on Jisapp](/playground)`

## Formatting (only these marks become formatting; HTML is not allowed)

| Write | Shows as |
|---|---|
| `# Title` (first line only) | Goes into the title field |
| `## Heading` / `### Subheading` | Headings |
| `**text**` | Bold |
| `- item` / `1. item` | Bullets / numbered list |
| `> text` | Quote (e.g. the message to the AI) |
| `[text](https://…)` / `[text](/playground)` | Link |
| `---` | Divider |
| `::app[APP ID]` | A Jisapp app card (the ID is the part after /apps/) |
| `::youtube[video URL]` | YouTube video |
| `::button[text](/playground)` | Button |
| `:::prompt Title` … `:::` | Collapsible prompt with a copy button (shown exactly as written) |
| `:::fold Title` … `:::` | Collapsible section (normal formatting inside) |
| `:::learn In this post` … `:::` | The grey box at the top (one per post, first) |

Don't add images (they're added later in the admin screen).

## Reply format

- Reply with the post only. No preface, no closing remarks
- First line: `# Title` (about 60 characters max; the moment or the benefit)
- After the post, separately, add these three lines (they're moved into the publish settings automatically when pasted):
  - `説明：` a description for search results (about 150 characters, in English)
  - `Xの投稿文：` a post for X (about 200 characters, in English; the link is added automatically)
  - `タグ：` 1–3 tags separated by commas. Preset tags get a color and an icon: Travel, Sports, PTA, School, Family, Clubs, Work, Money

(The labels `説明：`, `Xの投稿文：`, `タグ：` stay in Japanese so the admin screen can find them; the text after them is English.)
