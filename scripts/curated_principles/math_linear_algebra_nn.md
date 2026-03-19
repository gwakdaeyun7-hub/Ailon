---
difficulty: intermediate
connectionType: mathematical_foundation
keywords: 선형대수, 행렬 곱셈, 선형 변환, 특이값 분해, 고유값, 가중치 행렬, LoRA, 수치 안정성
keywords_en: linear algebra, matrix multiplication, linear transformation, singular value decomposition, eigenvalue, weight matrix, LoRA, numerical stability
---
Linear Algebra in Neural Networks - 신경망의 모든 계산은 행렬 곱셈이며, 선형대수는 딥러닝의 수학적 기반이자 물리적 실행 단위다

## 선형대수의 핵심: 공간을 변환하는 수학

선형대수는 벡터와 행렬을 다루는 수학 분야다. 그런데 "벡터"와 "행렬"이라는 단어는 본질을 가린다. 선형대수가 실제로 하는 일은 **공간 자체를 변환하는 것**이다.

2차원 평면 위의 모든 점을 동시에 회전시키거나, 한 방향으로 늘이거나, 특정 축에 대해 반사시키는 것 -- 이런 조작을 숫자로 표현한 것이 행렬이다. 2x2 행렬 하나가 평면 전체를 한 번에 변형하고, 3x3 행렬은 3차원 공간 전체를 변형한다. Arthur Cayley(1858)가 행렬 대수를 체계화했을 때 연립방정식의 표기법이 목적이었지만, 이 작업은 150년 뒤 전혀 예상하지 못한 영역에서 핵심 도구가 된다.

핵심 통찰은 이것이다. 행렬 곱셈 W * x가 단순한 숫자 계산이 아니라 "입력 공간의 점을 출력 공간의 점으로 옮기는 사상(mapping)"이라는 관점이다. 입력 차원이 n이고 출력 차원이 m인 행렬 W(크기 m x n)는, n차원 공간의 한 점을 m차원 공간의 한 점으로 보낸다. 이 **선형 사상**(linear map)이라는 개념이 나중에 신경망 레이어의 수학적 정체가 된다.

## 수학에서 신경망으로: 행렬이 "뉴런"이 된 과정

선형대수와 신경망의 만남은 한 번에 일어나지 않았다. 여러 사람이 서로 다른 시기에 각기 다른 다리를 놓았다.

## 순전파와 역전파: 행렬 곱셈의 연쇄

신경망의 순전파(forward pass)는 행렬 곱셈을 반복 적용하는 것이다. 단일 레이어는 다음 연산을 수행한다.

1. 가중치 행렬 W와 입력 벡터 x의 곱을 계산한다: z = W * x + b (b는 편향 벡터)
2. 결과에 활성화 함수 sigma를 적용한다: y = sigma(z)

L개의 레이어로 구성된 네트워크에서, 이 과정이 연쇄적으로 진행된다.

h_1 = sigma(W_1 * x + b_1)
h_2 = sigma(W_2 * h_1 + b_2)
...
y = sigma(W_L * h_{L-1} + b_L)

여기서 결정적인 질문이 나온다. 만약 활성화 함수 sigma를 모두 제거하면 어떻게 되는가? 전체 네트워크가 W_L * W_{L-1} * ... * W_1 * x가 되는데, 행렬의 곱은 또 하나의 행렬이다. 즉, 100층짜리 네트워크도 활성화 함수 없이는 단일 행렬 W_total = W_L * ... * W_1과 수학적으로 동치다. 이것이 **비선형 활성화 함수가 필수**인 이유다. 선형 변환만으로는 XOR처럼 직선 하나로 분리할 수 없는 문제를 풀 수 없다. 활성화 함수가 레이어 사이에 비선형성을 삽입해야, 깊은 네트워크가 단일 행렬 이상의 표현력을 갖는다.

## 차원, 랭크, 표현력의 트레이드오프

