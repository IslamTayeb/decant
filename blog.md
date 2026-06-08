---
title: On Agent Memory Fidelity (Decant)
slug: on-agent-memory-fidelity-decant
date: "2026-05-26T12:48Z"
description: Most code will be written by agents, making code intent harder to reconstruct from the code alone. Agents are constrained in how much they can keep in-memory by their context...
host: apm-overflow
---
Since Sonnet 3.7 came out right before my last internship, I've barely hand-written code. Coding agents are getting insanely good, and I keep trusting these models to do more and more. I think we're heading toward a world where most (if not all) code is written through and by agents.

That's a double-edged sword. When you're not writing code line by line, you stop thinking as hard about every edge case. The intent behind a change doesn't live in the diff anymore, it lives in the chat transcript. Those transcripts start mattering more than ever, and they can be millions of tokens large. You rarely need all of that loaded into context to find what you're after. So I've been toying with the idea of embedding compression. Most of the interesting work in the space happens through [alternative training methods](https://doi.org/10.48550/arXiv.2502.15957) that make embeddings reversibly compressible, but I wanted to see how far a pure harness-engineering approach could go.

What follows is an exploration from a harness-perspective. It'd need a lot more testing to know if it's any good, but I thought it was worth putting out there. Hopefully it inspires you to think of cooler solutions to this problem.

___
## Index

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

Point #2 can be fixed by allowing the agent to treat its context as a variable. Old work should not stay in the prompt just because it happened earlier in the chat. In theory, we can make an agent that can `read`, `grep`, and `bash` over its own context to edit it, similar to [recursive language models](https://alexzhang13.github.io/blog/2025/rlm/#:~:text=We%20propose%20Recursive%20Language%20Models%2C%20or,the%20user%E2%80%99s%20prompt%20in%20a%20variable) (RLMs). We'll call this an RGB-agent (credit to [Alexis](https://blog.alexisfox.dev/arcagi3)).

Point #3 is more interesting. It could be fixed by "compressing" messages into lower fidelity. There's no way to reversibly compress embeddings of frontier models yet, though there is [research](https://arxiv.org/abs/2502.15957) on it. If we consider context as a long string, we can use the same RGB-agent from point #2 to compress and edit context after every message. However, we'd still have to continuously re-ingest long context over and over again, so token consumption piles up.

### Proposal

Instead of a long context string with a separate RGB-agent, `Context` can be viewed as an object with `Message` objects within. Each `Message` contains data (`timeSent`, `content`, etc.). From this view, I believe that adding `fidelity` to `Message` lets an agent filter out obviously-irrelevant context without having to re-ingest the full transcript of `Context` at full fidelity.

That seems closer to how conversations work for humans. I do not remember every detail of a conversation (even mid-conversation). Some key parts stay vivid, some collapse into a gist, and tangents might disappear.

Agent sessions should have the same *adaptive forgetting*. Where it differs from humans: when detail matters again, the agent should be able to fetch the message in full fidelity.

The core distinction is between hiding context from the prompt and deleting it from memory. Decant lowers old work into cheap topic/message views, but keeps the exact messages addressable so the agent can reopen them only when needed.

**Decant** is my prototype of that idea. It gives agents (and users) tools to change message fidelity and explore Git blame-style code provenance.

___

## Decant: Context as Message Objects w/ Fidelities

Decant is an OpenCode plugin prototype. The idea is to stop treating context as one long string. **Instead, treat it as message objects grouped into topics/categories, then let the agent decide how much of each topic or message should stay in the next prompt.**

There are two control layers:
1. **Topic**: multiple messages that describe the same thread of work. A topic can be rendered as `full`, `summary`, `compressed`, `placeholder`, or `hidden`.
2. **Message**: the building block of a topic. A single message can inherit the topic setting, force itself back to `full`, force a `summary`, or be hidden.

The agent does not have to reread the whole transcript. It can start from the topic map, lower the fidelity of stale topics, look at message summaries, then fetch exact messages later if the summary is not enough.

To be concrete, below is a table summary of important fields of the `Topic` and `Message` objects in Decant.

