# Name-free voice lines

When the player picks their own names, the recorded voices cannot say them. For the ten lines that say "Thiri" or "Shwe", the game plays a second clip (`vo_XX-n.mp3`) that says "the girl" or "her cat" instead. The subtitles still show the player's names. Players who keep Thiri and Shwe hear the original clips.

How the clips were made:
- **Narrator lines** were generated with Kokoro-82M (kokoro-onnx, Apache-2.0), with a voice mix matched to the original narrator: 60% `bf_emma` + 40% `bf_isabella`, speed 0.9, loudness matched to the other narrator clips.
- **Thiri's and Calm's lines** are the original recordings with the name cut out.

## Intro (`intro/`)

| File | Speaker | Original | Name-free version |
|---|---|---|---|
| `vo_00-n.mp3` | Narrator | The school drawing contest. Thiri drew the one she loves most: her cat, Shwe. | The school drawing contest. The girl drew the one she loves most: her cat. |
| `vo_03-n.mp3` | Narrator | She walked home without a word. Shwe stayed close the whole way. | She walked home without a word. Her cat stayed close the whole way. |
| `vo_04-n.mp3` | Thiri | Don't look at me like that, Shwe. I'm fine. | Don't look at me like that. I'm fine. |
| `vo_10-n.mp3` | Narrator | But Shwe noticed. Cats can see what people can't. | But her cat noticed. Cats can see what people can't. |
| `vo_16-n.mp3` | Calm | Goodbye, Thiri. | Goodbye. |
| `vo_21-n.mp3` | Narrator | So Shwe leapt into the Night Side, to bring every feeling home before sunrise. | So her cat leapt into the Night Side, to bring every feeling home before sunrise. |

## Ending (`ending/`)

| File | Speaker | Original | Name-free version |
|---|---|---|---|
| `vo_02-n.mp3` | Narrator | Behind Shwe, the Moodlings floated in, one by one, glowing brighter than ever. | Behind her cat, the Moodlings floated in, one by one, glowing brighter than ever. |
| `vo_03-n.mp3` | Narrator | Colour poured back into the room. And Thiri woke up. | Colour poured back into the room. And the girl woke up. |
| `vo_04-n.mp3` | Thiri | Mmh… good morning, Shwe. I had the strangest dream… | Mmh… good morning. I had the strangest dream… |
| `vo_16-n.mp3` | Thiri | Thank you, Shwe. I'm ready to try again. | Thank you. I'm ready to try again. |
