---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 진화 알고리즘, 유전 알고리즘, 유전 프로그래밍, 진화 전략, 자연선택, 적합도 함수, 교차, 돌연변이, 신경망 구조 탐색
keywords_en: evolutionary algorithm, genetic algorithm, genetic programming, evolution strategy, natural selection, fitness function, crossover, mutation, neural architecture search
---
Evolutionary Algorithms and Genetic Programming - 다윈의 자연선택과 유전학의 원리를 직접 차용하여 해 집단을 반복적으로 진화시키는 최적화 패러다임

## 생물 진화의 핵심 메커니즘

다윈(1859)의 자연선택 이론은 세 가지 조건을 요구한다. 개체들 사이에 **변이**(variation)가 존재하고, 그 변이가 **유전**(heredity) 가능하며, 변이가 **적합도**(fitness) 차이를 만든다. 이 세 조건이 만족되면 적합도가 높은 형질이 세대를 거치면서 집단 내에 확산된다. 멘델(1866)의 유전학이 이를 미립자 유전 메커니즘으로 보완했고, 20세기 초 현대 종합 이론(Modern Synthesis)이 자연선택과 유전학을 통합했다.

진화 알고리즘(Evolutionary Algorithm, EA)은 이 생물학적 프로세스를 계산적으로 모사한다. 해 하나가 아니라 **해 집단**(population)을 유지하고, 선택(selection), 교차(crossover/recombination), 돌연변이(mutation)를 반복하여 세대마다 더 좋은 해를 찾는다.

## 세 줄기의 독립적 탄생

EA는 세 대륙에서 거의 동시에, 서로 모르는 연구자들에 의해 독립적으로 탄생했다.

미국에서 Holland(1975)가 유전 알고리즘(Genetic Algorithm, GA)을 제안했다. 이진 문자열로 해를 인코딩하고, 적합도에 비례하는 선택과 교차, 돌연변이를 적용한다. Holland의 핵심 기여는 스키마 이론(Schema Theorem)으로, GA의 작동 원리를 이론적으로 설명하려 했다.

독일에서 Rechenberg(1973)와 Schwefel(1977)이 진화 전략(Evolution Strategy, ES)을 개발했다. 실수 벡터를 직접 다루며, 돌연변이의 스텝 크기 자체를 진화시키는 자기적응(self-adaptation)이 핵심이다. 교차보다 돌연변이 중심이며, 연속 파라미터 최적화에 강하다.

미국에서 Fogel, Owens & Walsh(1966)가 진화 프로그래밍(Evolutionary Programming)을, Koza(1992)가 유전 프로그래밍(Genetic Programming, GP)을 제안했다. GP는 문자열이 아니라 **프로그램(트리 구조)**을 진화시켜, 데이터에 맞는 수식이나 알고리즘을 자동 생성한다.

## GA의 구조: 한 세대의 흐름

유전 알고리즘의 한 세대는 다음과 같이 진행된다.

1. **초기화**: N개의 해(개체)를 랜덤으로 생성하여 초기 집단을 구성한다
2. **적합도 평가**: 각 개체의 목적 함수 값(적합도)을 계산한다
3. **선택**: 적합도가 높은 개체일수록 부모로 선택될 확률이 높다. 적합도 비례 선택에서 i번째 개체의 선택 확률은 P(select_i) = f_i / sum_j f_j
4. **교차**: 부모 쌍의 유전 정보를 결합하여 자식을 생성한다. 1점 교차, 2점 교차, 균일 교차 등의 방법이 있다
5. **돌연변이**: 자식의 유전 정보 일부를 랜덤으로 변경한다. 이진 인코딩이면 비트를 뒤집고, 실수 인코딩이면 가우시안 노이즈를 더한다
6. **대체**: 자식 세대가 부모 세대를 대체하거나(세대 교체), 부모와 자식을 합쳐 상위 N개를 선택한다(정상 상태)

이 과정을 수백~수천 세대 반복하면, 집단 전체의 적합도가 상승한다.

## 스키마 이론과 그 한계

Holland의 스키마 이론은 GA의 작동 원리를 설명하려는 최초의 시도였다. 스키마(schema)는 특정 위치에 특정 값을 지정하고 나머지는 와일드카드인 패턴이다. 예를 들어 1**0*1은 위치 1, 4, 6이 고정된 스키마다.

스키마 이론의 근사적 표현은 다음과 같다.

E[m(H, t+1)] >= m(H, t) * f(H)/f_avg * (1 - p_c * d(H)/(l-1)) * (1 - p_m)^o(H)

