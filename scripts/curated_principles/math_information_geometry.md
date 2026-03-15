---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 정보 기하학, 자연 경사, 피셔 정보 행렬, KL 발산, 리만 계량, 통계적 다양체, TRPO, K-FAC
keywords_en: information geometry, natural gradient, Fisher information matrix, KL divergence, Riemannian metric, statistical manifold, TRPO, K-FAC
---
Information Geometry and Natural Gradient - 확률 분포들이 사는 공간에 곡률을 부여하여, 파라미터의 좌표 선택에 흔들리지 않는 최적화를 가능하게 한 미분 기하학 이론

## 확률 분포 사이의 "거리"라는 문제

경사하강법(gradient descent)에서 파라미터를 갱신할 때, 우리는 파라미터 변화량의 크기를 유클리드 노름(Euclidean norm)으로 잰다. ||delta_theta||^2 = sum(delta_theta_i^2). 그런데 이 측정 방식에는 근본적인 문제가 있다.

정규 분포 N(mu, sigma^2)를 예로 들자. 평균 mu를 0.1만큼 옮기는 것과 표준편차 sigma를 0.1만큼 줄이는 것은 유클리드 공간에서 "같은 크기"의 변화다. 그러나 sigma가 100인 분포에서 sigma를 0.1 줄이면 분포의 모양은 거의 변하지 않는다. 반면 sigma가 0.2인 분포에서 sigma를 0.1 줄이면 분포가 반 토막 나면서 완전히 다른 분포가 된다. 파라미터 공간의 유클리드 거리와 분포 공간의 실제 변화가 어긋나는 것이다.

이 문제를 공간적으로 상상하면 이렇다. 확률 분포들이 모여 있는 공간은 평평한 바닥이 아니라, 어떤 방향으로는 완만하고 어떤 방향으로는 급경사인 **굽어진 표면** 위에 놓여 있다. 유클리드 경사하강법은 이 표면이 평평하다고 가정하고 걸음을 내딛는다. 급경사 방향에서 한 걸음이 너무 크면 절벽 아래로 굴러떨어지고, 완만한 방향에서 같은 걸음은 제자리걸음이 된다. 표면의 곡률을 반영한 걸음걸이가 필요하다.

## 피셔 정보라는 자(ruler)의 발견

C. R. Rao(1945)가 이 문제의 핵심을 포착했다. 그는 피셔 정보 행렬(Fisher information matrix)이 확률 분포 공간 위의 자연스러운 리만 계량(Riemannian metric) -- 즉 분포 공간에서 거리를 재는 올바른 자(ruler) -- 임을 보였다. 정의는 다음과 같다.

F_ij = E[d(log p(x; theta))/d(theta_i) * d(log p(x; theta))/d(theta_j)]

이를 풀어 쓰면 이렇다. 로그 우도(log-likelihood)가 파라미터 theta_i를 바꿨을 때 얼마나 민감하게 변하는지의 편미분을 구하고, theta_i와 theta_j에 대한 두 편미분을 곱한 뒤 기댓값을 취한 것이다. 이 행렬의 (i,j) 성분이 크면 theta_i와 theta_j를 조금만 바꿔도 분포가 크게 변한다는 뜻이다. 반대로 작으면 많이 바꿔도 분포는 별로 안 변한다. 즉 피셔 정보 행렬은 "파라미터 변화 한 단위가 분포 변화 몇 단위에 해당하는가"를 알려주는 환율표다. 이 관점은 같은 피셔 정보 행렬을 추정의 한계로 해석하는 통계학(Cramer-Rao 하한)과는 다른 각도다. 통계학에서 피셔 정보는 "이 파라미터를 얼마나 정밀하게 추정할 수 있는가"를 답하지만, 정보 기하학에서는 "분포 공간이 이 지점에서 얼마나 휘어져 있는가"를 답한다.

이후 Chentsov(1982)가 결정적 증명을 내놓았다. 통계적 충분성(sufficiency) -- 데이터를 요약해도 추론에 필요한 정보를 잃지 않는 성질 -- 을 보존하는 리만 계량은 피셔 정보 행렬이 유일하다. 분포 공간에서 "올바른 자"가 하나밖에 없다는 수학적 필연성이다.

