---
difficulty: intermediate
connectionType: mathematical_foundation
keywords: 선형대수, 행렬 곱셈, 선형 변환, 특이값 분해, 고유값, 가중치 행렬, LoRA, 수치 안정성
keywords_en: linear algebra, matrix multiplication, linear transformation, singular value decomposition, eigenvalue, weight matrix, LoRA, numerical stability
---
Linear Algebra in Neural Networks - 신경망의 모든 계산은 행렬 곱셈이며, 선형대수는 딥러닝의 수학적 기반이자 물리적 실행 단위다

## 선형대수의 핵심: 공간을 변환하는 수학

선형대수는 벡터와 행렬을 다루는 수학 분야다. 그런데 "벡터"와 "행렬"이라는 단어는 본질을 가린다. 선형대수가 실제로 하는 일은 **공간 자체를 변환하는 것**이다.

2차원 평면 위의 모든 점을 동시에 회전시키거나, 한 방향으로 늘이거나, 특정 축에 대해 반사시키는 것 -- 이런 조작을 숫자로 표현한 것이 행렬이다. 2x2 행렬 하나가 평면 전체를 한 번에 변형하고, 3x3 행렬은 3차원 공간 전체를 변형한다. 1858년 Arthur Cayley가 행렬 대수를 체계화했을 때, 연립방정식의 간결한 표기법이 목적이었다. 행렬 곱셈, 역행렬, 행렬식(determinant)의 규칙을 세운 이 작업은 150년 뒤 전혀 예상하지 못한 영역에서 핵심 도구가 된다.

핵심 통찰은 이것이다. 행렬 곱셈 W * x가 단순한 숫자 계산이 아니라 "입력 공간의 점을 출력 공간의 점으로 옮기는 사상(mapping)"이라는 관점이다. 입력 차원이 n이고 출력 차원이 m인 행렬 W(크기 m x n)는, n차원 공간의 한 점을 m차원 공간의 한 점으로 보낸다. 이 **선형 사상**(linear map)이라는 개념이 나중에 신경망 레이어의 수학적 정체가 된다.

## 수학에서 신경망으로: 행렬이 "뉴런"이 된 과정

선형대수와 신경망의 만남은 한 번에 일어나지 않았다. 여러 사람이 서로 다른 시기에 각기 다른 다리를 놓았다.

- McCulloch & Pitts(1943)가 뉴런을 수학적으로 모델링할 때, 입력의 **가중합**(weighted sum)이라는 개념을 도입했다. 이것은 벡터의 내적(dot product)이며, 행렬 곱셈의 한 행(row)에 해당한다.
- Rosenblatt(1958)의 퍼셉트론은 이 가중합에 임계값 함수를 씌운 것이다. 단일 뉴런이 하는 연산이 "행렬의 한 행 x 입력 벡터 + 편향"과 정확히 같다는 사실은 이때 이미 명확했다. 뉴런 여러 개를 한 레이어에 묶으면, 각 뉴런의 가중치 벡터가 행렬의 각 행이 되어 하나의 **가중치 행렬** W를 형성한다.
- Rumelhart, Hinton & Williams(1986)의 역전파 알고리즘이 다층 퍼셉트론 학습을 실용화하면서, 신경망 연산이 **행렬 곱셈의 연쇄**임이 실무적으로도 확인되었다.
- 결정적 전환은 2012년이다. Krizhevsky, Sutskever & Hinton의 AlexNet이 GPU의 대규모 행렬 병렬 연산을 활용해 이미지 인식 대회(ImageNet)를 압도하면서, 선형대수 연산의 하드웨어 가속이 딥러닝의 실질적 병목이자 해결책임이 드러났다.

핵심 대응 관계는 다음과 같다.

- 수학의 선형 사상 --> 신경망 **한 레이어의 변환** (입력 공간을 출력 공간으로 매핑)
- 행렬의 각 행 --> 개별 **뉴런의 가중치 벡터**
- 행렬 곱셈 W * x --> 레이어의 **순전파 연산** (모든 뉴런의 가중합을 한 번에 계산)
- 야코비안 행렬의 곱 --> **역전파의 그래디언트 전파** (연쇄 법칙의 행렬 표현)
- 고유값 분석 --> **학습 안정성 진단** (그래디언트 소실/폭발 예측)

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

