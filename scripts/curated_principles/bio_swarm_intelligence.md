---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 군집 지능, 개미 군집 최적화, 입자 군집 최적화, 창발, 자기조직화, 페로몬, 흔적 자극, 양성 피드백
keywords_en: swarm intelligence, ant colony optimization, particle swarm optimization, emergence, self-organization, pheromone, stigmergy, positive feedback
---
Swarm Intelligence - 단순한 개체들의 국소 상호작용에서 집단 수준의 지능적 행동이 창발하는 생물학적 원리와 그 최적화 알고리즘으로의 번역

## 군집 지능의 생물학적 핵심 원리

개미 한 마리의 뇌 뉴런은 약 25만 개에 불과하다. 시력은 수 센티미터 밖에 되지 않고, 기억력도 극히 제한적이다. 그러나 수만 마리의 개미 군집은 둥지에서 먹이까지의 최단 경로를 발견하고, 홍수에 대비해 살아있는 다리를 만들며, 죽은 동료를 특정 장소에 모아 위생을 유지한다. 어떤 개미도 "전체 계획"을 가지고 있지 않다. 이 현상을 **창발(emergence)**이라 부른다. 전체가 부분의 합보다 크다는 것이 아니라, 부분들의 상호작용 방식 자체에서 전혀 새로운 수준의 질서가 솟아오른다는 의미다.

이를 공간적으로 상상하면 이렇다. 수천 명이 참여하는 멕시코 웨이브를 떠올려보자. 각 관중은 "옆 사람이 일어나면 나도 일어난다"는 단 하나의 규칙만 따른다. 아무도 파도의 전체 모양을 설계하지 않았지만, 경기장을 한 바퀴 도는 깔끔한 파도가 나타난다. 군집 지능도 정확히 이 구조다. 국소 규칙이 전역 패턴을 만든다.

군집 지능이 작동하는 세 가지 조건이 있다.

1. **단순한 국소 규칙**: 각 개체는 주변 이웃과의 간단한 상호작용 규칙만 따른다. 전체를 내려다보는 조율자가 없다.
2. **간접 통신(stigmergy)**: 개체들이 직접 대화하는 것이 아니라, 환경에 흔적을 남기고 다른 개체가 그 흔적을 읽는다. 개미의 페로몬(pheromone) -- 길 위에 남기는 화학 물질 -- 이 전형적 예시다.
3. **양성 피드백과 음성 피드백의 균형**: 좋은 경로에 페로몬이 축적되어 더 많은 개미를 끌어들이는 것이 양성 피드백이다. 동시에 페로몬이 시간에 따라 증발하는 것이 음성 피드백이다. 이 균형이 없으면 시스템은 하나의 경로에 갇히거나 혼란 속에 머문다.

개미만이 아니다. 꿀벌의 waggle dance, 찌르레기 수천 마리의 murmuration(분리-정렬-응집의 세 규칙, Reynolds 1987), 뇌 없는 점균류가 도쿄 철도망과 유사한 네트워크를 형성하는 현상(Nakagaki et al., 2000) 모두 같은 원리다. Beni와 Wang(1989)이 "swarm intelligence"라는 용어를 만들었고, Bonabeau, Dorigo, Theraulaz(1999)가 이 분야를 학문적으로 정립했다.

## 생물학에서 알고리즘으로

군집 지능의 알고리즘 번역은 두 갈래로 이루어졌다. 하나는 개미의 페로몬 경로를 조합 최적화로 옮긴 것이고, 다른 하나는 새 떼의 군무를 연속 최적화로 옮긴 것이다.

**개미 군집 최적화(ACO) -- Dorigo(1992):**
Marco Dorigo가 박사 논문에서 제안했다. 직접적 영감은 실제 개미의 먹이 탐색 실험이다. 핵심 대응 관계는 다음과 같다.

- 실제 페로몬 농도 --> **경로 선택 확률의 가중치** (페로몬이 짙을수록 선택 확률 증가)
- 페로몬 증발 --> **오래된 정보의 망각** (증발률 rho가 조절)
- 짧은 경로에 빠른 페로몬 축적 --> **좋은 해에 대한 양성 피드백** (짧은 경로를 쓴 개미가 더 자주 왕복)
- 개미의 무작위 탐색 --> **확률적 경로 선택** (페로몬이 없는 초기에도 새로운 경로 시도)
- 군집 전체의 경로 수렴 --> **반복을 통한 해의 수렴**

