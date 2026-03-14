---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 군집 지능, 개미 군집 최적화, 입자 군집 최적화, 창발, 자기조직화, 분산 시스템, 페로몬
keywords_en: swarm intelligence, ant colony optimization, particle swarm optimization, emergence, self-organization, distributed systems, pheromone
---
Swarm Intelligence - 단순한 개체들의 집단 행동에서 복잡한 지능이 창발하는 원리와 그 알고리즘적 번역

## 군집 지능의 생물학적 기원

개미 한 마리는 뇌 뉴런이 약 25만 개에 불과하고 시력도 극히 제한적이다. 그러나 수만 마리의 개미 군집은 최적 경로를 발견하고, 복잡한 구조물을 건설하며, 효율적으로 노동을 분배한다. 어떤 개체도 전체 계획을 알지 못하지만, 집단 수준에서 "지능적" 행동이 나타난다. 이것이 **창발(emergence)**이다. 부분의 합이 전체보다 작은 것이 아니라, 부분들의 상호작용에서 전혀 새로운 수준의 조직이 나타나는 현상이다.

이 현상은 다양한 생물에서 관찰된다. 꿀벌의 집단 의사결정(nest site selection, Seeley 2010), 물고기 떼의 포식자 회피(schooling), 찌르레기 떼의 장관인 군무(murmuration), 점균류의 네트워크 형성(Nakagaki et al., 2000이 도쿄 철도망과 유사한 네트워크를 점균류가 형성함을 보여줌). 이들에게 공통적인 원리는 세 가지다.

1. **단순한 국소 규칙**: 각 개체는 이웃과의 간단한 상호작용 규칙만 따른다
2. **간접 통신(stigmergy)**: 환경을 매개로 정보를 교환한다 (개미의 페로몬이 대표적)
3. **양성 피드백과 음성 피드백의 균형**: 좋은 경로가 강화되면서도 과도한 집중이 제한된다

Gian-Carlo Beni와 Jing Wang(1989)이 "swarm intelligence"라는 용어를 처음 사용했고, Eric Bonabeau, Marco Dorigo, Guy Theraulaz(1999)가 이 분야를 학문적으로 체계화했다.

## 개미 군집 최적화(ACO): 페로몬에서 확률 경로 선택으로

Marco Dorigo(1992)는 박사 논문에서 개미 군집 최적화(Ant Colony Optimization, ACO)를 제안했다. 직접적 영감은 실제 개미의 먹이 탐색 행동이다.

실제 개미는 무작위로 이동하다가 먹이를 발견하면 둥지로 돌아오며 **페로몬(pheromone)**을 분비한다. 다른 개미들은 페로몬이 짙은 경로를 따라갈 확률이 높다. 짧은 경로를 이용한 개미가 더 빨리 왕복하므로 해당 경로에 페로몬이 더 빨리 축적된다. 이 양성 피드백으로 최적 경로가 자연스럽게 선택된다. 동시에 페로몬은 시간이 지나면 증발하므로, 비효율적 경로는 자연스럽게 잊혀진다. 이 증발이 음성 피드백이다.

알고리즘에서 각 인공 개미는 다음 노드 j로 이동할 확률을 다음과 같이 계산한다.

P(i->j) = [tau_ij^alpha * eta_ij^beta] / sum_k [tau_ik^alpha * eta_ik^beta]

tau_ij는 경로 (i,j)의 페로몬 농도, eta_ij는 휴리스틱 정보(예: 거리의 역수 1/d_ij), alpha와 beta는 페로몬과 휴리스틱의 상대적 중요도를 조절하는 파라미터다. alpha가 높으면 이전 경험(페로몬)에 의존하고, beta가 높으면 문제의 구조적 정보를 더 활용한다.

페로몬 업데이트는 두 단계로 이루어진다.

tau_ij = (1 - rho) * tau_ij + delta_tau_ij

rho(0 < rho < 1)는 증발률로, 오래된 정보를 잊게 해준다. delta_tau_ij는 해당 경로를 사용한 개미들이 남기는 페로몬 양으로, 더 좋은 해를 찾은 개미가 더 많은 페로몬을 남긴다 (보통 delta_tau_ij = Q / L_k, 여기서 L_k는 개미 k의 경로 길이, Q는 상수).

ACO는 외판원 문제(TSP) 같은 조합 최적화에서 경쟁력 있는 성능을 보였고, 통신 네트워크 라우팅, 차량 경로 계획 등에 실용적으로 적용되었다.