역전파(backpropagation)에서도 행렬이 중심이다. 손실 함수 L에 대한 가중치 W_l의 그래디언트는 연쇄 법칙에 의해 야코비안(Jacobian) 행렬의 곱으로 표현된다.

dL/dW_l = dL/dy * dy/dh_{L-1} * ... * dh_l/dW_l

각 dy/dh 항이 야코비안 행렬이다. 이 야코비안들의 곱이 **그래디언트 소실**(vanishing gradient)과 **폭발**(exploding gradient) 문제의 수학적 뿌리다. 야코비안의 특이값(singular value)이 반복 곱셈에서 계속 1보다 작으면 그래디언트가 기하급수적으로 줄어들고, 1보다 크면 폭발한다. 10개 레이어를 통과하면서 특이값 0.5가 10번 곱해지면 0.5^10 = 약 0.001, 그래디언트가 1000분의 1로 축소된다. 이 현상을 공간적으로 상상하면 이렇다. 각 레이어가 공간을 한 방향으로 절반씩 찌그러뜨리는 변환이라면, 10번 거치면 그 방향의 정보가 사실상 사라지는 것이다.

## 차원, 랭크, 표현력의 트레이드오프

신경망 설계에서 행렬의 크기는 곧 모델의 용량이다. m x n 가중치 행렬은 m * n개의 학습 가능한 파라미터를 갖는다. 차원을 키우면 표현력이 늘어나지만, 두 가지 비용이 따른다.

첫째, **계산 비용**이다. 행렬 곱셈의 시간 복잡도는 나이브하게 O(m * n * k)이며(m x n 행렬과 n x k 행렬의 곱), 모델이 커질수록 이 연산이 전체 학습 시간을 지배한다. GPT-3의 가중치 행렬 하나가 12288 x 12288 크기이고, 이런 행렬이 수백 개 존재한다.

둘째, **과적합 위험**이다. 파라미터가 데이터에 비해 너무 많으면 훈련 데이터를 "외우게" 되어 새로운 데이터에 일반화하지 못한다.

여기서 **랭크**(rank)라는 개념이 핵심적 역할을 한다. 행렬의 랭크는 그 행렬이 실제로 사용하는 독립적 방향의 수다. m x n 행렬의 랭크가 r이면, 이 행렬은 n차원 입력을 사실상 r차원 공간으로 먼저 압축한 뒤 m차원으로 펼치는 것과 같다. 큰 가중치 행렬이라도 랭크가 낮으면, 실질적으로 적은 수의 차원만 사용하고 있다는 뜻이다. 이 관찰이 모델 압축과 LoRA의 이론적 토대가 된다.

## 특이값 분해: 행렬의 내부를 들여다보는 도구

특이값 분해(Singular Value Decomposition, SVD)는 임의의 m x n 행렬 W를 세 행렬의 곱으로 분해한다.

W = U * S * V^T

U는 m x m 직교 행렬, S는 m x n 대각 행렬, V는 n x n 직교 행렬이다. S의 대각 원소가 특이값 s_1 >= s_2 >= ... >= s_r > 0이다.

이 분해가 의미하는 것을 공간적으로 해석하면 이렇다. 행렬 W가 수행하는 변환은 세 단계로 풀어진다. 먼저 V^T가 입력 공간을 **회전**시키고, S가 각 축 방향으로 **늘이거나 줄이며**(특이값이 각 방향의 스케일), U가 출력 공간에서 다시 **회전**시킨다. 특이값의 크기가 해당 방향이 얼마나 중요한지를 나타낸다. 특이값이 큰 방향은 행렬이 강하게 활용하는 차원이고, 0에 가까운 방향은 거의 무시하는 차원이다.

신경망에서 SVD는 세 가지 핵심 역할을 한다.

첫째, **유효 랭크 파악**이다. 특이값이 빠르게 감쇠하면, 그 행렬은 소수의 방향만 실질적으로 사용하는 **저랭크**(low-rank) 행렬에 가깝다. 이는 불필요한 파라미터가 많다는 신호이며, 압축의 여지를 시사한다.

