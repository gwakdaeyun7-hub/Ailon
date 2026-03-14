---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 선형대수, 행렬 곱셈, 특이값 분해, LoRA, 가중치 행렬, 고유값, 텐서 연산, GPU 병렬화
keywords_en: linear algebra, matrix multiplication, singular value decomposition, LoRA, weight matrix, eigenvalue, tensor operation, GPU parallelization
---
Linear Algebra and Matrix Computation in Neural Networks - 신경망의 모든 연산은 행렬 곱셈으로 환원되며, 이것이 딥러닝의 수학적이자 계산적 기반이다

## 행렬 이론의 기원

Arthur Cayley(1858)가 행렬 대수를 체계화했을 때, 그는 연립방정식을 간결하게 표기하려는 목적이었다. 행렬의 곱셈, 역행렬, 행렬식(determinant)에 대한 규칙을 정립한 이 작업은 순수 수학의 영역에 머물렀다. 그러나 약 90년 뒤, John von Neumann(1945)이 EDVAC 보고서에서 디지털 컴퓨터의 행렬 연산 능력을 강조하면서 상황이 달라졌다. 대규모 행렬 계산이 컴퓨터의 핵심 용도로 부상한 것이다.

현대 딥러닝은 이 두 유산의 직접적 후손이다. 신경망의 모든 레이어는 본질적으로 **행렬 곱셈**이며, GPU와 TPU는 이 연산을 대규모 병렬로 수행하도록 설계되었다.

## 순전파: 행렬 곱셈의 연쇄

신경망의 순전파(forward pass)는 행렬 곱셈의 연쇄에 불과하다. 단일 레이어의 연산은 다음과 같다.

y = sigma(W * x + b)

여기서 W는 가중치 행렬(weight matrix), x는 입력 벡터, b는 편향 벡터, sigma는 활성화 함수다. 입력 차원이 n이고 출력 차원이 m이면, W는 m x n 행렬이다. 이 행렬 곱셈 W * x는 n차원 공간의 점을 m차원 공간으로 변환하는 **선형 사상**(linear map)이다.

L개의 레이어로 구성된 네트워크의 순전파는 다음과 같이 전개된다.

h_1 = sigma(W_1 * x + b_1)
h_2 = sigma(W_2 * h_1 + b_2)
...
y = sigma(W_L * h_{L-1} + b_L)

활성화 함수 sigma를 제거하면, 전체 네트워크는 W_L * W_{L-1} * ... * W_1 * x라는 단일 행렬 곱셈으로 축소된다. 이것이 **비선형 활성화 함수**가 필수적인 이유다. 활성화 함수 없이는 아무리 깊은 네트워크도 하나의 행렬과 수학적으로 동치이며, 선형으로 분리 불가능한 문제를 풀 수 없다.

## 역전파와 야코비안

역전파(backpropagation)에서 그래디언트 계산도 행렬 연산이다. 손실 함수 L에 대한 가중치 W_l의 그래디언트는 연쇄 법칙(chain rule)에 의해 야코비안(Jacobian) 행렬의 곱으로 표현된다.

dL/dW_l = dL/dy * dy/dh_{L-1} * ... * dh_{l}/dW_l

각 dy/dh 항은 야코비안 행렬이다. 이 야코비안들의 곱이 **그래디언트 소실**(vanishing gradient) 또는 **폭발**(exploding gradient) 문제의 수학적 근원이다. 야코비안의 특이값(singular value)이 반복적으로 1보다 작으면 그래디언트가 기하급수적으로 줄어들고, 1보다 크면 폭발한다.

배치(batch) 학습에서는 미니배치 전체의 순전파와 역전파가 행렬-행렬 곱셈(GEMM, General Matrix Multiply)으로 수행된다. 배치 크기 B, 입력 차원 n, 출력 차원 m일 때, 순전파는 m x n 행렬과 n x B 행렬의 곱이다. 이것이 GPU가 딥러닝에 적합한 근본적 이유다. GPU의 수천 개 코어는 대규모 행렬 곱셈을 병렬화하도록 설계되었다.

## 특이값 분해와 가중치 분석