신경망 설계에서 행렬의 크기는 곧 모델의 용량이다. m x n 가중치 행렬은 m * n개의 학습 가능한 파라미터를 갖는다. 차원을 키우면 표현력이 늘어나지만, 두 가지 비용이 따른다.

첫째, **계산 비용**이다. 행렬 곱셈의 시간 복잡도는 나이브하게 O(m * n * k)이며(m x n 행렬과 n x k 행렬의 곱), 모델이 커질수록 이 연산이 전체 학습 시간을 지배한다. GPT-3의 가중치 행렬 하나가 12288 x 12288 크기이고, 이런 행렬이 수백 개 존재한다.

둘째, **과적합 위험**이다. 파라미터가 데이터에 비해 너무 많으면 훈련 데이터를 "외우게" 되어 새로운 데이터에 일반화하지 못한다.

여기서 **랭크**(rank)라는 개념이 핵심적 역할을 한다. 행렬의 랭크는 그 행렬이 실제로 사용하는 독립적 방향의 수다. m x n 행렬의 랭크가 r이면, 이 행렬은 n차원 입력을 사실상 r차원 공간으로 먼저 압축한 뒤 m차원으로 펼치는 것과 같다. 큰 가중치 행렬이라도 랭크가 낮으면, 실질적으로 적은 수의 차원만 사용하고 있다는 뜻이다. 이 관찰이 모델 압축과 LoRA의 이론적 토대가 된다.

## 특이값 분해: 행렬의 내부를 들여다보는 도구

특이값 분해(Singular Value Decomposition, SVD)는 임의의 m x n 행렬 W를 세 행렬의 곱으로 분해한다.

W = U * S * V^T

U는 m x m 직교 행렬, S는 m x n 대각 행렬, V는 n x n 직교 행렬이다. S의 대각 원소가 특이값 s_1 >= s_2 >= ... >= s_r > 0이다.

공간적으로 해석하면, 행렬 W의 변환은 세 단계다. V^T가 입력 공간을 **회전**시키고, S가 각 축 방향으로 **늘이거나 줄이며**, U가 출력 공간에서 다시 **회전**시킨다. 특이값이 큰 방향은 행렬이 강하게 활용하는 차원이고, 0에 가까운 방향은 거의 무시하는 차원이다.

신경망에서 SVD는 세 가지 핵심 역할을 한다.

첫째, **유효 랭크 파악**이다. 특이값이 빠르게 감쇠하면 소수의 방향만 실질적으로 사용하는 **저랭크**(low-rank) 행렬에 가깝다는 뜻이며, 압축의 여지를 시사한다.

둘째, **학습 역학 분석**이다. Martin & Mahoney(2021)는 잘 훈련된 모델의 가중치 행렬 특이값 분포가 멱법칙(power law)을 따르며, 이 분포의 기울기가 일반화 성능과 상관관계가 있음을 보였다.

## 고유값, 초기화, 그리고 학습 안정성

정방 행렬 W에 대해 W * v = lambda * v를 만족하는 스칼라 lambda가 고유값(eigenvalue), 벡터 v가 고유벡터(eigenvector)다. 고유벡터는 행렬에 의해 "방향은 유지되고 크기만 lambda배 변하는" 특수한 벡터다.

고유값이 학습에 직접 영향을 미치는 대표적 사례가 순환 신경망(RNN)이다. RNN은 시간 단계마다 같은 가중치 행렬 W_h를 반복 곱한다. 최대 고유값의 절대값인 **스펙트럴 반지름**(spectral radius)이 이 행렬 거듭제곱의 행동을 결정한다. 1보다 크면 그래디언트가 폭발하고, 1보다 작으면 소실된다.

## 현대 AI 기법과의 연결

선형대수는 AI에 "영감을 준" 학문이라기보다, AI가 그 위에 **직접 서 있는** 수학적 토대다. 다만 현대 AI 기법들이 선형대수의 어떤 성질을 어떤 방식으로 활용하는지는 구분할 필요가 있다.

**수학적 기반으로서 직접 사용:**

