---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 정보 기하학, 자연 경사, 피셔 정보 행렬, KL 발산, 리만 계량, 통계적 다양체, TRPO, K-FAC
keywords_en: information geometry, natural gradient, Fisher information matrix, KL divergence, Riemannian metric, statistical manifold, TRPO, K-FAC
---
Information Geometry - 확률 분포들이 사는 공간에 곡률을 부여하여, 파라미터의 좌표 선택에 흔들리지 않는 최적화를 가능하게 한 미분 기하학 이론

## 확률 분포 사이의 "거리"라는 문제

경사하강법(gradient descent)에서 파라미터를 갱신할 때, 우리는 파라미터 변화량의 크기를 유클리드 노름(Euclidean norm)으로 잰다. ||delta_theta||^2 = sum(delta_theta_i^2). 그런데 이 측정 방식에는 근본적인 문제가 있다.

정규 분포 N(mu, sigma^2)를 예로 들자. sigma가 100인 분포에서 sigma를 0.1 줄이면 분포의 모양은 거의 변하지 않는다. 반면 sigma가 0.2인 분포에서 sigma를 0.1 줄이면 분포가 반 토막 나면서 완전히 다른 분포가 된다. 파라미터 공간의 유클리드 거리와 분포 공간의 실제 변화가 어긋나는 것이다.

공간적으로 상상하면, 확률 분포들이 모여 있는 공간은 평평한 바닥이 아니라 어떤 방향으로는 완만하고 어떤 방향으로는 급경사인 **굽어진 표면**이다. 유클리드 경사하강법은 이 표면이 평평하다고 가정하고 걸음을 내딛기 때문에, 급경사 방향에서는 절벽 아래로 굴러떨어지고 완만한 방향에서는 제자리걸음이 된다. 표면의 곡률을 반영한 걸음걸이가 필요하다.

## 피셔 정보라는 자(ruler)의 발견

C. R. Rao(1945)가 이 문제의 핵심을 포착했다. 그는 피셔 정보 행렬(Fisher information matrix)이 확률 분포 공간 위의 자연스러운 리만 계량(Riemannian metric) -- 즉 분포 공간에서 거리를 재는 올바른 자(ruler) -- 임을 보였다. 정의는 다음과 같다.

F_ij = E[d(log p(x; theta))/d(theta_i) * d(log p(x; theta))/d(theta_j)]

이 행렬의 (i,j) 성분이 크면 theta_i와 theta_j를 조금만 바꿔도 분포가 크게 변한다는 뜻이고, 작으면 많이 바꿔도 분포는 별로 안 변한다. 즉 피셔 정보 행렬은 "파라미터 변화 한 단위가 분포 변화 몇 단위에 해당하는가"를 알려주는 환율표다. 통계학에서 피셔 정보는 추정의 한계(Cramer-Rao 하한)로 해석되지만, 정보 기하학에서는 "분포 공간이 이 지점에서 얼마나 휘어져 있는가"를 답한다.

## Amari의 정보 기하학 체계

Shun-ichi Amari(1985)는 이 아이디어를 정보 기하학(information geometry)이라는 완성된 수학적 체계로 발전시켰다. 핵심 구성은 다음과 같다.

파라미터 theta로 인덱싱된 확률 분포의 집합 {p(x; theta)}를 하나의 매끄러운 다양체(smooth manifold) -- 통계적 다양체(statistical manifold) -- 로 본다. 이 다양체 위의 각 점이 하나의 확률 분포이고, 피셔 정보 행렬이 각 점에서의 거리 계량으로 부여된다.

이 계량 아래에서, 인접한 두 분포 사이의 "거리"는 KL 발산(Kullback-Leibler divergence)의 2차 근사와 일치한다.

D_KL(p(theta) || p(theta + d_theta)) ≈ 1/2 * d_theta^T * F * d_theta

## 수학에서 AI 최적화로: 자연 경사법

Amari(1998)는 이 기하학적 통찰을 기계학습 최적화에 직접 적용하여 자연 경사법(natural gradient)을 제안했다. 핵심 대응 관계는 다음과 같다.

- 통계적 다양체 --> **신경망의 파라미터가 정의하는 확률 분포의 공간**
- 피셔 정보 행렬 --> **파라미터 공간의 곡률을 반영하는 계량 텐서**
- 리만 다양체 위의 최급강하 방향 --> **자연 경사 갱신 규칙**
- 유클리드 거리의 한계 --> **일반 SGD가 파라미터화 방식에 따라 수렴 경로가 달라지는 문제**
- KL 발산의 국소 근사 --> **신뢰 영역(trust region) 제약의 이론적 근거**

