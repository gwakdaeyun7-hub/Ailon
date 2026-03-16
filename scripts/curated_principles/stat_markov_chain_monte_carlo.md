---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 마르코프 체인 몬테카를로, Metropolis-Hastings, 깁스 샘플링, 상세 균형, 정규화 상수, 번인, 해밀턴 몬테카를로, 탐색과 수렴
keywords_en: Markov chain Monte Carlo, Metropolis-Hastings, Gibbs sampling, detailed balance, normalization constant, burn-in, Hamiltonian Monte Carlo, exploration and convergence
---
Markov Chain Monte Carlo - 직접 샘플링이 불가능한 복잡한 확률 분포에서, 마르코프 체인을 설계하여 간접적으로 샘플을 추출하는 계산 기법

## 통계 물리학이 낳은 샘플링 전략

1953년, 로스알라모스 국립연구소에서 Nicholas Metropolis, Arianna Rosenbluth, Marshall Rosenbluth, Augusta Teller, Edward Teller는 핵무기 설계를 위한 중성자 확산 시뮬레이션에 직면했다. 수백 개의 입자가 상호작용하는 시스템에서 열평형 에너지 분포를 구해야 했지만, 가능한 배치 수가 천문학적이라 직접 계산은 불가능했다. 분포를 직접 계산하는 대신, 그 분포에서 **샘플을 뽑아** 통계적으로 근사하는 전략을 택했다.

비유로 표현하면, 울퉁불퉁한 산악 지형의 전체 지도를 그리는 것은 불가능하지만, 한 사람이 오래 걸어다니며 고도를 기록하면 지형의 윤곽을 알 수 있다. 다만 **낮은 곳을 더 자주 방문하고, 높은 곳을 덜 자주 방문하는 특별한 걸음 규칙**이 있어야 한다. 이 걸음 규칙이 마르코프 체인이다.

이들의 논문 "Equation of State Calculations by Fast Computing Machines"(1953)은 두 가지 AI 기법의 공통 조상이 되었다. Kirkpatrick et al.(1983)의 Simulated Annealing(최적화)과 MCMC(샘플링)다. 같은 수용-거부 메커니즘이 서로 다른 목적으로 갈라진 것이다.

## 통계학에서 AI로: 샘플링 불가능 문제의 해법

MCMC가 해결하는 핵심 문제는 복잡한 확률 분포 P(x)에서 샘플을 뽑고 싶지만 직접 샘플링이 불가능한 상황이다. 형태는 알지만 **정규화 상수**(모든 확률의 합이 1이 되도록 나누는 값)를 계산할 수 없는 경우가 전형적이다.

이 문제가 AI에서 반복적으로 등장한다. Boltzmann Machine의 분배함수, 베이즈 추론의 사후 분포, 생성 모델의 데이터 분포 -- 모두 정규화 상수를 직접 계산할 수 없다. MCMC는 이 공통 난관에 대한 범용 해법이다. 핵심 대응 관계는 다음과 같다.

- 열평형 상태의 에너지 분포 --> **목표 확률 분포 P(x)**
- 분자의 위치 변화 --> **해 공간에서의 상태 이동**
- 물리적 온도에 의한 전이 확률 --> **수용-거부 메커니즘**
- Metropolis(1953) --> Hastings(1970) 일반화 --> AI의 **학습과 추론**

## Metropolis-Hastings 알고리즘: 상세 균형이라는 설계 원리

MCMC의 핵심은 전이 확률의 설계다. 다음 상태가 현재 상태에만 의존하는 마르코프 체인을 구성하되, 충분히 오래 실행하면 목표 분포 P(x)에 수렴하도록 만들어야 한다. 이를 가능하게 하는 조건이 **상세 균형**(detailed balance)이다.

P(x) * T(x->y) = P(y) * T(y->x)

정상 상태에서 x에서 y로의 흐름과 y에서 x로의 흐름이 같다는 뜻이다. 물리학에서는 열평형에서의 미시적 가역성에 해당한다. 이 조건이 만족되면 P(x)가 체인의 정상 분포임이 보장된다.

Metropolis-Hastings(MH) 알고리즘의 한 스텝은 다음과 같다.

1. 현재 상태 x에서 제안 분포 q(y|x)로 후보 상태 y를 생성한다
2. 수용 확률을 계산한다: alpha = min(1, [P(y) * q(x|y)] / [P(x) * q(y|x)])
3. 균일 난수 U(0~1)를 생성하여, U < alpha이면 y로 이동하고 아니면 x에 머문다
4. 반복한다