- **Transformer의 어텐션**: 핵심 연산은 Q, K, V 세 행렬의 곱이다. Attention = softmax(Q * K^T / sqrt(d_k)) * V에서 Q * K^T가 토큰 간 유사도 행렬을 만들고 V에 곱해 가중 합산한다. 입력에 W_Q, W_K, W_V를 각각 곱하므로 어텐션 레이어 하나가 최소 4번의 행렬 곱셈을 수행한다.
- **임베딩 조회**: 단어 임베딩은 V x d 행렬이며, 토큰 인덱스로 행을 꺼내는 것이 원-핫 벡터와 임베딩 행렬의 곱이다.
- **LoRA(Hu et al. 2022)**: 갱신량 dW를 두 저랭크 행렬 A(d x r), B(r x d)의 곱으로 제한한다. 12288 x 12288 행렬은 약 1.5억 파라미터지만, r = 16 LoRA는 약 39만 개만 학습한다. 가중치 변화가 저랭크라는 SVD 관찰이 이론적 근거다.

## 한계와 약점

선형대수는 딥러닝의 뼈대이지만, 이 뼈대 자체에 내재된 제약이 있다.

- **선형 변환의 본질적 한계**: 행렬 곱셈은 선형 변환만 표현할 수 있다. XOR 같은 단순한 비선형 문제도 단일 행렬로는 풀 수 없으며, 활성화 함수 없이는 아무리 깊은 네트워크도 단일 행렬과 동치다. 선형대수는 필요조건이지 충분조건이 아니다.
- **수치 안정성 문제**: 대규모 행렬 연산은 부동소수점 오차가 누적된다. 조건수(condition number)가 큰 행렬은 작은 입력 변화에 출력이 크게 변하여 학습이 불안정해진다. 혼합 정밀도(mixed precision) 훈련에서 float16의 좁은 표현 범위로 인한 오버플로우가 빈번하다.
- **계산 비용의 확장**: 행렬 곱셈의 나이브 시간 복잡도는 O(n^3)이다. 실제 GPU에서는 메모리 접근 패턴과 캐시 효율이 이론적 복잡도보다 더 중요하며, 모델이 커질수록 행렬 곱셈 비용이 지배적이다.
- **저랭크 근사의 한계**: LoRA 등의 저랭크 기법은 가중치 변화가 실제로 저랭크일 때만 효과적이다. 전혀 다른 도메인으로의 전이 학습처럼 높은 랭크의 변화가 필요한 경우, 랭크 r의 선택이 성능에 민감하게 영향을 미치며 적절한 r을 사전에 알기 어렵다.

## 용어 정리

선형 사상(linear map) - 벡터 공간 사이의 변환으로, 덧셈과 스칼라 곱을 보존하는 함수. 행렬 곱셈이 그 구체적 표현이다

가중치 행렬(weight matrix) - 신경망 한 레이어에서 입력과 출력 사이의 선형 변환을 정의하는 행렬. 각 행이 하나의 뉴런에 대응한다

야코비안(Jacobian) - 다변수 벡터 함수의 모든 편미분을 모은 행렬. 역전파에서 그래디언트를 레이어 간에 전달하는 데 사용된다

특이값 분해(Singular Value Decomposition, SVD) - 임의의 행렬을 "회전-스케일-회전"의 세 단계로 분해하는 방법. 행렬이 공간을 어떻게 변형하는지 보여준다

고유값(eigenvalue) - 행렬 변환에서 방향이 바뀌지 않는 벡터(고유벡터)의 크기 변화 계수. W * v = lambda * v에서 lambda

랭크(rank) - 행렬이 실제로 사용하는 독립적 방향의 수. 랭크가 낮으면 고차원 행렬이라도 실질적으로 적은 차원만 활용한다

조건수(condition number) - 행렬의 최대 특이값과 최소 특이값의 비율. 이 값이 클수록 수치적으로 불안정하다

LoRA(Low-Rank Adaptation) - 사전 훈련된 가중치를 동결하고, 갱신량을 두 저랭크 행렬의 곱으로 제한하는 효율적 미세조정 기법
---EN---
Linear Algebra in Neural Networks - All neural network computation is matrix multiplication, and linear algebra is both the mathematical foundation and the physical execution unit of deep learning