갱신 규칙은 일반 경사하강법에 F^(-1)을 곱하는 것이다.

theta(t+1) = theta(t) - eta * F^(-1) * gradient(L)

일반 경사하강법이 "유클리드 공간에서 가장 가파른 내리막"으로 걷는다면, 자연 경사법은 "분포 공간에서 가장 가파른 내리막"으로 걷는다. F^(-1)이 유클리드 좌표계의 그래디언트를 분포 공간의 자연 좌표계로 변환하는 역할을 한다.

## 핵심 트레이드오프: 기하학적 정확성 vs 계산 비용

자연 경사법의 이론적 우수성에는 치명적인 실용 장벽이 있다. 파라미터 수가 n이면 피셔 정보 행렬 F는 n x n 행렬이고, 역행렬 계산은 O(n^3)이다. 10억 개 파라미터 모델이면 F는 10^18개 원소를 가진 행렬이 되어 저장 자체가 불가능하다.

이 때문에 정보 기하학의 AI 적용은 항상 "얼마나 많은 기하학적 정보를 포기할 것인가"라는 근사(approximation)의 문제가 된다. 대각 성분만 쓸 것인가, 블록 대각으로 근사할 것인가, 크로네커 곱으로 분해할 것인가. 근사가 거칠수록 계산은 빨라지지만 곡률 정보를 더 많이 잃는다.

## 현대 AI에서의 실현

정보 기하학의 AI 연결은 성격에 따라 구분된다.

**Amari의 자연 경사법에서 직접 파생된 기법:**

- **K-FAC**: Martens & Grosse(2015)는 각 레이어의 피셔 정보 행렬을 입력 활성화의 공분산과 그래디언트의 공분산의 크로네커 곱(Kronecker product)으로 근사했다. 레이어 내 뉴런 간 독립성을 가정하는 근사이지만, 전체 F를 다루는 O(n^3) 대신 레이어 단위로 분해하여 계산 비용을 크게 줄인다. 곡률 정보의 블록 구조를 보존하면서 실행 가능한 수준의 비용을 달성한 절충안이다.

- **TRPO**: Schulman et al.(2015)는 강화학습의 정책 갱신에 정보 기하학을 적용했다. 정책 갱신 폭을 KL 발산으로 제약하면, 그 국소 근사가 피셔 정보 행렬에 의한 2차 형식이 되어 갱신 방향이 자연 경사와 일치한다. Kakade(2001)의 natural policy gradient를 경유하여 Amari(1998)까지 이어지는 직접적 학문 계보에 있다. 후속 PPO(2017)는 KL 제약을 클리핑으로 대체하여, 기하학적 정밀도를 더 포기하고 실용성을 택한 진화다.

**독립 발전이지만 구조가 유사한 기법:**

- **Adam, AdaGrad**: 이 적응적 학습률 알고리즘들은 파라미터별로 과거 그래디언트의 크기를 추적하여 보폭을 조절한다. 결과적으로 피셔 정보 행렬의 대각 성분 근사와 유사한 효과를 내지만, 자연 경사법과는 독립적으로 발전했으며, 파라미터 간 상호작용(비대각 성분)은 반영하지 못한다.

## 한계와 약점

- **근사의 대가**: K-FAC, 대각 근사 등 모든 실용적 방법은 피셔 정보 행렬의 기하학적 정보를 상당 부분 포기한다. 자연 경사법의 이론적 이점이 실제로 얼마나 전달되는지는 근사 방법마다 다르다.
- **경험적 우위의 불확실성**: 대규모 딥러닝에서 자연 경사 근사가 Adam 대비 일관된 이점을 보이지 못하는 경우가 많다. 학습률 스케줄링, 배치 정규화 등이 자연 경사의 이점 일부를 간접적으로 제공할 수 있기 때문이다.
- **비지수족 한계**: 정보 기하학의 가장 우아한 결과들은 지수족 분포에 대해 성립한다. 딥 뉴럴 네트워크가 정의하는 복잡한 분포족은 지수족이 아니므로 이론적 보장이 약해진다.
- **비동정성 문제**: 신경망에서 서로 다른 파라미터 조합이 같은 분포를 정의할 수 있다(예: 뉴런 순서 변경). 이 비동정성(non-identifiability)은 피셔 정보 행렬을 특이(singular)하게 만들어 역행렬이 존재하지 않게 한다.

## 용어 정리

피셔 정보 행렬(Fisher information matrix) - 로그 우도의 그래디언트에 대한 공분산 행렬. 파라미터를 조금 바꿨을 때 분포가 얼마나 민감하게 변하는지를 측정하며, 분포 공간의 리만 계량으로 작용한다

