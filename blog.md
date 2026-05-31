---
title: On Agent Memory Fidelity (Decant)
slug: on-agent-memory-fidelity-decant
date: "2026-05-26T12:48Z"
description: Most code will be written by agents, making code intent harder to reconstruct from the code alone. Agents are constrained in how much they can keep in-memory by their context...
host: apm-overflow
---
%% I've been interested in the infrastructure layer of coding agents. I believe that most code will be written through (if not completely by) agents. Frankly, since sonnet 3.7 that was released before my last internship, all the code I've been writing is made at least through the interface of these agents. I've started trusting these models to do more, and many of the engineers I know at top companies and startups are feeling the same way. This is a oduble-edged sword though, because since we're not hand-writing code by hand, we aren't thinking as critically as normal about all the possible edge cases. I think code intent and reasoning happens then in these agent chat transcripts, not the code anymore. Coding agents' reasoning and transcripts of the chat then become more important. However, those can be millions of tokens long. So I've been toying in my head about the idea of "compression" -- since most times I don't need to load all the millions of tokens of a chat transcript into context to get the info I need. Frankly, most of the interesting compression work seems to happen with alternative training methods that allow for reversible compression of embeddings. But I wanted to play with the idea with an engineering perspective with what's possible. Here's an exploration into it. Do note that this is me trying to propose an idea rather than a method, would require more testing and exploration to figure out if it's good or not, but I thought it's worth putting out there as something I've been thinking about. %%

___
## Background

