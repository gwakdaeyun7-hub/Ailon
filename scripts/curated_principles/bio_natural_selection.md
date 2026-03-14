---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 자연선택, 진화 연산, 유전 알고리즘, 적합도, 돌연변이, 교차, 진화 전략, 신경진화
keywords_en: natural selection, evolutionary computation, genetic algorithm, fitness, mutation, crossover, evolution strategy, neuroevolution
---
Natural Selection and Evolutionary Computation - 다윈의 자연선택이 직접 영감을 준 계산적 진화 기법

## 자연선택의 생물학적 메커니즘

Charles Darwin(1859)이 "종의 기원"에서 제시한 자연선택은 세 가지 조건이 충족될 때 작동한다. 첫째, 개체 간 **변이(variation)**가 존재해야 한다. 같은 종이라도 개체마다 형질이 다르다. 둘째, 이 변이가 생존과 번식 성공률에 영향을 미쳐 **차별적 선택(differential selection)**이 일어난다. 셋째, 유리한 형질이 다음 세대로 **유전(heredity)**된다. 이 세 조건이 수많은 세대에 걸쳐 반복되면 환경에 적합한 형질이 집단 내에 퍼져나간다. 이것이 적응(adaptation)이다.

Gregor Mendel(1866)이 완두콩 실험으로 유전의 입자적 특성을 밝혔고, Ronald Fisher(1930)는 "자연선택의 유전학적 이론"에서 멘델 유전학과 다윈 진화론을 수학적으로 통합했다. Fisher의 기본 정리(fundamental theorem)는 "자연선택에 의한 적합도의 변화율은 적합도의 유전적 분산에 비례한다"라고 기술한다. 즉, 집단 내 유전적 다양성이 클수록 진화 속도가 빨라진다. 이 정리가 훗날 진화 알고리즘에서 집단 다양성(population diversity) 관리의 이론적 근거가 된다.

## 생물학에서 알고리즘으로: 번역된 것과 버려진 것

John Holland(1975)는 "자연 시스템과 인공 시스템에서의 적응"에서 유전 알고리즘(Genetic Algorithm, GA)을 체계화했다. Ingo Rechenberg(1973)와 Hans-Paul Schwefel은 독립적으로 진화 전략(Evolution Strategy, ES)을 개발했다. 이들은 자연선택의 핵심 메커니즘을 계산으로 번역했다.

대응 관계는 다음과 같다.

- 생물의 유전자형(genotype) --> 후보 해의 부호화(encoding, 비트열 또는 실수 벡터)
- 표현형(phenotype) --> 부호화를 해석한 실제 해
- 환경 적합도 --> 목적 함수(fitness function)
- 자연선택 --> 적합도에 비례하는 선택(selection)
- 유전적 돌연변이 --> 해의 랜덤 변형(mutation)
- 유성생식의 유전자 재조합 --> 두 해의 교차(crossover)
- 세대 교체 --> 반복(iteration)

그러나 **버려진 것**도 있다. 생물학적 진화에는 목적 함수가 없다. 환경 자체가 끊임없이 변하고, "더 나은" 방향이 미리 정해져 있지 않다. 알고리즘은 명시적 목적 함수를 전제한다. 또한 자연에서 한 세대는 수년에서 수십 년이지만, 알고리즘은 밀리초 단위로 세대를 반복한다. 시간 척도의 압축이 일어난다.

## 핵심 수식: 적합도 비례 선택과 변이 연산

적합도 비례 선택(fitness-proportionate selection, 룰렛 휠)은 가장 직관적인 선택 방식이다.

P(select_i) = f_i / sum_j(f_j)

여기서 f_i는 개체 i의 적합도, sum_j(f_j)는 전체 집단의 적합도 합이다. 적합도가 높을수록 선택될 확률이 높다. 이는 자연에서 "더 적합한 개체가 더 많은 자손을 남길 확률이 높다"는 것의 수학적 표현이다.

돌연변이율(mutation rate) p_m은 각 유전자 위치가 변형될 확률이다. 이진 인코딩에서는 비트 반전, 실수 인코딩에서는 가우시안 노이즈 추가로 구현한다. 일반적으로 p_m = 1/L (L은 유전자 길이)로 설정하여 평균적으로 한 개체당 1개의 유전자가 변이된다.