특이값 분해(Singular Value Decomposition, SVD)는 임의의 m x n 행렬 W를 세 행렬의 곱으로 분해한다.

W = U * S * V^T

U는 m x m 직교 행렬, S는 m x n 대각 행렬(특이값), V는 n x n 직교 행렬이다. 특이값 s_1 >= s_2 >= ... >= s_r > 0은 행렬이 각 방향으로 공간을 얼마나 늘리거나 줄이는지를 나타낸다.

SVD는 신경망 분석에서 세 가지 핵심 역할을 한다. 첫째, 가중치 행렬의 유효 랭크(effective rank)를 파악할 수 있다. 특이값이 빠르게 감쇠하면 행렬이 **저랭크**(low-rank)에 가깝다는 뜻이며, 이는 모델 압축의 가능성을 시사한다. 둘째, 훈련 과정에서 특이값 스펙트럼의 변화를 추적하여 학습 역학(training dynamics)을 분석할 수 있다. Martin & Mahoney(2021)는 가중치 행렬의 특이값 분포가 멱법칙(power law)을 따르며, 이 분포의 기울기가 모델의 일반화 성능과 상관관계가 있음을 보였다. 셋째, 상위 k개의 특이값만 유지하는 절단 SVD(truncated SVD)로 모델을 근사하여 추론 속도를 높일 수 있다.

## LoRA: 저랭크 적응의 수학

Hu et al.(2022)의 LoRA(Low-Rank Adaptation)는 SVD의 저랭크 근사 원리를 모델 미세조정(fine-tuning)에 직접 적용한 획기적 기법이다. 핵심 아이디어는 사전 훈련된 가중치 W_0를 **동결**하고, 갱신량 delta_W를 저랭크 행렬의 곱으로 파라미터화하는 것이다.

W = W_0 + B * A

여기서 A는 r x d 행렬, B는 d x r 행렬이며, r << d이다. 원래 d x d 가중치 갱신에 d^2개의 파라미터가 필요하지만, LoRA에서는 2 * d * r개만 필요하다. 예를 들어 d = 4096이고 r = 8이면, 파라미터 수는 16,777,216개에서 65,536개로 약 256배 줄어든다.

이 접근이 효과적인 수학적 근거는 Aghajanyan et al.(2021)의 발견에 있다. 사전 훈련된 대형 모델의 미세조정 시 가중치 변화가 실제로 매우 낮은 **고유 차원**(intrinsic dimension)에 집중된다는 것이다. 즉, delta_W가 자연적으로 저랭크인 경향이 있어, LoRA의 저랭크 제약이 실질적으로 표현력을 거의 손상하지 않는다.

LoRA는 QLoRA(Dettmers et al., 2023)로 확장되어, 4비트 양자화와 결합하여 65B 파라미터 모델을 단일 48GB GPU에서 미세조정할 수 있게 했다.

## 고유값과 학습 역학

가중치 행렬의 고유값(eigenvalue) 분석은 학습 안정성의 핵심 도구다. 정방 행렬 W에 대해 W * v = lambda * v를 만족하는 스칼라 lambda가 고유값, 벡터 v가 고유벡터(eigenvector)다.

순환 신경망(RNN)에서 시간 단계별 그래디언트 전파는 가중치 행렬의 반복 곱셈이다. 최대 고유값의 절대값(**스펙트럴 반지름**, spectral radius)이 1보다 크면 그래디언트가 폭발하고, 1보다 작으면 소실된다. 이 문제를 해결하기 위해 **직교 초기화**(orthogonal initialization)가 제안되었으며, 직교 행렬의 모든 고유값 절대값은 정확히 1이므로 그래디언트 규모가 보존된다.

He et al.(2015)의 Kaiming 초기화와 Glorot & Bengio(2010)의 Xavier 초기화는 모두 가중치 행렬의 분산을 레이어 차원에 맞게 조절하여, 순전파와 역전파 시 활성화값과 그래디언트의 분산이 레이어 간에 일정하게 유지되도록 한다. 이 초기화 전략의 수학적 기반은 행렬의 고유값 분포 이론이다.

## 텐서와 고차원 확장