| `Topic` Field   | What It Stores                                                                   | Why It Exists                                                           |
| --------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `topicID`       | Stable ID for the topic. Currently named `blobID` in the prototype code.         | Lets messages, tools, and UI controls refer to the same topic.          |
| `summary`       | Short topic-level summary across multiple messages.                              | Replaces many messages when the topic is rendered cheaply.              |
| `messageIDs[]`  | Message IDs assigned to the topic.                                               | Lets Decant reopen exact messages when the topic summary is not enough. |
| `tokenEstimate` | Rough total size estimate for the topic.                                         | Makes large topics visible before they eat the prompt.                  |
| `fidelity`      | Topic render setting: `full`, `summary`, `compressed`, `placeholder`, or `hidden`. | Controls how much of the topic appears in the next prompt.              |

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

Topic fidelity controls how a whole topic appears: `full`, `summary`, `compressed`, `placeholder`, or `hidden`. Message-level controls can force one message back to `full`, force it to `summary`, or hide it.

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

During OpenCode compaction, Decant also rewrites the compaction prompt so the summarizer respects those annotations instead of flattening every old turn equally. It can use `set_fidelity` to hide or shrink unimportant context.

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

The sidebar and `/context` show the conversation grouped by topic. Each topic has a token estimate and a fidelity setting. From `/context`, you can set a topic to `full`, `summary`, `compressed`, `placeholder`, or `hidden`. You can also override individual messages' fidelity.

![[Clipboard-20260525-142921-346.mp4]]
*Decant’s `/context` popup: topics, token share, and fidelity controls.*

`/blame` is a manual trigger over the aforementioned `blame_lookup` tool call. You could enter `file:line`, or ask a natural-language question about past chats. Decant runs `blame_lookup` as we discussed in the last section, finds the relevant prior session, and answers why a line is present given past conversations about it.

## Evaluation

I wanted to test whether Decant actually changes the shape of agent memory. Old conversations should not sit in every future prompt just because they happened earlier. But they also cannot disappear, because later tasks may need an exact old fact or the reason behind a line of code.

I tested that in three ways.
- The first eval asks whether old facts can be recovered after the old session has been compressed.
- The second asks what happens when unrelated future work piles up.
- The third starts from code: given a `file:line`, can Decant route back to the Codex session/message that explains it?

All of this is small and hand-built. The point is to check the memory routes, not to claim Decant makes agents better programmers per se. That'd require more rigorous benchmarks with harder problems.

I use three methods throughout the evals.

| Method             | What it does                                                                     |
| ------------------ | -------------------------------------------------------------------------------- |
| Default compaction | Carries a compacted summary of the old transcript. Default behavior of OpenCode. |
| RGB-agent          | Keeps old chat in files, then uses `read`, `grep`, and `bash` before answering.[^1] |
| Decant             | Keeps old detail outside the prompt, then opens exact messages only when needed. |

### Selective Memory Under Future Work

I started with 8 old topics, then asked 4 exact recall questions and 48 unrelated current-work questions. I ran the new RGB-agent version three times with `openai/gpt-5.5-fast`; default and Decant are the saved blog runs for the same shape.

Default compaction recovered 3 of 12 old facts. New RGB and Decant recovered all 12. New RGB also stopped carrying old memory into current-work prompts. Decant was still cheaper because its lookup opens narrower evidence than raw-log file search.

| Condition          | Runs Passed | Old-Fact Recall | Current Work | Avg Query Tokens | Avg Total Cost[^2] | Old Context Carried[^3] |
| ------------------ | ----------: | --------------: | -----------: | ---------------: | -----------------: | ----------------------: |
| Default compaction |         0/3 |            3/12 |      144/144 |             320K |              $0.79 |              259K chars |
| RGB-agent          |         3/3 |           12/12 |      144/144 |             425K |              $1.07 |                 0 chars |
| Decant             |         3/3 |           12/12 |      144/144 |             277K |              $0.62 |                 0 chars |

### Fanout

The old-memory demand stays fixed at 4 recall questions. The unrelated work grows from 24 to 96 future turns. New RGB keeps old memory out of current-work prompts, but recall turns still search the raw log. Decant uses fewer query tokens because lookup returns a smaller old-memory slice.

