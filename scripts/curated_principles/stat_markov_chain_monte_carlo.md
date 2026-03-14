---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 마르코프 체인 몬테카를로, Metropolis-Hastings, 깁스 샘플링, 해밀턴 몬테카를로, 정상 분포, 상세 균형, 확산 모델, 대비 발산
keywords_en: Markov chain Monte Carlo, Metropolis-Hastings, Gibbs sampling, Hamiltonian Monte Carlo, stationary distribution, detailed balance, diffusion models, contrastive divergence
---
Markov Chain Monte Carlo - 복잡한 확률 분포에서 마르코프 체인을 구성하여 샘플을 추출하는 계산 기법

## 핵폭탄에서 시작된 알고리즘

MCMC의 탄생은 과학사에서 가장 의외의 기원 중 하나다. 1953년, 로스알라모스 국립연구소에서 Nicholas Metropolis, Arianna Rosenbluth, Marshall Rosenbluth, Augusta Teller, Edward Teller는 핵무기 설계에 필요한 중성자 확산 시뮬레이션을 위해 새로운 계산 방법을 고안했다. 수백 개의 입자가 상호작용하는 시스템의 열평형 상태를 직접 계산하는 것은 불가능했기에, 무작위 샘플링으로 분포를 근사하는 전략을 택한 것이다.

이들이 발표한 "Equation of State Calculations by Fast Computing Machines"(1953)은 두 가지 AI 기법의 공통 조상이다. 하나는 Kirkpatrick et al.(1983)의 Simulated Annealing이고, 다른 하나가 바로 MCMC다. 같은 수용-거부 메커니즘이 최적화와 샘플링이라는 두 갈래로 진화한 것이다.

## 핵심 아이디어: 왜 마르코프 체인인가

MCMC가 해결하는 문제는 다음과 같다. 복잡한 확률 분포 P(x)에서 샘플을 뽑고 싶지만, P(x)에서 직접 샘플링할 수 없다. 분포의 형태(비정규화된 밀도 함수 등)는 알지만, 정규화 상수를 계산할 수 없는 상황이 전형적이다.

MCMC의 전략은 이렇다. P(x)를 **정상 분포**(stationary distribution)로 갖는 마르코프 체인을 구성한다. 이 체인을 충분히 오래 실행하면, 체인의 상태는 P(x)에서 뽑은 샘플과 동일한 분포를 따르게 된다.

마르코프 체인이란 다음 상태가 현재 상태에만 의존하고 과거 상태에는 무관한 확률 과정이다. 핵심은 전이 확률(transition probability) T(x->y)의 설계다. 이 전이 확률이 **상세 균형**(detailed balance) 조건을 만족하면, P(x)가 체인의 정상 분포가 됨이 보장된다.

상세 균형: P(x) * T(x->y) = P(y) * T(y->x)

이 조건은 정상 상태에서 x에서 y로의 흐름과 y에서 x로의 흐름이 같다는 것을 의미한다. 물리적으로는 열평형에서의 미시적 가역성(microscopic reversibility)에 해당한다.

## Metropolis-Hastings 알고리즘

Metropolis et al.(1953)의 원래 알고리즘을 Hastings(1970)가 비대칭 제안 분포로 일반화한 것이 Metropolis-Hastings(MH) 알고리즘이다.

1. 현재 상태 x에서 제안 분포(proposal distribution) q(y|x)를 이용해 후보 상태 y를 생성한다
2. 수용 확률을 계산한다: alpha = min(1, [P(y) * q(x|y)] / [P(x) * q(y|x)])
3. 균일 난수 U를 생성한다
4. U < alpha이면 y로 이동하고, 아니면 x에 머문다
5. 반복한다

주목할 점은, P(x)가 비정규화된 형태여도 괜찮다는 것이다. 수용 확률에서 P(y)/P(x) **비율만 필요**하므로, **정규화 상수가 상쇄**된다. 이것이 MCMC가 분배함수(partition function)를 계산할 수 없는 상황에서도 작동하는 핵심 이유다.

제안 분포 q가 대칭(q(y|x) = q(x|y))이면, 수용 확률은 원래 Metropolis 형태로 단순화된다: alpha = min(1, P(y)/P(x)). 이것이 Simulated Annealing에서도 사용되는 바로 그 형태다.