자연 경사(natural gradient) - 일반 그래디언트에 피셔 정보 행렬의 역행렬을 곱하여, 분포 공간에서의 최급강하 방향을 구하는 최적화 방법. Amari(1998)가 제안

KL 발산(Kullback-Leibler divergence) - 두 확률 분포 사이의 비대칭적 차이를 측정하는 양. p에서 q를 보는 거리와 q에서 p를 보는 거리가 다르다. 정보 기하학에서 국소적으로 피셔 계량과 일치

리만 계량(Riemannian metric) - 다양체(휘어진 공간) 위의 각 점에서 접선 벡터의 내적을 정의하는 양의 정치 대칭 텐서. 거리, 각도, 곡률을 재는 기반

통계적 다양체(statistical manifold) - 파라미터로 인덱싱된 확률 분포의 집합을 매끄러운 다양체로 본 기하학적 구조. 각 점이 하나의 확률 분포에 대응

지수족(exponential family) - 확률 밀도가 exp(theta^T * T(x) - A(theta)) 형태를 가지는 분포의 집합. 정규 분포, 포아송 분포, 베르누이 분포 등이 포함되며, 정보 기하학의 이론적 중심 대상

K-FAC(Kronecker-Factored Approximate Curvature) - 레이어별 피셔 정보 행렬을 크로네커 곱으로 근사하는 2차 최적화 알고리즘. Martens & Grosse(2015)

TRPO(Trust Region Policy Optimization) - KL 발산 제약 아래에서 정책을 갱신하는 강화학습 알고리즘. 자연 경사법을 분포 공간의 신뢰 영역 제약으로 구현. Schulman et al.(2015)
---EN---
Information Geometry - A differential geometry theory that equips the space of probability distributions with curvature, enabling optimization invariant to the choice of parameterization

## The Problem of "Distance" Between Probability Distributions

When updating parameters in gradient descent, we measure the magnitude of parameter changes using the Euclidean norm: ||delta_theta||^2 = sum(delta_theta_i^2). But this measurement has a fundamental problem.

Consider a normal distribution N(mu, sigma^2). Reducing sigma by 0.1 in a distribution with sigma = 100 barely changes the distribution's shape. But reducing sigma by 0.1 when sigma = 0.2 cuts the distribution nearly in half, producing an entirely different distribution. Euclidean distance in parameter space diverges from the actual change in distribution space.

Spatially, the space where probability distributions live is not a flat floor but a **curved surface** -- gentle in some directions, steeply sloped in others. Euclidean gradient descent assumes this surface is flat, so on a steep slope one step sends you tumbling off a cliff, while on a gentle slope the same step barely moves you. What is needed is a stride that reflects the surface's curvature.

## Discovering the Right Ruler: Fisher Information

C. R. Rao (1945) captured the essence of this problem. He showed that the Fisher information matrix is the natural Riemannian metric on the space of probability distributions -- the correct ruler for measuring distances in distribution space. It is defined as:

F_ij = E[d(log p(x; theta))/d(theta_i) * d(log p(x; theta))/d(theta_j)]

When the (i,j) entry of this matrix is large, even a small change in theta_i and theta_j produces a large change in the distribution. When small, even large parameter changes barely affect it. In essence, the Fisher information matrix is an exchange rate table: "how many units of distribution change does one unit of parameter change buy?" In statistics, Fisher information answers "how precisely can this parameter be estimated?" (Cramer-Rao lower bound). In information geometry, it answers "how curved is distribution space at this point?"

## Amari's Information Geometry Framework

Shun-ichi Amari (1985) developed this idea into a complete mathematical framework called information geometry. The core construction is as follows.

The collection of probability distributions {p(x; theta)} indexed by parameter theta is viewed as a smooth manifold -- called a statistical manifold. Each point on this manifold is a probability distribution, and the Fisher information matrix is assigned as the distance metric at each point.

Under this metric, the "distance" between two neighboring distributions coincides with the second-order approximation of KL divergence (Kullback-Leibler divergence):

D_KL(p(theta) || p(theta + d_theta)) ≈ 1/2 * d_theta^T * F * d_theta

## From Mathematics to AI Optimization: The Natural Gradient

Amari (1998) directly applied this geometric insight to machine learning optimization, proposing the natural gradient method. The key correspondences are:

- Statistical manifold --> **the space of probability distributions defined by a neural network's parameters**
- Fisher information matrix --> **a metric tensor reflecting the curvature of parameter space**
- Steepest descent on a Riemannian manifold --> **the natural gradient update rule**
- Limitations of Euclidean distance --> **the problem that ordinary SGD's convergence path changes depending on parameterization**
- Local approximation of KL divergence --> **the theoretical basis for trust region constraints**

