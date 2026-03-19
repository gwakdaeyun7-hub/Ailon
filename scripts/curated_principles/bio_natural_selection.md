---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 자연선택, 유전 알고리즘, 적합도 함수, 돌연변이, 교차, 집단 다양성, 탐색 공간
keywords_en: natural selection, genetic algorithm, fitness function, mutation, crossover, population diversity, search space
---
Natural Selection - 다윈의 자연선택 메커니즘에서 직접 영감을 받은 집단 기반 최적화 기법

## 자연선택의 생물학적 원리

갈라파고스 핀치새의 부리 길이는 같은 종 안에서도 개체마다 다르다. 1977년 대가뭄이 갈라파고스를 덮쳤을 때 작고 부드러운 씨앗이 사라지자, 크고 단단한 씨앗을 깰 수 있는 굵은 부리를 가진 개체들이 살아남았다. 가뭄이 끝나고 다음 세대를 조사하자 평균 부리 깊이가 이전 세대보다 4% 증가해 있었다. Peter와 Rosemary Grant 부부가 1973년부터 40년간 기록한 이 데이터는 자연선택이 실제로 세대 간 변화를 만들어내는 과정을 직접 보여준다.

Charles Darwin(1859)이 "종의 기원"에서 정리한 자연선택은 세 가지 조건이 동시에 충족될 때 작동한다. 첫째, 개체 사이에 **변이(variation)**가 존재한다. 둘째, 변이가 생존과 번식 성공률에 영향을 미쳐 **차별적 생존(differential survival)**이 일어난다. 셋째, 유리한 형질이 다음 세대로 **유전(heredity)**된다. 이 세 조건이 수백 세대 반복되면 환경에 적합한 형질이 집단 전체로 퍼진다. 핵심은 설계자가 없다는 것이다. 어떤 형질이 "좋은지" 미리 정해진 것이 아니라, 그때그때의 환경이 걸러낸다.

## 생물학에서 알고리즘으로

이 원리를 계산에 처음 도입한 것은 별개의 두 갈래에서 거의 동시에 일어났다. John Holland(1975)는 "자연 시스템과 인공 시스템에서의 적응"에서 유전 알고리즘(Genetic Algorithm, GA)을 체계화했다. 그는 이진 문자열(0과 1의 나열)로 후보 해를 표현하고, 자연선택의 선택-변이-유전 사이클을 반복해 최적화하는 틀을 만들었다. 독립적으로 Ingo Rechenberg(1973)와 Hans-Paul Schwefel은 독일에서 진화 전략(Evolution Strategy, ES)을 개발했다. 이들은 제트 노즐 형상 최적화라는 공학 문제에서 출발했고, 실수 벡터에 가우시안 노이즈를 더하는 돌연변이를 핵심으로 사용했다. 핵심 대응 관계는 다음과 같다.

- 개체의 유전자형(genotype) --> **후보 해의 부호화** (비트열 또는 실수 벡터)
- 환경에서의 생존 능력 --> **목적 함수 값** (적합도, fitness)
- 자연선택 --> **적합도에 비례하는 선택** (더 좋은 해가 살아남을 확률이 높다)
- 유전적 돌연변이 --> **해의 무작위 변형** (탐색 공간 탐험)
- 유성생식의 유전자 재조합 --> **두 해의 교차** (좋은 부분끼리 결합)
- 세대 교체 --> **반복(iteration)**

## 유전 알고리즘의 한 세대: 선택에서 교체까지

GA의 각 세대는 네 단계를 순서대로 밟는다.

1. **적합도 평가**: 집단 내 모든 개체(후보 해)의 목적 함수 값을 계산한다
2. **선택**: 적합도가 높은 개체를 부모로 뽑는다. 룰렛 휠 선택에서 개체 i가 뽑힐 확률은 P(i) = f_i / sum(f_j)이다. 적합도가 전체의 10%를 차지하는 개체는 부모로 뽑힐 확률이 10%다
3. **교차와 돌연변이**: 두 부모의 유전자열을 교차 확률 p_c(보통 0.6~0.9)로 결합한다. 단일점 교차는 유전자열의 한 지점을 무작위로 골라 그 앞은 부모 A에서, 뒤는 부모 B에서 가져온다. 이후 각 유전자 위치를 돌연변이 확률 p_m(보통 1/L, L은 유전자 길이)으로 뒤집는다. 길이 100의 비트열이라면 평균적으로 1개의 비트가 반전된다
4. **세대 교체**: 새로 만들어진 자손이 기존 집단을 대체하고 1단계로 돌아간다

## 집단 다양성과 선택압의 균형

SA가 온도 하나로 탐색-활용 균형을 조절했듯, GA는 **집단 다양성(population diversity)**과 **선택압(selection pressure)** 사이의 균형이 성능을 좌우한다.

