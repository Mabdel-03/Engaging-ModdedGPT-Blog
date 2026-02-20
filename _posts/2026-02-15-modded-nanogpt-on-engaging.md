---
layout: post
title: "From Zero to NanoGPT Hero on MIT Engaging"
excerpt: "A practical setup guide for MIT researchers running baseline NanoGPT on Engaging."
permalink: /nanogpt-hero/
---

The goal of this guide is simple: take you from a fresh Engaging login to working baseline NanoGPT runs on MIT Engaging.

If you can use Python and the command line, you can follow this end-to-end.

Primary training repo used in this guide:

- [Mabdel-03/Engaging-NanoGPT](https://github.com/Mabdel-03/Engaging-NanoGPT)

## 1) Why This Guide Exists

This is the baseline guide for Karpathy's NanoGPT workflow on Engaging. It gives you the core habits and command sequence you need before trying more complex speedrun setups.

This workflow uses:

- [karpathy/nanoGPT](https://github.com/karpathy/nanoGPT) as the baseline training code.
- [Engaging-NanoGPT](https://github.com/Mabdel-03/Engaging-NanoGPT) as the Engaging-ready packaging (SLURM scripts + environment helpers).

After you complete this guide, move to the companion guide for the speedrun path: [From Zero to *Modded* NanoGPT Hero on MIT Engaging]({{ '/modded-nanogpt-hero/' | relative_url }}).

## 2) MIT Engaging in 60 Seconds

Engaging is a SLURM cluster. For this workflow, these partitions are typically useful:

- `mit_normal_gpu` for GPU jobs.
- `mit_preemptable` for longer baseline runs.
- `mit_quicktest` for quick prep jobs.

Useful cluster commands:

```bash
sinfo -o "%P %G %N %a" | rg gpu
squeue -u "$USER"
sacct -u "$USER" --format=JobID,JobName,Partition,State,Elapsed,ExitCode
```

## 3) What Is Karpathy NanoGPT?

Karpathy's NanoGPT is a minimal, readable GPT training codebase that keeps the stack simple while preserving modern training behavior (PyTorch + DDP). It is a strong baseline for controlled experiments.

Upstream reference:

- [karpathy/nanoGPT](https://github.com/karpathy/nanoGPT)

### Baseline architecture (GPT-2 small / 124M)

- `n_layer=12`
- `n_head=12`
- `n_embd=768`
- `block_size=1024`
- GELU MLP with hidden width `4 * n_embd = 3072`
- Learned absolute positional embeddings
- Tied token embedding and language model head weights

### Baseline training defaults in this Engaging repo

- AdamW: `learning_rate=6e-4`, `beta1=0.9`, `beta2=0.95`, `weight_decay=0.1`, `grad_clip=1.0`
- Warmup + cosine schedule: 2,000 warmup steps, decay across 600,000 iters
- Effective accumulation target: 40 total accumulation steps at 8 GPUs (adjusted per `WORLD_SIZE`)
- Dataset path: OpenWebText tokenized with GPT-2 BPE to `train.bin` / `val.bin`
- Precision path: bfloat16 autocast when available
- Compile path: `compile=True`

### How long a full run takes

- The NanoGPT GPT-2 config comment targets roughly `~2.85` validation loss in about 5 days on 8x A100 40GB.
- On 8x H100, wall-clock time is typically lower, but exact time depends on partition behavior, job interruptions, IO, and runtime settings.

## 4) Prerequisites on Engaging

You need:

- Engaging account access with GPU allocation.
- A writable location with enough space.

Storage target before setup: at least **120 GB free**.

Check whether conda already exists:

```bash
conda --version
```

If conda is not available, install Miniforge quickly:

```bash
wget https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh
bash Miniforge3-Linux-x86_64.sh -b -p "$HOME/miniforge3"
```

## 5) Clone the Engaging-NanoGPT Repo

Choose your workspace location, then clone:

```bash
cd /path/to/your/workspace
git clone https://github.com/Mabdel-03/Engaging-NanoGPT.git
cd Engaging-NanoGPT
```

Command convention for the rest of this guide:

- After `cd Engaging-NanoGPT`, run commands from repo root unless a step explicitly says otherwise.

## 6) One-Time Environment Setup

### Path A: You already have conda

Set `CONDA_SH` and `ENV_PATH`, then run setup:

```bash
conda --version
export CONDA_SH="$(conda info --base)/etc/profile.d/conda.sh"
export ENV_PATH="$HOME/conda_envs/nanogpt_env"
bash setup_env.sh
```

### Path B: You do not have conda yet

Install Miniforge, set paths, then run setup:

```bash
wget https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh
bash Miniforge3-Linux-x86_64.sh -b -p "$HOME/miniforge3"
export CONDA_SH="$HOME/miniforge3/etc/profile.d/conda.sh"
export ENV_PATH="$HOME/conda_envs/nanogpt_env"
bash setup_env.sh
```

`setup_env.sh` installs Python deps and CUDA-compatible PyTorch wheels, and creates the environment if needed.

### Activation for every future shell session

```bash
export CONDA_SH="${CONDA_SH:-$HOME/miniforge3/etc/profile.d/conda.sh}"
export ENV_PATH="$HOME/conda_envs/nanogpt_env"
source activate_env.sh
```

## 7) Baseline NanoGPT: Shakespeare Sanity Run

This validates that your scheduler, environment, and baseline code path all work.

### Step 1: Prepare Shakespeare data

```bash
sbatch slurm/nanogpt/prepare_shakespeare.sh
```

### Step 2: Launch 1-GPU baseline sanity training

```bash
GPU_TYPE=h100 sbatch --gres=gpu:${GPU_TYPE}:1 slurm/nanogpt/train_shakespeare.sh
```

### Step 3: Monitor jobs and logs

```bash
squeue -u "$USER"
sacct -u "$USER" --format=JobID,JobName,Partition,State,Elapsed,ExitCode
tail -f logs/nanogpt-train-shakespeare-<jobid>.out
```

### Step 4: Sample from the trained checkpoint

This is one of the few steps where you intentionally leave repo root:

```bash
cd nanogpt
python sample.py --out_dir=../out/nanogpt-shakespeare
cd ..
```

## 8) Baseline NanoGPT: Full GPT-2 Training Path

After sanity success, run the full baseline path.

### Step 1: Prepare OpenWebText tokens

```bash
sbatch slurm/nanogpt/prepare_openwebtext.sh
```

### Step 2: Launch default GPT-2 training

Default script headers request 2 GPUs:

```bash
sbatch slurm/nanogpt/train_gpt2.sh
```

### Step 3: Launch GPT-2 with explicit GPU count

Use one of these exact command variants:

```bash
# 1x H100
GPU_TYPE=h100 GPUS_PER_NODE=1 GRAD_ACC_STEPS=40 \
sbatch --gres=gpu:${GPU_TYPE}:${GPUS_PER_NODE} slurm/nanogpt/train_gpt2.sh

# 2x H100
GPU_TYPE=h100 GPUS_PER_NODE=2 GRAD_ACC_STEPS=20 \
sbatch --gres=gpu:${GPU_TYPE}:${GPUS_PER_NODE} slurm/nanogpt/train_gpt2.sh

# 4x H100
GPU_TYPE=h100 GPUS_PER_NODE=4 GRAD_ACC_STEPS=10 \
sbatch --gres=gpu:${GPU_TYPE}:${GPUS_PER_NODE} slurm/nanogpt/train_gpt2.sh

# 8x H100
GPU_TYPE=h100 GPUS_PER_NODE=8 GRAD_ACC_STEPS=5 \
sbatch --gres=gpu:${GPU_TYPE}:${GPUS_PER_NODE} slurm/nanogpt/train_gpt2.sh
```

Important baseline note:

- In baseline NanoGPT DDP, `gradient_accumulation_steps` must be divisible by `WORLD_SIZE`.

## 9) Exact From-Scratch Command Sequence

```bash
# 1) Clone repo and enter it
cd /path/to/your/workspace
git clone https://github.com/Mabdel-03/Engaging-NanoGPT.git
cd Engaging-NanoGPT

# 2) If conda exists, use it; otherwise install Miniforge
conda --version || true
if command -v conda >/dev/null 2>&1; then
  export CONDA_SH="$(conda info --base)/etc/profile.d/conda.sh"
else
  wget https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh
  bash Miniforge3-Linux-x86_64.sh -b -p "$HOME/miniforge3"
  export CONDA_SH="$HOME/miniforge3/etc/profile.d/conda.sh"
fi
export ENV_PATH="$HOME/conda_envs/nanogpt_env"

# 3) One-time environment setup
bash setup_env.sh

# 4) Activate env for this shell
source activate_env.sh

# 5) Baseline sanity path (prepare + train)
sbatch slurm/nanogpt/prepare_shakespeare.sh
GPU_TYPE=h100 sbatch --gres=gpu:${GPU_TYPE}:1 slurm/nanogpt/train_shakespeare.sh

# 6) Baseline GPT-2 data + training
sbatch slurm/nanogpt/prepare_openwebtext.sh
sbatch slurm/nanogpt/train_gpt2.sh

# Baseline GPT-2 scale-up example (8 GPUs)
GPU_TYPE=h100 GPUS_PER_NODE=8 GRAD_ACC_STEPS=5 \
sbatch --gres=gpu:${GPU_TYPE}:${GPUS_PER_NODE} slurm/nanogpt/train_gpt2.sh
```

## 10) Monitoring and Troubleshooting

Use this daily monitoring loop:

```bash
squeue -u "$USER"
sacct -u "$USER" --format=JobID,JobName,Partition,State,Elapsed,ExitCode
```

Tail logs while runs are active:

```bash
tail -f logs/nanogpt-train-shakespeare-<jobid>.out
tail -f logs/nanogpt-train-gpt2-<jobid>.out
```

Common issues and fixes:

- **Conda activation fails**
  - Verify paths:

```bash
echo "$CONDA_SH"
ls "$CONDA_SH"
echo "$ENV_PATH"
ls "$ENV_PATH"
```

- **`torchrun: command not found`**
  - Verify PyTorch in active env:

```bash
python -c "import torch; print(torch.__version__)"
```

- **NCCL hangs / multi-GPU instability**
  - Keep `NCCL_IB_DISABLE=1` unless InfiniBand setup is confirmed.
  - Add `NCCL_DEBUG=INFO` if debugging communication issues.

- **OOM errors**
  - Reduce model/batch/sequence/accumulation for exploratory runs.

- **FineWeb prep download hiccups**
  - Retry in a fresh job; transient network failures happen.

---

Once your baseline path is stable, continue with the modded speedrun guide: [From Zero to *Modded* NanoGPT Hero on MIT Engaging]({{ '/modded-nanogpt-hero/' | relative_url }}).