## 입자 군집 최적화(PSO): 새 떼의 군무에서 연속 최적화로

James Kennedy와 Russell Eberhart(1995)는 새 떼와 물고기 떼의 집단 이동에서 영감을 받아 입자 군집 최적화(Particle Swarm Optimization, PSO)를 제안했다. Craig Reynolds(1987)가 컴퓨터 그래픽을 위해 만든 Boids 시뮬레이션(분리, 정렬, 응집의 세 규칙으로 새 떼 행동을 재현)이 중간 영감이 되었다.

PSO에서 각 "입자"는 해 공간의 한 위치(후보 해)와 속도(이동 방향과 크기)를 가진다. 각 입자는 두 가지 기억을 유지한다. 자신이 지금까지 찾은 최선의 위치(p_best_i)와 전체 군집이 찾은 최선의 위치(g_best)다.

v_i(t+1) = w * v_i(t) + c1 * r1 * (p_best_i - x_i(t)) + c2 * r2 * (g_best - x_i(t))
x_i(t+1) = x_i(t) + v_i(t+1)

세 항의 의미는 명확하다. w * v_i(t)는 **관성(inertia)** -- 현재 이동 방향을 유지하려는 경향이다. c1 * r1 * (p_best_i - x_i(t))는 **개인 경험(cognitive)** -- 자신의 과거 최선을 향해 끌리는 힘이다. c2 * r2 * (g_best - x_i(t))는 **사회적 영향(social)** -- 집단의 최선을 향해 끌리는 힘이다. r1, r2는 [0,1] 균일 난수로 확률적 다양성을 부여한다.

w(관성 가중치)는 SA의 온도처럼 탐색-활용 균형을 조절한다. 높은 w는 넓은 탐색을, 낮은 w는 세밀한 활용을 유도한다. c1과 c2의 비율은 개인 경험과 집단 지혜의 상대적 비중을 결정한다.

## 현대적 확장과 AI 연결

군집 지능의 원리는 단순한 최적화 알고리즘을 넘어 현대 AI의 여러 영역에 구조적으로 반영된다.

- **다중 에이전트 강화학습(MARL)**: 여러 에이전트가 국소 관찰만으로 협력하여 전역 과제를 수행하는 구조는 군집 지능과 직접적으로 닮아 있다. 각 에이전트는 국소 규칙(정책)만 가지고, 집단 행동이 창발한다.
- **연합 학습(Federated Learning, McMahan et al., 2017)**: 개별 디바이스에서 국소적으로 학습하고 모델 업데이트만 공유하는 구조는 간접 통신(stigmergy)의 디지털 변형이다. 각 디바이스는 "개미"처럼 국소 정보만 가지지만, 집계된 모델은 전체 데이터를 본 것처럼 동작한다.
- **분산 로봇 시스템**: 군집 로봇공학(swarm robotics)은 수십에서 수천 대의 소형 로봇이 중앙 제어 없이 협력하여 탐색, 운반, 구조 구축 등을 수행한다. 여기서 생물학적 군집 지능의 원리가 가장 직접적으로 적용된다.

## 한계와 약점

군집 지능 알고리즘에는 근본적 한계가 존재한다.

- **수렴 보장 부재**: ACO도 PSO도 전역 최적해 도달을 이론적으로 보장하지 않는다. 경험적으로 좋은 해를 찾을 뿐이며, "얼마나 좋은 해를 찾았는지"를 판단할 기준도 부족하다.
- **고차원 문제의 한계**: PSO는 차원이 수백을 넘어가면 성능이 급감한다. 입자들이 고차원 공간에서 유의미한 방향으로 이동하기 어렵기 때문이다. 이는 현대 딥러닝의 수억 파라미터 공간에서 군집 알고리즘이 경사하강법을 대체할 수 없는 이유다.
- **파라미터 민감성**: w, c1, c2(PSO), alpha, beta, rho(ACO) 등 메타파라미터의 설정이 성능에 큰 영향을 미치며, 문제마다 튜닝이 필요하다.
- **경사 정보 미활용**: 목적 함수의 미분 정보를 사용할 수 있는 문제에서는 경사 기반 방법이 거의 항상 더 효율적이다. 군집 알고리즘의 진가는 미분 불가능하거나 다봉(multimodal)인 목적 함수에서 발휘된다.
- **생물학적 유추의 한계**: 실제 개미 군집은 종별로 수백 종의 페로몬을 사용하며, 개체 간 직접 접촉 통신, 진동 신호 등 다양한 채널을 가진다. ACO의 단일 페로몬 모델은 이 복잡성을 극도로 단순화한 것이다.