둘째, **학습 역학 분석**이다. 훈련 중 가중치 행렬의 특이값 스펙트럼이 어떻게 변하는지를 추적하면 모델의 학습 상태를 진단할 수 있다. Martin & Mahoney(2021)는 잘 훈련된 모델의 가중치 행렬 특이값 분포가 멱법칙(power law)을 따르며, 이 분포의 기울기가 일반화 성능과 상관관계가 있음을 보였다.

셋째, **모델 압축**이다. 상위 k개 특이값만 유지하는 절단 SVD(truncated SVD)로 행렬을 근사하면, 원래 m * n개의 파라미터 대신 k * (m + n + 1)개만으로 비슷한 변환을 수행할 수 있다.

## 고유값, 초기화, 그리고 학습 안정성

정방 행렬 W에 대해 W * v = lambda * v를 만족하는 스칼라 lambda가 고유값(eigenvalue), 벡터 v가 고유벡터(eigenvector)다. 고유벡터는 행렬에 의해 "방향은 유지되고 크기만 lambda배 변하는" 특수한 벡터다.

고유값이 학습에 직접 영향을 미치는 대표적 사례가 순환 신경망(RNN)이다. RNN은 시간 단계마다 같은 가중치 행렬 W_h를 반복 곱한다. T번의 시간 단계를 거치면 그래디언트에 W_h^T가 관여하는데, 이 행렬 거듭제곱의 행동은 최대 고유값의 절대값인 **스펙트럴 반지름**(spectral radius)이 결정한다. 스펙트럴 반지름이 1.1이면 50단계 후 1.1^50 = 약 117배로 그래디언트가 폭발하고, 0.9이면 0.9^50 = 약 0.005배로 소실된다.

이 문제를 해결하기 위해 **직교 초기화**(orthogonal initialization)가 제안되었다. 직교 행렬의 모든 고유값 절대값은 정확히 1이므로, 반복 곱셈해도 크기가 변하지 않는다. 더 일반적으로, He et al.(2015)의 Kaiming 초기화와 Glorot & Bengio(2010)의 Xavier 초기화는 가중치 행렬의 분산을 레이어 차원(fan_in, fan_out)에 맞게 조절하여, 순전파와 역전파에서 활성화값과 그래디언트의 분산이 레이어를 거칠 때 일정하게 유지되도록 설계되었다. Kaiming 초기화에서 분산을 2/fan_in으로 설정하는 것은, ReLU 활성화 함수가 음수 입력을 0으로 만들어 분산을 절반으로 줄이는 효과를 보상하기 위한 것이다. 이 초기화 전략들의 수학적 기반은 모두 행렬의 고유값/특이값 분포 이론이다.

## 현대 AI 기법과의 연결

선형대수는 AI에 "영감을 준" 학문이라기보다, AI가 그 위에 **직접 서 있는** 수학적 토대다. 다만 현대 AI 기법들이 선형대수의 어떤 성질을 어떤 방식으로 활용하는지는 구분할 필요가 있다.

**수학적 기반으로서 직접 사용:**

- **LoRA (Low-Rank Adaptation)**: Hu et al.(2022)는 SVD의 저랭크 근사 원리를 모델 미세조정에 직접 적용했다. 사전 훈련된 가중치 W_0를 동결하고, 갱신량 delta_W를 두 저랭크 행렬의 곱 B * A로 파라미터화한다 (A는 r x d, B는 d x r, r << d). 원래 d^2개의 파라미터가 필요한 갱신을 2 * d * r개로 줄인다. d = 4096, r = 8이면 약 256배 감소다. 이 접근이 효과적인 근거는 Aghajanyan et al.(2021)의 발견이다. 대형 모델 미세조정 시 가중치 변화가 매우 낮은 고유 차원(intrinsic dimension)에 집중되어, delta_W가 자연적으로 저랭크인 경향이 있다. QLoRA(Dettmers et al., 2023)는 4비트 양자화를 결합하여 65B 모델을 단일 48GB GPU에서 미세조정할 수 있게 했다.
- **어텐션 메커니즘**: Transformer(Vaswani et al., 2017)의 셀프 어텐션은 Query, Key, Value 각각을 별도의 가중치 행렬로 선형 변환한 뒤, Q * K^T / sqrt(d_k)로 유사도를 계산하고 소프트맥스를 거쳐 V에 가중합을 취한다. 전체 과정이 행렬 곱셈의 조합이다.
- **GPU/TPU 하드웨어**: NVIDIA의 Tensor Core는 4x4 행렬 곱셈-누적(FMA)을 단일 사이클에 수행하고, Google TPU는 128x128 시스톨릭 어레이(systolic array)로 행렬 곱셈에 특화되었다. 하드웨어 자체가 선형대수를 물리적으로 구현한 것이다.

