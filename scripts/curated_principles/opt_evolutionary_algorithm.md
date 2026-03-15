---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 진화 알고리즘, 유전 알고리즘, 자연선택, 적합도 함수, 교차와 돌연변이, 집단 기반 탐색, 신경진화
keywords_en: evolutionary algorithm, genetic algorithm, natural selection, fitness function, crossover and mutation, population-based search, neuroevolution
---
Evolutionary Algorithms - 다윈의 자연선택 원리를 직접 차용하여 해 집단을 세대마다 진화시키는 최적화 기법

## 자연선택의 세 가지 조건

다윈(1859)의 자연선택 이론은 세 가지 조건이 동시에 만족될 때 작동한다. 첫째, 개체들 사이에 **변이**(variation)가 존재한다. 같은 종이라도 몸 크기, 달리기 속도, 질병 저항력이 제각각이다. 둘째, 그 변이가 **유전**(heredity)된다. 부모의 형질이 자식에게 전달된다. 셋째, 변이가 **적합도**(fitness) 차이를 만든다. 가뭄이 들면 깊은 뿌리를 가진 식물이 더 많이 살아남아 씨앗을 퍼뜨린다.

이 세 조건이 갖춰지면 선택이 자동으로 일어난다. 적합도가 높은 형질은 세대를 거치면서 집단 내에 퍼지고, 낮은 형질은 사라진다. 멘델(1866)의 유전학이 이를 입자적 유전 단위(유전자)로 설명했고, 20세기 초 피셔(Fisher), 홀데인(Haldane), 라이트(Wright)가 자연선택과 유전학을 통합한 현대 종합 이론(Modern Synthesis)을 완성했다.

공간적으로 비유하면, 진화는 광활한 산악 지형에서 봉우리(높은 적합도)를 찾는 과정이다. 한 마리의 탐험가가 아니라 **수천 마리의 탐험대**가 동시에 여기저기 흩어져서, 높은 곳에 있는 개체가 더 많은 후손을 남기고, 후손은 부모 근처에서 출발하되 약간 다른 방향으로 이동한다. 세대가 지나면 탐험대 전체가 봉우리 쪽으로 모여든다.

## 생물학에서 알고리즘으로

이 원리를 계산에 옮긴 것이 진화 알고리즘(Evolutionary Algorithm, EA)이다. 세 대륙에서 거의 동시에, 서로를 모른 채 독립적으로 탄생했다.

미국에서 Holland(1975)가 유전 알고리즘(Genetic Algorithm, GA)을 제안했다. 해를 이진 문자열로 인코딩하고, 적합도에 비례하는 선택과 교차, 돌연변이를 적용한다. 독일에서 Rechenberg(1973)와 Schwefel(1977)이 진화 전략(Evolution Strategy, ES)을 개발했다. 실수 벡터를 직접 다루며, 돌연변이의 스텝 크기 자체를 진화시키는 자기적응(self-adaptation)이 핵심이었다. 미국에서 Koza(1992)는 유전 프로그래밍(Genetic Programming, GP)을 제안하여, 문자열이 아니라 **프로그램(트리 구조)**을 진화 대상으로 삼았다.

세 방법 모두 생물학의 같은 뼈대를 공유하지만, 해의 표현 방식과 변이 연산이 다르다. 핵심 대응 관계는 다음과 같다.

- 개체(organism) --> **하나의 후보 해** (이진 문자열, 실수 벡터, 트리 등)
- 집단(population) --> **동시에 유지하는 해의 집합** (보통 수십~수천 개)
- 유전자(gene) --> **해의 구성 요소** (문자열의 비트, 벡터의 원소)
- 적합도(fitness) --> **목적 함수 값** (최대화 또는 최소화 대상)
- 자연선택 --> **선택 연산** (적합도 높은 해를 부모로 선호)
- 유성생식 --> **교차 연산** (두 부모의 정보를 결합)
- 돌연변이 --> **돌연변이 연산** (해의 일부를 랜덤으로 변경)
- 세대 교체 --> **한 반복 사이클**

## 유전 알고리즘: 한 세대의 흐름

GA의 한 세대는 다음 6단계로 진행된다.

