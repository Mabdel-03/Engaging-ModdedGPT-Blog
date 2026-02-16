---
layout: default
title: Engaging ModdedGPT
---

# Modded-NanoGPT on MIT Engaging

A minimalist guide for MIT researchers who want to run the modded-nanogpt challenge on the Engaging cluster.

<div class="card" markdown="1">
## Start Here

- Read the full guide: [From zero to speedrun on Engaging]({{ '/modded-nanogpt-on-engaging/' | relative_url }})
- Source repo for cluster scripts: [Engaging-NanoGPT](https://github.com/Mabdel-03/Engaging-NanoGPT)
- Upstream projects:
  - [karpathy/nanoGPT](https://github.com/karpathy/nanoGPT)
  - [KellerJordan/modded-nanogpt](https://github.com/KellerJordan/modded-nanogpt)
</div>

## Who This Is For

Researchers and students who already know the basics of model training, but are new to MIT's Engaging cluster workflow.

## What You Will Do

1. Set up a clean conda environment on Engaging.
2. Run a quick NanoGPT sanity check job.
3. Prepare FineWeb tokens for modded-nanogpt.
4. Launch an 8x H200 speedrun job with SLURM.
