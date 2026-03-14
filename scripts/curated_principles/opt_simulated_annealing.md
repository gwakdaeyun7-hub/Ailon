---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 담금질 기법, 메타휴리스틱, 전역 최적화, 냉각 스케줄, 볼츠만 분포, Metropolis 알고리즘, 탐색과 활용
keywords_en: simulated annealing, metaheuristic, global optimization, cooling schedule, Boltzmann distribution, Metropolis algorithm, exploration vs exploitation
---
Simulated Annealing - 금속 공학의 열처리 과정에서 직접 영감을 받은 확률적 전역 최적화 기법

## 담금질(Annealing)의 물리적 원리

금속을 높은 온도로 가열하면 내부 원자들이 격자 위치를 벗어나 활발히 재배열된다. 이 상태에서 **서서히 냉각**하면 원자들은 점진적으로 에너지를 잃으며 가장 안정적인 결정 구조에 안착한다. 반대로 급랭하면 원자가 불안정한 위치에 그대로 고정되어 내부 응력이 남는다. 천천히 식힐수록 **전체 시스템의 에너지가 최소인 상태**에 도달한다.

핵심은 이것이다. 높은 온도에서 원자들은 에너지 장벽을 넘어 다양한 배치를 시도할 수 있고, 온도가 내려가면서 점차 가장 낮은 에너지 배치로 수렴한다. "장벽을 넘는 자유"가 나중에 알고리즘의 핵심 메커니즘이 된다.

## 물리학에서 알고리즘으로

이 원리를 계산에 처음 쓴 건 Metropolis et al.(1953)의 분자 시뮬레이션이었다. 원래 목적은 최적화가 아니라 열평형 상태의 분자 배치를 샘플링하는 것이었지만, 여기서 쓰인 수용-거부 메커니즘이 30년 후 최적화의 열쇠가 된다. Kirkpatrick, Gelatt, Vecchi(1983)가 이를 조합 최적화에 직접 도입하면서 Simulated Annealing이 탄생했다. 같은 시기 Cerny(1985)도 독립적으로 동일한 아이디어에 도달했다. 핵심 대응 관계는 다음과 같다.

- 물리적 온도 T --> **탐색의 유연성** (높으면 넓게, 낮으면 좁게)
- 원자의 에너지 --> **목적 함수 값** (최소화 대상)
- 원자의 열적 이동 --> **이웃 해로의 랜덤 이동** (후보 해 생성)
- 냉각 스케줄 --> **수렴 전략** (T를 얼마나 빠르게 줄이는가)
- 열평형 도달 --> **각 온도에서 충분한 반복** (에르고딕 탐색)

## Metropolis 알고리즘: 한 스텝의 흐름

SA의 각 반복은 Metropolis 알고리즘의 한 스텝과 동일하다.