**선형대수 이론이 분석 도구로 쓰이는 경우:**

- **그래디언트 클리핑과 스펙트럴 정규화**: 학습 불안정을 제어하는 이 기법들은 야코비안의 특이값이나 가중치 행렬의 스펙트럴 노름을 직접 제한한다. 물리학이나 생물학에서 영감을 받은 것이 아니라, 선형대수의 행렬 노름 이론을 학습 안정화에 독립적으로 적용한 것이다.
- **Principal Component Analysis(PCA)**: 데이터의 공분산 행렬을 고유값 분해하여 주요 방향을 추출하는 PCA는 차원 축소와 시각화에 널리 쓰인다. 신경망의 은닉층 표현을 분석하거나, 임베딩 공간의 구조를 이해하는 데 사용된다.

## 한계와 약점

선형대수는 딥러닝의 뼈대이지만, 이 뼈대 자체에 내재된 제약이 있다.

- **선형 변환의 본질적 한계**: 행렬 곱셈은 선형 변환만 표현할 수 있다. XOR 같은 단순한 비선형 문제도 단일 행렬로는 풀 수 없으며, 활성화 함수 없이는 아무리 깊은 네트워크도 단일 행렬과 동치다. 선형대수는 필요조건이지 충분조건이 아니다.
- **수치 안정성 문제**: 대규모 행렬 연산은 부동소수점 오차가 누적된다. 조건수(condition number, 최대 특이값/최소 특이값의 비율)가 큰 행렬은 작은 입력 변화에 출력이 크게 변하여 학습이 불안정해진다. 혼합 정밀도(mixed precision) 훈련에서 float16의 좁은 표현 범위(최대 약 65504)로 인한 오버플로우가 빈번하다.
- **계산 비용의 확장**: 행렬 곱셈의 나이브 시간 복잡도는 O(n^3)이다. Strassen(1969)의 O(n^2.807)이나 이론적 한계인 O(n^2.373)이 있지만, 실제 GPU에서는 메모리 접근 패턴과 캐시 효율이 이론적 복잡도보다 더 중요하다. 모델이 커질수록 행렬 곱셈 비용이 지배적이며, 이것이 대형 모델 훈련 비용의 근본 원인이다.
- **저랭크 근사의 한계**: LoRA 등의 저랭크 기법은 가중치 변화가 실제로 저랭크일 때만 효과적이다. 전혀 다른 도메인으로의 전이 학습처럼 높은 랭크의 변화가 필요한 경우, 랭크 r의 선택이 성능에 민감하게 영향을 미치며 적절한 r을 사전에 알기 어렵다.

## 용어 정리

선형 사상(linear map) - 벡터 공간 사이의 변환으로, 덧셈과 스칼라 곱을 보존하는 함수. 행렬 곱셈이 그 구체적 표현이다

가중치 행렬(weight matrix) - 신경망 한 레이어에서 입력과 출력 사이의 선형 변환을 정의하는 행렬. 각 행이 하나의 뉴런에 대응한다

야코비안(Jacobian) - 다변수 벡터 함수의 모든 편미분을 모은 행렬. 역전파에서 그래디언트를 레이어 간에 전달하는 데 사용된다

특이값 분해(Singular Value Decomposition, SVD) - 임의의 행렬을 "회전-스케일-회전"의 세 단계로 분해하는 방법. 행렬이 공간을 어떻게 변형하는지 보여준다

고유값(eigenvalue) - 행렬 변환에서 방향이 바뀌지 않는 벡터(고유벡터)의 크기 변화 계수. W * v = lambda * v에서 lambda

랭크(rank) - 행렬이 실제로 사용하는 독립적 방향의 수. 랭크가 낮으면 고차원 행렬이라도 실질적으로 적은 차원만 활용한다

조건수(condition number) - 행렬의 최대 특이값과 최소 특이값의 비율. 이 값이 클수록 수치적으로 불안정하다