**입자 군집 최적화(PSO) -- Kennedy & Eberhart(1995):**
새 떼와 물고기 떼의 집단 이동에서 영감을 받았다. Reynolds(1987)의 Boids 시뮬레이션 -- 분리, 정렬, 응집의 세 규칙으로 새 떼를 컴퓨터 그래픽에 재현한 것 -- 이 중간 영감이 되었다.

- 새 한 마리의 위치 --> **해 공간의 한 점** (후보 해)
- 새의 비행 속도와 방향 --> **해 공간에서의 이동 벡터** (속도)
- 이웃 새들의 방향을 참고하는 행동 --> **전체 군집 최선(g_best) 방향으로의 인력**
- 개체의 경험 기억 --> **자신의 역대 최선(p_best_i) 방향으로의 인력**

## ACO의 핵심 메커니즘

ACO에서 각 인공 개미가 노드 i에서 다음 노드 j를 선택하는 확률은 다음과 같다.

전이 확률: P(i->j) = [tau_ij^alpha * eta_ij^beta] / sum_k [tau_ik^alpha * eta_ik^beta]

tau_ij는 경로 (i,j)의 페로몬 농도, eta_ij는 휴리스틱 정보(예: 거리의 역수 1/d_ij)다. alpha는 페로몬(과거 경험)의, beta는 휴리스틱(문제 구조 정보)의 상대적 중요도를 조절한다. alpha가 매우 크면 개미가 페로몬만 따라가서 새 경로를 시도하지 않고, beta만 크면 집단 학습이 사라진다. 실무에서 alpha = 1, beta = 2~5가 표준이다.

한 세대가 끝나면 페로몬이 업데이트된다.

페로몬 업데이트: tau_ij = (1 - rho) * tau_ij + delta_tau_ij

rho(0 < rho < 1)는 증발률이다. delta_tau_ij는 해당 경로를 사용한 개미들이 남기는 페로몬으로, 짧은 경로를 찾은 개미가 더 많은 페로몬을 남긴다(delta_tau_ij = Q / L_k). rho가 0에 가까우면 초기 경로에 과도하게 집착하고(**경로 고착**), 1에 가까우면 이전 경험이 사라진다. 이 양성 피드백(짧은 경로에 페로몬 축적)과 음성 피드백(증발)의 균형이 ACO의 핵심이다.

## PSO의 핵심 메커니즘

PSO에서 각 입자의 속도와 위치는 다음과 같이 갱신된다.

속도 갱신: v_i(t+1) = w * v_i(t) + c1 * r1 * (p_best_i - x_i(t)) + c2 * r2 * (g_best - x_i(t))
위치 갱신: x_i(t+1) = x_i(t) + v_i(t+1)

세 항은 각각 **관성**(현재 방향 유지), **인지 항**(자신의 역대 최선 p_best_i로의 인력 = "나의 경험"), **사회 항**(군집 최선 g_best로의 인력 = "집단의 지혜")이다. r1, r2는 매 반복 생성되는 난수로 확률적 다양성을 부여한다.

관성 가중치 w가 크면 넓은 탐색, 작으면 세밀한 수렴을 유도한다. Shi & Eberhart(1998)는 w를 0.9에서 0.4로 선형 감소시키는 전략을 제안했다 -- SA의 냉각 스케줄과 같은 "초반 탐색, 후반 수렴"의 직관이다. c1이 c2보다 크면 개인 경험 의존, c2가 크면 g_best로의 조기 수렴이 발생하므로 보통 c1 = c2 = 2.0으로 균형을 맞춘다. PSO에서도 사회적 인력(양성 피드백)이 과도하면 조기 수렴이 발생한다.

## 현대 AI와의 연결

군집 지능의 원리는 단순한 최적화 알고리즘을 넘어 현대 AI 여러 영역에 반영된다. 다만 각 연결의 성격은 다르다.

**생물학적 원리가 직접적으로 적용된 사례:**

- **군집 로봇공학(swarm robotics)**: 수십에서 수천 대의 소형 로봇이 중앙 제어 없이 협력하여 탐색, 운반, 구조물 건설을 수행한다. Harvard의 Kilobot 프로젝트(Rubenstein et al., 2014)는 1,024대의 로봇이 별 모양 같은 패턴을 자기조직화로 형성하는 것을 시연했다. 여기서 개미 군집의 원리 -- 국소 규칙, 간접 통신, 피드백 균형 -- 가 공학적으로 가장 직접적으로 번역되었다.
- **ACO 기반 네트워크 라우팅**: AntNet(Di Caro & Dorigo, 1998)은 ACO를 통신 네트워크 라우팅에 적용했다. 인공 개미가 네트워크를 순회하며 지연 시간 정보를 수집하고, 각 노드의 라우팅 테이블을 페로몬처럼 업데이트한다. 네트워크 부하가 동적으로 변하는 환경에서 정적 알고리즘보다 적응력이 높다.