## 깁스 샘플링: 다변량 분포의 우회

Geman과 Geman(1984)은 이미지 복원 문제에서 깁스 샘플링(Gibbs Sampling)을 제안했다. 다변량 분포 P(x_1, x_2, ..., x_n)에서 직접 샘플링이 어려울 때, 각 변수를 나머지 변수가 고정된 조건부 분포에서 순차적으로 샘플링한다.

x_i를 P(x_i | x_1, ..., x_{i-1}, x_{i+1}, ..., x_n)에서 샘플링

전체 결합 분포는 다루기 어렵지만, 각 조건부 분포가 알려진 형태(예: 가우시안)일 때 깁스 샘플링은 매우 효율적이다. 이것은 사실 MH 알고리즘의 특수한 경우로, 수용 확률이 항상 1인 것과 동치다.

깁스 샘플링은 베이즈 추론의 실용화에서 결정적 역할을 했다. 1990년대 BUGS(Bayesian inference Using Gibbs Sampling) 소프트웨어는 베이즈 통계의 대중화를 이끌었다.

## 해밀턴 몬테카를로: 물리학의 두 번째 선물

일반적인 MH 알고리즘은 고차원 공간에서 비효율적이다. 무작위 걸음(random walk)으로 탐색하면 수용률이 낮거나 이동 거리가 짧아 분포를 제대로 탐색하지 못한다.

Duane, Kennedy, Pendleton, Roweth(1987)는 분자 동역학(molecular dynamics)에서 영감을 받아 해밀턴 몬테카를로(Hamiltonian Monte Carlo, HMC)를 제안했다. 핵심 아이디어는 물리학의 **해밀턴 역학**을 샘플링에 도입하는 것이다.

각 파라미터 위치(position)에 가상의 운동량(momentum) 변수를 도입한다. 위치의 "위치 에너지"는 -log P(x)에 대응하고, 운동량의 "운동 에너지"가 추가된다. 해밀턴 방정식에 따라 위치와 운동량이 함께 진화하면, 입자는 높은 확률 영역을 따라 효율적으로 이동한다.

HMC는 **그래디언트 정보를 활용**한다는 점에서 무작위 걸음 MH와 근본적으로 다르다. -log P(x)의 기울기가 입자의 이동 방향을 안내하므로, 고차원에서도 높은 수용률과 빠른 탐색이 가능하다.

Hoffman과 Gelman(2014)의 NUTS(No-U-Turn Sampler)는 HMC의 궤적 길이를 자동으로 결정하여 실용성을 대폭 높였다. Stan과 PyMC에서 기본 샘플러로 채택되어 현대 베이즈 통계의 표준 도구가 되었다.

## AI로의 직접적 영향

MCMC는 여러 핵심 AI 기법에 직접적 기반을 제공했다.

볼츠만 머신과 대비 발산: Hinton(2002)의 **대비 발산**(Contrastive Divergence, CD)은 RBM 학습을 위해 MCMC를 "잘린(truncated)" 형태로 사용한 것이다. 정확한 사후 분포까지 수렴시키지 않고, 깁스 샘플링을 단 1~몇 스텝만 실행하여 그래디언트를 근사한다. 이론적 정확성을 포기한 대신 실용적 속도를 얻은 것으로, 이것이 심층 신뢰 신경망(DBN) 사전 학습의 핵심이었다.

확률적 그래디언트 랑주뱅 동역학: Welling과 Teh(2011)의 SGLD(Stochastic Gradient Langevin Dynamics)는 SGD에 적절한 노이즈를 추가하면 그것이 **랑주뱅 동역학**(Langevin dynamics) -- MCMC의 한 형태 -- 이 되어 사후 분포에서 샘플링하는 효과를 낸다는 것을 보였다. **최적화와 샘플링의 경계가 흐려지는** 지점이다.

확산 모델과의 연결: 현대의 확산 모델(Diffusion Models, Ho et al. 2020)은 데이터에 점진적으로 노이즈를 추가한 뒤 역방향으로 복원하는 과정이다. 이 역방향 과정은 랑주뱅 동역학과 깊이 연결되어 있으며, score matching을 통해 학습된다. MCMC의 물리학적 뿌리가 최신 생성 모델에까지 이어지는 것이다.