## The Core of Linear Algebra: Mathematics That Transforms Space

Linear algebra is the branch of mathematics dealing with vectors and matrices. But those words obscure its essence. What linear algebra actually does is **transform space itself**.

Rotating every point on a 2D plane simultaneously, stretching space in one direction, reflecting it across an axis -- a matrix is the numerical representation of such operations. A single 2x2 matrix deforms the entire plane at once; a 3x3 matrix deforms all of 3D space. When Arthur Cayley (1858) systematized matrix algebra, his goal was notation for systems of equations, but this work became an essential tool in a completely unforeseen domain 150 years later.

The key insight is this: the matrix multiplication W * x is not mere arithmetic but a "mapping that sends a point in input space to a point in output space." A matrix W of size m x n sends a point in n-dimensional space to a point in m-dimensional space. This concept of a **linear map** later becomes the mathematical identity of a neural network layer.

## From Mathematics to Neural Networks: How Matrices Became "Neurons"

The meeting of linear algebra and neural networks did not happen all at once. Different people built different bridges at different times.

## Forward and Backward Pass: Chains of Matrix Multiplications

The forward pass of a neural network is the repeated application of matrix multiplications. A single layer performs:

1. Compute the product of weight matrix W and input vector x: z = W * x + b (b is the bias vector)
2. Apply the activation function sigma to the result: y = sigma(z)

In a network with L layers, this process chains together:

h_1 = sigma(W_1 * x + b_1)
h_2 = sigma(W_2 * h_1 + b_2)
...
y = sigma(W_L * h_{L-1} + b_L)

A decisive question arises here. What happens if all activation functions sigma are removed? The entire network becomes W_L * W_{L-1} * ... * W_1 * x, and a product of matrices is simply another matrix. That is, even a 100-layer network without activation functions is mathematically equivalent to a single matrix W_total = W_L * ... * W_1. This is why **nonlinear activation functions are essential**. Linear transformations alone cannot solve problems like XOR that are not linearly separable. Activation functions insert nonlinearity between layers, giving deep networks expressive power beyond a single matrix.

## Dimensions, Rank, and the Expressiveness Tradeoff

In neural network design, a matrix's size is the model's capacity. An m x n weight matrix has m * n learnable parameters. Increasing dimensions increases expressiveness, but at two costs.

First, **computational cost**. The time complexity of matrix multiplication is naively O(m * n * k) (for multiplying an m x n matrix by an n x k matrix), and as models grow this operation dominates total training time. A single weight matrix in GPT-3 is 12288 x 12288, and hundreds of such matrices exist.

Second, **overfitting risk**. Too many parameters relative to data causes the model to "memorize" training data, failing to generalize to new data.

The concept of **rank** plays a key role here. A matrix's rank is the number of independent directions it actually uses. If an m x n matrix has rank r, it is effectively compressing n-dimensional input into r-dimensional space first, then expanding to m dimensions. Even a large weight matrix, if low-rank, is actually using only a few dimensions. This observation becomes the theoretical foundation for model compression and LoRA.

## Singular Value Decomposition: A Tool for Seeing Inside Matrices

Singular Value Decomposition (SVD) factorizes any m x n matrix W into the product of three matrices:

W = U * S * V^T

U is an m x m orthogonal matrix, S is an m x n diagonal matrix, and V is an n x n orthogonal matrix. The diagonal entries of S are the singular values s_1 >= s_2 >= ... >= s_r > 0.

Spatially, the transformation by matrix W breaks down into three stages: V^T **rotates** the input space, S **stretches or compresses** along each axis, and U **rotates** again in the output space. Directions with large singular values are dimensions the matrix heavily utilizes; directions near 0 are effectively ignored.

SVD plays three key roles in neural networks.

First, **determining effective rank**. If singular values decay rapidly, the matrix is approximately **low-rank**, signaling room for compression.

