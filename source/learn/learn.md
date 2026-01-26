---
title: 学习方法论
date: 2026-01-21 11:30:00
updated: 2026-01-26 15:16:36
permalink: source/learn/learn/
categories:
  - [source, learn]
tags:
  - 学习
  - 方法论
  - 编程
---

# 理解项目的两个层次

## 宏观理解
- 项目需要**树状索引结构**，快速定位代码
- 建立项目整体结构的理解
- 掌握模块之间的关系和依赖

## 微观理解
- 具体问题怎么解决
- 懂细节，理解实现原理
- 能够深入到代码细节

# 技术栈

## 0. ml入门

### 刷课

- [cs189-fall25](https://eecs189.org/fa25/) → [📚 查看我的 CS189 笔记](/categories/ml/cs189/)


- [Stanford CS336: Language Modeling from Scratch](https://stanford-cs336.github.io/spring2025/index.html)

  正如课程标题写的，在这门课程中你将从头编写大语言模型的所有核心组件，例如 Tokenizer，模型架构，训练优化器，底层算子，训练数据清洗，后训练算法等等。每次作业的 handout 都有四五十页 pdf，相当硬核。如果你想充分吃透大语言模型的所有底层细节，那么非常推荐学习这门课程。


### 刷题

- [LeetGPU Challenges](https://leetgpu.com/challenges) - GPU 编程挑战
- [Deep-ML](https://www.deep-ml.com/problems) - 深度学习和机器学习问题练习

### random source

- [csdiy](https://csdiy.wiki/) - 公开课收集器
- [InfiniTensor 冬令营 2025](https://www.infinitensor.com/camp/winter2025) - InfiniTensor 冬季训练营
- [hf blog](https://www.high-flyer.cn/blog/) - 幻方blog



--- 

<span style="color: #ff0000;"><strong>下面是仍未探索的领域</strong></span>

## 1. PyTorch 执行模型

### forward 执行顺序
- **Python 层**：`Module.__call__` →（pre-hook）→ `forward` →（post-hook）
- **算子层**：`aten` op 被调度到对应的实现（CPU/CUDA），按数据依赖顺序执行（默认是 **lazy/async 的 CUDA enqueue**）
- **混合精度**：`autocast` 影响算子 dtype/路径；`GradScaler` 影响 loss scale 与反缩放阶段

### backward 执行顺序
- **触发点**：`loss.backward()` / `torch.autograd.backward(...)`
- **遍历顺序**：按 autograd graph 的**反向拓扑**遍历（从 loss 的 `grad_fn` 向叶子张量传播）
- **梯度累积**：叶子参数的 `.grad` 默认是 **累加**（需 `zero_grad(set_to_none=True)` 或手动清零）

### autograd graph 构建与遍历
- **构建**：前向时，凡是 `requires_grad=True` 且参与运算的 Tensor，会为 op 创建 `grad_fn` 节点并记录依赖边
- **叶子/中间节点**：
  - 叶子参数：通常是 `nn.Parameter`，`grad_fn=None`，由 `AccumulateGrad` 接收梯度
  - 中间 Tensor：有 `grad_fn`，默认不保留 `.grad`（除非 `retain_grad()`）
- **遍历**：backward 通过 autograd engine 调度各节点的 backward 与梯度聚合

### optimizer step 执行阶段
- **典型训练循环**：`zero_grad` → `backward` →（可选）`clip_grad` → `step`
- **AMP**：`scaler.step(optimizer)` + `scaler.update()`（包含 unscale / overflow 检测）

### 梯度同步与隐式同步点
- **DDP 梯度同步**：在 backward 期间触发 bucket all-reduce（见「分布式训练机制」）
- **常见隐式同步点**：
  - `.item()` / `.cpu()` / `.numpy()` / 打印 CUDA Tensor
  - `torch.cuda.synchronize()`
  - 不当计时（直接用 `time.time()` 测 GPU 耗时）

## 2. 训练与推理执行性能

### batch / micro-batch 组织方式
- **batch**：一次 `forward+backward` 覆盖的样本数（影响吞吐/显存/统计效率）
- **micro-batch（梯度累积）**：把大 batch 拆成多次前后向，最后再 `optimizer.step()`
  - 关键：通信次数、同步点、激活保存策略（checkpointing）、BN/Dropout 语义

### 推理 batching
- **离线 batch**：吞吐优先
- **在线动态 batch**：在延迟约束下聚合请求（时间窗/最大 batch）
- **LLM 特有**：prefill（大算量）与 decode（小算量高频）分离；KV cache 管理

### pipeline 并行
- **stage 切分**：按层/块分到不同 GPU，micro-batch 在 stage 间流水
- **气泡（bubble）**：micro-batch 越多越能填满 pipeline，但延迟/内存压力更大

### 单卡执行路径
- Python 调度 → `aten` → CUDA kernel enqueue（stream）→（必要时同步）→ 结果可见
- 性能关键：算子融合、内存访问（layout/stride）、kernel launch 开销、数据搬运（H2D/D2H）

### 多卡执行路径差异
- **额外开销**：梯度/激活通信（NCCL）、跨卡同步点、pipeline stage 间发送
- **关键变量**：拓扑（PCIe/NVLink）、bucket 大小、overlap（计算/通信重叠）

## 3. 算子与 Kernel 执行

### Triton 算子编写
- **定位**：写自定义 GPU kernel 的高层 DSL（迭代速度快）
- **关注点**：tile/block、访存 coalescing、寄存器/共享内存压力、autotune
- **集成**：以 PyTorch extension / `triton` kernel 形式替换热点算子

### CUDA kernel 调用流程
- PyTorch op → dispatcher 选实现 → CUDA launcher 设置 grid/block/sharedmem/stream → kernel 入队
- kernel 在 GPU 异步执行；host 线程通常继续运行，直到遇到同步点

### kernel launch 与同步
- **launch**：小算子太多会被 launch 开销吞噬（融合/图捕获可优化）
- **同步**：
  - stream 内：FIFO
  - stream 间：event/依赖控制；避免不必要的全局同步

### kernel 与 execution graph 的关系
- **Eager**：每个 op 对应一次或多次 kernel launch
- **CUDA Graph**：capture 稳定的 launch 序列，重放时减少 Python/launch 开销，提高吞吐与稳定性

## 4. 分布式训练机制

### data parallel（DP / DDP）
- **思路**：每卡一份模型副本，数据切分；梯度在反向时 all-reduce 同步
- **DDP**：backward 时对梯度 bucket 做 all-reduce，尽量与计算 overlap

### tensor parallel（TP）
- **思路**：把张量维度切到多卡（如 Linear 的列/行切分）
- **通信形态**：前向/反向需要 all-gather / reduce-scatter / all-reduce（取决于切分）

### all-reduce 调用位置
- **DDP**：主要在 backward（梯度就绪时）
- **TP**：可能贯穿前向/反向的算子边界

### 参数同步时机
- 初始化：广播参数/缓冲确保一致
- 训练中：通过梯度同步 + 各卡执行同样的 `optimizer.step()` 保持一致

### checkpoint 状态组成
- **模型**：`model.state_dict()`
- **优化器**：`optimizer.state_dict()`（动量、Adam 的一阶/二阶矩等）
- **训练进度**：epoch/step、lr scheduler、AMP scaler、随机数种子、并行配置

### restart 流程
- 重建进程组 → 构建模型/优化器 → load checkpoint → 恢复 step/scheduler/scaler → 继续训练

## 5. Linux / OS 执行环境

### 进程 / 线程调度（scheduler）
- 关键点：亲和性（affinity）、上下文切换、worker 并发（DataLoader/通信线程）

### 虚拟内存管理（virtual memory）
- page cache、缺页（page fault）、mmap、TLB 行为会影响数据加载与大模型映射

### NUMA 内存布局与绑定
- 多路 CPU 时跨 NUMA 更慢；用 `numactl`/绑核绑内存让 GPU/NIC 就近

### 文件 IO 路径
- 磁盘/网络 FS → page cache → 用户态 buffer →（可选）pin memory → H2D
- 关注：顺序/随机、并发度、预取、压缩与解码开销

## 6. GPU 通信与互联

### NCCL 通信模型
- collective（all-reduce/all-gather/reduce-scatter/broadcast），根据拓扑选择 ring/tree 等算法

### GPU ↔ GPU 通信路径
- 同机：PCIe / NVLink（取决于拓扑）
- 跨机：NIC +（可选）RDMA；能否 GPUDirect 决定拷贝路径

### PCIe 拓扑
- root complex/交换芯片/共享链路带宽影响多卡 all-reduce 带宽

### NVLink 拓扑
- 更高带宽/更低延迟；连接图结构影响通信效率

## 7. 网络与内核相关能力

### RDMA 使用场景
- 跨机训练通信（IB/RoCE），降低 CPU 参与、提升带宽、降低延迟
- 常见配套：GPUDirect RDMA（减少拷贝路径）

### 用户态网络的基本模式
- kernel bypass（如 DPDK 思路）：减少系统调用/中断开销，提高吞吐、降低延迟

### 内核在计算与通信中的位置
- 计算：调度、内存管理、驱动资源仲裁
- 通信：socket 栈、路由、拥塞控制；是否走 RDMA/用户态路径决定 kernel 参与程度

## 8. 基础cs
- 网络协议
- cpp