## 용어 정리

창발(emergence) - 개별 요소의 단순한 상호작용에서 전체 수준의 복잡한 패턴이나 행동이 나타나는 현상

페로몬(pheromone) - 동물이 분비하여 같은 종의 다른 개체에게 정보를 전달하는 화학 물질. 개미의 경로 표시가 대표적

흔적 자극(stigmergy) - 환경을 매개로 한 간접적 의사소통. 개미가 페로몬으로 환경에 정보를 남기고 다른 개미가 이를 읽는 방식

개미 군집 최적화(ant colony optimization, ACO) - Dorigo(1992)가 제안한, 개미의 먹이 탐색 행동에서 영감받은 조합 최적화 알고리즘

입자 군집 최적화(particle swarm optimization, PSO) - Kennedy & Eberhart(1995)가 제안한, 새 떼의 집단 이동에서 영감받은 연속 최적화 알고리즘

관성 가중치(inertia weight) - PSO에서 입자의 현재 속도를 유지하려는 경향을 조절하는 파라미터. 탐색-활용 균형에 영향

양성 피드백(positive feedback) - 시스템의 출력이 입력을 같은 방향으로 증폭하는 순환. 좋은 경로에 페로몬이 축적되는 것이 예시

다중 에이전트 강화학습(multi-agent reinforcement learning, MARL) - 여러 에이전트가 공유 환경에서 각자의 정책을 학습하며 협력하거나 경쟁하는 RL 확장

연합 학습(federated learning) - 분산 디바이스에서 국소 학습 후 모델 업데이트만 중앙 서버에 집계하는 학습 패러다임. McMahan et al.(2017)

---EN---
Swarm Intelligence - The principle by which complex intelligence emerges from the collective behavior of simple individuals, and its algorithmic translation

## Biological Origins of Swarm Intelligence

A single ant has only about 250,000 brain neurons and extremely limited vision. Yet a colony of tens of thousands discovers optimal paths, constructs complex structures, and efficiently distributes labor. No individual knows the overall plan, yet "intelligent" behavior appears at the collective level. This is **emergence** -- not that the whole is greater than the sum of its parts, but that entirely new levels of organization arise from the interactions of those parts.