Second, **analyzing training dynamics**. Martin & Mahoney (2021) showed that singular value distributions of well-trained models follow a power law, with the slope correlating with generalization performance.

## Eigenvalues, Initialization, and Training Stability

For a square matrix W, the scalar lambda satisfying W * v = lambda * v is an eigenvalue, and the vector v is an eigenvector. Eigenvectors are special vectors whose direction is preserved by the matrix transformation, with only their magnitude changing by a factor of lambda.

A prime example of eigenvalues directly impacting learning is in recurrent neural networks (RNNs). RNNs multiply by the same weight matrix W_h at each time step, and the behavior of this matrix power is determined by the **spectral radius** -- the absolute value of the largest eigenvalue. Above 1, gradients explode; below 1, they vanish.

## Connections to Modern AI

Linear algebra is less a discipline that "inspired" AI and more the mathematical ground AI **directly stands on**. However, it is worth distinguishing how modern AI techniques leverage different properties of linear algebra.

**Direct use as mathematical foundation:**

- **Transformer attention**: The core operation is a product of three matrices Q, K, and V. In Attention = softmax(Q * K^T / sqrt(d_k)) * V, the Q * K^T product creates a token-to-token similarity matrix, multiplied by V for weighted aggregation. With W_Q, W_K, W_V applied to the input, a single attention layer performs at minimum four matrix multiplications.
- **Embedding lookup**: A word embedding is a V x d matrix (vocabulary size by dimension), and retrieving a row by token index is effectively a one-hot vector times the embedding matrix.
- **LoRA (Hu et al. 2022)**: Constrains the update dW to a product of two low-rank matrices A (d x r) and B (r x d). A 12288 x 12288 matrix has about 150 million parameters, but LoRA with r = 16 trains only about 390,000. The SVD observation that weight changes are effectively low-rank is its theoretical justification.

## Limitations and Weaknesses

Linear algebra forms the skeleton of deep learning, but inherent constraints exist within this skeleton.

- **Fundamental limits of linear transformations**: Matrix multiplication can only express linear transformations. Even a simple nonlinear problem like XOR cannot be solved by a single matrix, and without activation functions, an arbitrarily deep network is equivalent to a single matrix. Linear algebra is a necessary condition, not a sufficient one.
- **Numerical stability issues**: Large-scale matrix operations accumulate floating-point errors. Matrices with large condition numbers produce outputs that vary dramatically with small input changes, destabilizing training. In mixed-precision training, overflow from float16's narrow range is frequent.
- **Computational cost scaling**: The naive time complexity of matrix multiplication is O(n^3). In actual GPU implementations memory access patterns and cache efficiency matter more than theoretical complexity, and as models grow, matrix multiplication cost becomes dominant.
- **Limits of low-rank approximation**: Low-rank techniques like LoRA are effective only when weight changes are truly low-rank. Transfer learning to entirely different domains may require high-rank changes, and choosing the appropriate rank r sensitively affects performance with no reliable way to determine it in advance.

## Glossary

Linear map - a transformation between vector spaces that preserves addition and scalar multiplication; matrix multiplication is its concrete representation

Weight matrix - a matrix defining the linear transformation between inputs and outputs of a neural network layer, with each row corresponding to one neuron

Jacobian - a matrix collecting all partial derivatives of a multivariate vector function, used to propagate gradients between layers in backpropagation

Singular Value Decomposition (SVD) - a method of decomposing any matrix into three stages of "rotation-scaling-rotation," revealing how the matrix deforms space

Eigenvalue - the scaling factor of a vector (eigenvector) whose direction is unchanged by a matrix transformation; lambda in W * v = lambda * v

Rank - the number of independent directions a matrix actually uses; a low-rank matrix, even if high-dimensional, effectively utilizes only a few dimensions

Condition number - the ratio of a matrix's largest to smallest singular values; larger values indicate greater numerical instability

LoRA (Low-Rank Adaptation) - an efficient fine-tuning technique that freezes pre-trained weights and constrains updates to a product of two low-rank matrices
