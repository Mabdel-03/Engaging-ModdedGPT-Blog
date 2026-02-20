---
layout: default
title: Engaging ModdedGPT
---

# NanoGPT on MIT Engaging

A practical two-guide path for MIT researchers on Engaging:

1. Start with **From Zero to NanoGPT Hero** to learn the baseline training workflow end-to-end.
2. Then move to **From Zero to Modded NanoGPT Hero** to understand what changes in speedrun-style training and how those changes can accelerate runs.

<div class="card" markdown="1">
## Start Here

- Step 1: [From Zero to NanoGPT Hero]({{ '/nanogpt-hero/' | relative_url }})
- Step 2: [From Zero to Modded NanoGPT Hero]({{ '/modded-nanogpt-hero/' | relative_url }})
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