This phenomenon is observed across diverse organisms: honeybee collective decision-making (nest site selection, Seeley 2010), fish schooling for predator evasion, the spectacular murmuration of starlings, and slime mold network formation (Nakagaki et al., 2000 showed slime mold forming networks similar to Tokyo's rail system). Three common principles unite them:

1. **Simple local rules**: Each individual follows only simple interaction rules with neighbors
2. **Indirect communication (stigmergy)**: Information is exchanged through the environment (ant pheromones being the classic example)
3. **Balance of positive and negative feedback**: Good paths are reinforced while excessive concentration is limited

Gian-Carlo Beni and Jing Wang (1989) first coined "swarm intelligence," and Eric Bonabeau, Marco Dorigo, and Guy Theraulaz (1999) established the field academically.

## Ant Colony Optimization (ACO): From Pheromones to Probabilistic Path Selection

Marco Dorigo (1992) proposed Ant Colony Optimization (ACO) in his doctoral thesis. The direct inspiration was real ants' foraging behavior.

Real ants move randomly until finding food, then return to the nest while secreting **pheromone**. Other ants are more likely to follow paths with stronger pheromone. Ants using shorter paths complete round trips faster, so pheromone accumulates faster on those paths. This positive feedback naturally selects optimal routes. Simultaneously, pheromone evaporates over time, so inefficient paths are naturally forgotten. This evaporation provides negative feedback.

In the algorithm, each artificial ant calculates the probability of moving to node j as:

P(i->j) = [tau_ij^alpha * eta_ij^beta] / sum_k [tau_ik^alpha * eta_ik^beta]

tau_ij is the pheromone concentration on path (i,j), eta_ij is heuristic information (e.g., inverse distance 1/d_ij), and alpha and beta control the relative importance of pheromone and heuristic. High alpha means reliance on past experience (pheromone); high beta means greater use of structural problem information.

Pheromone update occurs in two steps:

tau_ij = (1 - rho) * tau_ij + delta_tau_ij

rho (0 < rho < 1) is the evaporation rate, enabling forgetting of outdated information. delta_tau_ij is the pheromone deposited by ants that used the path, with ants finding better solutions depositing more (typically delta_tau_ij = Q / L_k, where L_k is ant k's path length and Q is a constant).

ACO demonstrated competitive performance on combinatorial optimization problems like the Traveling Salesman Problem (TSP) and has been practically applied to telecommunications routing and vehicle routing.

## Particle Swarm Optimization (PSO): From Bird Flocking to Continuous Optimization

James Kennedy and Russell Eberhart (1995) proposed Particle Swarm Optimization (PSO), inspired by the collective movement of bird flocks and fish schools. Craig Reynolds' (1987) Boids simulation -- reproducing flock behavior with three rules (separation, alignment, cohesion) for computer graphics -- served as an intermediate inspiration.

In PSO, each "particle" has a position (candidate solution) and velocity (movement direction and magnitude) in the solution space. Each particle maintains two memories: its personal best position found so far (p_best_i) and the swarm's global best (g_best).

v_i(t+1) = w * v_i(t) + c1 * r1 * (p_best_i - x_i(t)) + c2 * r2 * (g_best - x_i(t))
x_i(t+1) = x_i(t) + v_i(t+1)

The three terms have clear meanings. w * v_i(t) is **inertia** -- the tendency to maintain current movement direction. c1 * r1 * (p_best_i - x_i(t)) is **cognitive** -- attraction toward one's own historical best. c2 * r2 * (g_best - x_i(t)) is **social** -- attraction toward the swarm's best. r1 and r2 are uniform random numbers in [0,1] providing stochastic diversity.

The inertia weight w controls exploration-exploitation balance like temperature in SA. High w encourages broad exploration; low w encourages fine exploitation. The ratio of c1 to c2 determines the relative weight of individual experience versus collective wisdom.

## Modern Extensions and AI Connections

Swarm intelligence principles extend beyond simple optimization algorithms, structurally reflected in several areas of modern AI:

- **Multi-Agent Reinforcement Learning (MARL)**: The structure where multiple agents cooperate on global tasks using only local observations directly resembles swarm intelligence. Each agent has only a local rule (policy), and collective behavior emerges.
- **Federated Learning (McMahan et al., 2017)**: The architecture of local learning on individual devices with only model updates shared is a digital variant of stigmergy. Each device, like an "ant," has only local information, but the aggregated model behaves as if it has seen all data.
- **Distributed robotics**: Swarm robotics uses tens to thousands of small robots cooperating without central control for exploration, transport, and structure building. Here, biological swarm intelligence principles are applied most directly.

## Limitations and Weaknesses

Swarm intelligence algorithms have fundamental limitations.

- **No convergence guarantee**: Neither ACO nor PSO theoretically guarantees reaching the global optimum. They find empirically good solutions, and there are insufficient criteria for judging "how good" a found solution is.
- **High-dimensional weakness**: PSO performance drops sharply beyond hundreds of dimensions. Particles struggle to move in meaningful directions in high-dimensional spaces. This is why swarm algorithms cannot replace gradient descent in modern deep learning's hundreds-of-millions parameter spaces.
- **Parameter sensitivity**: Meta-parameters (w, c1, c2 for PSO; alpha, beta, rho for ACO) significantly affect performance and require per-problem tuning.
- **No gradient exploitation**: When the objective function is differentiable, gradient-based methods are nearly always more efficient. Swarm algorithms' true value lies in non-differentiable or multimodal objective functions.
- **Limits of biological analogy**: Real ant colonies use hundreds of species-specific pheromones and have multiple communication channels including direct contact and vibration signals. ACO's single-pheromone model is an extreme simplification of this complexity.

## Glossary

Emergence - the phenomenon where complex patterns or behaviors at the collective level arise from simple interactions of individual elements

Pheromone - a chemical substance secreted by animals to convey information to other individuals of the same species; ant trail marking is the classic example

Stigmergy - indirect communication mediated by the environment; ants leave information via pheromone in the environment for other ants to read

Ant colony optimization (ACO) - a combinatorial optimization algorithm inspired by ant foraging behavior, proposed by Dorigo (1992)

Particle swarm optimization (PSO) - a continuous optimization algorithm inspired by collective movement of bird flocks, proposed by Kennedy & Eberhart (1995)

Inertia weight - a parameter in PSO controlling the tendency to maintain current velocity; affects exploration-exploitation balance

Positive feedback - a cycle where system output amplifies input in the same direction; pheromone accumulation on good paths is an example

Multi-agent reinforcement learning (MARL) - an RL extension where multiple agents learn individual policies while cooperating or competing in a shared environment

Federated learning - a learning paradigm where distributed devices learn locally and only aggregate model updates at a central server. McMahan et al. (2017)