## 수렴의 난제

MCMC의 가장 근본적인 실무적 문제는 "충분히 오래 실행했는가"를 알기 어렵다는 것이다.

**번인**(burn-in): 체인의 초기 상태가 정상 분포와 다를 때, 정상 분포에 수렴하기까지의 초기 샘플을 버려야 한다. 이 번인 기간의 적절한 길이를 사전에 결정하는 이론적 방법은 없다.

**혼합 시간**(mixing time): 체인이 분포의 모든 영역을 적절히 방문하는 데 걸리는 시간이다. 다봉분포(multimodal distribution)에서 봉우리 사이의 낮은 확률 영역을 건너가기 어려우면, 혼합이 극도로 느려진다.

자기상관(autocorrelation): 연속된 샘플들이 상관되어 있으므로, 독립 샘플 대비 유효 표본 크기(effective sample size)가 줄어든다.

Gelman-Rubin 진단(R-hat), 유효 표본 크기(ESS), 추적 그림(trace plot) 등의 진단 도구가 있지만, 모두 수렴의 필요조건만 확인할 뿐 충분조건을 보장하지 않는다.

## 한계와 약점

- **고차원의 저주**: 일반적인 MH 알고리즘은 차원이 높아질수록 수용률이 급격히 떨어진다. HMC가 이를 완화하지만, 수백만 파라미터의 신경망에 적용하기에는 여전히 비용이 크다.
- **수렴 진단의 불완전성**: 체인이 수렴했는지를 확실히 판단할 방법이 없다. 체인이 분포의 한 봉우리에만 갇혀 있을 때, 그 봉우리 내에서는 수렴한 것처럼 보인다.
- **계산 비용**: 각 스텝에서 P(x)를 평가해야 하고(HMC는 기울기까지), 충분한 수의 독립적 샘플을 모으려면 체인을 길게 실행해야 한다. 대규모 데이터에서는 각 스텝의 비용도 문제다.
- **이산 공간에서의 제약**: HMC는 연속 공간에서만 작동한다. 이산 파라미터를 포함하는 모델에서는 깁스 샘플링이나 MH 알고리즘으로 한정된다.
- **딥러닝의 주류 이탈**: MCMC 기반 베이즈 추론은 소규모~중규모 모델에서는 강력하지만, 현대 딥러닝의 규모에서는 변분 추론이나 MC-Dropout 같은 근사 방법에 밀렸다.

## 용어 정리

마르코프 체인(Markov chain) - 다음 상태가 현재 상태에만 의존하고 과거 상태와 무관한 확률 과정

정상 분포(stationary distribution) - 마르코프 체인이 충분히 오래 실행된 뒤 수렴하는 확률 분포. MCMC에서는 목표 분포 P(x)와 일치시킴

상세 균형(detailed balance) - P(x)*T(x->y) = P(y)*T(y->x) 조건. 이를 만족하면 P(x)가 정상 분포임이 보장됨

제안 분포(proposal distribution) - MH 알고리즘에서 후보 상태를 생성하는 보조 분포 q(y|x)

번인(burn-in) - 마르코프 체인의 초기 비정상 구간. 이 구간의 샘플은 버리고 이후 샘플만 사용

혼합 시간(mixing time) - 체인이 정상 분포의 모든 영역을 충분히 방문하는 데 걸리는 시간

해밀턴 몬테카를로(Hamiltonian Monte Carlo) - 해밀턴 역학을 이용해 그래디언트 방향으로 효율적으로 이동하는 MCMC 방법. Duane et al.(1987)

랑주뱅 동역학(Langevin dynamics) - 확률적 미분방정식에 기반한 MCMC 기법. 확산 모델과 SGLD의 이론적 기반

대비 발산(contrastive divergence) - Hinton(2002)이 제안한 RBM 학습법. MCMC를 몇 스텝만 실행하여 그래디언트를 근사

유효 표본 크기(effective sample size) - 자기상관을 고려했을 때 독립 샘플에 상응하는 실질적 표본 수