Ronald Fisher(1930)의 기본 정리는 "자연선택에 의한 적합도 증가율은 적합도의 유전적 분산에 비례한다"고 진술한다. 즉 집단이 다양할수록 진화가 빨라진다. 이것이 진화 알고리즘에서 다양성 관리의 이론적 근거가 된다.

- **선택압이 너무 강하면**: 적합도 높은 소수의 개체만 살아남아 집단이 균일해지고 지역 최적에 빠진다. 이를 **조기 수렴(premature convergence)**이라 부른다
- **선택압이 너무 약하면**: 적합도와 무관하게 개체가 살아남아 무작위 탐색과 다를 바 없다
- **돌연변이가 너무 높으면**: 교차로 만들어진 좋은 조합이 파괴된다
- **돌연변이가 너무 낮으면**: 새로운 유전자 조합이 등장하지 못해 탐색 범위가 좁아진다

## 라마르크주의: 생물학에서는 틀렸지만 AI에서는 작동하는 원리

진화 연산과 생물학 사이의 가장 주목할 만한 차이가 여기 있다. Jean-Baptiste Lamarck가 제안한 "획득 형질의 유전"은 생물학에서 완전히 반증되었다. 대장장이가 팔 근육을 키워도 자녀가 근육질로 태어나지 않는다. DNA는 체세포의 경험을 생식세포에 기록하지 않는다. 분자생물학의 중심원리(Central Dogma)에 따르면 정보는 DNA에서 RNA로, RNA에서 단백질로만 흐른다.

그러나 AI에서는 이것이 **실제로 작동한다**. 신경망의 가중치(학습으로 얻은 지식)를 진화 과정에서 자손에게 직접 전달할 수 있다. NEAT(NeuroEvolution of Augmenting Topologies, Stanley & Miikkulainen, 2002)에서는 네트워크 구조와 가중치가 함께 진화하며, 부모가 학습한 가중치가 자손의 출발점이 된다. 사전 학습된 모델을 미세조정(fine-tuning)하는 것도 넓게 보면 같은 구조다. GPT 계열 모델의 사전 학습 가중치를 "부모 세대의 지식"이라 보면, 이를 물려받아 특정 과제에 적응시키는 것은 획득 형질의 유전과 닮았다.

## 현대 AI 기법과의 연결

자연선택의 "변이-선택-유전" 사이클은 현대 AI 곳곳에 변형되어 살아 있다. 다만 각 연결의 성격은 다르다.

**자연선택에서 직접 영감을 받은 기법:**

- **유전 프로그래밍(Genetic Programming, Koza 1992)**: 해를 비트열이 아닌 트리 구조의 실행 가능한 프로그램으로 표현하여, 선택-교차-돌연변이로 프로그램 자체를 진화시킨다. 자연선택의 번역이 데이터 구조에서 프로그램 코드로 확장된 것이다.
- **NEAT(NeuroEvolution of Augmenting Topologies, Stanley & Miikkulainen 2002)**: 신경망의 구조(토폴로지)와 가중치를 동시에 진화시킨다. 종분화(speciation) 메커니즘으로 구조가 다른 개체들이 같은 적합도 기준으로 경쟁하지 않도록 보호하는데, 이는 자연의 생태적 지위(ecological niche) 분화와 직접 대응한다.
- **신경 아키텍처 탐색(NAS)**: Real et al.(2019)의 AmoebaNet은 진화 전략을 사용하여 ImageNet에서 인간 설계 아키텍처에 필적하는 성능을 달성했다. 수백 개의 신경망 "종"을 세대별로 진화시켜 최적 구조를 탐색하는 것이다.

## 한계와 약점

- **적합도 함수 설계 문제**: 자연에는 "목적 함수"가 없다. 환경 자체가 선택압이며 끊임없이 변한다. 알고리즘은 미리 정의된 적합도 함수를 전제하므로, 함수를 잘못 설계하면 원하는 것과 다른 방향으로 진화가 진행된다. 이른바 적합도 해킹(fitness hacking) 문제다
- **계산 비용**: 적합도 평가가 비싸면(시뮬레이션 기반 평가, 물리 실험 등) 수백 개체 x 수천 세대의 비용이 감당하기 어렵다. 경사하강법이 적용 가능한 연속 최적화에서는 거의 항상 GA보다 빠르다. 현대 딥러닝의 수십억 파라미터 공간에서 순수 진화 접근은 실용적이지 않다
- **교차의 파괴성**: 생물학적 교차는 같은 종의 상동 염색체 사이에서 일어나며 유전체 구조가 보존된다. 알고리즘의 교차는 임의의 두 해를 기계적으로 결합하므로, 의미 있는 부분 패턴(building block)이 파괴될 수 있다
- **수렴 보장의 부재**: 유한 시간 내 전역 최적해 도달을 보장하지 않는다. 조기 수렴으로 다양성이 소실되면 지역 최적에 빠지며, 이를 감지하고 회복하는 메커니즘을 별도로 설계해야 한다