| Unrelated Future Turns | RGB Query Tokens | Decant Query Tokens | RGB Total Cost[^2] | Decant Total Cost[^2] | RGB Old Context Carried |
| ---------------------: | ---------------: | ------------------: | -----------------: | --------------------: | ----------------------: |
|                     24 |             280K |                158K |              $4.16 |                 $1.52 |                 0 chars |
|                     48 |             473K |                277K |              $4.00 |                 $2.10 |                 0 chars |
|                     96 |             799K |                514K |              $5.41 |                 $2.36 |                 0 chars |

### Updated Blame / Provenance Lookup

The provenance eval starts from code, not from a memory question. Given a `file:line`, Decant follows blame to a commit, maps that commit to a Codex session, then opens the topic/message that explains the line.

```text
file:line -> git blame commit -> agent session -> topic/message -> rationale
```

The past chats here are Codex-generated eval fixtures. The repos are tiny, the commits are seeded, and the decoy sessions are known ahead of time. This is not evidence that Decant handles a messy real codebase yet. It checks whether the blame-to-chat route works when the evidence exists.

A post-hoc GPT-5.5 judge scored the five standard provenance answers from 0 to 1.[^4] The sixth fixture tests the updated `/blame` flow separately. New RGB passed that `/blame` fixture, but missed one exact message citation in the standard provenance set.

| Condition | Judge Score | Cost vs Default[^2] | Output + Reasoning |
| --------- | ----------: | ------------------: | -----------------: |
| Default compaction | 0.93 | baseline | 3.9K |
| RGB-agent | 0.91 | +82% | 5.2K |
| Decant | 0.93 | -41% | 1.6K |

Default and Decant both score 0.93. New RGB is slightly lower because one answer cited the wrong supporting message id while still getting the rationale right. Decant found the supporting session/message and answered from that evidence instead of relying on one flattened summary or raw-log search.

## What I'd Test Next

The next eval should be SWE-recall: real SWE-bench tasks, `hints_text` as prior issue-discussion memory, and the official grader still used for patch quality. Then compare Decant against Default, RGB-agent, and embedding retrieval. That is where the idea either becomes useful for coding or stays a memory demo.

I also want failure-focused checks: wrong summaries, stale summaries, useful detail hidden too aggressively, bad topic boundaries, and expensive recovery routes. Those are the failures that would actually make this dangerous or pointless.

## Afterword

The prototype works enough to make the eval question sharper. I do not think the hard part is proving that agents can summarize old chats. They can. The hard part is proving that a context map helps during real coding work: fewer stale mistakes, better provenance, lower prompt load, and recoverable detail when another agent picks up the thread later.

I'm glad I was able to get this working without model training. That path still seems worth trying, but the immediate question is more basic: can memory infrastructure around frontier models make long-running agent work less lossy and less sticky?

___

[^1]: In these evals, RGB-agent means the old chat is written to `recall/log.txt`, each question gets an editable `recall/rgb-work/.../context.txt`, and the answer turn can use `read`, `grep`, and `bash` over those files before replying.

[^2]: Estimated cost uses a fixed GPT-5.5 standard price model as of 2026-05-17: `input_tokens * $5/M + cache_read_tokens * $0.50/M + (output_tokens + reasoning_tokens) * $30/M`. Tool/runtime costs are not included. For non-GPT runs, treat this as a normalized estimate, not the provider bill.

[^3]: Old context carried means historical text pasted into future prompts. New RGB and Decant both keep old memory outside current-work prompts. RGB still keeps the raw log on disk; that is searchable memory, not prompt-carried memory.

[^4]: Judge scores are post-hoc semantic scores over saved artifacts, not the original benchmark pass/fail bit. I used `openai/gpt-5.5` as the judge. For provenance lookup, the judge saw the question, expected rationale facts, forbidden distractor terms, final answer, and expected session/message citation. The new RGB judge output is in `benchmarks/provenance-qa/runs/rgb-file-agent-blog-provenance-judge-20260608T070314Z/`.