교차 확률(crossover probability) p_c는 두 부모 해가 결합될 확률로, 보통 0.6~0.9 사이로 설정한다. 단일점 교차(one-point crossover)는 유전자열의 한 지점을 무작위로 선택하여 그 앞뒤를 두 부모에서 각각 가져온다. 이는 유성생식에서의 감수분열과 교차(crossing over)에 대응하지만, 실제 생물학적 재조합의 복잡성(연관 불평형, 핫스팟 등)은 크게 단순화되었다.

## 라마르크주의: 생물학에서는 틀렸지만 AI에서는 유효한 원리

Jean-Baptiste Lamarck는 "획득 형질의 유전" -- 개체가 살아가며 얻은 특성이 자손에게 전달된다는 이론을 제시했다. 이는 생물학적으로 완전히 반증되었다. 기린이 목을 늘려 먹이를 먹어도 자손의 목이 길어지지 않는다. DNA는 체세포의 경험을 생식세포에 기록하지 않는다.

그러나 AI에서는 이것이 **실제로 작동한다**. 이것이 진화 연산과 생물학 사이의 가장 매력적인 차이점이다. 신경망의 가중치(학습된 지식)를 진화 과정에서 직접 자손에게 전달할 수 있다. Fine-tuning(미세조정)은 사전 학습된 모델의 가중치를 상속받아 새로운 과제에 적응시킨다. NEAT(NeuroEvolution of Augmenting Topologies, Stanley & Miikkulainen, 2002)에서 네트워크 구조와 가중치가 함께 진화한다. 이런 Lamarckian inheritance는 탐색 효율을 극적으로 높인다.

생물학에서의 Central Dogma(DNA → RNA → 단백질 방향으로만 정보가 흐른다)가 깨지지 않는 한 라마르크는 생물학에서 틀린 채로 남는다. 하지만 AI에서는 "학습 → 유전" 방향의 정보 흐름이 자유롭다. 같은 영감에서 출발했지만, 매체의 차이(탄소 vs 실리콘)가 근본적으로 다른 가능성을 열어준 사례다.

## 현대적 발전: 진화 연산의 확장

GA와 ES를 넘어 진화적 아이디어는 여러 방향으로 확장되었다.

- **유전 프로그래밍(Genetic Programming, Koza 1992)**: 프로그램 자체를 트리 구조로 표현하여 진화시킨다. 해의 구조가 고정되지 않고 함께 진화한다는 점에서 자연의 진화에 더 가깝다.
- **신경진화(Neuroevolution)**: NEAT(Stanley & Miikkulainen, 2002)는 신경망의 구조(노드, 연결)와 가중치를 동시에 진화시킨다. OpenAI의 Evolution Strategies(Salimans et al., 2017)는 대규모 병렬 ES로 Atari 게임에서 강화학습에 필적하는 성능을 보여줬다.
- **다목적 최적화(Multi-objective)**: NSGA-II(Deb et al., 2002)는 여러 목적 함수를 동시에 최적화하는 파레토 프론트(Pareto front)를 탐색한다. 자연에서 "생존"과 "번식"이 별개의 선택압인 것처럼, 여러 기준의 균형을 찾는다.
- **AutoML과 NAS**: Neural Architecture Search(Zoph & Le, 2017)의 초기 버전은 강화학습을 사용했지만, 이후 진화적 접근(Real et al., 2019)이 경쟁력 있는 대안으로 부상했다.

## 한계와 약점

진화 연산은 강력하지만 근본적 한계가 있다.

- **목적 함수의 존재**: 자연선택에는 "목적"이 없다. 환경이 선택압이고, 환경 자체가 변한다. 알고리즘은 미리 정의된 적합도 함수를 전제하므로, 적합도 함수 설계 자체가 문제의 핵심이 된다(fitness shaping 문제).
- **유성생식 유추의 약점**: 생물학적 교차는 같은 종의 상동 염색체 사이에서 일어나며 유전체 구조가 보존된다. 알고리즘의 교차는 임의의 두 해를 기계적으로 결합하므로, 의미 있는 building block이 파괴될 수 있다.
- **계산 비용**: 적합도 평가가 비싸면 (예: 시뮬레이션 기반 평가) 수천 세대 x 수백 개체의 평가 비용이 감당할 수 없게 된다. 경사하강법이 적용 가능한 연속 최적화 문제에서는 거의 항상 진화 알고리즘보다 빠르다.
- **수렴 보장 부재**: 유한 시간 내 전역 최적해 도달을 보장하지 않는다. 조기 수렴(premature convergence)으로 다양성이 소실되면 지역 최적에 빠진다.
- **스케일링**: 탐색 공간이 기하급수적으로 커지면 효율이 급감한다. 현대 딥러닝의 수십억 파라미터 공간에서 순수 진화 접근은 실용적이지 않다.