## Amari의 정보 기하학 체계

Shun-ichi Amari(1985)는 이 아이디어를 정보 기하학(information geometry)이라는 완성된 수학적 체계로 발전시켰다. 핵심 구성은 다음과 같다.

파라미터 theta로 인덱싱된 확률 분포의 집합 {p(x; theta)}를 하나의 매끄러운 다양체(smooth manifold) -- 통계적 다양체(statistical manifold)라 부른다 -- 로 본다. 이 다양체 위의 각 점이 하나의 확률 분포이고, 피셔 정보 행렬이 각 점에서의 거리 계량으로 부여된다.

이 계량 아래에서, 인접한 두 분포 사이의 "거리"는 KL 발산(Kullback-Leibler divergence)의 2차 근사와 일치한다.

D_KL(p(theta) || p(theta + d_theta)) ≈ 1/2 * d_theta^T * F * d_theta

KL 발산은 두 분포가 "얼마나 다른지"를 비대칭적으로 측정하는 양이다. p에서 q를 바라보는 거리와 q에서 p를 바라보는 거리가 다르다. 그 국소적(무한소) 버전이 피셔 정보 계량이다. 유클리드 평면에서 짧은 거리의 제곱이 d^T * I * d (I는 단위 행렬)인 것처럼, 분포 공간에서는 d^T * F * d가 자연스러운 거리의 제곱이다. I 대신 F가 들어가면서 공간이 "휘어진다".

Amari는 여기서 더 나아가, 같은 분포 공간을 바라보는 두 가지 자연스러운 좌표계가 존재함을 보였다. 하나는 지수족(exponential family) 분포에 자연스러운 좌표이고, 다른 하나는 혼합족(mixture family) 분포에 자연스러운 좌표다. 직관적으로 비유하면, 같은 지형을 "등고선 지도"로 볼 수도 있고 "경사도 지도"로 볼 수도 있는데, 두 관점이 서로 보완적인 정보를 제공하는 것과 비슷하다. 이 쌍대성(duality) 덕분에 지수족에서의 KL 발산 최소화가 볼록(convex) 최적화 문제가 되는 성질이 나온다.

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

이것이 왜 중요한가? 자연 경사법은 파라미터화 방식에 무관(reparameterization-invariant)하다. 같은 분포를 theta로 표현하든 phi = f(theta)로 표현하든, 자연 경사가 분포 공간에서 가리키는 방향은 동일하다. 일반 경사하강법은 좌표를 바꾸면 수렴 경로가 완전히 달라진다. 앞서 정규 분포 예시에서 본 sigma의 크기에 따른 비균일성이 자연 경사에서는 자동으로 보정된다.

AI 실무에서 이 차이가 드러나는 예를 보자. 신경망의 학습률(learning rate)을 0.01에서 0.001로 줄이는 것과, 0.001에서 0.0001로 줄이는 것은 유클리드 공간에서 같은 크기(0.009)의 변화다. 그러나 확률 분포 공간에서 보면 이야기가 다르다. 학습률이 0.01일 때 0.001을 줄이면 출력 분포가 미세하게 바뀌지만, 학습률이 0.0001 근처에서 같은 크기를 바꾸면 학습 동태가 극적으로 변할 수 있다. 일반 SGD는 이 비균일성을 무시하고 같은 스텝을 밟지만, 자연 경사법은 분포 변화의 실제 크기에 맞추어 스텝을 조정한다.

## 핵심 트레이드오프: 기하학적 정확성 vs 계산 비용

자연 경사법의 이론적 우수성에는 치명적인 실용 장벽이 있다. 파라미터 수가 n이면 피셔 정보 행렬 F는 n x n 행렬이다. 현대 대형 모델의 파라미터가 수십억 개라면, F를 저장하는 데만 메모리가 n^2에 비례하고, 역행렬 계산은 O(n^3)이다. 10억 개 파라미터 모델이면 F는 10^18개 원소를 가진 행렬이 된다. 물리적으로 저장 자체가 불가능하다.