**동일한 구조적 직관을 독립적으로 공유하는 사례:**

- **연합 학습(Federated Learning, McMahan et al., 2017)**: 개별 디바이스에서 국소적으로 학습하고 모델 업데이트만 중앙 서버에 공유하는 구조다. 각 디바이스가 "개미"처럼 국소 정보만 가지고 있지만, 집계된 모델은 전체 데이터를 본 것처럼 동작한다. 이 구조는 stigmergy의 디지털 변형과 닮아 있다. 다만 McMahan et al.이 군집 지능에서 영감을 받았다는 기록은 없으며, 프라이버시 보존과 통신 효율이라는 독립적 동기에서 출발했다.
- **다중 에이전트 강화학습(MARL)**: 여러 에이전트가 국소 관찰만으로 협력하여 전역 과제를 수행하는 구조는 군집 지능과 구조적으로 닮아 있다. 각 에이전트는 자신의 정책(국소 규칙)만 가지고, 집단 행동이 창발한다. 그러나 MARL은 게임 이론과 강화학습 이론에서 독립적으로 발전한 분야다.

## 한계와 약점

- **수렴 보장 부재**: ACO도 PSO도 전역 최적해 도달을 이론적으로 보장하지 않는다. 경험적으로 좋은 해를 찾을 뿐이며, 주어진 해가 최적에 얼마나 가까운지 판단할 기준도 부족하다. 이는 적어도 지역 최적 조건을 검증할 수 있는 경사 기반 방법과 대조적이다.
- **고차원 문제의 한계**: PSO는 차원이 수백을 넘어가면 성능이 급감한다. 입자들이 고차원 공간에서 유의미한 방향으로 이동하기 어렵기 때문이다. 이는 현대 딥러닝의 수억 파라미터 공간에서 군집 알고리즘이 경사하강법을 대체할 수 없는 이유다.
- **파라미터 민감성**: w, c1, c2(PSO), alpha, beta, rho(ACO) 등 메타파라미터의 설정이 성능에 큰 영향을 미치며, 문제마다 튜닝이 필요하다. 범용적 설정은 없으며, 잘못된 선택은 경로 고착이나 조기 수렴으로 이어진다.
- **생물학적 유추의 한계**: 실제 개미 군집은 종별로 수백 종의 페로몬을 사용하며, 직접 접촉 통신과 진동 신호 등 다양한 채널을 가진다. ACO의 단일 페로몬 모델은 이 복잡성을 극도로 단순화한 것이다. 마찬가지로 실제 새 떼는 바람, 피로, 포식자 존재 등의 영향을 받지만 PSO에는 이런 요소가 전혀 없다.

## 용어 정리

창발(emergence) - 개별 요소의 단순한 국소 상호작용에서 집단 수준의 복잡한 패턴이나 행동이 나타나는 현상

페로몬(pheromone) - 동물이 분비하여 같은 종의 다른 개체에게 정보를 전달하는 화학 물질. 개미의 경로 표시가 대표적

흔적 자극(stigmergy) - 환경을 매개로 한 간접적 의사소통. 개미가 페로몬으로 환경에 정보를 남기고 다른 개미가 이를 읽는 방식

경로 고착(stagnation) - 과도한 양성 피드백으로 인해 차선의 해에 고착되어 더 나은 대안을 탐색하지 못하는 실패 모드

개미 군집 최적화(ant colony optimization, ACO) - Dorigo(1992)가 제안한, 개미의 먹이 탐색 행동에서 영감받은 조합 최적화 알고리즘

입자 군집 최적화(particle swarm optimization, PSO) - Kennedy & Eberhart(1995)가 제안한, 새 떼의 집단 이동에서 영감받은 연속 최적화 알고리즘

관성 가중치(inertia weight) - PSO에서 입자의 현재 속도를 유지하려는 경향을 조절하는 파라미터. 높으면 넓은 탐색, 낮으면 세밀한 활용을 유도

조기 수렴(premature convergence) - 해 공간이 충분히 탐색되기 전에 모든 개체가 하나의 해로 수렴하는 실패 모드. 선택압이나 사회적 인력이 과도할 때 발생

---EN---
Swarm Intelligence - The biological principle by which intelligent collective behavior emerges from local interactions of simple individuals, and its translation into optimization algorithms

## The Core Biological Principle of Swarm Intelligence