직교 행렬(orthogonal matrix) - 전치 행렬이 역행렬과 같은 정방 행렬. 모든 고유값의 절대값이 1이어서, 변환 시 벡터의 길이와 각도를 보존한다

LoRA(Low-Rank Adaptation) - 사전 훈련된 가중치를 동결하고, 갱신량을 두 저랭크 행렬의 곱으로 제한하는 효율적 미세조정 기법

텐서(tensor) - 행렬을 고차원으로 일반화한 다차원 배열. CNN의 4차원 입력(배치, 채널, 높이, 너비)이나 Transformer의 어텐션 텐서가 대표적이다

---EN---
Linear Algebra in Neural Networks - All neural network computation is matrix multiplication, and linear algebra is both the mathematical foundation and the physical execution unit of deep learning

## The Core of Linear Algebra: Mathematics That Transforms Space

Linear algebra is the branch of mathematics dealing with vectors and matrices. But those words obscure its essence. What linear algebra actually does is **transform space itself**.

Rotating every point on a 2D plane simultaneously, stretching space in one direction, reflecting it across an axis -- a matrix is the numerical representation of such operations. A single 2x2 matrix deforms the entire plane at once; a 3x3 matrix deforms all of 3D space. When Arthur Cayley systematized matrix algebra in 1858, his goal was concise notation for systems of equations. The rules he established for matrix multiplication, inverses, and determinants would become an essential tool in a completely unforeseen domain 150 years later.

The key insight is this: the matrix multiplication W * x is not mere arithmetic but a "mapping that sends a point in input space to a point in output space." A matrix W of size m x n sends a point in n-dimensional space to a point in m-dimensional space. This concept of a **linear map** later becomes the mathematical identity of a neural network layer.

## From Mathematics to Neural Networks: How Matrices Became "Neurons"

The meeting of linear algebra and neural networks did not happen all at once. Different people built different bridges at different times.

- When McCulloch & Pitts (1943) mathematically modeled a neuron, they introduced the **weighted sum** of inputs. This is a dot product of vectors -- equivalent to one row of a matrix multiplication.
- Rosenblatt's (1958) perceptron applied a threshold function to this weighted sum. The fact that a single neuron's operation is exactly "one row of a matrix times the input vector plus a bias" was already clear. Bundling multiple neurons into a layer means each neuron's weight vector becomes a row of a single **weight matrix** W.
- Rumelhart, Hinton & Williams's (1986) backpropagation algorithm made multi-layer perceptron training practical, confirming operationally that neural network computation is a **chain of matrix multiplications**.
- The decisive turning point came in 2012. Krizhevsky, Sutskever & Hinton's AlexNet leveraged GPUs' massive matrix-parallel computation to dominate the ImageNet image recognition competition, revealing that hardware acceleration of linear algebra operations was both the bottleneck and the solution for deep learning.

The key correspondences are:

- Mathematical linear map --> one layer's **transformation** (mapping input space to output space)
- Each row of a matrix --> an individual **neuron's weight vector**
- Matrix multiplication W * x --> the layer's **forward pass** (computing all neurons' weighted sums simultaneously)
- Product of Jacobian matrices --> **gradient propagation in backpropagation** (the matrix expression of the chain rule)
- Eigenvalue analysis --> **training stability diagnostics** (predicting gradient vanishing/explosion)

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

Matrices are central in backpropagation as well. The gradient of loss function L with respect to weights W_l is expressed as a product of Jacobian matrices via the chain rule:

dL/dW_l = dL/dy * dy/dh_{L-1} * ... * dh_l/dW_l

Each dy/dh term is a Jacobian matrix. The product of these Jacobians is the mathematical root of the **vanishing gradient** and **exploding gradient** problems. When the singular values of the Jacobians are repeatedly less than 1 through successive multiplications, gradients shrink exponentially; when greater than 1, they explode. If a singular value of 0.5 is multiplied 10 times through 10 layers, 0.5^10 = roughly 0.001 -- the gradient shrinks to one-thousandth. To visualize this spatially: if each layer is a transformation that squashes space by half in one direction, after 10 layers the information in that direction has effectively disappeared.

## Dimensions, Rank, and the Expressiveness Tradeoff