현대 딥러닝은 2차원 행렬을 넘어 텐서(tensor) 연산을 다룬다. CNN의 합성곱은 4차원 텐서(배치, 채널, 높이, 너비) 연산이고, Transformer의 멀티헤드 어텐션은 4차원 텐서(배치, 헤드, 시퀀스, 차원) 연산이다. 그러나 이 고차원 연산들도 궁극적으로 **im2col 변환**이나 einsum 연산을 통해 행렬 곱셈으로 환원되어 GPU에서 실행된다.

NVIDIA의 Tensor Core는 4x4 행렬 곱셈-누적(FMA) 연산을 단일 사이클에 수행하며, Google의 TPU는 128x128 **systolic array**로 행렬 곱셈에 특화되었다. 하드웨어 자체가 선형대수 연산을 위해 설계된 것이다. 이러한 하드웨어 발전이 2012년 이후 딥러닝 혁명의 핵심 동력 중 하나였다.

## 한계와 약점

선형대수는 딥러닝의 뼈대이지만, 이 프레임워크 자체에 내재된 한계가 있다.

- 선형 사상의 본질적 제약: 행렬 곱셈은 선형 변환만 표현할 수 있다. XOR 같은 단순한 비선형 문제도 선형 변환 하나로는 풀 수 없다. 활성화 함수 없이 깊은 네트워크를 쌓아도 단일 행렬과 동치라는 사실은 선형대수만으로는 근본적으로 불충분함을 보여준다.
- 수치 안정성: 대규모 행렬 연산은 부동소수점 오차가 누적된다. 조건수(condition number)가 큰 행렬은 작은 입력 변화에도 출력이 크게 변하며, 이는 학습 불안정으로 이어진다. 혼합 정밀도(mixed precision) 훈련에서 float16의 좁은 표현 범위로 인한 오버플로우/언더플로우 문제가 빈번하다.
- 계산 비용의 확장: 행렬 곱셈의 시간 복잡도는 나이브하게 O(n^3)이다. Strassen(1969)의 O(n^2.807)이나 최신 이론적 결과인 O(n^2.373)이 있지만, 실제 GPU 구현에서는 메모리 접근 패턴과 캐시 효율이 이론적 복잡도보다 중요하다. 모델 크기가 커질수록 행렬 곱셈의 연산량이 지배적이 되며, 이것이 대형 모델 훈련 비용의 근본 원인이다.
- LoRA의 근사 한계: 저랭크 근사는 가중치 변화가 실제로 저랭크일 때만 효과적이다. 전혀 새로운 도메인이나 태스크로 적응할 때는 높은 랭크의 변화가 필요할 수 있으며, r 값의 선택이 성능에 민감하게 영향을 미친다.

## 용어 정리

가중치 행렬(weight matrix) - 신경망 레이어의 입력과 출력 사이의 선형 변환을 정의하는 행렬

특이값 분해(Singular Value Decomposition, SVD) - 임의의 행렬을 직교 행렬과 대각 행렬의 곱으로 분해하는 방법

저랭크 근사(low-rank approximation) - 행렬을 더 적은 수의 특이값으로 근사하여 차원을 줄이는 기법

야코비안(Jacobian) - 다변수 벡터 함수의 모든 편미분을 모은 행렬. 역전파에서 그래디언트 전파에 사용

고유값(eigenvalue) - 행렬에 의한 선형 변환에서 방향이 변하지 않는 벡터(고유벡터)의 스케일링 계수

조건수(condition number) - 행렬의 최대 특이값과 최소 특이값의 비율. 수치 안정성의 척도

직교 행렬(orthogonal matrix) - 전치 행렬이 역행렬과 같은 행렬. 모든 고유값의 절대값이 1

텐서(tensor) - 행렬을 고차원으로 일반화한 다차원 배열. 딥러닝에서 데이터와 파라미터의 기본 자료구조

LoRA(Low-Rank Adaptation) - 사전 훈련 가중치를 동결하고 저랭크 행렬 쌍만 학습하는 효율적 미세조정 기법

---EN---
Linear Algebra and Matrix Computation in Neural Networks - All neural network operations reduce to matrix multiplications, forming both the mathematical and computational foundation of deep learning

## Origins of Matrix Theory