1. **초기화**: N개의 해(개체)를 랜덤으로 생성하여 초기 집단을 구성한다. 이진 인코딩이면 길이 L의 0/1 문자열 N개다
2. **적합도 평가**: 각 개체의 목적 함수 값을 계산한다
3. **선택**: 적합도가 높은 개체일수록 부모로 선택될 확률이 높다. 적합도 비례 선택에서 i번째 개체의 선택 확률은 P_i = f_i / (f_1 + f_2 + ... + f_N). 적합도가 10인 개체는 적합도 2인 개체보다 5배 자주 뽑힌다
4. **교차**: 부모 쌍의 유전 정보를 결합하여 자식을 생성한다. 가장 단순한 1점 교차는 문자열의 한 지점을 골라 그 앞은 부모 A에서, 뒤는 부모 B에서 가져온다. 예: 부모 A = 11100, 부모 B = 00011, 교차점 3 --> 자식 = 11111
5. **돌연변이**: 자식의 유전 정보 일부를 랜덤으로 변경한다. 이진 인코딩이면 각 비트를 확률 p_m으로 뒤집는다. p_m은 보통 0.001~0.01로 낮게 설정한다
6. **대체**: 자식 세대가 부모 세대를 대체하거나(세대 교체), 부모와 자식을 합쳐 상위 N개를 남긴다(정상 상태)

이 과정을 수백~수천 세대 반복하면, 집단 전체의 적합도가 세대마다 상승한다.

## 선택 압력과 다양성의 균형

EA의 핵심 트레이드오프는 **선택 압력**(selection pressure)과 **집단 다양성**(population diversity) 사이의 긴장이다.

선택 압력이 강하면 적합도 높은 개체가 빠르게 지배한다. 수렴이 빠르지만, 집단이 비슷한 해들로 획일화되어 탐색이 멈추는 조기 수렴(premature convergence)의 위험이 생긴다. 산악 지형 비유로 돌아가면, 탐험대 전체가 하나의 언덕에 몰려들어 더 높은 봉우리가 있는 다른 산맥을 영영 보지 못하는 것이다.

반대로 선택 압력이 약하면 다양성은 유지되지만, 좋은 해가 퍼지는 속도가 느려 수렴이 지연된다. 이 균형을 맞추기 위해 토너먼트 선택(tournament selection)이 실무에서 널리 쓰인다. 집단에서 k개를 랜덤 추출하고 그중 최고를 부모로 뽑는 방식인데, k를 조절하면 선택 압력을 직접 통제할 수 있다. k = 2면 부드럽고, k = 7이면 공격적이다.

돌연변이는 다양성의 최후 보루다. 교차만으로는 부모에게 없는 유전 정보를 만들 수 없지만, 돌연변이는 완전히 새로운 변이를 도입한다. 교차가 기존 좋은 형질을 조합하는 역할이라면, 돌연변이는 아직 탐색하지 않은 영역으로 탐침을 보내는 역할이다.

## 스키마 이론: 최초의 이론적 설명과 그 한계

Holland의 스키마 이론은 GA가 **왜** 작동하는지를 설명하려는 최초의 시도였다. 스키마(schema)는 특정 위치에 특정 값을 지정하고 나머지는 와일드카드인 패턴이다. 예를 들어 1**0*1은 위치 1, 4, 6이 고정된 스키마다.

스키마 정리의 근사적 표현은 다음과 같다.

E[m(H, t+1)] >= m(H, t) * f(H)/f_avg * (1 - p_c * d(H)/(l-1)) * (1 - p_m)^o(H)

각 항을 풀면 이렇다. m(H, t)는 세대 t에서 스키마 H에 속하는 개체 수다. f(H)/f_avg는 스키마의 평균 적합도를 집단 전체 평균으로 나눈 것으로, 이 비율이 1보다 크면 해당 스키마가 성장한다. (1 - p_c * d(H)/(l-1))은 교차에 의한 파괴 확률인데, d(H)(정의 길이, 고정 위치 간 최대 거리)가 짧을수록 교차에서 살아남기 쉽다. (1 - p_m)^o(H)는 돌연변이에 의한 파괴 확률로, o(H)(차수, 고정 위치 수)가 적을수록 안전하다.