결정적 수학적 특성: 수용 확률에서 P(y)/P(x) **비율만 필요**하므로 **정규화 상수가 상쇄**된다. P(x) = f(x)/Z라면 P(y)/P(x) = f(y)/f(x)가 되어 Z를 알 필요가 없다. 이것이 MCMC가 분배함수를 계산할 수 없는 상황에서도 작동하는 핵심 이유다.

제안 분포 q가 대칭이면 수용 확률은 alpha = min(1, P(y)/P(x))로 단순화된다. SA는 여기에 온도 파라미터를 추가하여 샘플링이 아닌 최적화를 수행한다.

## 탐색 효율과 수렴의 트레이드오프

MCMC의 근본적 실무 난제는 **"충분히 오래 실행했는가"**를 알기 어렵다는 것이다.

**번인(burn-in)**: 초기 상태가 목표 분포와 다를 때, 수렴까지의 초기 샘플을 버려야 한다. 번인 기간의 적절한 길이를 사전에 결정하는 이론적 방법은 없다.

**혼합(mixing)**: 확률 분포에 봉우리가 여러 개 있고 그 사이가 낮은 확률의 골짜기로 분리되면, 체인이 한 봉우리에 갇혀 다른 봉우리를 방문하지 못한다.

**자기상관(autocorrelation)**: 연속 샘플이 상관되어 있어, 유효 표본 크기(ESS)가 실제 샘플 수보다 작아진다.

Gelman-Rubin 진단(R-hat), ESS, 추적 그림 등 진단 도구가 있지만, 모두 수렴의 **필요**조건만 확인할 뿐 **충분**조건을 보장하지 않는다.

## 깁스 샘플링과 해밀턴 몬테카를로

**깁스 샘플링**: Geman과 Geman(1984)이 제안한 방법으로, 한 번에 한 변수만 갱신한다. 전체 결합 분포에서 직접 샘플링이 어려울 때, 각 변수를 나머지가 고정된 조건부 분포에서 순차적으로 샘플링한다. MH의 특수한 경우로 수용 확률이 항상 1이다.

**해밀턴 몬테카를로(HMC)**: 일반 MH는 무작위 걸음으로 탐색하므로 고차원에서 비효율적이다. Duane et al.(1987)은 물리학의 **해밀턴 역학**을 도입하여 이 문제를 해결했다. 각 파라미터에 가상의 운동량 변수를 추가하고, -log P(x)를 위치 에너지로 해석한다. 해밀턴 방정식에 따라 입자가 높은 확률 영역의 등고선을 따라 효율적으로 이동하므로, 고차원에서도 높은 수용률과 빠른 탐색이 가능하다. Hoffman과 Gelman(2014)의 NUTS(No-U-Turn Sampler)는 HMC의 궤적 길이를 자동 결정하여, Stan과 PyMC의 기본 샘플러로 채택되었다.

## 현대 AI 기법과의 연결

**MCMC 메커니즘을 직접 사용하는 기법:**

- **Boltzmann Machine과 대비 발산**: Hinton(2002)은 RBM 학습을 위해 MCMC를 "잘린" 형태로 사용했다. 깁스 샘플링을 1~몇 스텝만 실행하여 그래디언트를 근사한다. 정규화 상수를 피해가는 MCMC의 강점이 그대로 작동하며, 심층 신뢰 신경망(DBN) 사전 학습의 핵심이었다.
- **확률적 그래디언트 랑주뱅 동역학(SGLD)**: Welling과 Teh(2011)는 SGD에 적절한 노이즈를 추가하면 랑주뱅 동역학(MCMC의 연속 시간 버전)이 되어 사후 분포에서 샘플링하는 효과를 낸다는 것을 보였다. 학습률을 줄여가면 최적화가 자연스럽게 샘플링으로 전환되는 지점이다.
- **확산 모델(Diffusion Models)**: Ho et al.(2020)의 확산 모델은 데이터에 점진적으로 노이즈를 추가한 뒤 역방향으로 복원하는 과정이다. 역방향 복원은 랑주뱅 동역학과 수학적으로 깊이 연결되어 있다. MCMC의 통계 물리학적 뿌리가 현재 가장 강력한 이미지 생성 모델에까지 이어지는 직접적 계보다.

**같은 문제를 다른 방식으로 해결하는 구조적 유사성:**

- **변분 추론(Variational Inference)**: MCMC가 정확한 사후 분포에서 샘플링을 추구하는 반면, 변분 추론은 다루기 쉬운 분포로 근사하는 최적화 문제로 전환한다. 상보적 해법이며, 현대 딥러닝에서는 규모 문제로 변분 추론이 주류가 되었다. VAE(Kingma & Welling, 2014)가 대표적이다.

## 한계와 약점