When Arthur Cayley (1858) systematized matrix algebra, his purpose was concise notation for systems of equations. His work establishing rules for matrix multiplication, inverses, and determinants remained in the realm of pure mathematics. But roughly 90 years later, John von Neumann (1945) emphasized the matrix computation capabilities of digital computers in his EDVAC report, and the landscape shifted. Large-scale matrix computation emerged as a core use case for computers.

Modern deep learning is the direct descendant of these two legacies. Every layer of a neural network is essentially a **matrix multiplication**, and GPUs and TPUs are designed to perform these operations in massively parallel fashion.

## Forward Pass: A Chain of Matrix Multiplications

The forward pass of a neural network is nothing more than a chain of matrix multiplications. A single layer computes:

y = sigma(W * x + b)

Here W is the weight matrix, x is the input vector, b is the bias vector, and sigma is the activation function. If the input dimension is n and the output dimension is m, then W is an m x n matrix. The matrix multiplication W * x is a **linear map** that transforms a point in n-dimensional space to m-dimensional space.

The forward pass of a network with L layers unfolds as:

h_1 = sigma(W_1 * x + b_1)
h_2 = sigma(W_2 * h_1 + b_2)
...
y = sigma(W_L * h_{L-1} + b_L)

Remove the activation function sigma, and the entire network collapses to a single matrix multiplication: W_L * W_{L-1} * ... * W_1 * x. This is precisely why **nonlinear activation functions** are essential. Without them, no matter how deep the network, it is mathematically equivalent to a single matrix and cannot solve linearly inseparable problems.

## Backpropagation and the Jacobian

Gradient computation in backpropagation is also a matrix operation. The gradient of loss function L with respect to weights W_l is expressed as a product of Jacobian matrices via the chain rule:

dL/dW_l = dL/dy * dy/dh_{L-1} * ... * dh_{l}/dW_l

Each dy/dh term is a Jacobian matrix. The product of these Jacobians is the mathematical root of the **vanishing** or **exploding gradient** problem. When the singular values of the Jacobians are repeatedly less than 1, gradients shrink exponentially; when greater than 1, they explode.

In batch training, the forward and backward passes for the entire mini-batch are performed as matrix-matrix multiplications (GEMM, General Matrix Multiply). With batch size B, input dimension n, and output dimension m, the forward pass is a product of an m x n matrix and an n x B matrix. This is the fundamental reason GPUs are suited for deep learning -- their thousands of cores are designed to parallelize large matrix multiplications.

## SVD and Weight Analysis

Singular Value Decomposition (SVD) factorizes any m x n matrix W into the product of three matrices:

W = U * S * V^T

U is an m x m orthogonal matrix, S is an m x n diagonal matrix (containing singular values), and V is an n x n orthogonal matrix. The singular values s_1 >= s_2 >= ... >= s_r > 0 indicate how much the matrix stretches or compresses space in each direction.

SVD plays three key roles in neural network analysis. First, it reveals the effective rank of a weight matrix. If singular values decay rapidly, the matrix is approximately **low-rank**, suggesting potential for model compression. Second, tracking the singular value spectrum during training enables analysis of training dynamics. Martin & Mahoney (2021) showed that weight matrix singular value distributions follow a power law, and the slope of this distribution correlates with model generalization performance. Third, truncated SVD, retaining only the top k singular values, can approximate the model for faster inference.

## LoRA: The Mathematics of Low-Rank Adaptation

Hu et al.'s (2022) LoRA (Low-Rank Adaptation) directly applies SVD's low-rank approximation principle to model fine-tuning. The core idea is to **freeze** pre-trained weights W_0 and parameterize the update delta_W as a product of low-rank matrices:

W = W_0 + B * A

Here A is an r x d matrix and B is a d x r matrix, where r << d. While the original d x d weight update requires d^2 parameters, LoRA needs only 2 * d * r. For example, with d = 4096 and r = 8, the parameter count drops from 16,777,216 to 65,536 -- roughly a 256-fold reduction.

The mathematical justification for this approach comes from Aghajanyan et al. (2021), who found that weight changes during fine-tuning of large pre-trained models concentrate in a very low **intrinsic dimension**. That is, delta_W naturally tends to be low-rank, so LoRA's low-rank constraint barely compromises expressiveness in practice.