m(H, t)는 세대 t에서 스키마 H에 속하는 개체 수, f(H)는 H에 속하는 개체들의 평균 적합도, f_avg는 집단 전체 평균 적합도, p_c는 교차 확률, d(H)는 정의 길이(defining length), l은 문자열 길이, p_m은 돌연변이 확률, o(H)는 차수(order, 고정된 위치 수)다.

이 정리가 말하는 것은: 적합도가 높고, 짧고, 저차인 스키마가 세대를 거치면서 기하급수적으로 늘어난다는 것이다. 하지만 이 이론은 많은 비판을 받았다. 하한이지 등호가 아니며, 스키마 간 상호작용을 무시하고, 실제 GA 행동을 정확히 예측하지 못한다. Wright et al.(2003) 등은 스키마 이론이 GA의 성공을 설명하기엔 불충분하다고 주장했다.

## 현대 AI에서의 부활

2010년대 딥러닝 시대에 EA는 새로운 역할을 찾았다.

Salimans et al.(2017, OpenAI)은 진화 전략(ES)이 Atari 게임 등에서 강화학습(RL)의 대안이 될 수 있음을 보였다. 수천 개의 파라미터 섭동을 병렬로 평가하고, 적합도 가중 평균으로 갱신하는 이 방식은 역전파가 필요 없어 병렬화가 극도로 쉽다. 그래디언트 없이 수백만 파라미터를 최적화할 수 있다는 것이 핵심이었다.

Stanley & Miikkulainen(2002)의 NEAT(NeuroEvolution of Augmenting Topologies)는 신경망의 가중치뿐 아니라 **구조(토폴로지)**까지 진화시킨다. 노드와 연결을 추가하는 돌연변이로 네트워크가 점차 복잡해지며, 역사 마커(historical marker)를 통해 교차 시 구조적 일관성을 보장한다.

CMA-ES(Hansen & Ostermeier, 2001)는 공분산 행렬 적응(Covariance Matrix Adaptation)을 통해 다변량 정규분포의 형태를 진화시킨다. 목적 함수의 곡면 구조에 자동으로 적응하는 이 방법은 연속 최적화의 벤치마크이자 블랙박스 최적화의 표준이 되었다.

현대 신경망 구조 탐색(NAS)에서도 진화적 접근이 활발하다. Real et al.(2019)의 AmoebaNet은 진화적 탐색으로 발견한 아키텍처가 강화학습 기반 NAS와 대등한 성능을 달성했다.

## 진화와 경사하강법의 관계

EA와 경사하강법은 종종 대립적으로 묘사되지만, 깊은 연결이 있다. ES에서 적합도 가중 평균을 취하는 것은 로그 적합도의 그래디언트를 추정하는 것과 수학적으로 등가다(점수 함수 추정기, score function estimator). 즉, ES는 "그래디언트를 사용하지 않는 것"이 아니라 "다른 방식으로 그래디언트를 추정하는 것"이다.

또한 EA의 집단 기반 탐색은 SGD의 미니배치 노이즈와 유사한 역할을 한다. 다양한 해를 동시에 유지함으로써 손실 곡면의 여러 영역을 동시에 탐색하는 것이다.

## 한계와 약점

EA는 유연하지만, 그 유연성에는 대가가 따른다.

- **그래디언트 대비 효율성**: 그래디언트를 계산할 수 있는 문제에서 EA는 경사하강법보다 수 배에서 수천 배 느리다. 딥러닝의 수백만~수십억 파라미터를 EA로 직접 최적화하는 것은 비현실적이다.
- **고차원의 저주**: 집단 크기가 고정되어 있으면, 차원이 높아질수록 해 공간의 극히 작은 부분만 탐색할 수 있다. 교차 연산의 효과도 고차원에서 약화된다.
- **적합도 함수 평가 비용**: 매 세대, 매 개체마다 적합도를 평가해야 한다. 평가가 비싸면(신경망 학습 등) 전체 비용이 급등한다.
- **조기 수렴(premature convergence)**: 집단의 다양성이 너무 빨리 줄어들어 지역 최적에 빠지는 현상이다. 선택 압력과 다양성 유지 사이의 균형을 맞추기 어렵다.
- **이론적 기반 약화**: 스키마 이론의 한계 이후, EA의 성공을 설명하는 포괄적 이론이 부재하다. "왜 작동하는가"에 대한 이해가 "어떻게 사용하는가"에 비해 뒤처져 있다.
- **하이퍼파라미터**: 집단 크기, 선택 방법, 교차 확률, 돌연변이 확률 등 EA 자체의 하이퍼파라미터 설정이 문제별로 달라, 메타 최적화가 필요하다.