## 용어 정리

자연선택(natural selection) - 환경에 더 적합한 형질을 가진 개체가 더 많이 생존하고 번식하여 그 형질이 세대를 거쳐 퍼지는 메커니즘

적합도(fitness) - 생물학에서 개체의 생존과 번식 성공 정도. 진화 알고리즘에서 목적 함수 값

돌연변이(mutation) - 유전 정보의 무작위 변형. 생물학에서 DNA 복제 오류, 알고리즘에서 해의 무작위 변형

교차(crossover) - 두 부모의 유전 정보를 결합하여 새로운 자손을 만드는 연산. 유성생식의 유전자 재조합에서 영감

유전 알고리즘(genetic algorithm) - Holland(1975)가 체계화한, 자연선택을 모방한 메타휴리스틱 최적화 기법

진화 전략(evolution strategy) - Rechenberg(1973)가 개발한 실수 벡터 기반 진화 최적화. 돌연변이의 자기적응이 특징

라마르크주의(Lamarckism) - 획득 형질이 유전된다는 이론. 생물학에서는 반증되었으나 AI에서는 학습된 가중치 상속으로 유효하게 작동

신경진화(neuroevolution) - 신경망의 구조와 가중치를 진화적 방법으로 최적화하는 접근

파레토 프론트(Pareto front) - 다목적 최적화에서 어떤 목적도 다른 목적을 희생하지 않고는 개선할 수 없는 해의 집합

조기 수렴(premature convergence) - 진화 알고리즘에서 집단의 다양성이 너무 빨리 소실되어 지역 최적에 갇히는 현상

---EN---
Natural Selection and Evolutionary Computation - Computational evolution techniques directly inspired by Darwin's natural selection

## The Biological Mechanism of Natural Selection

Natural selection, as Charles Darwin (1859) presented in "On the Origin of Species," operates when three conditions are met. First, **variation** must exist among individuals -- even within the same species, traits differ. Second, these variations must affect survival and reproductive success, causing **differential selection**. Third, advantageous traits must be **inherited** by the next generation. When these three conditions repeat over countless generations, traits suited to the environment spread through the population. This is adaptation.

Gregor Mendel (1866) revealed the particulate nature of heredity through pea experiments, and Ronald Fisher (1930) mathematically unified Mendelian genetics with Darwinian evolution in "The Genetical Theory of Natural Selection." Fisher's fundamental theorem states that "the rate of increase in fitness due to natural selection is proportional to the genetic variance in fitness." In other words, the greater the genetic diversity in a population, the faster evolution proceeds. This theorem later became the theoretical basis for managing population diversity in evolutionary algorithms.

## From Biology to Algorithm: What Was Translated and What Was Discarded

John Holland (1975) formalized the Genetic Algorithm (GA) in "Adaptation in Natural and Artificial Systems." Independently, Ingo Rechenberg (1973) and Hans-Paul Schwefel developed Evolution Strategies (ES). They translated the core mechanisms of natural selection into computation.

The correspondences are as follows:

- Biological genotype --> candidate solution encoding (bit strings or real-valued vectors)
- Phenotype --> the actual solution derived from decoding
- Environmental fitness --> objective function (fitness function)
- Natural selection --> fitness-proportionate selection
- Genetic mutation --> random perturbation of solutions (mutation)
- Sexual reproduction's genetic recombination --> crossover of two solutions
- Generational replacement --> iteration

However, much was **discarded**. Biological evolution has no objective function. The environment itself constantly changes, and no "better" direction is predetermined. Algorithms presuppose an explicit objective function. Moreover, a biological generation spans years to decades, while algorithms iterate in milliseconds. A dramatic compression of time scale occurs.

## Core Formulas: Fitness-Proportionate Selection and Variation Operators

Fitness-proportionate selection (roulette wheel) is the most intuitive selection method:

P(select_i) = f_i / sum_j(f_j)

Here f_i is the fitness of individual i, and sum_j(f_j) is the total fitness of the population. Higher fitness means higher selection probability. This is the mathematical expression of "more fit individuals are more likely to leave more offspring."

The mutation rate p_m is the probability that each gene position is altered. In binary encoding, this is a bit flip; in real-valued encoding, Gaussian noise is added. Typically p_m = 1/L (where L is the gene length), so on average one gene per individual mutates.

