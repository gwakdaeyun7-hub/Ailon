---
difficulty: advanced
connectionType: direct_inspiration
keywords: 정보 기하학, 자연 경사, 피셔 정보 행렬, KL 발산, 리만 계량, 통계적 다양체, TRPO, K-FAC
keywords_en: information geometry, natural gradient, Fisher information matrix, KL divergence, Riemannian metric, statistical manifold, TRPO, K-FAC
---
Information Geometry and Natural Gradient - 확률 분포 공간 위의 미분 기하학으로, 파라미터 공간의 곡률을 반영한 최적화를 가능하게 한다

## 통계와 기하학의 만남

확률 분포를 최적화할 때, 우리는 보통 파라미터 공간에서 유클리드 거리를 암묵적으로 가정한다. 경사하강법에서 theta(t+1) = theta(t) - eta * gradient(L)라고 쓸 때, 파라미터 변화량 delta_theta의 크기를 유클리드 노름 ||delta_theta||^2 = sum(delta_theta_i^2)로 측정한다. 그러나 이 측정은 파라미터가 정의하는 확률 분포의 관점에서는 부자연스럽다.

C. R. Rao(1945)가 이 문제의 핵심을 포착했다. 그는 **피셔 정보 행렬**(Fisher information matrix)이 확률 분포 공간 위의 자연스러운 **리만 계량**(Riemannian metric)임을 보였다. 피셔 정보 행렬의 정의는 다음과 같다.

F_ij = E[d(log p(x; theta))/d(theta_i) * d(log p(x; theta))/d(theta_j)]

이는 로그 우도(log-likelihood)의 그래디언트에 대한 공분산 행렬이다. Rao의 통찰은 이 행렬이 확률 분포들 사이의 "거리"를 재는 자연스러운 도구라는 것이었다. 이후 Chentsov(1982)는 이 계량이 통계적 충분성(sufficiency)을 보존하는 유일한 리만 계량임을 증명하여, 피셔 정보의 기하학적 특별함을 수학적으로 확립했다.

## Amari의 정보 기하학 체계

Shun-ichi Amari(1985)는 이 아이디어를 "정보 기하학(information geometry)"이라는 완성된 수학적 체계로 발전시켰다. 핵심 개념은 **통계적 다양체**(statistical manifold)다. 파라미터 theta로 인덱싱된 확률 분포의 집합 {p(x; theta)}를 매끄러운 다양체(smooth manifold)로 보는 것이다. 각 점은 하나의 확률 분포이며, 이 다양체 위에 피셔 정보 행렬이 리만 계량으로 부여된다.

이 계량 하에서 두 인접한 분포 사이의 "거리"는 KL 발산(Kullback-Leibler divergence)의 2차 근사와 일치한다.

D_KL(p(theta) || p(theta + d_theta)) ≈ 1/2 * d_theta^T * F * d_theta

이 등식이 정보 기하학의 핵심이다. **KL 발산**은 두 분포가 얼마나 다른지를 비대칭적으로 측정하는 양이며, 그 국소적(무한소) 버전이 피셔 정보 계량이다. 유클리드 공간에서 거리의 제곱이 d^T * I * d인 것처럼, 확률 분포 공간에서는 d^T * F * d가 자연스러운 거리 척도다.

Amari는 나아가 이 다양체 위에 **이중 아핀 접속**(dual affine connections)이라는 기하학적 구조를 도입했다. 지수족(exponential family)과 혼합족(mixture family) 분포에 대해 각각 자연스러운 좌표계와 연결이 존재하며, 이들 사이의 쌍대성(duality)이 정보 기하학의 심층 구조를 형성한다.

## 자연 경사의 원리

Amari(1998)는 이 기하학적 통찰을 최적화에 적용하여 **자연 경사법**(natural gradient)을 제안했다. 일반 경사하강법은 유클리드 공간에서 가장 가파른 방향으로 이동하지만, 자연 경사법은 확률 분포 공간에서 가장 가파른 방향으로 이동한다.