## 용어 정리

적합도 함수(fitness function) - 개체(해)의 품질을 정량적으로 평가하는 함수. 목적 함수와 동일하거나 그 변환

집단(population) - EA에서 동시에 유지하는 해의 집합. 세대마다 선택, 교차, 돌연변이를 통해 갱신

교차(crossover/recombination) - 두 부모의 유전 정보를 결합하여 자식을 생성하는 연산. 생물학적 유성생식에서 직접 차용

돌연변이(mutation) - 개체의 유전 정보 일부를 랜덤으로 변경하는 연산. 다양성을 유지하고 지역 탐색을 수행

스키마(schema) - 유전 알고리즘에서 특정 위치의 값이 고정된 패턴. Holland의 스키마 이론에서 GA 분석의 기본 단위

자기적응(self-adaptation) - 진화 전략에서 돌연변이 스텝 크기 등의 전략 파라미터를 해와 함께 진화시키는 메커니즘

조기 수렴(premature convergence) - 집단의 다양성이 빠르게 소실되어 전역 최적에 도달하기 전에 탐색이 멈추는 현상

공분산 행렬 적응(Covariance Matrix Adaptation) - CMA-ES에서 돌연변이의 분포 형태를 손실 곡면의 기하 구조에 맞게 자동 조절하는 기법

신경진화(neuroevolution) - 진화 알고리즘으로 신경망의 가중치, 구조, 학습 규칙을 최적화하는 분야

---EN---
Evolutionary Algorithms and Genetic Programming - An optimization paradigm that directly borrows natural selection and genetics to iteratively evolve a population of solutions

## Core Mechanisms of Biological Evolution

Darwin's (1859) theory of natural selection requires three conditions: **variation** exists among individuals, that variation is **heritable**, and variation creates differences in **fitness**. When all three are met, traits with higher fitness spread through the population across generations. Mendel's (1866) genetics complemented this with a particulate inheritance mechanism, and the Modern Synthesis of the early 20th century unified natural selection with genetics.

Evolutionary Algorithms (EA) computationally emulate this biological process. Instead of maintaining a single solution, they maintain a **population** of solutions, repeatedly applying selection, crossover (recombination), and mutation to find better solutions each generation.

## Three Independent Origins on Three Continents

EA emerged almost simultaneously from independent researchers on different continents who were unaware of each other.

In the US, Holland (1975) proposed the Genetic Algorithm (GA). Solutions are encoded as binary strings, with fitness-proportionate selection, crossover, and mutation applied. Holland's key contribution was the Schema Theorem, an attempt to theoretically explain how GA works.

In Germany, Rechenberg (1973) and Schwefel (1977) developed Evolution Strategies (ES). Working directly with real-valued vectors, the key innovation is self-adaptation -- evolving the mutation step sizes themselves. Mutation-centric rather than crossover-centric, ES excels at continuous parameter optimization.

In the US, Fogel, Owens & Walsh (1966) proposed Evolutionary Programming, and Koza (1992) proposed Genetic Programming (GP). GP evolves **programs (tree structures)** rather than strings, automatically generating formulas or algorithms that fit data.

## GA Structure: One Generation's Flow

One generation of a genetic algorithm proceeds as follows:

1. **Initialization**: Randomly generate N solutions (individuals) to form the initial population
2. **Fitness evaluation**: Compute each individual's objective function value (fitness)
3. **Selection**: Individuals with higher fitness are more likely to be chosen as parents. In fitness-proportionate selection, the probability of selecting individual i is P(select_i) = f_i / sum_j f_j
4. **Crossover**: Combine genetic information from parent pairs to produce offspring. Methods include one-point, two-point, and uniform crossover
5. **Mutation**: Randomly alter portions of offspring's genetic information. For binary encoding, flip bits; for real-valued encoding, add Gaussian noise
6. **Replacement**: The offspring generation replaces the parent generation (generational), or parents and offspring are combined and the top N selected (steady-state)

Repeating this process for hundreds to thousands of generations raises the entire population's fitness.

## Schema Theorem and Its Limitations

Holland's Schema Theorem was the first attempt to explain how GA works. A schema is a pattern with specific values at certain positions and wildcards elsewhere. For example, 1**0*1 is a schema with positions 1, 4, and 6 fixed.

