---
layout: post
title: "From Zero to Modded-NanoGPT on MIT Engaging"
excerpt: "A practical setup guide for MIT researchers running modded-nanogpt speedruns on Engaging."
permalink: /modded-nanogpt-on-engaging/
---

The goal of this guide is simple: help MIT researchers go from a fresh login on Engaging to a working run of the modded-nanogpt speedrun stack.

You do not need to be an Engaging power user. If you are comfortable with Python, GPUs, and basic command line usage, this is enough to get started.

## 1) The Premise: Why This Exists

The **modded-nanogpt challenge** is an optimization-focused effort around training GPT-style models quickly and efficiently on modern hardware.

This setup uses two upstream codebases:

- [karpathy/nanoGPT](https://github.com/karpathy/nanoGPT) for a clean baseline workflow.
- [KellerJordan/modded-nanogpt](https://github.com/KellerJordan/modded-nanogpt) for speedrun-oriented training improvements.

The companion repo used in this guide is:

- [Mabdel-03/Engaging-NanoGPT](https://github.com/Mabdel-03/Engaging-NanoGPT)

It packages cluster-ready SLURM scripts and environment setup so you can spend less time wiring infrastructure and more time running experiments.

## 2) MIT Engaging in 60 Seconds

MIT Engaging is a SLURM-managed HPC environment. For this workflow, two partitions are especially relevant:

- `mit_normal_gpu` (up to 6h): includes 8x H200 nodes, ideal for the modded speedrun path.
- `mit_preemptable` (up to 2 days): useful for longer baseline NanoGPT runs.

Helpful commands while learning the cluster:

```bash
sinfo -o "%P %G %N %a" | rg gpu
squeue -u "$USER"
sacct -u "$USER" --format=JobID,JobName,Partition,State,Elapsed,ExitCode
```

## 3) Clone the Training Repo

```bash
cd /home/$USER/orcd/scratch
git clone https://github.com/Mabdel-03/Engaging-NanoGPT.git
cd Engaging-NanoGPT
```

The repository includes:

- `setup_env.sh` and `activate_env.sh` for conda setup.
- `slurm/nanogpt/` for baseline NanoGPT jobs.
- `slurm/modded/` for FineWeb prep and modded speedrun training.

## 4) Set Up Your Environment

Run this once:

```bash
bash setup_env.sh
```

For future sessions:

```bash
source activate_env.sh
```

What `setup_env.sh` does:

- Sources conda from the configured Engaging path.
- Loads `cuda/12.4.0` and `cudnn/9.8.0.87-cuda12` if modules are available.
- Creates a dedicated conda environment.
- Installs PyTorch CUDA wheels and required Python dependencies.

> Important: this repository currently contains account-specific paths (for example, `mabdel03`). If you are adapting it for your own account, update paths in `setup_env.sh`, `activate_env.sh`, and SLURM scripts before running.

## 5) Sanity Check with a Small Job

Before launching large runs, verify your environment and scheduler path with a tiny single-GPU job:

```bash
sbatch slurm/nanogpt/train_shakespeare.sh
```

Then monitor:

```bash
squeue -u "$USER"
tail -f logs/nanogpt-train-shakespeare-<jobid>.out
```

If this succeeds, your Python environment, CUDA stack, and basic SLURM flow are in good shape.

## 6) Run the Modded-NanoGPT Path

### Step A: Prepare FineWeb token cache

```bash
sbatch slurm/modded/prepare_fineweb.sh
```

Optional smaller prep:

```bash
FINEWEB_CHUNKS=3 sbatch slurm/modded/prepare_fineweb.sh
```

### Step B: Launch the 8x H200 speedrun job

```bash
sbatch slurm/modded/train_speedrun.sh
```

This script requests one H200 node and runs:

```bash
torchrun --standalone --nproc_per_node=8 train_gpt.py
```

under `modded_nanogpt/`.

At a high level, this path combines distributed `torchrun` execution with optimized training internals from modded-nanogpt (custom kernels and optimizer choices tuned for high-throughput runs).

## 7) Monitoring and Troubleshooting

Daily monitoring loop:

```bash
squeue -u "$USER"
sacct -u "$USER" --format=JobID,JobName,Partition,State,Elapsed,ExitCode
```

Log inspection:

```bash
tail -f logs/modded-speedrun-<jobid>.out
```

Common issues and quick fixes:

- **Conda activation issues**: verify the conda init script path and environment path in shell scripts.
- **`torchrun` missing**: activate the environment and verify `python -c "import torch; print(torch.__version__)"`.
- **NCCL hangs**: keep `NCCL_IB_DISABLE=1` unless you confirm cluster networking settings.
- **OOMs**: reduce batch size or context settings for exploratory runs.
- **Dataset hiccups**: retry FineWeb prep jobs if downloads fail transiently.

---

If you want to go deeper after your first successful run, start by editing SLURM resources and training configs incrementally, one variable at a time, and keep a log of throughput, loss, and stability changes.