결론적으로 이 정리가 말하는 것은: **적합도가 높고, 짧고, 저차인 스키마**가 세대를 거치면서 기하급수적으로 늘어난다는 것이다. Holland는 이를 GA의 "암묵적 병렬성"(implicit parallelism)이라 불렀다.

그러나 이 이론은 많은 비판을 받았다. 부등식의 하한이지 등호가 아니며, 스키마 간 상호작용(에피스타시스)을 무시하고, 실제 GA 행동을 정확히 예측하지 못한다. Wright et al.(2003) 등은 스키마 이론이 GA의 성공을 설명하기엔 불충분하다고 주장했다. "왜 작동하는가"에 대한 포괄적 이론은 아직 부재하다.

## 현대 AI 기법과의 연결

EA의 "집단을 진화시켜 해를 찾는다"는 아이디어는 현대 AI 곳곳에서 활용된다. 다만 각 연결의 성격은 다르다.

**생물학적 진화 원리의 직접 적용:**

- **신경 구조 탐색(Neural Architecture Search)**: Real et al.(2019)의 AmoebaNet은 신경망의 층 구성과 연결 방식을 유전자로 인코딩하고, 교차와 돌연변이로 아키텍처를 진화시켰다. ImageNet에서 강화학습 기반 NAS와 대등한 성능을 달성했다. 여기서 적합도는 검증 정확도, 개체는 하나의 아키텍처 설계도다.
- **NEAT(NeuroEvolution of Augmenting Topologies)**: Stanley & Miikkulainen(2002)은 신경망의 가중치뿐 아니라 구조까지 진화시킨다. 노드와 연결을 추가하는 돌연변이로 네트워크가 단순한 것에서 복잡한 것으로 점차 성장하며, 역사 마커(historical marker)를 통해 교차 시 구조적 일관성을 보장한다. 생물학에서 상동(homology) 개념을 차용한 것이다.
- **CMA-ES**: Hansen & Ostermeier(2001)는 돌연변이 분포의 공분산 행렬을 진화시킨다. 목적 함수의 곡면 구조에 자동으로 적응하는 이 방법은 블랙박스 연속 최적화의 표준 벤치마크가 되었다. ES에서의 자기적응 원리를 극한까지 발전시킨 사례다.

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **SGD의 미니배치 노이즈**: 확률적 경사하강법(SGD)에서 미니배치가 만드는 그래디언트의 랜덤 변동은 손실 곡면의 여러 영역을 동시에 탐색하는 효과를 낳는다. EA의 집단이 해 공간의 여러 지점을 동시에 유지하는 것과 기능적으로 유사하지만, SGD는 EA에서 영감을 받은 것이 아니다.
- **앙상블 학습**: 여러 모델을 동시에 학습시키고 결합하여 단일 모델보다 나은 성능을 얻는 앙상블 기법은 "다양한 개체를 유지하는 것이 단일 개체보다 강건하다"는 EA의 집단 원리와 구조적으로 유사하다. 다만 앙상블은 통계학(편향-분산 분해)에서 독립적으로 발전했다.

주목할 점은 EA와 경사하강법의 관계다. ES에서 적합도 가중 평균을 취하는 것은 로그 적합도의 그래디언트를 추정하는 것과 수학적으로 등가다(점수 함수 추정기, score function estimator). Salimans et al.(2017, OpenAI)은 이를 활용하여 Atari 게임에서 역전파 없이 수백만 파라미터를 최적화했다. 즉, ES는 "그래디언트를 사용하지 않는 것"이 아니라 "다른 방식으로 그래디언트를 추정하는 것"이다.

## 한계와 약점