- **고차원의 벽**: 일반 MH의 수용률은 차원이 높아질수록 급락한다. HMC가 완화하지만, 수백만 파라미터의 현대 신경망에는 여전히 비실용적이다. 실제로 변분 추론이나 MC-Dropout이 주류다.
- **수렴 진단의 근본적 불완전성**: 체인이 수렴했는지 확실히 판단할 방법이 없다. 다봉분포에서 한 봉우리에 갇히면 완벽히 수렴한 것처럼 보일 수 있다.
- **계산 비용과 자기상관**: 각 스텝에서 P(x)를 평가해야 하고(HMC는 그래디언트까지), 자기상관 때문에 체인을 길게 실행해야 한다.
- **이산 공간의 제약**: HMC는 연속 공간에서만 작동한다. 이산 변수를 포함하는 모델(언어 모델의 토큰 선택 등)에서는 깁스 샘플링이나 기본 MH로 제한된다.

## 용어 정리

마르코프 체인(Markov chain) - 다음 상태가 현재 상태에만 의존하고 과거 상태와 무관한 확률 과정

정규화 상수(normalization constant) - 확률 분포의 모든 값의 합이 1이 되도록 나누는 값. 가능한 상태가 너무 많으면 계산 불가능

상세 균형(detailed balance) - P(x)*T(x->y) = P(y)*T(y->x) 조건. 정상 상태에서 두 상태 간 흐름이 양방향으로 같음을 보장

제안 분포(proposal distribution) - MH 알고리즘에서 후보 상태를 생성하는 보조 분포 q(y|x). 알고리즘의 효율을 좌우한다

번인(burn-in) - 마르코프 체인의 초기 구간. 목표 분포에 수렴하지 않은 상태이므로 이 구간의 샘플은 버린다

유효 표본 크기(effective sample size) - 자기상관을 고려한 실질적 독립 표본 수. 1000개 샘플의 ESS가 200이면 독립 샘플 200개와 같은 정보량

대비 발산(contrastive divergence) - Hinton(2002)이 제안한 RBM 학습법. 깁스 샘플링을 수렴까지 실행하지 않고 몇 스텝만 실행하여 그래디언트를 근사

랑주뱅 동역학(Langevin dynamics) - 확률적 미분방정식에 기반한 MCMC의 연속 시간 버전. 확산 모델과 SGLD의 수학적 기반

---EN---
Markov Chain Monte Carlo - A computational technique for indirectly drawing samples from complex probability distributions by designing Markov chains that converge to the target distribution

## A Sampling Strategy Born from Statistical Physics

In 1953, at Los Alamos National Laboratory, Nicholas Metropolis, Arianna Rosenbluth, Marshall Rosenbluth, Augusta Teller, and Edward Teller faced neutron diffusion simulation for nuclear weapon design. They needed the equilibrium energy distribution for hundreds of interacting particles, but the astronomical number of configurations made direct computation impossible. Instead of computing the distribution directly, they **drew samples** and approximated statistically.

The core idea, as an analogy: drawing a complete map of rugged terrain is impossible, but a person walking long enough and recording elevations reveals the rough contours. The catch: there must be **a special walking rule that visits low areas more frequently and high areas less frequently**. This walking rule is the Markov chain.

Their paper "Equation of State Calculations by Fast Computing Machines" (1953) became the common ancestor of two AI techniques: Simulated Annealing (Kirkpatrick et al., 1983) for optimization, and MCMC for sampling. The same accept-reject mechanism diverged toward different purposes.

## From Statistics to AI: Solving the Intractable Sampling Problem

The core problem MCMC solves: we want samples from a complex distribution P(x), but cannot sample directly. The typical case is knowing the form but being unable to compute the **normalization constant** -- the value ensuring probabilities sum to 1.

This problem appears repeatedly in AI: Boltzmann Machine partition functions, Bayesian posteriors, generative model data distributions -- all with intractable normalization constants. MCMC provides a general solution. The key correspondences:

- Energy distribution at equilibrium --> **target distribution P(x)**
- Molecular position changes --> **state transitions in solution space**
- Temperature-governed transition probability --> **accept-reject mechanism**
- Metropolis (1953) --> Hastings (1970) generalization --> AI **learning and inference**

## The Metropolis-Hastings Algorithm: Detailed Balance as Design Principle

MCMC's heart is designing transition probabilities. The chain must depend only on the current state and converge to P(x) after sufficient runtime. The enabling condition is **detailed balance**:

P(x) * T(x->y) = P(y) * T(y->x)

This means flow from x to y equals flow from y to x at steady state -- corresponding to microscopic reversibility in physics. When satisfied, P(x) is guaranteed to be the stationary distribution.

One MH step:

1. From state x, generate candidate y using proposal distribution q(y|x)
2. Compute acceptance probability: alpha = min(1, [P(y) * q(x|y)] / [P(x) * q(y|x)])
3. Generate uniform random U (0-1); if U < alpha, move to y; otherwise stay at x
4. Repeat

The decisive mathematical property: only the **ratio P(y)/P(x)** is needed, so **normalization constants cancel**. If P(x) = f(x)/Z, then P(y)/P(x) = f(y)/f(x), and Z never needs to be known. This is why MCMC works even with intractable partition functions.

When proposal q is symmetric, acceptance simplifies to alpha = min(1, P(y)/P(x)). SA adds a temperature parameter to perform optimization instead of sampling.

## The Tradeoff Between Exploration and Convergence

MCMC's fundamental practical challenge: knowing **"have we run long enough?"**

**Burn-in**: Early samples must be discarded before convergence. No theoretical method determines the appropriate burn-in length in advance.

**Mixing**: If the distribution has multiple peaks separated by low-probability valleys, the chain gets trapped in one peak.

**Autocorrelation**: Consecutive samples are correlated, so effective sample size (ESS) falls below the actual count.

Diagnostics like Gelman-Rubin (R-hat), ESS, and trace plots check **necessary** conditions only -- none **guarantee** convergence.

## Gibbs Sampling and Hamiltonian Monte Carlo

**Gibbs Sampling**: Proposed by Geman and Geman (1984). Updates one variable at a time by sampling from its conditional distribution with all others held fixed. A special case of MH where acceptance is always 1.

**Hamiltonian Monte Carlo (HMC)**: Standard MH is inefficient in high dimensions. Duane et al. (1987) introduced **Hamiltonian mechanics** into sampling. Auxiliary momentum variables are added, -log P(x) is interpreted as potential energy, and the particle moves efficiently along contours of high probability. Hoffman and Gelman's (2014) NUTS automatically determines trajectory length and has become the default sampler in Stan and PyMC.

## Connections to Modern AI

**Techniques directly using MCMC mechanisms:**

- **Boltzmann Machines and Contrastive Divergence**: Hinton (2002) used truncated MCMC for RBM training -- running Gibbs sampling for just a few steps to approximate gradients. MCMC's strength of bypassing normalization constants works directly here, key to Deep Belief Network pre-training.
- **Stochastic Gradient Langevin Dynamics (SGLD)**: Welling and Teh (2011) showed that adding appropriate noise to SGD turns it into Langevin dynamics -- MCMC's continuous-time version -- effectively sampling from the posterior. As the learning rate is annealed, optimization transitions naturally into sampling.
- **Diffusion Models**: Ho et al.'s (2020) diffusion models gradually add noise then reverse the process. The reverse denoising is deeply connected to Langevin dynamics mathematically. MCMC's statistical physics roots extend in direct lineage to today's most powerful image generation models.

**Structural similarity -- solving the same problem differently:**

- **Variational Inference**: While MCMC pursues exact posterior sampling, VI approximates the posterior with a tractable distribution via optimization. Complementary solutions to the same problem. At modern deep learning scale, VI dominates. VAE (Kingma & Welling, 2014) is representative.

## Limitations and Weaknesses

- **The wall of high dimensions**: Standard MH acceptance rates drop sharply with dimensions. HMC helps but remains impractical for million-parameter neural networks. In practice, variational inference and MC-Dropout are mainstream.
- **Fundamentally incomplete convergence diagnostics**: No way to definitively confirm convergence. A chain trapped in one mode of a multimodal distribution can appear perfectly converged.
- **Computational cost and autocorrelation**: Each step evaluates P(x) (HMC also needs gradients), and autocorrelation forces longer chains for effectively independent samples.
- **Discrete space constraints**: HMC works only in continuous spaces. Models with discrete variables (token selection in language models, etc.) are limited to Gibbs or basic MH.

## Glossary

Markov chain - a stochastic process where the next state depends only on the current state, independent of past states

Normalization constant - the value dividing a distribution so probabilities sum to 1; intractable when possible states are too numerous

Detailed balance - P(x)*T(x->y) = P(y)*T(y->x); guarantees equal flow between states in both directions at steady state

Proposal distribution - the auxiliary distribution q(y|x) for generating candidates in MH; governs algorithm efficiency

Burn-in - the initial period before convergence; samples from this period are discarded

Effective sample size - the substantive number of independent-equivalent samples after accounting for autocorrelation

Contrastive divergence - Hinton's (2002) RBM training method; runs Gibbs sampling for only a few steps instead of to convergence

Langevin dynamics - continuous-time MCMC based on stochastic differential equations; the mathematical foundation of diffusion models and SGLD