## 용어 정리

자연선택(natural selection) - 환경에 더 적합한 형질을 가진 개체가 더 많이 생존하고 번식하여, 그 형질이 세대를 거쳐 집단에 퍼지는 메커니즘

적합도(fitness) - 생물학에서 개체의 생존과 번식 성공 정도. 진화 알고리즘에서는 목적 함수 값으로, 해가 얼마나 좋은지를 나타낸다

돌연변이(mutation) - 유전 정보의 무작위 변형. 생물학에서 DNA 복제 오류, 알고리즘에서 해의 랜덤 변형으로 새로운 탐색 영역을 여는 역할

교차(crossover) - 두 부모의 유전 정보를 결합해 새 자손을 만드는 연산. 유성생식의 유전자 재조합에서 영감을 받았으나, 실제 생물학적 재조합보다 크게 단순화되었다

유전 알고리즘(genetic algorithm) - Holland(1975)가 체계화한, 자연선택의 선택-변이-유전 사이클을 모방한 집단 기반 최적화 기법

조기 수렴(premature convergence) - 집단의 다양성이 너무 빨리 소실되어 탐색이 멈추고 지역 최적에 갇히는 현상

라마르크주의(Lamarckism) - 살면서 획득한 형질이 자손에게 유전된다는 이론. 생물학에서는 반증되었으나 AI에서는 학습된 가중치 전달로 유효하게 작동한다

파레토 프론트(Pareto front) - 다목적 최적화에서 어떤 목적도 다른 목적을 희생하지 않고는 더 개선할 수 없는 해들의 집합
---EN---
Natural Selection - A population-based optimization technique directly inspired by Darwin's mechanism of natural selection

## The Biological Principle of Natural Selection

Beak length varies among individual finches even within the same species on the Galapagos Islands. When a severe drought struck the Galapagos in 1977, small soft seeds disappeared, and only individuals with thick beaks capable of cracking large hard seeds survived. When the next generation was surveyed after the drought, average beak depth had increased 4% over the previous generation. This data, recorded by Peter and Rosemary Grant over 40 years starting in 1973, directly demonstrates natural selection producing measurable change across generations.

Natural selection, as Charles Darwin (1859) articulated in "On the Origin of Species," operates when three conditions are simultaneously met. First, **variation** exists among individuals. Second, that variation affects survival and reproductive success, causing **differential survival**. Third, advantageous traits are **inherited** by the next generation. When these three conditions repeat over hundreds of generations, traits suited to the environment spread through the entire population. The key point is that there is no designer. Which traits are "good" is not predetermined -- the environment at any given moment does the filtering.

## From Biology to Algorithm

The computational adoption of this principle happened nearly simultaneously along two independent lines. John Holland (1975) formalized the Genetic Algorithm (GA) in "Adaptation in Natural and Artificial Systems." He represented candidate solutions as binary strings (sequences of 0s and 1s) and created a framework that optimizes by repeating the selection-variation-heredity cycle of natural selection. Independently, Ingo Rechenberg (1973) and Hans-Paul Schwefel developed Evolution Strategies (ES) in Germany. They started from the engineering problem of jet nozzle shape optimization, using Gaussian noise added to real-valued vectors as their primary mutation operator. The key correspondences are:

- Biological genotype --> **candidate solution encoding** (bit strings or real-valued vectors)
- Survival ability in environment --> **objective function value** (fitness)
- Natural selection --> **fitness-proportionate selection** (better solutions are more likely to survive)
- Genetic mutation --> **random perturbation of solutions** (exploring the search space)
- Genetic recombination in sexual reproduction --> **crossover of two solutions** (combining good parts)
- Generational replacement --> **iteration**

## One Generation of a Genetic Algorithm: From Selection to Replacement

Each generation of a GA follows four steps in order:

1. **Fitness evaluation**: Calculate the objective function value for every individual (candidate solution) in the population
2. **Selection**: Choose high-fitness individuals as parents. In roulette wheel selection, the probability of selecting individual i is P(i) = f_i / sum(f_j). An individual accounting for 10% of total fitness has a 10% chance of being selected as a parent
3. **Crossover and mutation**: Combine two parents' gene strings with crossover probability p_c (typically 0.6-0.9). One-point crossover randomly picks a point in the gene string and takes everything before it from parent A and after it from parent B. Then flip each gene position with mutation probability p_m (typically 1/L, where L is gene length). For a 100-bit string, on average 1 bit is flipped
4. **Generational replacement**: The newly created offspring replace the existing population, and the process returns to step 1

