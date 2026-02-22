---
layout: post
title: "From Zero to Modded NanoGPT Hero on MIT Engaging"
excerpt: "A practical setup guide for MIT researchers running Keller Jordan style modded-nanogpt speedruns on Engaging."
permalink: /modded-nanogpt-hero/
---

This guide focuses on the modded speedrun path. It assumes you already completed the baseline setup flow in [From Zero to NanoGPT Hero on MIT Engaging]({{ '/nanogpt-hero/' | relative_url }}).

If baseline is not yet stable, stop here and finish Guide 1 first.

Primary training repo used in this guide:

- [Mabdel-03/Engaging-NanoGPT](https://github.com/Mabdel-03/Engaging-NanoGPT)

## 1) What Is Modded NanoGPT?

Modded NanoGPT is a community speedrun effort centered on one concrete target:

- Train a GPT-2-scale model to `<= 3.28` validation loss on FineWeb.
- Do it as fast as possible on modern GPUs.

Unlike baseline NanoGPT, modded runs combine coordinated changes across architecture, optimizer design, kernels, and distributed scheduling.

Upstream reference:

- [KellerJordan/modded-nanogpt](https://github.com/KellerJordan/modded-nanogpt)

## 2) The Leaderboard

The official world record history is maintained here:

- [modded-nanogpt world record history](https://github.com/KellerJordan/modded-nanogpt#world-record-history)

## 3) How the Modded Run Differs from Baseline

The vendored speedrun pipeline in `modded_nanogpt/train_gpt.py` changes architecture, optimizer behavior, schedule shape, and kernel stack in a tightly coupled way.

### Architecture differences

- Core width remains 768, but head layout is `6 x 128` instead of `12 x 64`.
- Model depth is 11 layers, with one layer skipping attention (10 active attention layers).
- RMSNorm replaces LayerNorm.
- ReLU-squared replaces GELU and is executed through fused Triton kernels.
- FlashAttention path uses windowed causal masks.
- RoPE behavior is modified (half-truncated RoPE + YaRN updates).
- Additional mechanisms include paired-head layers, key-offset trick, value embeddings, bigram embeddings, gates, and a backout term.
- FP8-capable language model head path is used to reduce output projection cost.

### Optimizer and distributed update differences

- Hybrid optimizer split:
  - NorMuon for projection-heavy parameter banks.
  - Adam for embeddings, gates, scalars, and non-bank params.
- Alternating optimizer cadence: Adam updates only on odd steps; NorMuon updates each step.
- Explicit communication scheduling (`scatter_order`, `work_order`) overlaps comms and compute.
- This repo snapshot supports practical `world_size` values in `{1, 2, 4, 8}`.

### Training schedule differences

- Dataset is FineWeb cached binaries (`fineweb_train_*.bin`, `fineweb_val_*.bin`).
- Training sequence length is 2048.
- Gradient accumulation is `8 // world_size`.
- Schedule has three progressive stages plus an extension:
  - Stages increase batch/window sizes over time.
  - MTP weights simplify over time.
  - Final extension pushes to longer attention windows.
- Total schedule is about 1,555 iterations (1,515 + 40 extension).

### Why it is much faster

- Fused Triton kernels reduce launch overhead and memory traffic.
- FP8-capable lm-head reduces heavy projection cost.
- Windowed attention avoids full quadratic attention cost at long contexts.
- RMSNorm and ReLU-squared are cheaper to execute than baseline alternatives.
- Progressive schedule and communication overlap improve end-to-end throughput.
- Fullgraph `torch.compile` is used to optimize execution.

## 4) Prerequisites

Complete Guide 1 first so your environment and baseline workflow are already validated:

- [From Zero to NanoGPT Hero on MIT Engaging]({{ '/nanogpt-hero/' | relative_url }})

Then return to your Engaging-NanoGPT repo root:

```bash
cd /path/to/your/workspace/Engaging-NanoGPT
```

Activate your environment:

```bash
export CONDA_SH="${CONDA_SH:-$HOME/miniforge3/etc/profile.d/conda.sh}"
export ENV_PATH="$HOME/conda_envs/nanogpt_env"
source activate_env.sh
```

## 5) Prepare FineWeb Token Cache

Default prep (9 train chunks + val):

```bash
sbatch slurm/modded/prepare_fineweb.sh
```

Smaller quick-test prep:

```bash
FINEWEB_CHUNKS=3 sbatch slurm/modded/prepare_fineweb.sh
```

## 6) Optional: Build FlashAttention from Source

```bash
GPU_TYPE=h100 sbatch --gres=gpu:${GPU_TYPE}:1 slurm/modded/build_flash_attn.sh
```

## 7) Launch Speedrun Training

Default launch (script defaults target 8 GPUs):

```bash
sbatch slurm/modded/train_speedrun.sh
```

Custom GPU count launch:

```bash
# 1x H100
GPU_TYPE=h100 NUM_GPUS=1 \
sbatch --gres=gpu:${GPU_TYPE}:${NUM_GPUS} slurm/modded/train_speedrun.sh

# 2x H100
GPU_TYPE=h100 NUM_GPUS=2 \
sbatch --gres=gpu:${GPU_TYPE}:${NUM_GPUS} slurm/modded/train_speedrun.sh

# 4x H100
GPU_TYPE=h100 NUM_GPUS=4 \
sbatch --gres=gpu:${GPU_TYPE}:${NUM_GPUS} slurm/modded/train_speedrun.sh

# 8x H100
GPU_TYPE=h100 NUM_GPUS=8 \
sbatch --gres=gpu:${GPU_TYPE}:${NUM_GPUS} slurm/modded/train_speedrun.sh
```

H200 variant:

```bash
GPU_TYPE=h200 NUM_GPUS=8 \
sbatch --gres=gpu:${GPU_TYPE}:${NUM_GPUS} slurm/modded/train_speedrun.sh
```

Important:

- This vendored script expects `world_size` in `{1, 2, 4, 8}`.
- Recommended rollout is `1 -> 2/4 -> 8` GPUs so you catch config/runtime failures early.

## 8) Exact Command Sequence for the Modded Path

Use this sequence after completing Guide 1:

```bash
# 1) Enter repo root
cd /path/to/your/workspace/Engaging-NanoGPT

# 2) Activate environment
export CONDA_SH="${CONDA_SH:-$HOME/miniforge3/etc/profile.d/conda.sh}"
export ENV_PATH="$HOME/conda_envs/nanogpt_env"
source activate_env.sh

# 3) Prepare FineWeb cache
sbatch slurm/modded/prepare_fineweb.sh

# 4) Launch a small validation run first
GPU_TYPE=h100 NUM_GPUS=1 \
sbatch --gres=gpu:${GPU_TYPE}:${NUM_GPUS} slurm/modded/train_speedrun.sh

# 5) Scale to full speedrun target
GPU_TYPE=h100 NUM_GPUS=8 \
sbatch --gres=gpu:${GPU_TYPE}:${NUM_GPUS} slurm/modded/train_speedrun.sh
```

## 9) Submission Checklist (For Lab Leaderboard)

Submit your results on the [MIT Leaderboard]({{ '/leaderboard/' | relative_url }}).

Before submitting, prepare the same simple fields used by the public record table.

Required fields:

- Record time in seconds.
- Short run description (what changed).
- Log URL.

Optional field:

- Contributors (comma-separated).

Prerequisite:

- Complete a modded NanoGPT run under this guide workflow.

Recommended local notes for your own reproducibility:

- SLURM job ID and run timestamp.
- Commit hash and config diff used.
- Any caveats about partition behavior or interruptions.

## 10) Monitoring and Troubleshooting

Daily monitoring:

```bash
squeue -u "$USER"
sacct -u "$USER" --format=JobID,JobName,Partition,State,Elapsed,ExitCode
```

Tail modded logs:

```bash
tail -f logs/modded-speedrun-<jobid>.out
```

Common issues and fixes:

- **Conda activation fails**
  - Verify:

```bash
echo "$CONDA_SH"
ls "$CONDA_SH"
echo "$ENV_PATH"
ls "$ENV_PATH"
```

- **`torchrun: command not found`**
  - Check environment:

```bash
python -c "import torch; print(torch.__version__)"
```

- **NCCL hangs / multi-GPU issues**
  - Keep `NCCL_IB_DISABLE=1` unless cluster networking settings are confirmed.
  - Add `NCCL_DEBUG=INFO` to debug communication.

- **OOM**
  - Start at lower GPU counts or smaller exploratory settings.

- **FineWeb download issues**
  - Retry dataset prep in a new job.

---

Track current records and compare your run throughput against the official table: [modded-nanogpt world record history](https://github.com/KellerJordan/modded-nanogpt#world-record-history).
