# Parallax Protocol

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

Parallax Protocol is a partial-information dialogue game for [Pollinations Quest #19178](https://github.com/pollinations/pollinations/issues/19178). Two AI agents receive different halves of a distress signal. The player guides their conversation for three exchanges, then chooses the only rescue channel supported by both agents' evidence.

## How it works

- CIPHER and ECHO run on two independently selectable Pollinations text models.
- Each agent receives a private evidence card, the shared transcript, and the player's current relay directive.
- One direct player click advances one exchange and makes two bounded model requests.
- The correct channel is fixed by the incident data, so the game validates the answer in code rather than asking a model to judge itself.
- A scripted zero-Pollen demo is available before connecting a wallet.
- Live play uses a capped temporary BYOP key from `<polli-connect>`; no secret key ships in the repository.

## Development

```bash
npm test
```

The deployable static application is in `dist/`.
