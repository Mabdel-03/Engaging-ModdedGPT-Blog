---
layout: default
title: Engaging ModdedGPT
---

# NanoGPT on MIT Engaging

This blog is a practical MIT Engaging path for Poggio Lab researchers working on the NanoGPT speedrun challenge: train GPT-2 124M to `<= 3.28` validation loss as quickly as possible.

A practical two-guide path for MIT researchers on Engaging:

1. Start with **From Zero to NanoGPT Hero** to learn the baseline training workflow end-to-end.
2. Then move to **From Zero to Modded NanoGPT Hero** to understand what changes in speedrun-style training and how those changes can accelerate runs.

<div class="card" markdown="1">
## Start Here

<div class="home-path" markdown="1">
- Step 0: [Getting Started on MIT Engaging]({{ '/getting-started/' | relative_url }})
- Step 1: [From Zero to NanoGPT Hero]({{ '/nanogpt-hero/' | relative_url }})
- Step 2: [From Zero to Modded NanoGPT Hero]({{ '/modded-nanogpt-hero/' | relative_url }})
- Step 3: [MIT Leaderboard]({{ '/leaderboard/' | relative_url }}) for submitting and comparing run times (Google sign-in and admin approval required before submission)
</div>

- Source repo for cluster scripts: [Engaging-NanoGPT](https://github.com/Mabdel-03/Engaging-NanoGPT)
- Upstream projects:
  - [karpathy/nanoGPT](https://github.com/karpathy/nanoGPT)
  - [KellerJordan/modded-nanogpt](https://github.com/KellerJordan/modded-nanogpt)
</div>

## Who This Is For

Researchers and students who already know the basics of model training, but are new to MIT's Engaging cluster workflow.

## What You Will Do

1. Set up a clean conda environment on Engaging.
2. Run baseline NanoGPT sanity and GPT-2 jobs.
3. Learn how modded-nanogpt differs architecturally and system-wise.
4. Launch and scale Keller Jordan style speedrun jobs with SLURM.
5. Submit results to the MIT leaderboard after approval to compare with other lab members.