- **그래디언트 대비 효율성**: 그래디언트를 계산할 수 있는 문제에서 EA는 경사하강법보다 수 배에서 수천 배 느리다. 딥러닝의 수백만~수십억 파라미터를 EA로 직접 최적화하는 것은 비현실적이며, EA의 진가는 목적 함수가 미분 불가능하거나 해 공간이 이산적인 문제에서 발휘된다.
- **적합도 평가 비용**: 매 세대, 매 개체마다 적합도를 평가해야 한다. NAS처럼 한 번의 평가가 신경망 학습 전체를 요구하면, 집단 크기 100 x 세대 수 500 = 5만 번의 학습이 필요해진다.
- **조기 수렴**: 선택 압력이 강하거나 집단이 작으면, 다양성이 빠르게 소실되어 지역 최적에 갇힌다. 교차 연산도 부모가 유사하면 자식 역시 유사해져 탈출이 어렵다.
- **이론적 기반 부재**: 스키마 이론의 한계 이후, EA의 성공을 설명하는 포괄적 이론이 없다. 실무에서는 집단 크기, 선택 방법, 교차/돌연변이 확률을 문제마다 시행착오로 조정해야 하며, 보편적 설정 지침이 부족하다.

## 용어 정리

자연선택(natural selection) - 적합도가 높은 개체가 더 많이 생존하고 번식하여, 그 형질이 다음 세대에 퍼지는 진화의 메커니즘

적합도(fitness) - 생물학에서 개체의 생존과 번식 성공률. EA에서는 목적 함수 값으로 해의 품질을 정량화한 것

집단(population) - EA에서 동시에 유지하는 해의 집합. 보통 수십~수천 개로 구성되며, 세대마다 선택/교차/돌연변이를 거쳐 갱신

교차(crossover) - 두 부모 해의 유전 정보를 결합하여 자식 해를 생성하는 연산. 유성생식에서 부모의 염색체가 재조합되는 과정을 직접 차용

돌연변이(mutation) - 해의 일부를 랜덤으로 변경하는 연산. 집단에 새로운 변이를 도입하여 다양성을 유지하고 미탐색 영역을 개척

스키마(schema) - GA에서 특정 위치의 값이 고정되고 나머지는 와일드카드인 패턴. Holland가 GA 분석의 기본 단위로 제안했으나 이론적 한계가 밝혀짐

자기적응(self-adaptation) - 진화 전략(ES)에서 돌연변이 스텝 크기 같은 전략 파라미터를 해와 함께 진화시키는 메커니즘. 문제의 난이도에 자동 적응

조기 수렴(premature convergence) - 집단의 다양성이 빠르게 소실되어, 전역 최적에 도달하기 전에 탐색이 사실상 멈추는 현상

토너먼트 선택(tournament selection) - 집단에서 k개를 랜덤 추출하여 그중 최고 적합도를 가진 개체를 부모로 뽑는 선택 방식. k로 선택 압력을 조절

신경진화(neuroevolution) - 진화 알고리즘으로 신경망의 가중치, 구조, 학습 규칙을 최적화하는 분야. NEAT, HyperNEAT 등이 대표적

---EN---
Evolutionary Algorithms - An optimization technique that directly borrows natural selection to evolve a population of solutions across generations

## The Three Conditions of Natural Selection

Darwin's (1859) theory of natural selection operates when three conditions are met simultaneously. First, **variation** exists among individuals -- even within the same species, body size, running speed, and disease resistance differ. Second, that variation is **heritable** -- parental traits are passed to offspring. Third, variation creates differences in **fitness** -- during drought, plants with deeper roots survive more and spread more seeds.

When all three conditions hold, selection happens automatically. Traits with higher fitness spread through the population across generations while less fit traits disappear. Mendel's (1866) genetics explained this through particulate inheritance units (genes), and in the early 20th century Fisher, Haldane, and Wright completed the Modern Synthesis, unifying natural selection with genetics.

Spatially, evolution is like searching for peaks (high fitness) across a vast mountain range. Not a single explorer but **thousands of scouts** spread out simultaneously -- those at higher elevations leave more descendants, and descendants start near their parents but move in slightly different directions. Over generations, the entire expedition converges toward the peaks.

## From Biology to Algorithm

The computational translation of this principle is the Evolutionary Algorithm (EA). It emerged almost simultaneously on three continents from researchers unaware of each other.

In the US, Holland (1975) proposed the Genetic Algorithm (GA). Solutions are encoded as binary strings, with fitness-proportionate selection, crossover, and mutation applied. In Germany, Rechenberg (1973) and Schwefel (1977) developed Evolution Strategies (ES). Working directly with real-valued vectors, the key innovation was self-adaptation -- evolving the mutation step sizes themselves. In the US, Koza (1992) proposed Genetic Programming (GP), which evolves **programs (tree structures)** rather than strings.

