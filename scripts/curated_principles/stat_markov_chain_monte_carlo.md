---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 마르코프 체인 몬테카를로, Metropolis-Hastings, 깁스 샘플링, 상세 균형, 정규화 상수, 번인, 해밀턴 몬테카를로, 탐색과 수렴
keywords_en: Markov chain Monte Carlo, Metropolis-Hastings, Gibbs sampling, detailed balance, normalization constant, burn-in, Hamiltonian Monte Carlo, exploration and convergence
---
Markov Chain Monte Carlo - 직접 샘플링이 불가능한 복잡한 확률 분포에서, 마르코프 체인을 설계하여 간접적으로 샘플을 추출하는 계산 기법

## 통계 물리학이 낳은 샘플링 전략

1953년, 로스알라모스 국립연구소에서 Nicholas Metropolis, Arianna Rosenbluth, Marshall Rosenbluth, Augusta Teller, Edward Teller는 핵무기 설계에 필요한 중성자 확산 시뮬레이션에 직면했다. 수백 개의 입자가 서로 밀고 당기는 시스템에서 열평형 상태의 에너지 분포를 계산해야 했는데, 가능한 배치의 수가 천문학적이라 모든 경우를 직접 계산하는 것은 불가능했다. 그래서 이들은 전혀 다른 전략을 택했다. 분포를 직접 계산하는 대신, 그 분포에서 **샘플을 뽑아** 통계적으로 근사하는 것이다.

이 아이디어의 핵심을 비유로 표현하면 이렇다. 울퉁불퉁한 산악 지형의 전체 지도를 그리는 것은 불가능하지만, 한 사람이 오래 걸어다니면서 방문한 장소들의 고도를 기록하면 지형의 대략적 윤곽을 알 수 있다. 다만 아무렇게나 걸어서는 안 된다. **낮은 곳을 더 자주 방문하고, 높은 곳을 덜 자주 방문하는 특별한 걸음 규칙**이 있어야 한다. 이 걸음 규칙이 바로 마르코프 체인이다.

이들이 발표한 "Equation of State Calculations by Fast Computing Machines"(1953)은 두 가지 AI 기법의 공통 조상이 되었다. 하나는 Kirkpatrick et al.(1983)의 Simulated Annealing(최적화)이고, 다른 하나가 바로 MCMC(샘플링)다. 같은 수용-거부 메커니즘이 서로 다른 목적으로 갈라진 것이다.

## 통계학에서 AI로: 샘플링 불가능 문제의 해법

MCMC가 해결하는 핵심 문제는 이것이다. 복잡한 확률 분포 P(x)에서 샘플을 뽑고 싶지만, P(x)에서 직접 샘플링하는 방법이 없다. 형태는 알지만 **정규화 상수**(normalization constant)를 계산할 수 없는 상황이 전형적이다. 정규화 상수란 모든 확률의 합이 1이 되도록 전체를 나누는 값인데, 가능한 상태가 무한하거나 천문학적으로 많으면 이 값을 구할 수 없다.

이 문제가 AI에서 반복적으로 등장한다. Boltzmann Machine의 분배함수(partition function), 베이즈 추론의 사후 분포, 생성 모델의 데이터 분포 -- 모두 정규화 상수를 직접 계산할 수 없는 분포다. MCMC는 이 공통적 난관에 대한 범용 해법을 제공했다. 핵심 대응 관계는 다음과 같다.

- 열평형 상태의 에너지 분포 --> **목표 확률 분포 P(x)** (샘플링 대상)
- 분자의 위치 변화 --> **해 공간에서의 상태 이동** (후보 생성)
- 물리적 온도에 의한 전이 확률 --> **수용-거부 메커니즘** (상세 균형 보장)
- Metropolis(1953)의 분자 시뮬레이션 --> Hastings(1970)의 일반화 --> AI의 **학습과 추론**

## Metropolis-Hastings 알고리즘: 상세 균형이라는 설계 원리