갱신 규칙은 다음과 같다.

theta(t+1) = theta(t) - eta * F^(-1) * gradient(L)

여기서 F^(-1)은 피셔 정보 행렬의 역행렬이다. 일반 그래디언트에 F^(-1)을 곱하는 것은 유클리드 좌표계의 그래디언트를 분포 공간의 자연스러운 좌표계로 변환하는 것이다.

왜 이것이 중요한가? 파라미터 공간에서 동일한 크기의 변화가 **분포 공간에서는 매우 다른 크기의 변화**를 야기할 수 있기 때문이다. 예를 들어 정규 분포 N(mu, sigma^2)에서, 평균 mu를 0.1만큼 바꾸는 것과 표준편차 sigma를 0.1만큼 바꾸는 것은 파라미터 공간에서는 같은 크기지만, 분포의 형태에 미치는 영향은 sigma가 작을수록 극적으로 달라진다. 자연 경사법은 이런 비균일성을 보정한다.

## AI에서의 실현: K-FAC, TRPO, 그리고 Adam

자연 경사법의 이론적 우수성에도 불구하고, 직접 적용은 피셔 정보 행렬의 크기 때문에 비현실적이다. 파라미터 수가 n이면 F는 n x n 행렬이므로, 현대 대형 모델(수십억 파라미터)에서는 저장조차 불가능하다. F의 역행렬 계산은 O(n^3)이다.

이 문제를 해결하기 위한 다양한 근사가 제안되었다. Martens & Grosse(2015)의 K-FAC(Kronecker-Factored Approximate Curvature)은 각 레이어의 피셔 정보 행렬을 입력 활성화의 공분산과 그래디언트의 공분산의 크로네커 곱(Kronecker product)으로 근사한다. 이 근사는 레이어 내 뉴런 간 독립성을 가정하지만, 실제로 합리적인 정확도를 유지하면서 계산 비용을 O(n)에 가깝게 줄인다.

강화학습에서 Schulman et al.(2015)의 TRPO(Trust Region Policy Optimization)는 자연 경사법의 실질적 구현이다. TRPO는 정책(policy) 갱신 시 KL 발산 제약 조건을 부과한다.

maximize E[advantage(a, s)] subject to D_KL(pi_old || pi_new) <= delta

이 KL 제약은 정보 기하학적 관점에서 신뢰 영역(trust region)을 분포 공간에서 정의하는 것이다. 파라미터 공간이 아닌 분포 공간에서의 제약이므로, **파라미터화에 무관한**(reparameterization-invariant) 갱신을 달성한다. PPO(Schulman et al., 2017)는 TRPO의 KL 제약을 클리핑 메커니즘으로 근사하여 구현을 단순화했다.

흥미롭게도, 가장 널리 쓰이는 옵티마이저인 Adam(Kingma & Ba, 2015)도 정보 기하학적으로 해석할 수 있다. Adam의 2차 모멘트 추정은 피셔 정보 행렬의 **대각 근사**에 해당한다. 대각 성분만 사용하므로 파라미터 간 상관관계를 무시하지만, 각 파라미터의 스케일을 개별적으로 보정하는 효과가 있다. Adam이 "충분히 잘 작동하는" 이유 중 하나가 이 암묵적 자연 경사 근사에 있을 수 있다.

## 정보 기하학의 더 넓은 연결

정보 기하학은 최적화를 넘어 머신러닝의 여러 영역에 연결된다. Variational AutoEncoder(VAE)에서 ELBO 손실의 KL 항은 잠재 분포와 사전 분포 사이의 정보 기하학적 거리다. GAN의 판별자 훈련은 생성 분포와 실제 분포 사이의 다양체 위 거리를 줄이는 과정으로 해석할 수 있다. Wasserstein GAN(Arjovsky et al., 2017)은 KL 발산 대신 Wasserstein 거리를 사용하여 분포 공간에서의 최적화를 안정화했다.