1. 현재 해 x에서 이웃 해 x'를 랜덤으로 생성한다
2. 에너지 차이를 계산한다: dE = E(x') - E(x)
3. dE <= 0이면 (더 좋은 해) 무조건 수용한다
4. dE > 0이면 (더 나쁜 해) 확률 P = e^(-dE/T)로 확률적 수용한다
5. 균일 난수 U를 생성하여 U < P이면 수용, 아니면 현재 해를 유지한다
6. 온도 T를 냉각 스케줄에 따라 낮추고 반복한다

4단계가 SA를 탐욕 알고리즘과 구분하는 결정적 차이다. 나쁜 해를 받아들일 확률이 있기 때문에 지역 최적해의 "골짜기"를 빠져나올 수 있다.

## 탐색과 활용의 균형

SA는 **탐색(exploration)과 활용(exploitation)의 균형** 문제를 온도라는 하나의 파라미터로 우아하게 해결한다.

- **높은 온도**: 거의 모든 이동을 수용하므로 해 공간을 넓게 **탐색**한다. T가 매우 크면 P = e^(-dE/T)가 1에 가까워져 무작위 탐색과 비슷해진다.
- **낮은 온도**: 나쁜 이동의 수용 확률이 급격히 떨어져, 현재 좋은 영역을 집중적으로 **활용**한다. T가 0에 가까우면 탐욕 알고리즘과 동일해진다.
- **냉각 과정 전체**: 초반의 넓은 탐색에서 후반의 깊은 활용으로 자연스럽게 전환된다.

이 "처음엔 넓게, 나중엔 깊게" 패턴은 AI 전반에서 반복적으로 나타나는 근본 원리다.

## 수용 확률의 핵심 수식

dE = E(new) - E(old)

dE <= 0이면 새로운 해가 더 좋으므로 **무조건 수용**한다.
dE > 0이면 새로운 해가 더 나쁘지만, 다음 조건으로 확률적 수용이 가능하다.

P(accept) = e^(-dE/T)

이 확률이 균일 난수 U보다 크면 수용한다. T가 높을수록, dE가 작을수록 수용 확률이 올라간다.

이 수식은 통계역학의 **볼츠만 분포**에서 직접 유래한 것으로, 핵심 수학적 형태가 높은 충실도로 알고리즘에 보존된 사례다. 물리학에서의 kT(볼츠만 상수 x 온도)를 SA에서는 단일 제어 파라미터 T로 통합했다. Metropolis(1953)가 분자 시뮬레이션을 위해 만든 이 수용 규칙이, 원래 맥락을 벗어나 범용 최적화 도구가 된 것이다.

## 냉각 스케줄과 수렴

가장 널리 쓰이는 기하 냉각 스케줄에서 alpha의 역할은 다음과 같다.

T(t+1) = alpha * T(t)

alpha는 보통 0.95~0.99로 설정한다. alpha가 1에 가까울수록 천천히 식어서 탐색이 충분하고, 0에 가까울수록 빨리 식어 지역 최적에 갇힐 위험이 커진다.

수렴 보장의 이론적 핵심은 **에르고딕성**(ergodicity)이다. 충분히 높은 온도에서 시작하고, 충분히 느리게 냉각하면, 알고리즘이 해 공간의 모든 상태를 방문할 확률이 0이 아니게 된다. 이 조건이 만족되면 전역 최적해를 찾을 수 있다는 것이 보장된다.

Geman & Geman(1984)은 대수적 냉각 T(t) = c/ln(1+t)일 때 전역 수렴을 엄밀히 증명했다. 하지만 이 스케줄은 실용적으로 너무 느리다. 예를 들어 1000번째 반복에서도 T = c/6.9로, 온도가 매우 천천히 내려간다. 기하 냉각은 같은 반복에서 T = 0.95^1000 * T_0으로 사실상 0에 수렴한다. 그래서 실무에서는 이론적 보장을 일부 포기하고 기하 냉각을 표준으로 사용한다. 이론과 실무 사이의 이 간극은 SA 연구의 중요한 주제다.

## 현대 AI 기법과의 연결

SA의 핵심 아이디어인 "초반 탐색, 후반 활용"은 현대 AI 곳곳에 변형되어 살아 있다.

- **강화학습의 epsilon-greedy**: 학습 초기에 epsilon(무작위 행동 확률)을 높게 시작해서 점차 줄이는 전략은 SA의 냉각 스케줄과 유사한 전략이다. 온도 대신 epsilon이 탐색-활용 균형을 조절한다.
- **학습률 스케줄링**: 신경망 학습에서 학습률을 초기에 크게 잡고 점차 줄이는 것(cosine annealing, warmup-decay 등)은 이름에서부터 annealing을 차용했다. 큰 학습률은 높은 온도에, 작은 학습률은 낮은 온도에 대응하는 같은 직관을 공유한다.
- **소프트맥스 온도**: LLM의 텍스트 생성에서 temperature 파라미터가 높으면 다양한 토큰을, 낮으면 확률 높은 토큰을 선택하는 것은 같은 수학적 원리에 기반한 유사한 역할이다.
- **Boltzmann Machine**: Ackley, Hinton & Sejnowski(1985)는 같은 물리적 원리를 신경망 학습에 적용했다. 네트워크의 가중치를 "에너지"로 해석하고, 볼츠만 분포에 따라 확률적으로 뉴런을 활성화하는 이 구조는 SA와 지적 뿌리를 공유한다.

## 한계와 약점

SA는 강력하지만 만능이 아니다.

- **냉각 스케줄 민감성**: 초기 온도, alpha, 각 온도에서의 반복 횟수를 문제마다 조정해야 한다. 잘못 설정하면 너무 느리거나 지역 최적에 빠진다.
- **고차원 문제에 약함**: 변수가 수천~수만 개인 현대 딥러닝 파라미터 최적화에는 적합하지 않다. 이웃 해 생성이 한 번에 소수의 변수만 바꾸기 때문에 고차원 공간을 효율적으로 탐색하기 어렵다.
- **그래디언트 정보 미활용**: 목적 함수의 기울기를 사용하지 않으므로, 기울기를 계산할 수 있는 문제에서는 경사하강법 기반 방법보다 느리다. SA의 진가는 목적 함수가 미분 불가능하거나 불연속인 조합 최적화에서 발휘된다.
- **수렴 속도**: 이론적 전역 수렴은 무한한 시간을 전제한다. 실무에서는 "충분히 좋은" 해를 합리적 시간 안에 찾는 것이 목표이며, 최적해를 보장하지 않는다.

## 용어 정리

격자(lattice) - 금속 내 원자들이 규칙적으로 배열된 3차원 구조

결정 구조(crystal structure) - 원자가 반복적 패턴으로 정렬된 고체 상태의 배열

급랭(quenching) - 고온의 금속을 물이나 기름에 담가 급속히 냉각하는 열처리 방법

내부 응력(residual stress) - 급냉 등으로 인해 재료 내부에 불균일하게 남아있는 잔류 응력

지역 최적해(local optimum) - 주변 해보다는 좋지만 전체에서 최선은 아닌 해

볼츠만 분포(Boltzmann distribution) - 온도 T의 시스템이 에너지 E 상태에 있을 확률 분포. 물리학에서 P(E) ~ e^(-E/kT), SA에서는 kT를 단일 파라미터 T로 통합

메타휴리스틱(metaheuristic) - 특정 문제에 국한되지 않는 범용 최적화 전략

에르고딕성(ergodicity) - 충분한 시간이 주어지면 시스템이 가능한 모든 상태를 방문할 수 있는 성질

탐색과 활용(exploration vs exploitation) - 새로운 영역을 넓게 살펴보는 것(탐색)과 이미 좋은 영역을 깊이 파는 것(활용) 사이의 균형
---EN---
Simulated Annealing - A probabilistic global optimization technique directly inspired by the heat treatment process in metallurgy

## The Physics of Annealing

When metal is heated to high temperatures, atoms break free from their lattice positions and rearrange actively. As the metal **cools slowly**, atoms gradually lose energy and settle into the most stable crystal structure. Rapid cooling (quenching) instead traps atoms in unstable positions, leaving residual stress. The slower the cooling, the closer the system reaches its **global energy minimum**.

The key insight is this: at high temperatures, atoms can cross energy barriers to try various arrangements, and as temperature drops, they gradually converge to the lowest energy configuration. This "freedom to cross barriers" later becomes the core mechanism of the algorithm.

## From Physics to Algorithm

The principle was first used computationally in Metropolis et al.'s (1953) molecular simulation. The original purpose was not optimization but sampling molecular configurations at thermal equilibrium -- yet the accept-reject mechanism used there became the key to optimization three decades later. Kirkpatrick, Gelatt, and Vecchi (1983) directly transplanted it into combinatorial optimization, giving birth to Simulated Annealing. Around the same time, Cerny (1985) independently arrived at the same idea. The key correspondences are:

- Physical temperature T --> **search flexibility** (high = explore widely, low = exploit locally)
- Atomic energy --> **objective function value** (the quantity to minimize)
- Thermal atomic movement --> **random neighbor moves** (candidate solution generation)
- Cooling schedule --> **convergence strategy** (how fast T decreases)
- Reaching thermal equilibrium --> **sufficient iterations at each temperature** (ergodic exploration)

## The Metropolis Algorithm: One Step at a Time

Each iteration of SA follows exactly one step of the Metropolis algorithm:

1. From the current solution x, randomly generate a neighbor x'
2. Compute the energy difference: dE = E(x') - E(x)
3. If dE <= 0 (better solution), always accept
4. If dE > 0 (worse solution), accept with probability P = e^(-dE/T)
5. Generate a uniform random number U; accept if U < P, otherwise keep the current solution
6. Lower T according to the cooling schedule and repeat

Step 4 is what decisively separates SA from greedy algorithms. The probability of accepting worse solutions allows the algorithm to escape the "valleys" of local optima.

## Balancing Exploration and Exploitation

SA elegantly solves the **exploration vs. exploitation** tradeoff through a single parameter: temperature.

- **High temperature**: Nearly all moves are accepted, so the algorithm **explores** the solution space broadly. When T is very large, P = e^(-dE/T) approaches 1, resembling random search.
- **Low temperature**: Acceptance probability for worse moves drops sharply, so the algorithm **exploits** the current promising region. As T approaches 0, it becomes identical to a greedy algorithm.
- **The cooling process overall**: A natural transition from broad exploration early on to deep exploitation later.

This "explore broadly first, exploit deeply later" pattern is a fundamental principle that recurs throughout AI.

## The Core Acceptance Formula

dE = E(new) - E(old)

When dE <= 0, the new solution is better, so it is **always accepted**.
When dE > 0, the new solution is worse, but probabilistic acceptance is possible:

P(accept) = e^(-dE/T)

If this probability exceeds a uniform random number U, the move is accepted. Higher T and smaller dE both increase acceptance probability.

This formula derives directly from the **Boltzmann distribution** in statistical mechanics -- a rare case where the core mathematical form of a physical principle was preserved with high fidelity in an algorithm. In physics, the distribution uses kT (Boltzmann constant times temperature); SA absorbs kT into a single control parameter T. The acceptance rule Metropolis (1953) created for molecular simulation transcended its original context to become a general-purpose optimization tool.

## Cooling Schedule and Convergence

In the most widely used geometric cooling schedule, alpha works as follows:

T(t+1) = alpha * T(t)

Alpha is typically set between 0.95 and 0.99. Closer to 1 means slower cooling with more thorough exploration; closer to 0 means faster cooling with higher risk of getting trapped in local optima.

The theoretical key to convergence guarantees is **ergodicity**. Starting at a sufficiently high temperature and cooling sufficiently slowly ensures that the algorithm has a nonzero probability of visiting every state in the solution space. When this condition is met, reaching the global optimum is guaranteed.

Geman & Geman (1984) rigorously proved global convergence under logarithmic cooling T(t) = c/ln(1+t). But this schedule is impractically slow -- for example, at the 1000th iteration, T = c/6.9, meaning temperature decreases extremely slowly. Geometric cooling at the same iteration yields T = 0.95^1000 * T_0, which effectively converges to 0. In practice, we sacrifice part of the theoretical guarantee and use geometric cooling as the standard. This gap between theory and practice remains an important topic in SA research.

## Connections to Modern AI

SA's core idea of "explore early, exploit late" lives on in transformed forms throughout modern AI:

- **Epsilon-greedy in reinforcement learning**: Starting with a high epsilon (random action probability) and gradually reducing it follows a similar strategy to SA's cooling schedule. Instead of temperature, epsilon controls the exploration-exploitation balance.
- **Learning rate scheduling**: Starting with a large learning rate and gradually reducing it in neural network training (cosine annealing, warmup-decay, etc.) borrows even its name from annealing. A large learning rate and high temperature share the same intuition of broad exploration.
- **Softmax temperature**: In LLM text generation, a high temperature parameter selects diverse tokens while a low one favors high-probability tokens -- a similar role grounded in the same mathematical principle as SA's temperature.
- **Boltzmann Machine**: Ackley, Hinton & Sejnowski (1985) applied the same physical principle to neural network learning. Interpreting network weights as "energy" and stochastically activating neurons according to the Boltzmann distribution, this architecture shares intellectual roots with SA.

## Limitations and Weaknesses

SA is powerful but not a panacea.

- **Cooling schedule sensitivity**: Initial temperature, alpha, and iterations per temperature must be tuned per problem. Poor settings lead to either excessive slowness or entrapment in local optima.
- **Weakness in high dimensions**: SA is poorly suited for modern deep learning parameter optimization with thousands to millions of variables. Since neighbor generation typically changes only a few variables at a time, efficiently exploring high-dimensional spaces is difficult.
- **No gradient information**: SA does not use the objective function's gradient, making it slower than gradient-based methods for differentiable problems. SA's true strength lies in combinatorial optimization where the objective is non-differentiable or discontinuous.
- **Convergence speed**: Theoretical global convergence assumes infinite time. In practice, the goal is finding a "good enough" solution within reasonable time, with no guarantee of optimality.

## Glossary

Lattice - the regular three-dimensional arrangement of atoms within a metal

Crystal structure - the ordered, repeating pattern in which atoms are arranged in a solid

Quenching - a heat treatment method that rapidly cools hot metal by immersing it in water or oil

Residual stress - non-uniform internal stress remaining in a material due to rapid cooling

Local optimum - a solution better than its neighbors but not the best overall

Boltzmann distribution - a probability distribution describing the likelihood of a system at temperature T being in energy state E. In physics P(E) ~ e^(-E/kT); SA absorbs kT into a single parameter T

Metaheuristic - a general-purpose optimization strategy not limited to a specific problem

Ergodicity - the property that a system can visit all possible states given sufficient time

Exploration vs. exploitation - the balance between broadly surveying new regions and deeply examining a known promising region