In neural network design, a matrix's size is the model's capacity. An m x n weight matrix has m * n learnable parameters. Increasing dimensions increases expressiveness, but at two costs.

First, **computational cost**. The time complexity of matrix multiplication is naively O(m * n * k) (for multiplying an m x n matrix by an n x k matrix), and as models grow this operation dominates total training time. A single weight matrix in GPT-3 is 12288 x 12288, and hundreds of such matrices exist.

Second, **overfitting risk**. Too many parameters relative to data causes the model to "memorize" training data, failing to generalize to new data.

The concept of **rank** plays a key role here. A matrix's rank is the number of independent directions it actually uses. If an m x n matrix has rank r, it is effectively compressing n-dimensional input into r-dimensional space first, then expanding to m dimensions. Even a large weight matrix, if low-rank, is actually using only a few dimensions. This observation becomes the theoretical foundation for model compression and LoRA.

## Singular Value Decomposition: A Tool for Seeing Inside Matrices

Singular Value Decomposition (SVD) factorizes any m x n matrix W into the product of three matrices:

W = U * S * V^T

U is an m x m orthogonal matrix, S is an m x n diagonal matrix, and V is an n x n orthogonal matrix. The diagonal entries of S are the singular values s_1 >= s_2 >= ... >= s_r > 0.

Interpreting this decomposition spatially: the transformation performed by matrix W breaks down into three stages. First, V^T **rotates** the input space; then S **stretches or compresses** along each axis (singular values are the scale in each direction); finally U **rotates** again in the output space. The magnitude of each singular value indicates how important that direction is. Directions with large singular values are dimensions the matrix heavily utilizes; directions near 0 are effectively ignored.

SVD plays three key roles in neural networks.

First, **determining effective rank**. If singular values decay rapidly, the matrix is approximately **low-rank**, using only a few directions substantively. This signals redundant parameters and suggests room for compression.

Second, **analyzing training dynamics**. Tracking how the singular value spectrum of weight matrices changes during training enables diagnosing model learning states. Martin & Mahoney (2021) showed that singular value distributions of well-trained models follow a power law, with the slope of this distribution correlating with generalization performance.

Third, **model compression**. Truncated SVD, retaining only the top k singular values, can approximate the matrix using k * (m + n + 1) parameters instead of the original m * n, performing a similar transformation at lower cost.

## Eigenvalues, Initialization, and Training Stability

For a square matrix W, the scalar lambda satisfying W * v = lambda * v is an eigenvalue, and the vector v is an eigenvector. Eigenvectors are special vectors whose direction is preserved by the matrix transformation, with only their magnitude changing by a factor of lambda.

A prime example of eigenvalues directly impacting learning is in recurrent neural networks (RNNs). RNNs multiply by the same weight matrix W_h at each time step. After T time steps, W_h^T appears in the gradient computation, and the behavior of this matrix power is determined by the **spectral radius** -- the absolute value of the largest eigenvalue. A spectral radius of 1.1 means after 50 steps, 1.1^50 = roughly 117-fold gradient explosion; 0.9 means 0.9^50 = roughly 0.005-fold vanishing.

**Orthogonal initialization** was proposed to address this. All eigenvalues of an orthogonal matrix have absolute value exactly 1, so repeated multiplication preserves magnitude. More generally, He et al.'s (2015) Kaiming initialization and Glorot & Bengio's (2010) Xavier initialization adjust weight matrix variance to match layer dimensions (fan_in, fan_out), ensuring activation and gradient variances remain consistent across layers during forward and backward passes. In Kaiming initialization, setting variance to 2/fan_in compensates for ReLU activation zeroing out negative inputs, which halves the variance. The mathematical foundation of all these initialization strategies is eigenvalue/singular value distribution theory.

## Connections to Modern AI

Linear algebra is less a discipline that "inspired" AI and more the mathematical ground AI **directly stands on**. However, it is worth distinguishing how modern AI techniques leverage different properties of linear algebra.

**Direct use as mathematical foundation:**