---EN---
Markov Chain Monte Carlo - A computational technique for sampling from complex probability distributions by constructing Markov chains with desired stationary distributions

## An Algorithm Born from Nuclear Weapons

MCMC has one of the most unexpected origins in the history of science. In 1953, at Los Alamos National Laboratory, Nicholas Metropolis, Arianna Rosenbluth, Marshall Rosenbluth, Augusta Teller, and Edward Teller devised a new computational method for neutron diffusion simulations needed in nuclear weapon design. Since directly computing the thermal equilibrium states of systems with hundreds of interacting particles was impossible, they adopted the strategy of approximating distributions through random sampling.

Their paper "Equation of State Calculations by Fast Computing Machines" (1953) is the common ancestor of two AI techniques. One is Simulated Annealing by Kirkpatrick et al. (1983), and the other is MCMC itself. The same accept-reject mechanism evolved along two branches: optimization and sampling.

## Core Idea: Why Markov Chains

The problem MCMC solves is: we want to draw samples from a complex probability distribution P(x), but cannot sample from P(x) directly. Typically, we know the form of the distribution (an unnormalized density function) but cannot compute the normalization constant.

MCMC's strategy: construct a Markov chain whose **stationary distribution** is P(x). Running the chain long enough guarantees that its states follow the same distribution as samples drawn from P(x).

A Markov chain is a stochastic process where the next state depends only on the current state, independent of the past. The key is designing the transition probability T(x->y). When this transition probability satisfies the **detailed balance** condition, P(x) is guaranteed to be the chain's stationary distribution.

Detailed balance: P(x) * T(x->y) = P(y) * T(y->x)

This condition means that in steady state, the flow from x to y equals the flow from y to x. Physically, this corresponds to microscopic reversibility at thermal equilibrium.

## The Metropolis-Hastings Algorithm

The Metropolis-Hastings (MH) algorithm is Hastings' (1970) generalization of the original Metropolis et al. (1953) algorithm to asymmetric proposal distributions.

1. From the current state x, generate a candidate state y using the proposal distribution q(y|x)
2. Compute the acceptance probability: alpha = min(1, [P(y) * q(x|y)] / [P(x) * q(y|x)])
3. Generate a uniform random number U
4. If U < alpha, move to y; otherwise, stay at x
5. Repeat

A crucial point: P(x) can be unnormalized. Since only the **ratio P(y)/P(x)** is needed in the acceptance probability, **normalization constants cancel out**. This is the fundamental reason MCMC works even when the partition function cannot be computed.

When the proposal distribution q is symmetric (q(y|x) = q(x|y)), the acceptance probability simplifies to the original Metropolis form: alpha = min(1, P(y)/P(x)). This is exactly the form also used in Simulated Annealing.

## Gibbs Sampling: A Detour for Multivariate Distributions

Geman and Geman (1984) proposed Gibbs Sampling for image restoration problems. When direct sampling from a multivariate distribution P(x_1, x_2, ..., x_n) is difficult, each variable is sequentially sampled from its conditional distribution with all other variables fixed:

Sample x_i from P(x_i | x_1, ..., x_{i-1}, x_{i+1}, ..., x_n)

The full joint distribution may be intractable, but Gibbs sampling is very efficient when each conditional distribution has a known form (e.g., Gaussian). It is in fact a special case of MH where the acceptance probability is always 1.

Gibbs sampling played a decisive role in making Bayesian inference practical. In the 1990s, the BUGS (Bayesian inference Using Gibbs Sampling) software led the popularization of Bayesian statistics.

## Hamiltonian Monte Carlo: A Second Gift from Physics

Standard MH algorithms are inefficient in high-dimensional spaces. Random walk exploration leads to low acceptance rates or short travel distances, failing to adequately explore the distribution.

Duane, Kennedy, Pendleton, and Roweth (1987) drew inspiration from molecular dynamics to propose Hamiltonian Monte Carlo (HMC). The core idea is introducing **Hamiltonian mechanics** into sampling.

Auxiliary momentum variables are introduced for each parameter position. The "potential energy" of position corresponds to -log P(x), and "kinetic energy" of momentum is added. As position and momentum evolve together according to Hamilton's equations, the particle efficiently travels along high-probability regions.