The approximate expression of the Schema Theorem is:

E[m(H, t+1)] >= m(H, t) * f(H)/f_avg * (1 - p_c * d(H)/(l-1)) * (1 - p_m)^o(H)

m(H, t) is the number of individuals belonging to schema H at generation t, f(H) is the average fitness of individuals in H, f_avg is the population's overall average fitness, p_c is crossover probability, d(H) is defining length, l is string length, p_m is mutation probability, and o(H) is order (number of fixed positions).

The theorem says: schemas that are fit, short, and low-order grow exponentially across generations. However, this theory has received extensive criticism. It provides a lower bound, not an equality; it ignores inter-schema interactions; and it fails to accurately predict actual GA behavior. Wright et al. (2003) among others argued the Schema Theorem is insufficient to explain GA's success.

## Revival in Modern AI

In the 2010s deep learning era, EA found new roles.

Salimans et al. (2017, OpenAI) showed that Evolution Strategies (ES) can serve as an alternative to reinforcement learning (RL) on tasks like Atari games. Evaluating thousands of parameter perturbations in parallel and updating via fitness-weighted averaging, this approach requires no backpropagation and is extremely easy to parallelize. The key insight was that millions of parameters can be optimized without gradients.

Stanley & Miikkulainen's (2002) NEAT (NeuroEvolution of Augmenting Topologies) evolves not only neural network weights but also **structure (topology)**. Mutations add nodes and connections, gradually increasing network complexity, while historical markers ensure structural consistency during crossover.

CMA-ES (Hansen & Ostermeier, 2001) evolves the shape of a multivariate normal distribution through Covariance Matrix Adaptation. This method automatically adapts to the objective function's landscape geometry and has become both a continuous optimization benchmark and a standard for black-box optimization.

Evolutionary approaches are also active in modern neural architecture search (NAS). Real et al.'s (2019) AmoebaNet discovered architectures through evolutionary search that matched the performance of RL-based NAS.

## The Relationship Between Evolution and Gradient Descent

EA and gradient descent are often portrayed as opposites, but they share deep connections. Taking fitness-weighted averages in ES is mathematically equivalent to estimating the gradient of log-fitness (score function estimator). That is, ES does not "avoid using gradients" but rather "estimates gradients differently."

Furthermore, EA's population-based search plays a role similar to SGD's mini-batch noise -- maintaining diverse solutions simultaneously explores multiple regions of the loss surface at once.

## Limitations and Weaknesses

EA is flexible, but that flexibility comes at a cost.

- **Efficiency vs. gradients**: On problems where gradients are computable, EA is several to thousands of times slower than gradient descent. Directly optimizing deep learning's millions to billions of parameters with EA is impractical.
- **Curse of high dimensions**: With fixed population size, higher dimensions mean only a vanishingly small fraction of the solution space can be explored. Crossover effectiveness also weakens in high dimensions.
- **Fitness evaluation cost**: Every generation, every individual requires fitness evaluation. When evaluation is expensive (e.g., neural network training), total cost escalates dramatically.
- **Premature convergence**: Population diversity diminishes too rapidly, trapping search in local optima. Balancing selection pressure with diversity maintenance is difficult.
- **Weakened theoretical foundation**: After the Schema Theorem's limitations were exposed, no comprehensive theory explains EA's success. Understanding "why it works" lags behind "how to use it."
- **Hyperparameters**: Population size, selection method, crossover probability, and mutation probability vary by problem, requiring meta-optimization for EA itself.

## Glossary

Fitness function - a function that quantitatively evaluates the quality of an individual (solution); identical to or a transformation of the objective function

Population - the set of solutions maintained simultaneously in EA; updated each generation through selection, crossover, and mutation

Crossover/recombination - an operation combining genetic information from two parents to produce offspring; directly borrowed from biological sexual reproduction

Mutation - an operation randomly altering portions of an individual's genetic information; maintains diversity and performs local search

Schema - a pattern with fixed values at certain positions in a genetic algorithm; the basic analytical unit in Holland's Schema Theorem

Self-adaptation - a mechanism in evolution strategies that evolves strategy parameters (such as mutation step sizes) alongside the solutions themselves

Premature convergence - the phenomenon where population diversity is lost rapidly, halting search before reaching the global optimum

Covariance Matrix Adaptation - a technique in CMA-ES that automatically adjusts the mutation distribution shape to match the loss surface geometry

Neuroevolution - the field of optimizing neural network weights, architectures, and learning rules using evolutionary algorithms