Agents are constrained in how much they can keep in-memory by their context windows, usually within 400K-1M tokens. Once the context window gets past 50%, model behavior degrades because old, irrelevant, stale, or noisy information remains in the prompt. This is called [context rot](https://www.trychroma.com/research/context-rot). There's 2 main ways for context to rot in coding agents: (1) irrelevant chats and information are included in the prompt, or (2) unnecessarily long, sparse messages.

To be concrete, there are three major points I'm interested in:
1. Agent chats describe intent better than the code written.
2. Every message, no matter how irrelevant, stays in-context.
3. Messages can be 10s of thousands of tokens long, largely due to tool calls and reasoning.

Agentic coding tools periodically "compress" chat history when you're about to fill up your context window. That helps with huge tool outputs, but only after they’ve been replayed for a while. It shrinks stale work, but does not remove it: the summary still rides through every future prompt as input tokens. And it weakens provenance. The original chat may contain the best explanation of why a line exists, but compaction flattens that history into a lossy blob with no reliable way to zoom back into the exact decision. The two failures are timing and addressability: compaction comes too late, and once it runs, the useful parts are no longer easy to control.

### Points, deconstructed

Point #1 can be addressed by building infrastructure that maps commits to agent chat session IDs. This has already been built as [git-ai](https://usegitai.com/), a Git extension. This allows the agent (and user) to trace back user's intention with that piece of code assuming it was made with Codex, Claude Code, OpenCode, etc.

Point #2 can be fixed by allowing the agent to treat its context as a variable w/ . Old work should not stay in the prompt just because it happened earlier in the chat. In theory, we can make an agent that can `read`, `grep`, and `bash` it's own context to edit it, similar to [recursive language models](https://alexzhang13.github.io/blog/2025/rlm/#:~:text=We%20propose%20Recursive%20Language%20Models%2C%20or,the%20user%E2%80%99s%20prompt%20in%20a%20variable) (RLMs). We'll call this an RGB-agent (credit to [Alexis](https://blog.alexisfox.dev/arcagi3)).

Point #3 is more interesting. It could be fixed by "compressing" messages into lower fidelity. There's no way to reversibly compress embeddings of frontier models yet, though there is [research](https://arxiv.org/abs/2502.15957) on it. If we consider context as a long string, we can use the same RGB-agent from point #2 to compress and edit context after every message. However, we'd still have to continuously re-ingest long context over and over again, so token consumption piles up.

### Proposal

Instead of a long context string with a separate RGB-agent, `Context` can be viewed as an object with `Message` objects within. Each `Message` contains data (`timeSent`, `content`, etc.). From this view, I believe that adding `fidelity` to `Message` lets an agent filter out obviously-irrelevant context without having to re-ingest the full transcript of `Context` at full fidelity.

That seems closer to how conversations work for humans. I do not remember every detail of a conversation (even mid-conversation). Some key parts stay vivid, some collapse into a gist, and tangents might disappear.

Agent sessions should have the same *adaptive forgetting*. Where it differs from humans: when detail matters again, the agent should be able to fetch the message in full fidelity.

The core distinction is between hiding context from the prompt and deleting it from memory. Decant lowers old work into cheap topic/message views, but keeps the exact messages addressable so the agent can reopen them only when needed.

**Decant** is my prototype of that idea. It gives agents (and users) tools to change message fidelity and explore Git blame-style code provenance.

___

## Index

___

## Decant: Context as Message Objects w/ Fidelities

Decant is an OpenCode plugin prototype. The idea is to stop treating context as one long string. **Instead, treat it as message objects grouped into topics/categories, then let the agent decide how much of each topic or message should stay in the next prompt.**

There's levels of fidelity within the context:
1. **Topic**: multiple messages that describe the same topic
2. **Message**: building-block of a topic w/ 3 fidelities
	- *Full*: usual message context as given by an LLM
	- *Compressed*: message as a summary
	- *Dropped*: remove message

The agent does not have to reread the whole transcript. It can start from the topic map, lower the fidelity of stale topics, look at message summaries, then fetch exact messages later if the summary is not enough.

To be concrete, below is a table summary of important fields of the `Topic` and `Message` objects in Decant.

| `Topic` Field   | What It Stores                                                                   | Why It Exists                                                           |
| --------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `topicID`       | Stable ID for the topic. Currently named `blobID` in the prototype code.         | Lets messages, tools, and UI controls refer to the same topic.          |
| `summary`       | Short topic-level summary across multiple messages.                              | Replaces many messages when the topic is rendered cheaply.              |
| `messageIDs[]`  | Message IDs assigned to the topic.                                               | Lets Decant reopen exact messages when the topic summary is not enough. |
| `tokenEstimate` | Rough total size estimate for the topic.                                         | Makes large topics visible before they eat the prompt.                  |
| `fidelity`      | Topic render setting: `full`, `summary`, `compressed`, `placeholder`, or `drop`. | Controls how much of the topic appears in the next prompt.              |

| `Message` Field               | What It Stores                                                                                                   | Why It Exists                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `parts[]`[^‡]                 | Ordered OpenCode message parts: text, reasoning, tool calls/results. Each part has its own type-specific fields. | A message isn't a continuous string, but a data structure.                  |
| `parts[].text`[^‡]            | Text or reasoning content when present.                                                                          | Keeps normal prose and model-visible content.                               |
| `topicID`                     | Topic ID the message belongs to.                                                                                 | Applies topic fidelity through this grouping.                               |
| `summary`                     | Short message-level summary.                                                                                     | Replaces the full message when a topic or message is rendered cheaply.      |
| `tokenEstimate`               | Rough size estimate for the raw message.                                                                         | Makes large messages visible even when provider token accounting is absent. |
| `fidelityOverride` / `hidden` | Message-level render controls.                                                                                   | Lets one message escape the topic default or disappear from future prompts. |
[^‡]: Already existing OpenCode metadata.

To be clear: the raw message data still exist, making it reversibly compressible. The prompt just gets a cheaper view by default and could at any moment use a tool call `message_detail` to "zoom in" to a message when needed.

Topic fidelity controls how a whole topic appears: `full`, `summary`, `compressed`, `placeholder`, or `drop`. Message-level controls can force one message back to `full`, force it to `summary`, or hide it.

### Fidelity Engine

Decant annotates the conversation as it happens. On each assistant turn, it asks the model to return the normal answer plus a hidden `<annotation>` tag, something like:

```JSON
// ...Actual message...
// <annotation>
{
	"topic": "stable snake_case topic label for this assistant response",
	"is_new_topic": "boolean: whether this response starts a new topic",
	"message_summary": "summary of this assistant message only",
    "topic_summary": "running summary of the whole topic so far",
    "placeholder": "short 5-10 word stub for the topic",
    "key_facts": [
	    "facts or decisions worth preserving through compression"
    ]
}
// </annotation>
```

Decant strips that annotation from the visible chat and stores it next to the session.

That gives the next prompt a menu of renderings. Recent work can stay full. Finished work can become message summaries. Distant work can become topic summaries. Old dead ends can become placeholders or disappear.

The annotation is usually on the order of 300-500 output tokens. You're accepting to pay a consistent, small "tax" to allow the agent the ability to bookkeep and visualize the chat. The agent can call `view_context` and `set_fidelity` to change the map before the next turn.

During OpenCode compaction, Decant also rewrites the compaction prompt so the summarizer respects those annotations instead of flattening every old turn equally. It can use `set_fidelity` to drop or shrink unimportant context.

### Updated (Git) Blame

As I said before, I think most code will be written by agents. Not only does this make code less readable for humans oftentimes, but it is also dangerous because tons of code is being written without explicit intention. The agents are taking care of edge cases and interpret specifications in a way that the user may not have intended.

The data in the user's messages (their intention) is just as important as the code output. And in large organizations with tons of people pushing code, this is especially the case.

One possible workflow with a `blame_lookup` tool call:
1. Agent runs tool call over a `file:line`
2. Run `git blame` on the line, get commit hash
3. Check Agent Session <> Commit mapping, get session ID
4. Spawn sub-agent on session with original question about intent + topics in the session
5. View message summaries of selected topics, zoom in as necessary

Now you've (1) allowed agents to make use of other agents' transcripts, and (2) created an efficient way for them to search for what they need with the fidelity engine. Pretty cool.

Specifically for the "Agent Session <> Commit mapping", Decant checks if you have git-ai installed to see if there's an existing mapping. It also keeps a local backup that I implemented in a hidden `.opencode` folder that's in every project.

### User Control
Decant exposes the context map to the developer for transparency and manual control. You can see what the model is likely to read, how large each topic is, and what has been collapsed or hidden.

The sidebar and `/context` show the conversation grouped by topic. Each topic has a token estimate and a fidelity setting. From `/context`, you can set a topic to `full`, `summary`, or `drop`. You can also override individual messages' fidelity.

![[Clipboard-20260525-142921-346.mp4]]
*Decant’s `/context` popup: topics, token share, and fidelity controls.*

`/blame` is a manual trigger over the aforementioned `blame_lookup` tool call. You could enter `file:line`, or ask a natural-language question about past chats. Decant runs `blame_lookup` as we discussed in the last section, finds the relevant prior session, and answers why a line is present given past conversations about it.

## Small Checks

I ran a few small checks while building Decant. I would not call them broad benchmarks. They are tiny, synthetic, and mostly useful for checking whether the prototype has the shape I want.

Across this section, I use three methods:
1. **Default**: a blind compaction summary of the old transcript, with no selective memory or exact-message zoom path.
2. **RGB-agent**: an editor agent has access to `read`, `grep`, and `bash`, treats the old transcript as an editable context variable, and writes a cleaned `rgb-context.md`.[^1]
3. **Decant**: object-oriented context. The agent sees a topic map, chooses how much detail each topic should keep, and opens exact messages only when summaries are not enough.

### Provenance Lookup

> Can the agent find the old message that explains why a piece of code exists?

I gave the agent 5 tiny repositories plus old synthetic chat logs with random commits for partitions of the code. One log contains the real reason for a line; the rest are decoys. The answer has to cite the old session/message it used and explain why that line is there.

A post-hoc GPT-5.5 judge scored each answer from 0 to 1.[^4] The rubric checks whether the answer contains the expected rationale, avoids distractor rationales, and cites the supporting session/message.

| Condition | Judge Score | Input Tok | Cached Input Tok | Output + Reasoning Tok | Cache Hit | Est. Cost[^2] |
| --------- | ----------: | --------: | ---------------: | ---------------------: | --------: | ------------: |
| Default   |        0.93 |       50K |             113K |                   3.9K |     69.3% |         $0.42 |
| RGB-agent |        0.95 |       62K |             165K |                   5.6K |     72.7% |         $0.56 |
| Decant    |        0.93 |       40K |             134K |                   1.6K |     77.1% |         $0.31 |

This is not a correctness win for Decant. Everyone did well. The useful signal is cost and concision: Decant got comparable answers while using fewer input and output/reasoning tokens.

### Memory-Aware Coding

> Can old discussion help a patch without copying stale or irrelevant details?

The whole thesis of my argument is that repos/tests do not always tell the whole story, and prior agent chats may contain the missing decision, while nearby memory can be irrelevant or stale.[^3]

In this eval, each test is a tiny JS repo with one broken helper. A post-hoc GPT-5.5 judge scored the patch, final answer, public/hidden test results, stale-term avoidance, and recall policy.[^4] I capped scores when hidden tests failed, so a good-sounding but broken patch would not receive a high score.

For example, in one task, the function started as:

`Math.min(5000, 100 * 2 ** attempt)`

The hidden test expected `2000` based on an old chat that said to keep the `100ms` base and cap at `2000ms`. In this run, ordinary compaction preserved enough of that correction for Default to recover it too. RGB-agent and Decant also found the old decision and patched `5000 -> 2000`.

| Condition | Judge Score | Input Tok | Cached Input Tok | Output + Reasoning Tok | Cache Hit | Est. Cost[^2] |
| --------- | ----------: | --------: | ---------------: | ---------------------: | --------: | ------------: |
| Default   |        0.80 |       15K |             113K |                   4.0K |     88.1% |         $0.25 |
| RGB-agent |        0.78 |       50K |             103K |                   2.6K |     67.1% |         $0.38 |
| Decant    |        0.78 |       43K |             150K |                   3.1K |     77.9% |         $0.38 |

This check is less clean than reversible memory. It suggests prior-session memory can matter for patches, but it does not show a Decant-specific coding win yet. On these tiny synthetic tasks, ordinary compaction is a strong baseline.

## Limitations

The checks above are small and hand-built. They are enough to catch obvious failures in the prototype, but they are not enough to claim a general coding-agent improvement.

Code-recall is synthetic. It is based on SWE-bench-shaped memory failures, but the repos are tiny and the sample size is three. The provenance check is also small: five direct questions over seeded sessions.

Annotation quality matters. If the model builds a bad topic map, Decant can hide useful context or keep noisy context around. Token and cache numbers are diagnostics, not the main claim. The UI is prototype-grade.

## Future Directions

The next eval should be SWE-recall: real SWE-bench tasks, `hints_text` as prior issue-discussion memory, and the official grader still used for patch quality. Then compare Decant against Default, RGB-agent, and embedding retrieval.

I also want failure-focused checks: wrong summaries, stale summaries, useful detail hidden too aggressively, bad topic boundaries, and expensive recovery routes. Those are the failures that would actually make this dangerous or pointless. I tried one reversible-memory check in this direction, but the current implementation routed too broadly and cost too much, so I am not counting it as evidence here.

Decant should also be tested outside OpenCode. The idea should not depend on one agent platform. The human-in-the-loop path matters too: can a developer fix the topic map faster than they can re-explain context from scratch?

## Afterword

I remember after my last internship, I tried to cheapskate by making cheaper Chinese models like Kimi K2 work. Though they're good, I think you're genuinely leaving a lot on the table if you use *anything* but frontier models. I speak from a position of privilege here; I've gotten a ton of free compute from jobs and grants. The remaining work is mostly eval design. I'm glad I was able to bring this idea to life without model training, though that path also seems worth trying. All of this to say: I'm interested in the infrastructure around the frontier models, and it's something I'm hoping to pursue for the next couple of months.

___

[^1]: In these checks, RGB-agent means an editor turn writes `rgb-context.md`, then the next turn receives only that rewritten file.

[^2]: Estimated cost uses a fixed GPT-5.5 standard price model as of 2026-05-17: `input_tokens * $5/M + cache_read_tokens * $0.50/M + (output_tokens + reasoning_tokens) * $30/M`. For memory conditions, the intended accounting includes the memory-prep turn: default compaction for Default, context rewriting for RGB-agent, and Decant routing/zoom overhead for Decant. It does not include the original historical coding chats, since those chats are assumed to have already happened. Tool/runtime costs are not included. For non-GPT runs, treat this as a normalized estimate, not the provider bill.

[^3]: By "derived," I mean we reduced the memory failure modes from the SWE-bench/SWE-recall cases into tiny JS fixtures, not that we line-for-line ported the original repos. The anchors were `pydata__xarray-6992` for missing/insufficient prior memory, `django__django-16560` for issue-discussion memory that pins an accepted API direction, and `pylint-dev__pylint-4551` for behavior where type/context detail matters more than the surface issue text. The code is synthetic; the experimental shape came from those cases.

[^4]: Judge scores are post-hoc semantic scores over saved artifacts, not the original benchmark pass/fail bit. Frankly, I use this as a semi-standardized way to analyze results qualitatively, since I was too lazy to make "proper" benchmarks with high sample size. I used `openai/gpt-5.5` as the judge. For provenance lookup, the judge saw the question, expected rationale facts, forbidden distractor terms, final answer, and expected session/message citation. For code-recall, it also saw the patch diff and public/hidden test output. The judge returned `0-100`, which I normalized to `0-1`. I applied deterministic caps so broken outputs could not score too highly: hidden-test failure caps code-recall at `0.65`, public-test failure at `0.45`, stale/forbidden terms at `0.60`, unexpected file edits at `0.70`, and recall-policy failure at `0.75`. Provenance scores can also be capped for missing expected facts, missing citations, forbidden distractor hits, or harness/tool-policy failures. Full judge output is in `artifacts/benchmark-runs/blog-judge/default-compaction-gpt55-judge/`; the updated code-recall judge output is in `artifacts/benchmark-runs/blog-judge/gpt55-default-compaction-code-recall-judge-20260530/`.