The crossover probability p_c determines how often two parent solutions are combined, usually set between 0.6 and 0.9. One-point crossover randomly selects a point in the gene string and takes the portions before and after from each parent. This corresponds to meiotic crossing over in sexual reproduction, but the complexity of biological recombination (linkage disequilibrium, hotspots, etc.) is greatly simplified.

## Lamarckism: Wrong in Biology, Valid in AI

Jean-Baptiste Lamarck proposed "inheritance of acquired characteristics" -- the idea that traits gained during an organism's lifetime are passed to offspring. This has been thoroughly disproven in biology. A giraffe stretching its neck to reach food does not produce longer-necked offspring. DNA does not record somatic cell experiences in germ cells.

Yet in AI, this **actually works**. This is the most fascinating divergence between evolutionary computation and biology. Neural network weights (learned knowledge) can be directly passed to offspring during evolution. Fine-tuning inherits pretrained model weights and adapts them to new tasks. In NEAT (NeuroEvolution of Augmenting Topologies, Stanley & Miikkulainen, 2002), network structure and weights evolve together. Such Lamarckian inheritance dramatically increases search efficiency.

As long as the Central Dogma (information flows only from DNA to RNA to protein) holds, Lamarck remains wrong in biology. But in AI, the "learning to heredity" information flow is unconstrained. Starting from the same inspiration, the difference in medium (carbon vs. silicon) opens fundamentally different possibilities.

## Modern Evolution: Extensions of Evolutionary Computation

Beyond GA and ES, evolutionary ideas have expanded in several directions:

- **Genetic Programming (Koza, 1992)**: Evolves programs themselves, represented as tree structures. The solution structure is not fixed but co-evolves, making it closer to natural evolution.
- **Neuroevolution**: NEAT (Stanley & Miikkulainen, 2002) simultaneously evolves neural network architecture (nodes, connections) and weights. OpenAI's Evolution Strategies (Salimans et al., 2017) demonstrated large-scale parallel ES achieving RL-competitive performance on Atari games.
- **Multi-objective optimization**: NSGA-II (Deb et al., 2002) searches the Pareto front, optimizing multiple objectives simultaneously. Just as "survival" and "reproduction" are separate selection pressures in nature, it balances multiple criteria.
- **AutoML and NAS**: Early versions of Neural Architecture Search (Zoph & Le, 2017) used RL, but evolutionary approaches (Real et al., 2019) emerged as competitive alternatives.

## Limitations and Weaknesses

Evolutionary computation is powerful but has fundamental limitations.

- **Existence of an objective function**: Natural selection has no "purpose." The environment is the selection pressure, and the environment itself changes. Algorithms presuppose a predefined fitness function, making fitness function design itself a core challenge (the fitness shaping problem).
- **Weak sexual reproduction analogy**: Biological crossover occurs between homologous chromosomes of the same species, preserving genome structure. Algorithmic crossover mechanically combines arbitrary solutions, potentially destroying meaningful building blocks.
- **Computational cost**: When fitness evaluation is expensive (e.g., simulation-based), the cost of evaluating thousands of generations times hundreds of individuals becomes prohibitive. Gradient descent is nearly always faster for continuous optimization problems where gradients are available.
- **No convergence guarantee**: Global optimum is not guaranteed within finite time. Premature convergence -- loss of diversity -- leads to entrapment in local optima.
- **Scaling**: As search spaces grow exponentially, efficiency plummets. Pure evolutionary approaches are impractical for modern deep learning's billions of parameters.

## Glossary

Natural selection - the mechanism by which individuals with traits better suited to their environment survive and reproduce more, spreading those traits across generations

Fitness - in biology, the degree of survival and reproductive success. In evolutionary algorithms, the objective function value

Mutation - random alteration of genetic information. DNA replication errors in biology; random perturbation of solutions in algorithms

Crossover - an operation combining genetic information from two parents to create new offspring. Inspired by genetic recombination in sexual reproduction

Genetic algorithm - a metaheuristic optimization technique mimicking natural selection, formalized by Holland (1975)

Evolution strategy - a real-valued vector-based evolutionary optimization developed by Rechenberg (1973), characterized by self-adaptation of mutation

Lamarckism - the theory that acquired traits are inherited. Disproven in biology but effectively operational in AI through learned weight inheritance

Neuroevolution - an approach that optimizes neural network architecture and weights through evolutionary methods

Pareto front - in multi-objective optimization, the set of solutions where no objective can be improved without sacrificing another

Premature convergence - the phenomenon in evolutionary algorithms where population diversity is lost too quickly, trapping the search in local optima