MCMC의 핵심은 전이 확률(transition probability)의 설계다. 다음 상태가 현재 상태에만 의존하고 과거에는 무관한 확률 과정 -- 마르코프 체인 -- 을 구성하되, 이 체인이 충분히 오래 실행되면 목표 분포 P(x)에 수렴하도록 만들어야 한다. 이를 가능하게 하는 조건이 **상세 균형**(detailed balance)이다.

P(x) * T(x->y) = P(y) * T(y->x)

이 조건은 정상 상태에서 x에서 y로의 흐름과 y에서 x로의 흐름이 같다는 뜻이다. 물리학에서는 열평형에서의 미시적 가역성(microscopic reversibility)에 해당한다. 상세 균형이 만족되면 P(x)가 체인의 정상 분포(stationary distribution)임이 보장된다.

Metropolis et al.(1953)의 원래 알고리즘을 Hastings(1970)가 비대칭 제안 분포(proposal distribution)까지 허용하는 형태로 일반화한 것이 Metropolis-Hastings(MH) 알고리즘이다.

1. 현재 상태 x에서 제안 분포 q(y|x)를 이용해 후보 상태 y를 생성한다
2. 수용 확률을 계산한다: alpha = min(1, [P(y) * q(x|y)] / [P(x) * q(y|x)])
3. 균일 난수 U를 생성한다 (0~1 사이)
4. U < alpha이면 y로 이동하고, 아니면 x에 머문다
5. 반복한다

여기서 결정적인 수학적 특성이 있다. 수용 확률에서 P(y)/P(x) **비율만 필요**하므로, **정규화 상수가 분자와 분모에서 상쇄**된다. P(x) = f(x)/Z라면, P(y)/P(x) = f(y)/f(x)가 되어 Z를 알 필요가 없다. 이것이 MCMC가 분배함수를 계산할 수 없는 상황에서도 작동하는 핵심 이유다.

제안 분포 q가 대칭(q(y|x) = q(x|y))이면, 수용 확률은 원래 Metropolis 형태로 단순화된다: alpha = min(1, P(y)/P(x)). 이것이 Simulated Annealing에서도 사용되는 바로 그 형태다. SA는 여기에 온도 파라미터를 추가해서 샘플링이 아닌 최적화를 수행한다.

## 탐색 효율과 수렴 사이의 트레이드오프

MCMC의 가장 근본적인 실무 난제는 **"충분히 오래 실행했는가"**를 알기 어렵다는 것이다.

**번인(burn-in)**: 체인의 초기 상태가 목표 분포와 다를 때, 정상 분포에 수렴하기까지의 초기 샘플을 버려야 한다. 이를 공간적으로 생각하면, 등산객이 산 정상에서 출발했는데 실제로 알고 싶은 것은 계곡 바닥의 지형이다. 처음 한동안은 내려오는 과정일 뿐이므로 그 기록은 버려야 한다. 문제는 이 번인 기간의 적절한 길이를 사전에 결정하는 이론적 방법이 없다는 것이다.

**혼합(mixing)**: 체인이 목표 분포의 모든 영역을 적절히 방문하는 능력이다. 확률 분포에 봉우리가 여러 개 있고(다봉분포) 그 사이가 확률이 매우 낮은 골짜기로 분리되어 있으면, 체인이 한 봉우리에 갇혀 다른 봉우리를 방문하지 못한다. 마치 높은 산맥으로 분리된 두 계곡 사이를 평지 걷기만으로 오가려는 것과 같다.

**자기상관(autocorrelation)**: 연속된 샘플들이 서로 상관되어 있다. 한 걸음씩 이동하므로 인접한 샘플은 비슷한 값을 가진다. 이 때문에 100개의 연속 샘플이 독립적 100개 샘플과 같은 정보를 담지 못한다. 유효 표본 크기(effective sample size)가 실제 샘플 수보다 작아진다.