- **LoRA (Low-Rank Adaptation)**: Hu et al. (2022) directly applied SVD's low-rank approximation principle to model fine-tuning. Pre-trained weights W_0 are frozen and the update delta_W is parameterized as a product of two low-rank matrices B * A (A is r x d, B is d x r, r << d). This reduces the d^2 parameters needed for the update to 2 * d * r. With d = 4096 and r = 8, that is roughly a 256-fold reduction. The effectiveness of this approach rests on Aghajanyan et al.'s (2021) finding that weight changes during large model fine-tuning concentrate in a very low intrinsic dimension, meaning delta_W naturally tends to be low-rank. QLoRA (Dettmers et al., 2023) combined 4-bit quantization to enable fine-tuning of 65B models on a single 48GB GPU.
- **Attention mechanism**: The self-attention in Transformers (Vaswani et al., 2017) linearly transforms inputs through separate weight matrices for Query, Key, and Value, computes similarity via Q * K^T / sqrt(d_k), passes through softmax, and takes a weighted sum over V. The entire process is a composition of matrix multiplications.
- **GPU/TPU hardware**: NVIDIA's Tensor Cores perform 4x4 matrix multiply-accumulate (FMA) in a single cycle, and Google's TPUs specialize in matrix multiplication with 128x128 systolic arrays. The hardware itself is a physical implementation of linear algebra.

**Linear algebra theory used as an analytical tool:**

- **Gradient clipping and spectral normalization**: These techniques for controlling training instability directly constrain Jacobian singular values or weight matrix spectral norms. They are not inspired by physics or biology, but independently apply linear algebra's matrix norm theory to stabilize learning.
- **Principal Component Analysis (PCA)**: PCA extracts principal directions by eigenvalue-decomposing the data covariance matrix, widely used for dimensionality reduction and visualization. It is used to analyze hidden layer representations or understand embedding space structure.

## Limitations and Weaknesses

Linear algebra forms the skeleton of deep learning, but inherent constraints exist within this skeleton.

- **Fundamental limits of linear transformations**: Matrix multiplication can only express linear transformations. Even a simple nonlinear problem like XOR cannot be solved by a single matrix, and without activation functions, an arbitrarily deep network is equivalent to a single matrix. Linear algebra is a necessary condition, not a sufficient one.
- **Numerical stability issues**: Large-scale matrix operations accumulate floating-point errors. Matrices with large condition numbers (ratio of largest to smallest singular values) produce outputs that vary dramatically with small input changes, destabilizing training. In mixed-precision training, overflow from float16's narrow range (maximum roughly 65504) is frequent.
- **Computational cost scaling**: The naive time complexity of matrix multiplication is O(n^3). While Strassen's (1969) O(n^2.807) and the theoretical bound O(n^2.373) exist, in actual GPU implementations memory access patterns and cache efficiency matter more than theoretical complexity. As models grow, matrix multiplication cost becomes dominant -- the root cause of large model training expenses.
- **Limits of low-rank approximation**: Low-rank techniques like LoRA are effective only when weight changes are truly low-rank. Transfer learning to entirely different domains may require high-rank changes, and choosing the appropriate rank r sensitively affects performance with no reliable way to determine it in advance.

## Glossary

Linear map - a transformation between vector spaces that preserves addition and scalar multiplication; matrix multiplication is its concrete representation

Weight matrix - a matrix defining the linear transformation between inputs and outputs of a neural network layer, with each row corresponding to one neuron

Jacobian - a matrix collecting all partial derivatives of a multivariate vector function, used to propagate gradients between layers in backpropagation

Singular Value Decomposition (SVD) - a method of decomposing any matrix into three stages of "rotation-scaling-rotation," revealing how the matrix deforms space

Eigenvalue - the scaling factor of a vector (eigenvector) whose direction is unchanged by a matrix transformation; lambda in W * v = lambda * v

Rank - the number of independent directions a matrix actually uses; a low-rank matrix, even if high-dimensional, effectively utilizes only a few dimensions

Condition number - the ratio of a matrix's largest to smallest singular values; larger values indicate greater numerical instability

Orthogonal matrix - a square matrix whose transpose equals its inverse, with all eigenvalue absolute values equal to 1, preserving vector lengths and angles during transformation

LoRA (Low-Rank Adaptation) - an efficient fine-tuning technique that freezes pre-trained weights and constrains updates to a product of two low-rank matrices

Tensor - a multidimensional array generalizing matrices to higher dimensions; representative examples include CNN 4D inputs (batch, channel, height, width) and Transformer attention tensors