All three share the same biological skeleton but differ in solution representation and variation operators. The key correspondences are:

- Organism --> **one candidate solution** (binary string, real vector, tree, etc.)
- Population --> **set of solutions maintained simultaneously** (typically tens to thousands)
- Gene --> **component of a solution** (bit in a string, element in a vector)
- Fitness --> **objective function value** (the quantity to maximize or minimize)
- Natural selection --> **selection operator** (preferring higher-fitness solutions as parents)
- Sexual reproduction --> **crossover operator** (combining information from two parents)
- Mutation --> **mutation operator** (randomly altering part of a solution)
- Generation turnover --> **one iteration cycle**

## Genetic Algorithm: One Generation's Flow

One generation of a GA proceeds in six steps:

1. **Initialization**: Randomly generate N solutions (individuals) to form the initial population. With binary encoding, this means N binary strings of length L
2. **Fitness evaluation**: Compute each individual's objective function value
3. **Selection**: Higher-fitness individuals are more likely to be chosen as parents. In fitness-proportionate selection, the probability of selecting individual i is P_i = f_i / (f_1 + f_2 + ... + f_N). An individual with fitness 10 is chosen 5 times more often than one with fitness 2
4. **Crossover**: Combine genetic information from parent pairs to produce offspring. The simplest one-point crossover picks a split point and takes everything before it from parent A and after it from parent B. Example: parent A = 11100, parent B = 00011, crossover point 3 --> offspring = 11111
5. **Mutation**: Randomly alter portions of offspring's genetic information. For binary encoding, each bit is flipped with probability p_m, typically set low at 0.001 to 0.01
6. **Replacement**: The offspring generation replaces the parent generation (generational), or parents and offspring are combined and the top N kept (steady-state)

Repeating this process for hundreds to thousands of generations raises the entire population's fitness.

## Balancing Selection Pressure and Diversity

The core tradeoff of EA is the tension between **selection pressure** and **population diversity**.

Strong selection pressure causes high-fitness individuals to dominate quickly. Convergence is fast, but the population becomes homogeneous, risking premature convergence where search stalls. Returning to the mountain range metaphor, the entire expedition crowds onto one hill and never discovers higher peaks on other mountain ranges.

Weak selection pressure maintains diversity but slows the spread of good solutions, delaying convergence. To balance this, tournament selection is widely used in practice. It randomly draws k individuals from the population and picks the best as a parent -- adjusting k directly controls selection pressure. k = 2 is gentle; k = 7 is aggressive.

Mutation is the last line of defense for diversity. Crossover alone cannot create genetic information absent from both parents, but mutation introduces entirely new variations. If crossover combines existing good traits, mutation sends probes into unexplored regions.

## Schema Theorem: The First Theoretical Explanation and Its Limits

Holland's Schema Theorem was the first attempt to explain **why** GA works. A schema is a pattern with specific values at certain positions and wildcards elsewhere. For example, 1**0*1 is a schema with positions 1, 4, and 6 fixed.

The approximate expression of the Schema Theorem is:

E[m(H, t+1)] >= m(H, t) * f(H)/f_avg * (1 - p_c * d(H)/(l-1)) * (1 - p_m)^o(H)

Unpacking each term: m(H, t) is the count of individuals belonging to schema H at generation t. f(H)/f_avg is the schema's average fitness divided by the population's overall average -- when this ratio exceeds 1, the schema grows. (1 - p_c * d(H)/(l-1)) is the survival probability against crossover disruption, where d(H) (defining length, maximum distance between fixed positions) being shorter means higher survival. (1 - p_m)^o(H) is the survival probability against mutation, where o(H) (order, number of fixed positions) being lower means safer.

The theorem's conclusion: **schemas that are fit, short, and low-order** grow exponentially across generations. Holland called this GA's "implicit parallelism."

However, this theory has received extensive criticism. It provides a lower bound, not an equality; it ignores inter-schema interactions (epistasis); and it fails to accurately predict actual GA behavior. Wright et al. (2003) among others argued the Schema Theorem is insufficient to explain GA's success. A comprehensive theory of why EA works remains absent.