Gelman-Rubin 진단(R-hat)은 여러 독립 체인을 실행하여 체인 간 분산과 체인 내 분산을 비교하는데, R-hat이 1에 가까우면 수렴 신호로 본다. 유효 표본 크기(ESS), 추적 그림(trace plot) 등 진단 도구가 있지만, 모두 수렴의 **필요**조건만 확인할 뿐 **충분**조건을 보장하지 않는다. 체인이 분포의 한 봉우리에만 갇혀 있을 때, 그 봉우리 내에서는 수렴한 것처럼 보일 수 있다.

## 깁스 샘플링과 해밀턴 몬테카를로: 두 가지 확장

**깁스 샘플링**: Geman과 Geman(1984)이 제안한 방법으로, 핵심 아이디어는 한 번에 한 변수만 갱신하는 것이다. 전체 결합 분포 P(x_1, x_2, ..., x_n)에서 직접 샘플링이 어려울 때, 각 변수를 나머지가 고정된 조건부 분포에서 순차적으로 샘플링한다. MH의 특수한 경우로 수용 확률이 항상 1이며, 각 조건부 분포가 알려진 형태(예: 가우시안)일 때 효율적이다.

**해밀턴 몬테카를로(HMC)**: 일반적인 MH 알고리즘은 무작위 걸음(random walk)으로 탐색하므로 고차원 공간에서 비효율적이다. 100차원 공간에서 무작위 걸음의 수용률은 0.01% 미만으로 떨어지지만, HMC는 기울기 정보를 활용해 80% 이상의 수용률을 유지한다. Duane, Kennedy, Pendleton, Roweth(1987)는 물리학의 **해밀턴 역학**을 샘플링에 도입하여 이 문제를 해결했다. 각 파라미터 위치에 가상의 운동량(momentum) 변수를 추가하고, -log P(x)를 위치 에너지로 해석한다. 해밀턴 방정식에 따라 위치와 운동량이 함께 진화하면, 입자는 높은 확률 영역의 등고선을 따라 효율적으로 이동한다. -log P(x)의 기울기가 이동 방향을 안내하므로, 고차원에서도 높은 수용률과 빠른 탐색이 가능하다. Hoffman과 Gelman(2014)의 NUTS(No-U-Turn Sampler)는 HMC의 궤적 길이를 자동으로 결정하여 실용성을 크게 높였다. Stan과 PyMC에서 기본 샘플러로 채택되어 현대 베이즈 통계의 표준 도구가 되었다.

## 현대 AI 기법과의 연결

MCMC는 여러 핵심 AI 기법에 직접적 기반을 제공했다. 다만 각 연결의 성격을 구분할 필요가 있다.

**MCMC 메커니즘을 직접 사용하는 기법:**

- **Boltzmann Machine과 대비 발산(Contrastive Divergence)**: Hinton(2002)은 제한 볼츠만 머신(RBM) 학습을 위해 MCMC를 "잘린(truncated)" 형태로 사용했다. 정확한 분포까지 수렴시키지 않고, 깁스 샘플링을 단 1~몇 스텝만 실행하여 그래디언트를 근사한다. 이론적 정확성을 포기한 대신 실용적 속도를 얻은 것으로, 심층 신뢰 신경망(DBN) 사전 학습의 핵심이었다. 정규화 상수를 피해가는 MCMC의 강점이 여기서도 그대로 작동한다.
- **확률적 그래디언트 랑주뱅 동역학(SGLD)**: Welling과 Teh(2011)는 SGD에 적절한 크기의 가우시안 노이즈를 추가하면 그것이 랑주뱅 동역학(Langevin dynamics) -- MCMC의 연속 시간 버전 -- 이 되어 사후 분포에서 샘플링하는 효과를 낸다는 것을 보였다. 학습률을 줄여가면 최적화가 자연스럽게 샘플링으로 전환되는, **최적화와 샘플링의 경계가 흐려지는** 지점이다.
- **확산 모델(Diffusion Models)**: Ho et al.(2020)의 확산 모델은 데이터에 점진적으로 가우시안 노이즈를 추가한 뒤 역방향으로 복원하는 과정이다. 이 역방향 복원 과정은 랑주뱅 동역학과 수학적으로 깊이 연결되어 있으며, score matching을 통해 학습된다. MCMC의 통계 물리학적 뿌리가 현재 가장 강력한 이미지 생성 모델에까지 이어지는 직접적 계보다.