이 때문에 정보 기하학의 AI 적용은 항상 "얼마나 많은 기하학적 정보를 포기할 것인가"라는 근사(approximation)의 문제가 된다. F의 대각 성분만 쓸 것인가, 블록 대각으로 근사할 것인가, 크로네커 곱으로 분해할 것인가. 근사가 거칠수록 계산은 빨라지지만 곡률 정보를 더 많이 잃는다.

## 현대 AI에서의 실현

정보 기하학의 AI 연결은 성격에 따라 구분된다.

**Amari의 자연 경사법에서 직접 파생된 기법:**

- **K-FAC**: Martens & Grosse(2015)는 각 레이어의 피셔 정보 행렬을 입력 활성화의 공분산과 그래디언트의 공분산의 크로네커 곱(Kronecker product)으로 근사했다. 레이어 내 뉴런 간 독립성을 가정하는 근사이지만, 전체 F를 다루는 O(n^3) 대신 레이어 단위로 분해하여 계산 비용을 크게 줄인다. 곡률 정보의 블록 구조를 보존하면서 실행 가능한 수준의 비용을 달성한 절충안이다.

- **TRPO**: Schulman et al.(2015)는 강화학습에서 정책(policy)을 갱신할 때 KL 발산 제약을 부과했다. maximize E[advantage(a, s)] subject to D_KL(pi_old || pi_new) <= delta. 이 KL 제약은 정보 기하학적으로 신뢰 영역(trust region)을 파라미터 공간이 아닌 분포 공간에서 정의한 것이다. 분포 공간에서의 제약이므로 파라미터화 방식에 무관한 갱신을 달성한다. PPO(Schulman et al., 2017)는 TRPO의 KL 제약을 클리핑(clipping) 메커니즘으로 근사하여 구현을 단순화했다.

**정보 기하학적으로 해석 가능한 구조적 유사성:**

- **Adam 옵티마이저**: Kingma & Ba(2015)의 Adam에서 2차 모멘트 추정(v_t)은 피셔 정보 행렬의 대각 근사에 해당한다. 대각 성분만 사용하므로 파라미터 간 상관관계를 무시하지만, 각 파라미터의 스케일을 개별적으로 보정하는 효과가 있다. Adam이 "충분히 잘 작동하는" 이유 중 하나가 이 암묵적 자연 경사 근사에 있을 수 있다. 다만 Adam이 자연 경사를 의식하고 설계된 것은 아니며, 사후적 해석이다.

- **VAE의 KL 항**: Variational AutoEncoder의 ELBO 손실에서 잠재 분포와 사전 분포 사이의 KL 발산 항은 정보 기하학적 거리로 해석된다. 잠재 공간의 분포가 사전 분포에서 너무 멀어지지 않도록 제약하는 역할이다.

- **Wasserstein GAN**: Arjovsky et al.(2017)은 KL 발산 대신 Wasserstein 거리를 사용하여 생성 분포와 실제 분포 사이의 최적화를 안정화했다. 이는 분포 공간 위의 거리 척도 선택이 학습 안정성에 직접적 영향을 미친다는 정보 기하학적 통찰의 실용적 결과다.

## 한계와 약점

- **근사의 대가**: K-FAC, 대각 근사 등 모든 실용적 방법은 피셔 정보 행렬의 기하학적 정보를 상당 부분 포기한다. 전체 F를 쓸 수 없는 한, 자연 경사법의 이론적 이점이 실제로 얼마나 전달되는지는 근사 방법마다 다르다.
- **경험적 우위의 불확실성**: 대규모 딥러닝에서 자연 경사 근사가 Adam 대비 일관된 실용적 이점을 보이지 못하는 경우가 많다. 학습률 스케줄링, 가중치 감쇠(weight decay), 배치 정규화 등이 자연 경사의 이점 일부를 간접적으로 제공할 수 있기 때문이다.
- **비지수족 한계**: 정보 기하학의 가장 우아한 결과들(이중 아핀 접속, 볼록성)은 지수족 분포에 대해 성립한다. 딥 뉴럴 네트워크가 정의하는 복잡한 분포족은 지수족이 아니므로 이론적 보장이 약해진다.
- **비동정성 문제**: 신경망에서 서로 다른 파라미터 조합이 같은 분포를 정의할 수 있다(예: 뉴런의 순서를 바꿔도 같은 함수). 이 비동정성(non-identifiability)은 피셔 정보 행렬을 특이(singular)하게 만들어 역행렬이 존재하지 않게 되며, 기하학적 해석을 복잡하게 만든다.