## Connections to Modern AI

EA's idea of "evolving a population to find solutions" is employed throughout modern AI. However, the nature of each connection differs.

**Direct application of biological evolution principles:**

- **Neural Architecture Search (NAS)**: Real et al.'s (2019) AmoebaNet encoded neural network layer configurations and connection patterns as genes, evolving architectures through crossover and mutation. It matched RL-based NAS performance on ImageNet. Here fitness is validation accuracy, and each individual is one architecture blueprint.
- **NEAT (NeuroEvolution of Augmenting Topologies)**: Stanley & Miikkulainen (2002) evolved not only neural network weights but also structure. Mutations add nodes and connections, growing networks from simple to complex, while historical markers ensure structural consistency during crossover -- borrowing the biological concept of homology.
- **CMA-ES**: Hansen & Ostermeier (2001) evolved the covariance matrix of the mutation distribution. Automatically adapting to the objective function's landscape geometry, this method became the standard benchmark for black-box continuous optimization -- the self-adaptation principle of ES taken to its limit.

**Structural similarities sharing the same intuition independently:**

- **SGD mini-batch noise**: The random gradient fluctuations from mini-batches in stochastic gradient descent effectively explore multiple regions of the loss surface. This is functionally similar to EA's population maintaining diverse points across the solution space, but SGD was not inspired by EA.
- **Ensemble learning**: Training multiple models simultaneously and combining them for better performance than any single model shares the structural principle of EA that "maintaining diverse individuals is more robust than a single individual." However, ensembles developed independently from statistics (bias-variance decomposition).

A notable point is the relationship between EA and gradient descent. Taking fitness-weighted averages in ES is mathematically equivalent to estimating the gradient of log-fitness (score function estimator). Salimans et al. (2017, OpenAI) leveraged this to optimize millions of parameters on Atari games without backpropagation. In other words, ES does not "avoid gradients" but rather "estimates gradients differently."

## Limitations and Weaknesses

- **Efficiency vs. gradients**: On problems where gradients are computable, EA is several to thousands of times slower than gradient descent. Directly optimizing deep learning's millions to billions of parameters with EA is impractical; EA's true strength lies where the objective is non-differentiable or the solution space is discrete.
- **Fitness evaluation cost**: Every generation, every individual requires fitness evaluation. When one evaluation demands full neural network training, as in NAS, population size 100 x 500 generations = 50,000 training runs.
- **Premature convergence**: With strong selection pressure or small populations, diversity is lost rapidly, trapping the search in local optima. Crossover also becomes ineffective when parents are similar, as offspring will be similar too.
- **Absent theoretical foundation**: After the Schema Theorem's limitations were exposed, no comprehensive theory explains EA's success. In practice, population size, selection method, and crossover/mutation probabilities must be tuned per problem through trial and error, with no universal guidelines.

## Glossary

Natural selection - the evolutionary mechanism by which individuals with higher fitness survive and reproduce more, spreading their traits to subsequent generations

Fitness - in biology, an organism's survival and reproductive success rate; in EA, a quantification of solution quality via the objective function value

Population - the set of solutions maintained simultaneously in EA, typically tens to thousands, updated each generation through selection, crossover, and mutation

Crossover - an operation combining genetic information from two parent solutions to produce offspring, directly borrowed from chromosomal recombination in sexual reproduction

Mutation - an operation randomly altering part of a solution, introducing new variation to maintain diversity and explore uncharted regions

Schema - a pattern in GA with fixed values at certain positions and wildcards elsewhere; proposed by Holland as the basic analytical unit, though its theoretical limitations have since been established

Self-adaptation - a mechanism in Evolution Strategies that evolves strategy parameters (such as mutation step sizes) alongside the solutions themselves, automatically adapting to problem difficulty

Premature convergence - the phenomenon where population diversity is lost rapidly, effectively halting search before the global optimum is reached

Tournament selection - a selection method that randomly draws k individuals from the population and picks the one with highest fitness as a parent; k controls selection pressure

Neuroevolution - the field of optimizing neural network weights, architectures, and learning rules using evolutionary algorithms, with NEAT and HyperNEAT as notable examples