정보 기하학의 이중 좌표계(자연 파라미터와 기댓값 파라미터)는 변분 추론(variational inference)에서 자연스럽게 나타난다. 지수족 분포의 자연 파라미터 좌표에서 KL 발산의 최소화가 볼록(convex) 문제가 되는 성질은 많은 변분 알고리즘의 수학적 기반이다.

## 한계와 약점

정보 기하학의 AI 응용에는 근본적 장벽이 남아 있다.

- 계산 비용: 전체 피셔 정보 행렬의 저장(O(n^2))과 역행렬 계산(O(n^3))은 대규모 모델에서 비현실적이다. K-FAC, 대각 근사 등은 기하학적 정보의 상당 부분을 포기한다. 근사의 질과 계산 비용 사이의 트레이드오프가 항상 존재한다.
- 경험적 우위의 불확실성: 자연 경사법이 이론적으로 우수함에도, 대규모 딥러닝에서 Adam 대비 일관된 실용적 이점을 보이지 못하는 경우가 많다. 학습률 스케줄링, 가중치 감쇠(weight decay), 배치 정규화 등의 기법이 자연 경사의 이점 일부를 간접적으로 제공할 수 있다.
- 비지수족 분포: 정보 기하학의 가장 우아한 결과들(이중 아핀 접속, 볼록성)은 지수족에 대해 성립한다. 딥 뉴럴 네트워크가 정의하는 복잡한 분포족에 대해서는 이론적 보장이 약해진다.
- 모델-분포 구분의 모호성: 신경망의 파라미터 공간은 확률 분포 공간과 일대일 대응이 아닐 수 있다(같은 분포를 정의하는 서로 다른 파라미터 조합이 존재). 이 **비동정성**(non-identifiability)은 피셔 정보 행렬의 특이성(singularity)을 야기하며, 기하학적 해석을 복잡하게 만든다. Watanabe의 특이 학습 이론(singular learning theory)은 이 문제를 다루지만, 아직 실용적 알고리즘으로의 번역은 제한적이다.

## 용어 정리

피셔 정보 행렬(Fisher information matrix) - 로그 우도 그래디언트의 공분산 행렬로, 확률 분포 공간의 리만 계량으로 작용한다

자연 경사(natural gradient) - 피셔 정보 행렬의 역행렬을 그래디언트에 곱하여, 분포 공간에서의 최급강하 방향을 구하는 최적화 방법

KL 발산(Kullback-Leibler divergence) - 두 확률 분포 사이의 비대칭적 차이를 측정하는 양. 정보 기하학에서 국소적으로 피셔 계량과 일치

리만 계량(Riemannian metric) - 다양체 위의 각 점에서 접선 벡터의 내적을 정의하는 양의 정치 대칭 텐서. 거리와 곡률의 기반

통계적 다양체(statistical manifold) - 파라미터로 인덱싱된 확률 분포의 집합을 매끄러운 다양체로 본 기하학적 구조

K-FAC(Kronecker-Factored Approximate Curvature) - 레이어별 피셔 정보 행렬을 크로네커 곱으로 근사하는 2차 최적화 알고리즘

TRPO(Trust Region Policy Optimization) - KL 발산 제약 아래에서 정책을 갱신하는 강화학습 알고리즘. 자연 경사법의 실질적 구현

크로네커 곱(Kronecker product) - 두 행렬의 모든 원소 쌍에 대한 곱을 블록 행렬로 배열하는 연산

지수족(exponential family) - 확률 밀도가 exp(theta^T * T(x) - A(theta)) 형태를 가지는 분포의 집합. 정보 기하학의 이론적 중심 대상

변분 추론(variational inference) - 다루기 어려운 사후 분포를 간단한 분포로 근사하는 추론 방법. KL 발산 최소화로 정식화