**같은 문제를 다른 방식으로 해결하는 구조적 유사성:**

- **변분 추론(Variational Inference)**: MCMC가 정확한 사후 분포에서 샘플링을 추구하는 반면, 변분 추론은 다루기 쉬운 분포(예: 가우시안 혼합)로 사후 분포를 근사하는 최적화 문제로 전환한다. 같은 "다루기 어려운 분포" 문제에 대한 상보적 해법이며, 현대 딥러닝에서는 규모 문제로 변분 추론이 주류가 되었다. VAE(Variational Autoencoder, Kingma & Welling 2014)가 대표적이다.

## 한계와 약점

- **고차원의 벽**: 일반적인 MH 알고리즘은 차원이 높아질수록 수용률이 급격히 떨어진다. HMC가 이를 완화하지만, 수백만 파라미터의 현대 신경망에 적용하기에는 여전히 계산 비용이 너무 크다. 실제로 현대 딥러닝에서는 MCMC 대신 변분 추론이나 MC-Dropout 같은 근사 방법이 주류다.
- **수렴 진단의 근본적 불완전성**: 체인이 수렴했는지 확실히 판단할 방법이 없다. R-hat, ESS 같은 진단 도구는 "아직 수렴하지 않았다"는 신호를 줄 수 있지만, "수렴했다"를 보장하지 못한다. 다봉분포에서 체인이 하나의 봉우리에만 갇혀 있으면, 그 봉우리 안에서는 완벽하게 수렴한 것처럼 보인다.
- **계산 비용과 자기상관**: 각 스텝에서 P(x)를 평가해야 하고(HMC는 그래디언트까지), 독립적 샘플을 충분히 모으려면 자기상관 때문에 체인을 훨씬 길게 실행해야 한다. 대규모 데이터셋에서는 각 스텝의 비용 자체도 문제가 된다.
- **이산 공간의 제약**: HMC는 그래디언트 기반이므로 연속 공간에서만 작동한다. 이산 변수를 포함하는 모델(언어 모델의 토큰 선택, 그래프 구조 탐색 등)에서는 깁스 샘플링이나 기본 MH로 제한된다.

## 용어 정리

마르코프 체인(Markov chain) - 다음 상태가 현재 상태에만 의존하고 과거 상태와 무관한 확률 과정. "기억 없는(memoryless)" 과정이라고도 부른다

정규화 상수(normalization constant) - 확률 분포의 모든 값의 합이 1이 되도록 전체를 나누는 값. 가능한 상태가 너무 많으면 계산 불가능

상세 균형(detailed balance) - P(x)*T(x->y) = P(y)*T(y->x) 조건. 정상 상태에서 임의의 두 상태 간 흐름이 양방향으로 같음을 보장하며, 이를 만족하면 P(x)가 정상 분포임이 증명된다

정상 분포(stationary distribution) - 마르코프 체인이 충분히 오래 실행된 뒤 수렴하는 확률 분포. MCMC에서는 이것을 목표 분포 P(x)와 일치하도록 체인을 설계한다

제안 분포(proposal distribution) - MH 알고리즘에서 후보 상태를 생성하는 보조 분포 q(y|x). 목표 분포와 무관하게 자유롭게 선택 가능하며, 알고리즘의 효율을 좌우한다

번인(burn-in) - 마르코프 체인의 초기 구간. 체인이 목표 분포에 아직 수렴하지 않은 상태이므로 이 구간의 샘플은 버린다