## 용어 정리

피셔 정보 행렬(Fisher information matrix) - 로그 우도의 그래디언트에 대한 공분산 행렬. 파라미터를 조금 바꿨을 때 분포가 얼마나 민감하게 변하는지를 측정하며, 분포 공간의 리만 계량으로 작용한다

자연 경사(natural gradient) - 일반 그래디언트에 피셔 정보 행렬의 역행렬을 곱하여, 분포 공간에서의 최급강하 방향을 구하는 최적화 방법. Amari(1998)가 제안

KL 발산(Kullback-Leibler divergence) - 두 확률 분포 사이의 비대칭적 차이를 측정하는 양. p에서 q를 보는 거리와 q에서 p를 보는 거리가 다르다. 정보 기하학에서 국소적으로 피셔 계량과 일치

리만 계량(Riemannian metric) - 다양체(휘어진 공간) 위의 각 점에서 접선 벡터의 내적을 정의하는 양의 정치 대칭 텐서. 거리, 각도, 곡률을 재는 기반

통계적 다양체(statistical manifold) - 파라미터로 인덱싱된 확률 분포의 집합을 매끄러운 다양체로 본 기하학적 구조. 각 점이 하나의 확률 분포에 대응

지수족(exponential family) - 확률 밀도가 exp(theta^T * T(x) - A(theta)) 형태를 가지는 분포의 집합. 정규 분포, 포아송 분포, 베르누이 분포 등이 포함되며, 정보 기하학의 이론적 중심 대상

크로네커 곱(Kronecker product) - 두 행렬 A, B의 모든 원소 쌍에 대한 곱을 블록 행렬로 배열하는 연산. K-FAC에서 피셔 행렬의 분해에 사용

K-FAC(Kronecker-Factored Approximate Curvature) - 레이어별 피셔 정보 행렬을 크로네커 곱으로 근사하는 2차 최적화 알고리즘. Martens & Grosse(2015)

TRPO(Trust Region Policy Optimization) - KL 발산 제약 아래에서 정책을 갱신하는 강화학습 알고리즘. 자연 경사법을 분포 공간의 신뢰 영역 제약으로 구현. Schulman et al.(2015)

변분 추론(variational inference) - 다루기 어려운 사후 분포를 간단한 분포로 근사하는 추론 방법. KL 발산 최소화로 정식화된다

---EN---
Information Geometry and Natural Gradient - A differential geometry theory that equips the space of probability distributions with curvature, enabling optimization invariant to the choice of parameterization

## The Problem of "Distance" Between Probability Distributions

When updating parameters in gradient descent, we measure the magnitude of parameter changes using the Euclidean norm: ||delta_theta||^2 = sum(delta_theta_i^2). But this measurement has a fundamental problem.

Consider a normal distribution N(mu, sigma^2). Shifting the mean mu by 0.1 and reducing the standard deviation sigma by 0.1 are "equal-sized" changes in Euclidean space. But reducing sigma by 0.1 in a distribution with sigma = 100 barely changes the distribution's shape. Reducing sigma by 0.1 when sigma = 0.2, on the other hand, cuts the distribution nearly in half, producing an entirely different distribution. Euclidean distance in parameter space diverges from the actual change in distribution space.

To visualize this spatially: the space where probability distributions live is not a flat floor but a **curved surface** -- gentle in some directions, steeply sloped in others. Euclidean gradient descent assumes this surface is flat and takes uniform steps. On a steep slope, one step can send you tumbling off a cliff; on a gentle slope, the same step barely moves you. What is needed is a stride that reflects the surface's curvature.

## Discovering the Right Ruler: Fisher Information

C. R. Rao (1945) captured the essence of this problem. He showed that the Fisher information matrix is the natural Riemannian metric on the space of probability distributions -- the correct ruler for measuring distances in distribution space. It is defined as:

F_ij = E[d(log p(x; theta))/d(theta_i) * d(log p(x; theta))/d(theta_j)]