A single ant has only about 250,000 brain neurons. Its vision extends just a few centimeters, and its memory is extremely limited. Yet a colony of tens of thousands discovers shortest paths from nest to food, builds living bridges to prepare for floods, and gathers dead members in specific locations to maintain hygiene. No ant possesses an "overall plan." This phenomenon is called **emergence** -- not that the whole is greater than the sum of its parts, but that an entirely new level of order springs up from the very way parts interact.

To picture this spatially: think of a Mexican wave in a stadium of thousands. Each spectator follows one rule only: "stand up when my neighbor stands up." Nobody designed the wave's overall shape, yet a clean wave circles the entire stadium. Swarm intelligence works on exactly this structure. Local rules create global patterns.

Three conditions enable swarm intelligence:

1. **Simple local rules**: Each individual follows only simple interaction rules with nearby neighbors. There is no central coordinator overseeing the whole.
2. **Indirect communication (stigmergy)**: Individuals do not talk to each other directly; instead they leave traces in the environment and others read those traces. Ant **pheromone** -- a chemical substance deposited on a path -- is the classic example.
3. **Balance of positive and negative feedback**: Pheromone accumulating on good paths, attracting more ants, is positive feedback. Pheromone evaporating over time is negative feedback. Without this balance, the system either locks onto one path or remains in chaos.

Ants are not alone. Honeybee waggle dances, starling murmurations (three rules: separation, alignment, cohesion -- Reynolds 1987), and brainless slime mold forming networks strikingly similar to Tokyo's rail system (Nakagaki et al., 2000) all follow the same principle. Beni and Wang (1989) coined "swarm intelligence," and Bonabeau, Dorigo, and Theraulaz (1999) established the field academically.

## From Biology to Algorithm

The algorithmic translation of swarm intelligence took two paths: one mapped ant pheromone trails into combinatorial optimization, the other mapped bird flocking into continuous optimization.

**Ant Colony Optimization (ACO) -- Dorigo (1992):**
Marco Dorigo proposed this in his doctoral thesis. The direct inspiration was real ant foraging experiments. Key correspondences:

- Real pheromone concentration --> **weight in path selection probability** (stronger pheromone raises selection probability)
- Pheromone evaporation --> **forgetting of outdated information** (evaporation rate rho controls this)
- Faster pheromone accumulation on shorter paths --> **positive feedback for good solutions** (ants on shorter paths complete round trips more frequently)
- Random wandering of ants --> **stochastic path selection** (new paths tried even initially when no pheromone exists)
- Colony-wide path convergence --> **solution convergence through iteration**

**Particle Swarm Optimization (PSO) -- Kennedy & Eberhart (1995):**
Inspired by the collective movement of bird flocks and fish schools. Reynolds' (1987) Boids simulation -- reproducing flock behavior with three rules (separation, alignment, cohesion) for computer graphics -- served as an intermediate inspiration.

- A single bird's position --> **a point in solution space** (candidate solution)
- A bird's flight speed and direction --> **movement vector in solution space** (velocity)
- Adjusting to neighbors' direction --> **attraction toward the swarm's global best (g_best)**
- Individual experiential memory --> **attraction toward one's personal best (p_best_i)**

## Core Mechanism of ACO

In ACO, each artificial ant at node i selects the next node j with the following probability:

Transition probability: P(i->j) = [tau_ij^alpha * eta_ij^beta] / sum_k [tau_ik^alpha * eta_ik^beta]

tau_ij is the pheromone concentration on path (i,j), eta_ij is heuristic information (e.g., inverse distance 1/d_ij). alpha controls the importance of pheromone (past experience), beta controls heuristic importance (structural problem information). If alpha is very large, ants follow only pheromone and never try new routes. If only beta matters, collective learning disappears. In practice, alpha = 1 and beta = 2-5 are standard.

After one generation, pheromone is updated:

Pheromone update: tau_ij = (1 - rho) * tau_ij + delta_tau_ij

rho (0 < rho < 1) is the evaporation rate. delta_tau_ij is pheromone deposited by ants that used the path -- ants finding shorter paths deposit more (delta_tau_ij = Q / L_k). If rho is near 0, pheromone barely evaporates, leading to **stagnation** on early-discovered paths. If near 1, prior experience vanishes. The balance between positive feedback (pheromone accumulation on good paths) and negative feedback (evaporation) is ACO's core.

## Core Mechanism of PSO

In PSO, each particle's velocity and position are updated as follows:

Velocity update: v_i(t+1) = w * v_i(t) + c1 * r1 * (p_best_i - x_i(t)) + c2 * r2 * (g_best - x_i(t))
Position update: x_i(t+1) = x_i(t) + v_i(t+1)