The update rule multiplies the ordinary gradient by F^(-1):

theta(t+1) = theta(t) - eta * F^(-1) * gradient(L)

Where ordinary gradient descent walks "downhill in the steepest direction in Euclidean space," the natural gradient walks "downhill in the steepest direction in distribution space." F^(-1) transforms the gradient from Euclidean coordinates to the natural coordinates of distribution space.

## The Core Tradeoff: Geometric Accuracy vs. Computational Cost

The theoretical superiority of the natural gradient faces a critical practical barrier. With n parameters, the Fisher information matrix F is an n x n matrix, and computing its inverse is O(n^3). For a model with 1 billion parameters, F would have 10^18 entries -- physically impossible to store.

This is why applying information geometry to AI always becomes a question of approximation: "How much geometric information are we willing to sacrifice?" Use only F's diagonal? Block diagonals? Kronecker products? Coarser approximations compute faster but lose more curvature information.

## Realization in Modern AI

The connections between information geometry and AI differ in character.

**Techniques directly derived from Amari's natural gradient:**

- **K-FAC**: Martens & Grosse (2015) approximated each layer's Fisher information matrix as the Kronecker product of the input activation covariance and the gradient covariance. This approximation assumes independence between neurons within a layer, but by decomposing at the layer level instead of handling the full O(n^3) F, it dramatically reduces computational cost. A compromise that preserves the block structure of curvature information while achieving tractable cost.

- **TRPO**: Schulman et al. (2015) applied information geometry to policy updates in reinforcement learning. Constraining the update step by KL divergence produces a local approximation that becomes a quadratic form under the Fisher information matrix, making the update direction coincide with the natural gradient. It sits in a direct academic lineage from Amari (1998) via Kakade's (2001) natural policy gradient. The successor PPO (2017) replaced the KL constraint with clipping, trading more geometric precision for practicality.

**Techniques that arrived at similar structure independently:**

- **Adam, AdaGrad**: These adaptive learning rate algorithms track the magnitude of past gradients per parameter to adjust step sizes. The effect resembles a diagonal approximation of the Fisher information matrix, but they were developed independently of the natural gradient and cannot capture inter-parameter interactions (off-diagonal elements).

## Limitations and Weaknesses

- **The cost of approximation**: Every practical method -- K-FAC, diagonal approximation -- sacrifices substantial geometric information. How much of the natural gradient's theoretical advantage transfers depends on the approximation method.
- **Uncertain empirical advantage**: In large-scale deep learning, natural gradient approximations often fail to show consistent benefits over Adam. Learning rate scheduling and batch normalization may indirectly provide some of the natural gradient's benefits.
- **Non-exponential family limitations**: Information geometry's most elegant results hold for exponential family distributions. Deep neural networks define complex non-exponential distribution families, so theoretical guarantees weaken.
- **Non-identifiability**: Different parameter combinations in neural networks can define the same distribution (e.g., permuting neuron order). This non-identifiability makes the Fisher information matrix singular -- its inverse does not exist.

## Glossary

Fisher information matrix - the covariance matrix of the log-likelihood gradient, measuring how sensitively a distribution responds to parameter changes, serving as the Riemannian metric on distribution space

Natural gradient - an optimization method that obtains the steepest descent direction in distribution space by multiplying the gradient with the inverse Fisher information matrix. Proposed by Amari (1998)

KL divergence (Kullback-Leibler divergence) - a quantity measuring the asymmetric difference between two probability distributions; the distance from p to q differs from q to p. Locally coincides with the Fisher metric in information geometry

Riemannian metric - a positive-definite symmetric tensor defining the inner product of tangent vectors at each point on a manifold (curved space), the foundation for measuring distance, angles, and curvature

Statistical manifold - a geometric structure viewing a collection of probability distributions indexed by parameters as a smooth manifold, where each point corresponds to a single probability distribution

Exponential family - a family of distributions whose density takes the form exp(theta^T * T(x) - A(theta)). Includes the normal, Poisson, and Bernoulli distributions; the central theoretical object in information geometry

K-FAC (Kronecker-Factored Approximate Curvature) - a second-order optimization algorithm approximating the per-layer Fisher information matrix via Kronecker products. Martens & Grosse (2015)

TRPO (Trust Region Policy Optimization) - a reinforcement learning algorithm that updates policies under KL divergence constraints, implementing the natural gradient as a trust region constraint in distribution space. Schulman et al. (2015)