## Balancing Population Diversity and Selection Pressure

Just as SA regulates the exploration-exploitation balance through a single temperature parameter, GA's performance hinges on the balance between **population diversity** and **selection pressure**.

Ronald Fisher's (1930) fundamental theorem states that "the rate of increase in fitness due to natural selection is proportional to the genetic variance in fitness." In other words, the more diverse the population, the faster evolution proceeds. This became the theoretical basis for diversity management in evolutionary algorithms.

- **Selection pressure too strong**: Only a few high-fitness individuals survive, making the population uniform. The search digs into only one region and falls into a local optimum. This is called **premature convergence**
- **Selection pressure too weak**: Individuals survive regardless of fitness, making the search no different from random exploration. The population fails to converge toward better solutions even after many generations
- **Mutation rate too high**: Good combinations created by crossover are destroyed. Genetic memory is not maintained
- **Mutation rate too low**: New gene combinations cannot emerge, narrowing the search range

## Lamarckism: Wrong in Biology, Operational in AI

The most notable divergence between evolutionary computation and biology lies here. Jean-Baptiste Lamarck's "inheritance of acquired characteristics" has been thoroughly disproven in biology. A blacksmith building arm muscle does not produce muscular children. DNA does not record somatic cell experiences in germ cells. According to molecular biology's Central Dogma, information flows only from DNA to RNA to protein.

Yet in AI, this **actually works**. Neural network weights (knowledge gained through learning) can be directly transmitted to offspring during evolution. In NEAT (NeuroEvolution of Augmenting Topologies, Stanley & Miikkulainen, 2002), network structure and weights evolve together, and a parent's learned weights become the offspring's starting point. Fine-tuning a pretrained model follows the same structure in broad terms. If GPT's pretrained weights are viewed as "ancestral knowledge," inheriting them and adapting to a specific task resembles inheritance of acquired characteristics.

## Connections to Modern AI

Natural selection's "variation-selection-heredity" cycle lives on in transformed forms across modern AI. However, the nature of each connection differs.

**Techniques directly inspired by natural selection:**

- **Genetic Programming (Koza, 1992)**: Represents solutions not as bit strings but as tree-structured executable programs, evolving the programs themselves through selection, crossover, and mutation. The translation of natural selection extended from data structures to program code.
- **NEAT (NeuroEvolution of Augmenting Topologies, Stanley & Miikkulainen, 2002)**: Simultaneously evolves both neural network topology and weights. A speciation mechanism protects structurally different individuals from competing under the same fitness criteria -- directly corresponding to ecological niche differentiation in nature.
- **Neural Architecture Search (NAS)**: Real et al.'s (2019) AmoebaNet used evolutionary strategies to achieve performance rivaling human-designed architectures on ImageNet. It evolves hundreds of neural network "species" generation by generation to discover optimal structures.

## Limitations and Weaknesses

- **Fitness function design problem**: Nature has no "objective function." The environment itself is the selection pressure and constantly changes. Algorithms presuppose a predefined fitness function, so a poorly designed function drives evolution in unintended directions -- the so-called fitness hacking problem
- **Computational cost**: When fitness evaluation is expensive (simulation-based evaluation, physical experiments, etc.), the cost of hundreds of individuals over thousands of generations becomes prohibitive. Gradient descent is nearly always faster for continuous optimization where gradients are available. Pure evolutionary approaches are impractical for modern deep learning's billions of parameters
- **Destructive crossover**: Biological crossover occurs between homologous chromosomes of the same species, preserving genome structure. Algorithmic crossover mechanically combines arbitrary solutions, potentially destroying meaningful partial patterns (building blocks)
- **No convergence guarantee**: Global optimum is not guaranteed within finite time. When premature convergence causes diversity loss, the search gets trapped in local optima, requiring separately designed mechanisms for detection and recovery

## Glossary

Natural selection - the mechanism by which individuals with traits better suited to the environment survive and reproduce more, spreading those traits across generations

Fitness - in biology, the degree of survival and reproductive success. In evolutionary algorithms, the objective function value indicating how good a solution is

Mutation - random alteration of genetic information. DNA replication errors in biology; random perturbation of solutions in algorithms, opening new search regions

Crossover - an operation combining genetic information from two parents to create new offspring. Inspired by genetic recombination in sexual reproduction but greatly simplified compared to actual biological recombination

Genetic algorithm - a population-based optimization technique formalized by Holland (1975), mimicking the selection-variation-heredity cycle of natural selection

Premature convergence - the phenomenon where population diversity is lost too quickly, halting search and trapping it in local optima

Lamarckism - the theory that traits acquired during a lifetime are inherited by offspring. Disproven in biology but effectively operational in AI through learned weight transfer

Pareto front - in multi-objective optimization, the set of solutions where no objective can be improved without sacrificing another