The three terms are **inertia** (maintaining current direction), **cognitive term** (pull toward personal best p_best_i = "my experience"), and **social term** (pull toward swarm best g_best = "collective wisdom"). r1 and r2 are random numbers providing stochastic diversity.

Inertia weight w controls broad exploration (large w) vs. fine convergence (small w). Shi & Eberhart (1998) proposed linearly decreasing w from 0.9 to 0.4 -- the same "explore early, converge late" intuition as SA's cooling schedule. If c1 dominates, particles trust only individual experience; if c2 dominates, all particles rush toward g_best causing premature convergence. Typically c1 = c2 = 2.0 balances individual and collective wisdom. As with ACO, excessive positive feedback (social attraction) without sufficient negative feedback causes premature convergence.

## Connections to Modern AI

Swarm intelligence principles extend beyond simple optimization algorithms, reflected in several areas of modern AI. However, the nature of each connection differs.

**Direct application of biological principles:**

- **Swarm robotics**: Tens to thousands of small robots cooperate without central control for exploration, transport, and structure building. Harvard's Kilobot project (Rubenstein et al., 2014) demonstrated 1,024 robots self-organizing into patterns like star shapes. Here the principles of ant colonies -- local rules, indirect communication, feedback balance -- are most directly translated into engineering.
- **ACO-based network routing**: AntNet (Di Caro & Dorigo, 1998) applied ACO to telecommunications routing. Artificial ants traverse the network collecting latency information and update routing tables at each node like pheromone. In dynamically changing network loads, this shows greater adaptability than static algorithms.

**Structural similarities sharing the same intuition independently:**

- **Federated Learning (McMahan et al., 2017)**: Individual devices learn locally and share only model updates with a central server. Each device, like an "ant," has only local information, yet the aggregated model behaves as if it has seen all data. This structure resembles a digital variant of stigmergy. However, there is no record of McMahan et al. being inspired by swarm intelligence; they started from independent motivations of privacy preservation and communication efficiency.
- **Multi-Agent Reinforcement Learning (MARL)**: The structure where multiple agents cooperate on global tasks using only local observations resembles swarm intelligence structurally. Each agent has its own policy (local rule), and collective behavior emerges. However, MARL developed independently from game theory and reinforcement learning theory.

## Limitations and Weaknesses

- **No convergence guarantee**: Neither ACO nor PSO theoretically guarantees reaching the global optimum. They find empirically good solutions, but there is no criterion for measuring how close to optimal a given solution is. This contrasts with gradient-based methods that can at least verify local optimality conditions.
- **High-dimensional weakness**: PSO performance drops sharply beyond a few hundred dimensions. Particles struggle to move meaningfully in high-dimensional spaces. This is why swarm algorithms cannot replace gradient descent for modern deep learning's hundreds of millions of parameters.
- **Parameter sensitivity**: Meta-parameters (w, c1, c2 for PSO; alpha, beta, rho for ACO) significantly affect performance and require per-problem tuning. There is no universal setting, and poor choices can lead to stagnation or premature convergence.
- **Limits of biological analogy**: Real ant colonies use hundreds of species-specific pheromones and communicate through multiple channels including direct contact and vibration signals. ACO's single-pheromone model is an extreme simplification. Similarly, real bird flocks are influenced by wind, fatigue, and predator presence -- factors entirely absent from PSO.

## Glossary

Emergence - the phenomenon where complex patterns or behaviors at the collective level arise from simple local interactions of individual elements

Pheromone - a chemical substance secreted by animals to convey information to other individuals of the same species; ant trail marking is the classic example

Stigmergy - indirect communication mediated through the environment; ants leave pheromone information in the environment for other ants to read

Stagnation - the failure mode where the system locks onto a suboptimal solution due to excessive positive feedback, unable to escape to better alternatives

Ant colony optimization (ACO) - a combinatorial optimization algorithm inspired by ant foraging behavior, proposed by Dorigo (1992)

Particle swarm optimization (PSO) - a continuous optimization algorithm inspired by the collective movement of bird flocks, proposed by Kennedy & Eberhart (1995)

Inertia weight - a parameter in PSO controlling the tendency to maintain current velocity; higher values encourage broad exploration, lower values encourage fine exploitation

Positive feedback - a cycle where a system's output amplifies its input in the same direction; pheromone accumulation on good paths attracting more ants is the classic example

Premature convergence - the failure mode where all particles collapse toward a single point before the solution space has been adequately explored, typically caused by excessive social attraction

Self-organization - the spontaneous formation of order from local interactions in an open system without central control; a theoretical framework encompassing swarm intelligence