Unpacking this: take the partial derivative of the log-likelihood with respect to theta_i to see how sensitively it responds to changes in that parameter, multiply the partial derivatives for theta_i and theta_j, then take the expected value. When the (i,j) entry of this matrix is large, even a small change in theta_i and theta_j produces a large change in the distribution. When small, even large parameter changes barely affect the distribution. In essence, the Fisher information matrix is an exchange rate table telling you "how many units of distribution change does one unit of parameter change buy." This perspective differs from statistics, which interprets the same Fisher information matrix through the lens of estimation limits (Cramer-Rao lower bound). In statistics, Fisher information answers "how precisely can this parameter be estimated?" In information geometry, it answers "how curved is distribution space at this point?"

Chentsov (1982) later delivered a decisive proof: the Fisher information matrix is the unique Riemannian metric preserving statistical sufficiency -- the property that summarizing data loses no information needed for inference. There is exactly one "correct ruler" in distribution space, and it is Fisher information. A mathematical necessity, not a choice.

## Amari's Information Geometry Framework

Shun-ichi Amari (1985) developed this idea into a complete mathematical framework called information geometry. The core construction is as follows.

The collection of probability distributions {p(x; theta)} indexed by parameter theta is viewed as a smooth manifold -- called a statistical manifold. Each point on this manifold is a probability distribution, and the Fisher information matrix is assigned as the distance metric at each point.

Under this metric, the "distance" between two neighboring distributions coincides with the second-order approximation of KL divergence (Kullback-Leibler divergence):

D_KL(p(theta) || p(theta + d_theta)) ≈ 1/2 * d_theta^T * F * d_theta

KL divergence asymmetrically measures how different two distributions are -- the distance from p looking at q differs from q looking at p. Its local (infinitesimal) version is the Fisher information metric. Just as the squared distance over a short interval in Euclidean space is d^T * I * d (where I is the identity matrix), in distribution space d^T * F * d is the natural squared distance. Replacing I with F is what makes the space "curved."

Amari went further, showing that two natural coordinate systems exist for viewing the same distribution space. One is natural for exponential family distributions, the other for mixture family distributions. Intuitively, this is like viewing the same terrain through a "contour map" versus a "gradient map" -- each perspective provides complementary information. This duality is what makes KL divergence minimization a convex optimization problem in exponential family natural parameter coordinates.

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

Why does this matter? The natural gradient is reparameterization-invariant. Whether you express the same distribution using theta or phi = f(theta), the direction the natural gradient points in distribution space is identical. Ordinary gradient descent changes its convergence path entirely when you change coordinates. The non-uniformity from the normal distribution example earlier -- where the same-sized sigma change has dramatically different effects depending on sigma's magnitude -- is automatically corrected by the natural gradient.

A practical AI example illustrates this difference. Reducing a neural network's learning rate from 0.01 to 0.001 and from 0.001 to 0.0001 are changes of the same Euclidean magnitude (0.009). But in distribution space, the story differs. At a learning rate of 0.01, subtracting 0.001 barely changes the output distribution; near 0.0001, the same-sized change can dramatically alter training dynamics. Ordinary SGD ignores this non-uniformity and takes the same step, while the natural gradient adjusts its step to match the actual magnitude of distributional change.

## The Core Tradeoff: Geometric Accuracy vs. Computational Cost

The theoretical superiority of the natural gradient faces a critical practical barrier. With n parameters, the Fisher information matrix F is an n x n matrix. For modern large models with billions of parameters, storing F alone requires memory proportional to n^2, and computing its inverse is O(n^3). For a model with 1 billion parameters, F would have 10^18 entries -- physically impossible to store.

This is why applying information geometry to AI always becomes a question of approximation: "How much geometric information are we willing to sacrifice?" Use only F's diagonal? Approximate with block diagonals? Decompose via Kronecker products? Coarser approximations compute faster but lose more curvature information.

## Realization in Modern AI

The connections between information geometry and AI differ in character.

**Techniques directly derived from Amari's natural gradient:**

- **K-FAC**: Martens & Grosse (2015) approximated each layer's Fisher information matrix as the Kronecker product of the input activation covariance and the gradient covariance. This approximation assumes independence between neurons within a layer, but by decomposing at the layer level instead of handling the full O(n^3) F, it dramatically reduces computational cost. A compromise that preserves the block structure of curvature information while achieving tractable cost.