유효 표본 크기(effective sample size) - 자기상관을 고려했을 때 독립 샘플에 상응하는 실질적 표본 수. 1000개 샘플의 ESS가 200이면, 독립 샘플 200개와 같은 정보량을 가진다는 뜻이다

대비 발산(contrastive divergence) - Hinton(2002)이 제안한 RBM 학습법. MCMC(깁스 샘플링)를 수렴까지 실행하지 않고 몇 스텝만 실행하여 그래디언트를 근사한다

랑주뱅 동역학(Langevin dynamics) - 확률적 미분방정식에 기반한 MCMC의 연속 시간 버전. 확산 모델과 SGLD의 수학적 기반이다

분배함수(partition function) - 통계역학에서 시스템의 모든 가능한 상태에 대한 볼츠만 인자의 합. 정규화 상수의 물리학적 대응물이다

---EN---
Markov Chain Monte Carlo - A computational technique for indirectly drawing samples from complex probability distributions by designing Markov chains that converge to the target distribution

## A Sampling Strategy Born from Statistical Physics

In 1953, at Los Alamos National Laboratory, Nicholas Metropolis, Arianna Rosenbluth, Marshall Rosenbluth, Augusta Teller, and Edward Teller faced the challenge of simulating neutron diffusion for nuclear weapon design. They needed to compute the energy distribution at thermal equilibrium for a system of hundreds of particles pushing and pulling against each other, but the astronomical number of possible configurations made direct computation impossible. So they adopted an entirely different strategy: instead of computing the distribution directly, **draw samples** from it and approximate it statistically.

The core idea can be illustrated with a spatial analogy. Drawing a complete map of a rugged mountain landscape is impossible, but if a person walks around long enough and records the elevation of every place visited, the rough contours of the terrain emerge. The catch is that walking randomly will not work. There must be **a special walking rule that visits low areas more frequently and high areas less frequently**. This walking rule is the Markov chain.

Their paper "Equation of State Calculations by Fast Computing Machines" (1953) became the common ancestor of two AI techniques. One is Simulated Annealing by Kirkpatrick et al. (1983), for optimization, and the other is MCMC itself, for sampling. The same accept-reject mechanism diverged toward two different purposes.

## From Statistics to AI: Solving the Intractable Sampling Problem

The core problem MCMC solves is this: we want to draw samples from a complex probability distribution P(x), but have no way to sample from P(x) directly. The typical situation is knowing the distribution's form but being unable to compute the **normalization constant** -- the value that divides everything so all probabilities sum to 1. When the number of possible states is infinite or astronomically large, this value is simply intractable.

This problem appears repeatedly in AI. The partition function of Boltzmann Machines, the posterior distribution in Bayesian inference, the data distribution in generative models -- all involve distributions whose normalization constants cannot be computed directly. MCMC provided a general-purpose solution to this shared obstacle. The key correspondences are:

- Energy distribution at thermal equilibrium --> **target probability distribution P(x)** (what we want to sample)
- Changes in molecular position --> **state transitions in solution space** (candidate generation)
- Transition probability governed by physical temperature --> **accept-reject mechanism** (ensuring detailed balance)
- Metropolis (1953) molecular simulation --> Hastings (1970) generalization --> AI **learning and inference**

## The Metropolis-Hastings Algorithm: Detailed Balance as a Design Principle

The heart of MCMC is designing the transition probability. We must construct a stochastic process -- a Markov chain -- where the next state depends only on the current state, and this chain converges to the target distribution P(x) after running long enough. The condition that makes this possible is **detailed balance**:

P(x) * T(x->y) = P(y) * T(y->x)

This means that at steady state, the flow from x to y equals the flow from y to x. In physics, this corresponds to microscopic reversibility at thermal equilibrium. When detailed balance is satisfied, P(x) is guaranteed to be the chain's stationary distribution.

The Metropolis-Hastings (MH) algorithm is Hastings' (1970) generalization of the original Metropolis et al. (1953) algorithm to allow asymmetric proposal distributions:

1. From the current state x, generate a candidate state y using the proposal distribution q(y|x)
2. Compute the acceptance probability: alpha = min(1, [P(y) * q(x|y)] / [P(x) * q(y|x)])
3. Generate a uniform random number U between 0 and 1
4. If U < alpha, move to y; otherwise, stay at x
5. Repeat

There is a decisive mathematical property here. Since only the **ratio P(y)/P(x)** appears in the acceptance probability, **normalization constants cancel between numerator and denominator**. If P(x) = f(x)/Z, then P(y)/P(x) = f(y)/f(x), and Z need never be known. This is the fundamental reason MCMC works even when the partition function is intractable.

When the proposal distribution q is symmetric (q(y|x) = q(x|y)), the acceptance probability simplifies to the original Metropolis form: alpha = min(1, P(y)/P(x)). This is exactly the form used in Simulated Annealing. SA adds a temperature parameter on top to perform optimization instead of sampling.

## The Tradeoff Between Exploration Efficiency and Convergence

MCMC's most fundamental practical challenge is the difficulty of knowing **"have we run long enough?"**

**Burn-in**: When the chain's initial state differs from the target distribution, early samples must be discarded until convergence. Spatially, imagine a hiker who starts at a mountain peak but wants to map the valley floor. The initial descent is just travel, not useful data. The problem is that there is no theoretical method to determine the appropriate burn-in length in advance.

**Mixing**: The chain's ability to adequately visit all regions of the target distribution. If the probability distribution has multiple peaks (multimodal) separated by valleys of very low probability, the chain gets trapped in one peak and cannot reach the others. It is like trying to travel between two valleys separated by a towering mountain range on foot alone.

**Autocorrelation**: Consecutive samples are correlated with each other. Since the chain moves one step at a time, adjacent samples have similar values. As a result, 100 consecutive samples do not carry the same information as 100 independent samples. The effective sample size ends up smaller than the actual sample count.

The Gelman-Rubin diagnostic (R-hat) runs multiple independent chains and compares between-chain variance to within-chain variance; R-hat close to 1 signals convergence. Effective sample size (ESS) and trace plots are also available, but all these diagnostics only check **necessary** conditions -- none **guarantee** convergence. When a chain is trapped in a single mode, it can look perfectly converged within that mode.

## Gibbs Sampling and Hamiltonian Monte Carlo: Two Extensions

**Gibbs Sampling**: Proposed by Geman and Geman (1984), the core idea is updating one variable at a time. When direct sampling from a multivariate distribution P(x_1, x_2, ..., x_n) is difficult, each variable is sequentially sampled from its conditional distribution with all others held fixed. It is a special case of MH where the acceptance probability is always 1, and is efficient when each conditional has a known form (e.g., Gaussian).

**Hamiltonian Monte Carlo (HMC)**: Standard MH algorithms explore via random walks and become inefficient in high dimensions. In a 100-dimensional space, random-walk acceptance rates drop below 0.01%, but HMC maintains acceptance rates above 80% by leveraging gradient information. Duane, Kennedy, Pendleton, and Roweth (1987) solved this by introducing **Hamiltonian mechanics** into sampling. Auxiliary momentum variables are added for each parameter position, and -log P(x) is interpreted as potential energy. As position and momentum evolve together according to Hamilton's equations, the particle efficiently travels along contours of high probability. The gradient of -log P(x) guides movement direction, enabling high acceptance rates and fast exploration even in high dimensions. Hoffman and Gelman's (2014) NUTS (No-U-Turn Sampler) automatically determines HMC trajectory length, greatly improving practicality. Adopted as the default sampler in Stan and PyMC, it has become the standard tool of modern Bayesian statistics.

## Connections to Modern AI

MCMC provided direct foundations for several core AI techniques. The nature of each connection requires careful distinction.

**Techniques that directly use MCMC mechanisms:**