LoRA was extended to QLoRA (Dettmers et al., 2023), combining 4-bit quantization to enable fine-tuning of 65B parameter models on a single 48GB GPU.

## Eigenvalues and Training Dynamics

Eigenvalue analysis of weight matrices is a key tool for training stability. For a square matrix W, the scalar lambda satisfying W * v = lambda * v is an eigenvalue, and the vector v is an eigenvector.

In recurrent neural networks (RNNs), gradient propagation across time steps involves repeated multiplication of the weight matrix. If the **spectral radius** (the absolute value of the largest eigenvalue) exceeds 1, gradients explode; if less than 1, they vanish. **Orthogonal initialization** was proposed to address this, since all eigenvalues of an orthogonal matrix have absolute value exactly 1, preserving gradient magnitude.

He et al.'s (2015) Kaiming initialization and Glorot & Bengio's (2010) Xavier initialization both adjust weight matrix variance to match layer dimensions, ensuring that activation and gradient variances remain consistent across layers during forward and backward passes. The mathematical foundation of these initialization strategies is eigenvalue distribution theory.

## Tensors and Higher-Dimensional Extensions

Modern deep learning operates beyond 2D matrices with tensor operations. CNN convolutions are 4D tensor operations (batch, channel, height, width), and Transformer multi-head attention involves 4D tensors (batch, head, sequence, dimension). Yet these higher-dimensional operations are ultimately reduced to matrix multiplications through **im2col transformations** or einsum operations for GPU execution.

NVIDIA's Tensor Cores perform 4x4 matrix multiply-accumulate (FMA) operations in a single cycle, and Google's TPUs specialize in matrix multiplication with 128x128 **systolic arrays**. The hardware itself is designed for linear algebra operations. This hardware evolution was one of the key drivers of the deep learning revolution since 2012.

## Limitations and Weaknesses

Linear algebra forms the skeleton of deep learning, but inherent limitations exist within this framework.

- Inherent constraints of linear maps: Matrix multiplication can only express linear transformations. Even a simple nonlinear problem like XOR cannot be solved by a single linear transformation. The fact that stacking deep networks without activation functions is equivalent to a single matrix demonstrates that linear algebra alone is fundamentally insufficient.
- Numerical stability: Large-scale matrix operations accumulate floating-point errors. Matrices with large condition numbers produce outputs that vary dramatically with small input changes, leading to training instability. In mixed-precision training, overflow/underflow issues from float16's narrow representation range are frequent.
- Computational cost scaling: The time complexity of naive matrix multiplication is O(n^3). While Strassen's (1969) O(n^2.807) and the latest theoretical results of O(n^2.373) exist, in actual GPU implementations, memory access patterns and cache efficiency matter more than theoretical complexity. As model sizes grow, matrix multiplication computation becomes dominant, which is the root cause of large model training costs.
- LoRA's approximation limits: Low-rank approximation is effective only when weight changes are truly low-rank. Adaptation to entirely new domains or tasks may require high-rank changes, and the choice of r sensitively affects performance.

## Glossary

Weight matrix - a matrix defining the linear transformation between inputs and outputs of a neural network layer

Singular Value Decomposition (SVD) - a method of factorizing any matrix into the product of orthogonal matrices and a diagonal matrix

Low-rank approximation - a technique that reduces dimensionality by approximating a matrix with fewer singular values

Jacobian - a matrix collecting all partial derivatives of a multivariate vector function, used for gradient propagation in backpropagation

Eigenvalue - the scaling factor of a vector (eigenvector) whose direction is unchanged by a linear transformation represented by a matrix

Condition number - the ratio of a matrix's largest to smallest singular values, serving as a measure of numerical stability

Orthogonal matrix - a matrix whose transpose equals its inverse, with all eigenvalue absolute values equal to 1

Tensor - a multidimensional array generalizing matrices to higher dimensions, the basic data structure for data and parameters in deep learning

LoRA (Low-Rank Adaptation) - an efficient fine-tuning technique that freezes pre-trained weights and trains only a pair of low-rank matrices