- **TRPO**: Schulman et al. (2015) imposed a KL divergence constraint on policy updates in reinforcement learning: maximize E[advantage(a, s)] subject to D_KL(pi_old || pi_new) <= delta. From an information-geometric perspective, this KL constraint defines a trust region in distribution space rather than parameter space. Because the constraint lives in distribution space, it achieves reparameterization-invariant updates. PPO (Schulman et al., 2017) simplified implementation by approximating TRPO's KL constraint with a clipping mechanism.

**Structural similarities with information-geometric interpretations:**

- **Adam optimizer**: In Kingma & Ba's (2015) Adam, the second moment estimate (v_t) corresponds to a diagonal approximation of the Fisher information matrix. Using only diagonal elements ignores inter-parameter correlations, but effectively calibrates each parameter's scale individually. One reason Adam "works well enough" may be this implicit natural gradient approximation. However, Adam was not consciously designed with the natural gradient in mind -- this is a post-hoc interpretation.

- **KL term in VAEs**: The KL divergence term in the Variational AutoEncoder's ELBO loss is interpretable as an information-geometric distance between the latent distribution and the prior. It constrains the latent space distribution from straying too far from the prior.

- **Wasserstein GAN**: Arjovsky et al. (2017) used Wasserstein distance instead of KL divergence to stabilize optimization between generated and real distributions. This is a practical consequence of the information-geometric insight that the choice of distance metric on distribution space directly impacts training stability.

## Limitations and Weaknesses

- **The cost of approximation**: Every practical method -- K-FAC, diagonal approximation, and others -- sacrifices substantial geometric information from the Fisher information matrix. As long as the full F cannot be used, how much of the natural gradient's theoretical advantage actually transfers depends on the approximation method.
- **Uncertain empirical advantage**: In large-scale deep learning, natural gradient approximations often fail to show consistent practical benefits over Adam. Learning rate scheduling, weight decay, and batch normalization may indirectly provide some of the natural gradient's benefits.
- **Non-exponential family limitations**: Information geometry's most elegant results (dual affine connections, convexity) hold for exponential family distributions. The complex distribution families defined by deep neural networks are not exponential families, so theoretical guarantees weaken.
- **Non-identifiability**: Different parameter combinations in neural networks can define the same distribution (e.g., permuting neuron order yields the same function). This non-identifiability makes the Fisher information matrix singular -- its inverse does not exist -- complicating geometric interpretation.

## Glossary

Fisher information matrix - the covariance matrix of the log-likelihood gradient, measuring how sensitively a distribution responds to parameter changes, serving as the Riemannian metric on distribution space

Natural gradient - an optimization method that obtains the steepest descent direction in distribution space by multiplying the gradient with the inverse Fisher information matrix. Proposed by Amari (1998)

KL divergence (Kullback-Leibler divergence) - a quantity measuring the asymmetric difference between two probability distributions; the distance from p to q differs from q to p. Locally coincides with the Fisher metric in information geometry

Riemannian metric - a positive-definite symmetric tensor defining the inner product of tangent vectors at each point on a manifold (curved space), the foundation for measuring distance, angles, and curvature

Statistical manifold - a geometric structure viewing a collection of probability distributions indexed by parameters as a smooth manifold, where each point corresponds to a single probability distribution

Exponential family - a family of distributions whose density takes the form exp(theta^T * T(x) - A(theta)). Includes the normal, Poisson, and Bernoulli distributions; the central theoretical object in information geometry

Kronecker product - an operation arranging the products of all element pairs of two matrices A and B into a block matrix. Used in K-FAC for decomposing the Fisher matrix

K-FAC (Kronecker-Factored Approximate Curvature) - a second-order optimization algorithm approximating the per-layer Fisher information matrix via Kronecker products. Martens & Grosse (2015)

TRPO (Trust Region Policy Optimization) - a reinforcement learning algorithm that updates policies under KL divergence constraints, implementing the natural gradient as a trust region constraint in distribution space. Schulman et al. (2015)

Variational inference - an inference method approximating an intractable posterior distribution with a simpler distribution, formulated as KL divergence minimization