- **Boltzmann Machines and Contrastive Divergence**: Hinton (2002) used MCMC in a "truncated" form for Restricted Boltzmann Machine (RBM) training. Instead of running to convergence, Gibbs sampling is executed for just 1 to a few steps to approximate the gradient. Sacrificing theoretical accuracy for practical speed, this was key to Deep Belief Network (DBN) pre-training. MCMC's strength of bypassing the normalization constant works here in exactly the same way.
- **Stochastic Gradient Langevin Dynamics (SGLD)**: Welling and Teh (2011) showed that adding appropriately scaled Gaussian noise to SGD turns it into Langevin dynamics -- the continuous-time version of MCMC -- effectively sampling from the posterior distribution. As the learning rate is annealed, optimization naturally transitions into sampling: the point where **the boundary between optimization and sampling blurs**.
- **Diffusion Models**: Ho et al.'s (2020) diffusion models gradually add Gaussian noise to data and then reverse the process. The reverse denoising process is mathematically deeply connected to Langevin dynamics and is trained through score matching. The statistical physics roots of MCMC extend in a direct lineage to the most powerful image generation models of the present day.

**Structural similarity -- solving the same problem differently:**

- **Variational Inference (VI)**: While MCMC pursues exact sampling from the posterior, VI converts the problem into an optimization task by approximating the posterior with a tractable distribution (e.g., Gaussian mixture). These are complementary solutions to the same "intractable distribution" problem. At modern deep learning scale, VI has become dominant due to computational considerations. The Variational Autoencoder (VAE, Kingma & Welling 2014) is a representative example.

## Limitations and Weaknesses

- **The wall of high dimensions**: Standard MH acceptance rates drop sharply as dimensions increase. HMC mitigates this but remains too computationally expensive for modern neural networks with millions of parameters. In practice, modern deep learning uses approximate methods like variational inference or MC-Dropout instead of MCMC.
- **Fundamental incompleteness of convergence diagnostics**: There is no way to definitively determine whether a chain has converged. Diagnostics like R-hat and ESS can signal "not yet converged" but cannot guarantee "converged." In multimodal distributions, a chain trapped in a single mode can appear perfectly converged within that mode.
- **Computational cost and autocorrelation**: Each step requires evaluating P(x) (HMC requires gradients too), and due to autocorrelation, chains must be run much longer to collect enough effectively independent samples. For large-scale datasets, even the per-step cost becomes prohibitive.
- **Constraints in discrete spaces**: HMC is gradient-based and works only in continuous spaces. Models with discrete variables (token selection in language models, graph structure search, etc.) are limited to Gibbs sampling or basic MH.

## Glossary

Markov chain - a stochastic process where the next state depends only on the current state, independent of past states; also called a "memoryless" process

Normalization constant - the value that divides a distribution so all probabilities sum to 1; intractable when the number of possible states is too large

Detailed balance - the condition P(x)*T(x->y) = P(y)*T(y->x); guarantees that flow between any two states is equal in both directions at steady state, proving P(x) is the stationary distribution

Stationary distribution - the probability distribution a Markov chain converges to after running long enough; in MCMC, the chain is designed so this matches the target distribution P(x)

Proposal distribution - the auxiliary distribution q(y|x) used to generate candidate states in MH; freely chosen independently of the target distribution, and governs algorithm efficiency

Burn-in - the initial period of a Markov chain before convergence to the target distribution; samples from this period are discarded

Effective sample size - the substantive number of independent-equivalent samples after accounting for autocorrelation; if 1000 samples have an ESS of 200, they carry the same information as 200 independent samples

Contrastive divergence - an RBM training method by Hinton (2002); approximates gradients by running MCMC (Gibbs sampling) for only a few steps instead of to convergence

Langevin dynamics - the continuous-time version of MCMC based on stochastic differential equations; the mathematical foundation of diffusion models and SGLD

Partition function - the sum of Boltzmann factors over all possible states of a system in statistical mechanics; the physics counterpart of the normalization constant