HMC is fundamentally different from random walk MH in that it **leverages gradient information**. The gradient of -log P(x) guides the particle's movement direction, enabling high acceptance rates and fast exploration even in high dimensions.

Hoffman and Gelman's (2014) NUTS (No-U-Turn Sampler) automatically determines HMC trajectory length, greatly improving practicality. Adopted as the default sampler in Stan and PyMC, it has become the standard tool of modern Bayesian statistics.

## Direct Influence on AI

MCMC provided direct foundations for several core AI techniques.

Boltzmann Machines and Contrastive Divergence: Hinton's (2002) **Contrastive Divergence** (CD) uses MCMC in a "truncated" form for RBM training. Instead of converging to the exact posterior, it runs Gibbs sampling for just 1 to a few steps to approximate the gradient. Sacrificing theoretical accuracy for practical speed, this was key to Deep Belief Network (DBN) pre-training.

Stochastic Gradient Langevin Dynamics: Welling and Teh's (2011) SGLD showed that adding appropriate noise to SGD turns it into **Langevin dynamics** -- a form of MCMC -- effectively sampling from the posterior distribution. This is where the **boundary between optimization and sampling blurs**.

Connection to Diffusion Models: Modern diffusion models (Ho et al. 2020) gradually add noise to data and then reverse the process. The reverse process is deeply connected to Langevin dynamics and learned through score matching. The physical roots of MCMC extend to the latest generative models.

## The Challenge of Convergence

MCMC's most fundamental practical issue is the difficulty of knowing "have we run long enough?"

**Burn-in**: When the chain's initial state differs from the stationary distribution, early samples must be discarded until convergence. There is no theoretical method to determine the appropriate burn-in length in advance.

**Mixing time**: The time required for the chain to adequately visit all regions of the distribution. When crossing low-probability valleys between modes of a multimodal distribution is difficult, mixing becomes extremely slow.

Autocorrelation: Consecutive samples are correlated, reducing the effective sample size relative to independent samples.

Diagnostic tools exist -- Gelman-Rubin diagnostic (R-hat), effective sample size (ESS), trace plots -- but all only check necessary conditions for convergence without guaranteeing sufficiency.

## Limitations and Weaknesses

- **Curse of dimensionality**: Standard MH acceptance rates drop sharply as dimensions increase. HMC mitigates this but remains costly for neural networks with millions of parameters.
- **Incomplete convergence diagnostics**: There is no way to definitively determine if a chain has converged. When a chain is trapped in one mode, it may appear converged within that mode.
- **Computational cost**: Each step requires evaluating P(x) (HMC requires gradients too), and the chain must run long to collect enough independent samples. For large-scale data, even the per-step cost is an issue.
- **Constraints in discrete spaces**: HMC works only in continuous spaces. Models with discrete parameters are limited to Gibbs sampling or MH algorithms.
- **Departure from deep learning mainstream**: MCMC-based Bayesian inference is powerful for small to mid-scale models but has been overtaken by approximate methods like variational inference and MC-Dropout at modern deep learning scales.

## Glossary

Markov chain - a stochastic process where the next state depends only on the current state, independent of past states

Stationary distribution - the probability distribution a Markov chain converges to after running long enough; in MCMC, this is matched to the target distribution P(x)

Detailed balance - the condition P(x)*T(x->y) = P(y)*T(y->x); when satisfied, P(x) is guaranteed to be the stationary distribution

Proposal distribution - the auxiliary distribution q(y|x) used to generate candidate states in the MH algorithm

Burn-in - the initial non-stationary period of a Markov chain; samples from this period are discarded

Mixing time - the time required for a chain to sufficiently visit all regions of the stationary distribution

Hamiltonian Monte Carlo - an MCMC method that uses Hamiltonian mechanics to efficiently move along gradient directions; Duane et al. (1987)

Langevin dynamics - an MCMC technique based on stochastic differential equations; the theoretical foundation of diffusion models and SGLD

Contrastive divergence - an RBM training method proposed by Hinton (2002); approximates gradients by running MCMC for only a few steps

Effective sample size - the substantive number of samples equivalent to independent samples when accounting for autocorrelation