---EN---
Information Geometry and Natural Gradient - Differential geometry on statistical manifolds, enabling optimization that respects the curvature of probability distribution space

## The Meeting of Statistics and Geometry

When optimizing probability distributions, we typically assume Euclidean distance in parameter space implicitly. When writing theta(t+1) = theta(t) - eta * gradient(L) in gradient descent, we measure the magnitude of parameter change delta_theta using the Euclidean norm ||delta_theta||^2 = sum(delta_theta_i^2). But this measurement is unnatural from the perspective of the probability distributions that the parameters define.

C. R. Rao (1945) captured the essence of this problem. He showed that the **Fisher information matrix** is the natural **Riemannian metric** on the space of probability distributions. The Fisher information matrix is defined as:

F_ij = E[d(log p(x; theta))/d(theta_i) * d(log p(x; theta))/d(theta_j)]

This is the covariance matrix of the log-likelihood gradient. Rao's insight was that this matrix is the natural tool for measuring "distance" between probability distributions. Later, Chentsov (1982) proved that this is the unique Riemannian metric preserving statistical sufficiency, mathematically establishing the geometric special status of Fisher information.

## Amari's Information Geometry Framework

Shun-ichi Amari (1985) developed this idea into a complete mathematical framework called "information geometry." The central concept is the **statistical manifold**. The collection of probability distributions {p(x; theta)} indexed by parameter theta is viewed as a smooth manifold. Each point is a probability distribution, and the Fisher information matrix is assigned as the Riemannian metric on this manifold.

Under this metric, the "distance" between two neighboring distributions coincides with the second-order approximation of KL divergence:

D_KL(p(theta) || p(theta + d_theta)) ≈ 1/2 * d_theta^T * F * d_theta

This equation is the core of information geometry. **KL divergence** asymmetrically measures how different two distributions are, and its local (infinitesimal) version is the Fisher information metric. Just as the squared distance in Euclidean space is d^T * I * d, in probability distribution space d^T * F * d is the natural distance measure.

Amari further introduced the geometric structure of **dual affine connections** on this manifold. Exponential family and mixture family distributions each have natural coordinate systems and connections, and the duality between them forms the deep structure of information geometry.

## The Principle of Natural Gradient

Amari (1998) applied this geometric insight to optimization, proposing the **natural gradient** method. Ordinary gradient descent moves in the steepest direction in Euclidean space, but the natural gradient moves in the steepest direction in probability distribution space.

The update rule is:

theta(t+1) = theta(t) - eta * F^(-1) * gradient(L)

Here F^(-1) is the inverse of the Fisher information matrix. Multiplying the ordinary gradient by F^(-1) transforms the gradient from Euclidean coordinates to the natural coordinates of distribution space.

Why does this matter? Because identical-magnitude changes in parameter space can cause **very different-magnitude changes in distribution space**. For example, in a normal distribution N(mu, sigma^2), changing the mean mu by 0.1 and changing the standard deviation sigma by 0.1 are the same magnitude in parameter space, but their effects on the distribution's shape become dramatically different as sigma gets small. The natural gradient corrects for such non-uniformity.

## Realization in AI: K-FAC, TRPO, and Adam

Despite the theoretical superiority of the natural gradient, direct application is impractical due to the size of the Fisher information matrix. With n parameters, F is an n x n matrix, making storage impossible for modern large models (billions of parameters). Computing F's inverse is O(n^3).

Various approximations have been proposed to address this. Martens & Grosse's (2015) K-FAC (Kronecker-Factored Approximate Curvature) approximates each layer's Fisher information matrix as the Kronecker product of the input activation covariance and the gradient covariance. This approximation assumes independence between neurons within a layer but maintains reasonable accuracy while reducing computational cost to near O(n).

In reinforcement learning, Schulman et al.'s (2015) TRPO (Trust Region Policy Optimization) is a practical implementation of the natural gradient. TRPO imposes a KL divergence constraint on policy updates:

