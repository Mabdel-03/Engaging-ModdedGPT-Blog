---
layout: post
title: "Getting Started on MIT Engaging"
excerpt: "A practical Engaging primer for Poggio lab researchers: SSH, filesystems, modules, interactive and batch jobs, and where to find official docs."
permalink: /getting-started/
---

This page is a practical quick-start for MIT researchers using Engaging, with commands you can copy and adapt.

## 1) What Is Engaging?

Engaging is MIT ORCD's shared HPC system. You run compute jobs through the Slurm scheduler (instead of running heavy workloads directly on login nodes).

- Official system page: [ORCD Engaging System](https://orcd-docs.mit.edu/orcd-systems/)
- OnDemand web portal: [https://engaging-ood.mit.edu](https://engaging-ood.mit.edu/)

## 2) Getting an Account

If this is your first time, log into the OnDemand portal using MIT Kerberos. This activates your Engaging account.

- Official getting-started tutorial: [ORCD Getting Started](https://orcd-docs.mit.edu/getting-started/)

## 3) Logging In via SSH

Use your MIT Kerberos username:

```bash
ssh USERNAME@orcd-login.mit.edu
```

You will be prompted for Kerberos password and Duo 2FA.

For detailed SSH instructions:

- [ORCD SSH Login Docs](https://orcd-docs.mit.edu/accessing-orcd/ssh-login/)

## 4) File Systems (Home, Pool, Scratch)

Engaging commonly uses three storage spaces for users:

- **Home**: personal files and code (`/home/USERNAME`)
- **Pool**: shared project/group data (if your group has an allocation)
- **Scratch**: fast, temporary, high-performance workspace for active runs

Read full filesystem guidance here:

- [ORCD Filesystems Docs](https://orcd-docs.mit.edu/filesystems-file-transfer/filesystems/)

## 5) Transferring Files

Common workflows:

- Clone from GitHub directly on Engaging
- Use `scp` / `rsync`
- Use OnDemand file browser or Globus for larger transfers

Examples:

```bash
# Clone code on Engaging
git clone https://github.com/your-org/your-repo.git

# Copy local file to Engaging
scp local_file.py USERNAME@orcd-login.mit.edu:/home/USERNAME/

# Sync a local directory to Engaging
rsync -avP ./my_project/ USERNAME@orcd-login.mit.edu:/home/USERNAME/my_project/
```

Official transfer docs:

- [ORCD Transferring Files](https://orcd-docs.mit.edu/filesystems-file-transfer/transferring-files/)

## 6) The Module System

Engaging uses environment modules to load software stacks.

```bash
module avail
module load cuda/12.4.0
module load cudnn/9.8.0.87-cuda12
module list
module purge
```

For software/module details:

- [ORCD Modules Docs](https://orcd-docs.mit.edu/software/modules/)
- [ORCD Software Overview](https://orcd-docs.mit.edu/software/overview/)

## 7) Interactive Sessions (salloc)

Interactive allocations are useful for debugging, short tests, and exploratory work.

CPU-only example:

```bash
salloc -p mit_normal -t 01:00:00 -c 4 --mem=16G
```

GPU example:

```bash
salloc -p mit_normal_gpu -t 01:00:00 -c 8 --mem=32G --gres=gpu:h100:1
```

Once granted, you are placed on a compute node where you can run tests interactively.

Resource request guidance:

- [ORCD Requesting Resources](https://orcd-docs.mit.edu/running-jobs/requesting-resources/)

## 8) Batch Scripts with Slurm (sbatch)

Use `sbatch` for reproducible runs and longer jobs.

Minimal template:

```bash
#!/usr/bin/env bash
#SBATCH --job-name=test-job
#SBATCH --partition=mit_normal_gpu
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --gres=gpu:h100:1
#SBATCH --time=02:00:00
#SBATCH --output=logs/%x-%j.out

set -euo pipefail
echo "Running on $(hostname)"
nvidia-smi
python train.py
```

Core commands:

```bash
sbatch my_job.sh
squeue -u "$USER"
scancel <jobid>
sacct -u "$USER" --format=JobID,JobName,Partition,State,Elapsed,ExitCode
```

Official running-jobs docs:

- [ORCD Running Jobs Overview](https://orcd-docs.mit.edu/running-jobs/overview/)

## 9) GPU Partitions (General)

Useful general-purpose partitions often include:

- `mit_normal_gpu`
- `mit_preemptable`
- `mit_quicktest`

Inspect live partition + GPU availability:

```bash
sinfo -o "%P %G %N %a" | rg gpu
```

Request GPUs via `--gres`, for example:

```bash
sbatch --gres=gpu:h100:1 my_job.sh
```

## 10) Poggio Lab Partition (`pi_tpoggio`)

For Poggio lab members, the lab partition is:

- **Partition**: `pi_tpoggio`
- **Node**: `node3807`
- **Hardware**: 8x A100 GPUs, 192 CPU cores, ~1 TB RAM
- **Time limit**: 7 days

This is a PI-owned partition with priority access for Poggio lab users.

Examples targeting `pi_tpoggio`:

```bash
# Interactive allocation (1x A100)
salloc -p pi_tpoggio -t 04:00:00 -c 16 --mem=64G --gres=gpu:a100:1

# Batch submission with explicit partition and GPU resource
sbatch -p pi_tpoggio --gres=gpu:a100:4 my_job.sh
```

Check current partition details at any time:

```bash
sinfo -p pi_tpoggio -N -o "%N %P %c %m %G %T %l"
```

## 11) Maintenance and Support

Per ORCD documentation:

- Login nodes are restarted weekly (Monday morning, around 7am)
- Monthly maintenance occurs on the 3rd Tuesday

Support email:

- `orcd-help-engaging@mit.edu`

## 12) Official Documentation Links

- [ORCD Engaging System](https://orcd-docs.mit.edu/orcd-systems/)
- [ORCD Getting Started](https://orcd-docs.mit.edu/getting-started/)
- [ORCD SSH Login](https://orcd-docs.mit.edu/accessing-orcd/ssh-login/)
- [ORCD Filesystems](https://orcd-docs.mit.edu/filesystems-file-transfer/filesystems/)
- [ORCD Transferring Files](https://orcd-docs.mit.edu/filesystems-file-transfer/transferring-files/)
- [ORCD Modules](https://orcd-docs.mit.edu/software/modules/)
- [ORCD Requesting Resources](https://orcd-docs.mit.edu/running-jobs/requesting-resources/)
- [ORCD Running Jobs Overview](https://orcd-docs.mit.edu/running-jobs/overview/)
- [Engaging OnDemand Portal](https://engaging-ood.mit.edu/)
