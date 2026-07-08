# Issue tracker: GitHub

Issues and PRDs for this repo live canonically as GitHub issues. Use the `gh` CLI for issue operations.

Repository: `Gil-1/rusty-art`

## Pull requests as a triage surface

PRs as a request surface: no.

## Conventions

- Create: `gh issue create --title "..." --body "..."`
- Read: `gh issue view <number> --comments`
- List: `gh issue list --state open --json number,title,body,labels,comments`
- Comment: `gh issue comment <number> --body "..."`
- Label: `gh issue edit <number> --add-label "..."`
- Close: `gh issue close <number> --comment "..."`

## Local scratch files

Tracked `.scratch/**` PRD and issue files are historical planning records. Do not treat them as the current issue tracker or create new work there unless the user explicitly asks for local scratch artifacts.