maximize E[advantage(a, s)] subject to D_KL(pi_old || pi_new) <= delta

This KL constraint, from an information-geometric perspective, defines a trust region in distribution space rather than parameter space. Because the constraint is in distribution space, it achieves **reparameterization-invariant** updates. PPO (Schulman et al., 2017) simplified implementation by approximating TRPO's KL constraint with a clipping mechanism.

Interestingly, the most widely used optimizer, Adam (Kingma & Ba, 2015), can also be interpreted information-geometrically. Adam's second moment estimation corresponds to a **diagonal approximation** of the Fisher information matrix. Using only diagonal elements ignores inter-parameter correlations, but has the effect of individually calibrating each parameter's scale. One reason Adam "works well enough" may be this implicit natural gradient approximation.

## Broader Connections of Information Geometry

Information geometry connects to multiple areas of machine learning beyond optimization. In Variational AutoEncoders (VAEs), the KL term in the ELBO loss is an information-geometric distance between the latent distribution and the prior. GAN discriminator training can be interpreted as reducing the distance on the manifold between generated and real distributions. Wasserstein GAN (Arjovsky et al., 2017) used Wasserstein distance instead of KL divergence to stabilize optimization in distribution space.

Information geometry's dual coordinate systems (natural parameters and expectation parameters) arise naturally in variational inference. The property that KL divergence minimization becomes a convex problem in natural parameter coordinates of exponential family distributions is the mathematical foundation of many variational algorithms.

## Limitations and Weaknesses

Fundamental barriers remain in information geometry's AI applications.

- Computational cost: Storing the full Fisher information matrix (O(n^2)) and computing its inverse (O(n^3)) are impractical for large-scale models. K-FAC, diagonal approximations, and others sacrifice substantial geometric information. A tradeoff between approximation quality and computational cost always exists.
- Uncertain empirical advantage: Despite theoretical superiority, the natural gradient often fails to show consistent practical benefits over Adam in large-scale deep learning. Techniques like learning rate scheduling, weight decay, and batch normalization may indirectly provide some of the natural gradient's benefits.
- Non-exponential family distributions: Information geometry's most elegant results (dual affine connections, convexity) hold for exponential families. Theoretical guarantees weaken for the complex distribution families defined by deep neural networks.
- Model-distribution ambiguity: The parameter space of a neural network may not have a one-to-one correspondence with distribution space (different parameter combinations can define the same distribution). This **non-identifiability** causes singularity in the Fisher information matrix and complicates geometric interpretation. Watanabe's singular learning theory addresses this issue, but its translation to practical algorithms remains limited.

## Glossary

Fisher information matrix - the covariance matrix of the log-likelihood gradient, serving as the Riemannian metric on probability distribution space

Natural gradient - an optimization method that obtains the steepest descent direction in distribution space by multiplying the gradient with the inverse Fisher information matrix

KL divergence (Kullback-Leibler divergence) - a quantity measuring the asymmetric difference between two probability distributions, locally coinciding with the Fisher metric in information geometry

Riemannian metric - a positive-definite symmetric tensor defining the inner product of tangent vectors at each point on a manifold, the foundation for distance and curvature

Statistical manifold - a geometric structure viewing a collection of probability distributions indexed by parameters as a smooth manifold

K-FAC (Kronecker-Factored Approximate Curvature) - a second-order optimization algorithm approximating the per-layer Fisher information matrix via Kronecker products

TRPO (Trust Region Policy Optimization) - a reinforcement learning algorithm that updates policies under KL divergence constraints, a practical implementation of the natural gradient

Kronecker product - an operation arranging the products of all element pairs of two matrices into a block matrix

Exponential family - a family of distributions whose density takes the form exp(theta^T * T(x) - A(theta)), the central theoretical object in information geometry

Variational inference - an inference method approximating an intractable posterior distribution with a simpler distribution, formulated as KL divergence minimization
