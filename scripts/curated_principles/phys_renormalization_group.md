---
difficulty: advanced
connectionType: structural_analogy
keywords: 재규격화군, 블록 스핀 변환, 조대화, 임계 현상, 스케일 불변성, 보편성, 고정점, 계층적 특징 추출
keywords_en: renormalization group, block spin transformation, coarse-graining, critical phenomena, scale invariance, universality, fixed point, hierarchical feature extraction
---
Renormalization Group - 물리학의 다중 스케일 분석 프레임워크와 심층 신경망의 계층적 특징 추출 사이에서 발견된 구조적 유사성 (가설 단계)

## 재규격화군이 해결한 문제

자석을 가열하면 어느 순간 자기력이 사라진다. 이 특정 온도를 임계 온도(critical temperature)라 부른다. 임계 온도 바로 아래에서 기묘한 일이 벌어진다. 원자 수십 개 규모의 작은 자기 영역(domain)이 모여 수백 개짜리 영역을 이루고, 그 영역들이 다시 모여 수천 개짜리 덩어리가 된다. 이 패턴은 어떤 배율로 확대해도 동일하게 반복된다. 마치 러시아 인형(마트료시카)처럼, 큰 구조 안에 작은 구조가, 그 안에 더 작은 구조가 같은 형태로 들어 있다. 이것이 자기유사성(self-similarity)이다.

더 놀라운 사실은 이것이다. 철의 자화가 사라지는 임계 현상과 물이 끓을 때 액체-기체 구분이 사라지는 임계 현상이 동일한 수학적 법칙을 따른다. 원자의 종류도, 상호작용의 형태도 완전히 다른데 거시적 거동은 같다. 이 현상을 보편성(universality)이라 부르며, 1960년대까지 이것을 설명할 이론은 없었다.

Kenneth Wilson(1971)이 정립한 재규격화군(Renormalization Group, RG)이 이 수수께끼를 풀었다. 핵심 아이디어는 "스케일을 바꿔가며 시스템을 바라보면 본질이 드러난다"는 것이다. Wilson은 이 업적으로 1982년 노벨 물리학상을 수상했다.

## 블록 스핀 변환: RG의 핵심 절차

RG가 어떻게 작동하는지를 가장 직관적으로 보여주는 것이 블록 스핀 변환(block spin transformation)이다. Leo Kadanoff(1966)가 기본 아이디어를 제안하고 Wilson(1971)이 수학적으로 완성했다.

1. 이징 모델(Ising model) 격자에서 출발한다. 각 격자점에 위(+1) 또는 아래(-1) 방향의 스핀이 있다
2. 인접한 스핀 몇 개(예: 3x3 블록)를 하나의 그룹으로 묶는다
3. 블록 내부의 개별 스핀 정보를 버리고, 블록 전체를 대표하는 하나의 유효 스핀(effective spin)으로 대체한다. 예를 들어 9개 중 6개가 위를 가리키면 블록 전체가 "위"가 된다
4. 이 과정을 반복할 때마다 격자의 해상도가 낮아진다. 100x100 격자가 33x33이 되고, 다시 11x11이 된다

이것을 공간적으로 상상하면 이렇다. 위성사진에서 도시를 점차 줌아웃하는 것과 비슷하다. 가까이서 보면 개별 건물이 보이지만, 멀리서 보면 건물 하나하나는 사라지고 "주거 지역" "상업 지역" 같은 대규모 패턴만 남는다. RG의 조대화(coarse-graining)가 정확히 이 줌아웃이다. 미시적 세부를 제거하고 거시적 구조만 남긴다.

핵심 질문은 이것이다. 줌아웃할 때마다 블록 스핀들 사이의 유효 상호작용(effective interaction)은 원래와 어떻게 달라지는가? Wilson이 개발한 것은 이 변화를 체계적으로 추적하는 방법이다.

## RG 흐름과 고정점

블록 스핀 변환을 수학적으로 표현하면 결합 상수(coupling constant)의 변환이다.

K' = R(K)

K는 원래 스케일의 결합 상수 집합, K'는 조대화 후의 유효 결합 상수, R은 RG 변환이다. 변환을 한 번 적용하면 K가 K'로 바뀌고, 다시 적용하면 K''가 된다. 이 궤적을 파라미터 공간에서 추적한 것이 RG 흐름(RG flow)이다.

RG 흐름에서 결정적인 것은 고정점(fixed point)의 존재다. 고정점이란 K* = R(K*)를 만족하는 결합 상수 값, 즉 변환을 적용해도 변하지 않는 점이다. 임계점은 바로 이 RG 고정점에 대응한다.

보편성의 설명이 여기서 나온다. 철과 물이라는 완전히 다른 출발점(K 값)이 조대화를 반복하면 동일한 고정점 K*로 흘러간다. 고정점이 같으면 그 근처의 수학적 거동이 같고, 따라서 거시적 물리도 같다. 서로 다른 강에서 출발한 물줄기가 결국 같은 바다에 도달하는 것처럼, 미시적 출발점이 달라도 같은 고정점으로 수렴하면 같은 거시적 법칙이 나타난다.

연속적인 스케일 변화에서 RG 변환은 베타 함수(beta function)로 기술된다.

beta(g) = dg/d(ln s)

g는 결합 상수, s는 스케일 변화 인자다. beta(g) = 0인 점이 고정점이다. 고정점 근처에서 결합 상수가 어떤 방향으로 흐르는지를 선형 분석하면 임계 지수(critical exponent)가 결정된다. 예를 들어 자화 M은 임계 온도 T_c 근처에서 M ~ (T_c - T)^beta로 거동하는데, 이 지수 beta(여기서는 임계 지수로, 위의 베타 함수와는 다른 기호)는 물질의 미시적 세부에 무관하고 공간 차원과 대칭성에만 의존한다. 이것이 보편성의 수학적 표현이다.

## 핵심 트레이드오프: 정보 제거와 본질 보존

RG의 매 단계는 정보를 의도적으로 버린다. 3x3 블록의 9개 스핀을 1개로 줄이면 개별 스핀의 방향 정보 8개분이 사라진다. 이 정보 손실은 결함이 아니라 RG의 핵심이다. "어떤 정보를 버려야 본질이 드러나는가"가 RG가 답하는 질문이다.

여기에 깊은 트레이드오프가 존재한다.

- **너무 적게 조대화하면**: 미시적 세부에 파묻혀 거시적 패턴을 놓친다. 나무를 보되 숲을 보지 못하는 상태다
- **너무 많이 조대화하면**: 의미 있는 구조까지 뭉개져 자명한(trivial) 고정점에 도달한다. 모든 스핀이 하나로 합쳐지면 어떤 정보도 남지 않는다
- **적절한 조대화**: 무관한 세부는 제거하되 임계 거동을 결정하는 관련 연산자(relevant operator)는 보존한다. RG의 기술적 핵심은 이 균형을 수학적으로 제어하는 데 있다

이 관점에서 RG는 "모든 스케일에서 동시에 중요한 것은 무엇인가"를 식별하는 프레임워크다.

## 이론적 심화: 관련 연산자와 비관련 연산자

고정점 근처에서 결합 상수의 미소 변화를 분석하면, 두 종류의 방향이 나타난다.

관련 연산자(relevant operator)는 RG 변환을 거듭할수록 커지는 방향이다. 이들이 임계 거동을 결정하며, 임계 지수를 지배한다. 예를 들어 온도 차이 (T - T_c)는 관련 연산자다. 조대화를 반복하면 이 차이가 증폭되어 시스템이 고정점에서 멀어진다.

비관련 연산자(irrelevant operator)는 반복할수록 줄어드는 방향이다. 원자의 구체적 배열 방식이나 격자의 세부 형태 같은 미시적 세부사항에 해당한다. 이것들이 줄어들기 때문에 서로 다른 물질이 동일한 고정점으로 수렴할 수 있다. 보편성의 수학적 메커니즘이 바로 비관련 연산자의 소멸이다.

관련/비관련의 구분은 고정점에서의 RG 변환을 선형화한 행렬(stability matrix)의 고유값으로 결정된다. 고유값이 1보다 크면 관련, 1보다 작으면 비관련이다. 이 분류가 보편성 클래스(universality class)를 정의한다. 같은 보편성 클래스에 속하는 시스템은 관련 연산자의 수와 종류가 동일하다.

## 심층 신경망과의 구조적 유사성

여기서부터 매우 중요한 구분이 필요하다. 이하의 내용은 사후에 발견된 구조적 유사성(structural analogy)이며, 심층 신경망 설계가 RG에서 영감을 받은 것이 아니다. LeCun, Hinton, Bengio 등 심층 학습의 개척자들은 RG를 참조하지 않았다. 이 연결은 2014년 이후 물리학자들이 제안한 가설이다.

**Mehta와 Schwab(2014)의 대응 관계:**

이들은 제한 볼츠만 머신(RBM)을 스택으로 쌓은 심층 신뢰 신경망(DBN)과 RG 변환 사이에 수학적 대응이 존재함을 보였다. 핵심 대응 관계는 다음과 같다.

- RG의 한 단계 조대화 --> RBM **한 층의 학습** (가시 층의 세밀한 변수를 은닉 층의 거칠은 변수로 압축)
- 블록 내부 스핀 정보 제거 --> **은닉 층이 입력의 세부를 버리고 패턴만 보존**
- RG 흐름에서 미세 스케일 세부 소실 --> **여러 층을 거치며 점차 추상적인 표현 학습**
- RG 고정점 --> **학습된 표현이 수렴하는 최종 상태** (가설)

단, 이 정확한 대응은 1차원 이징 모델과 특정 RBM 구조라는 매우 특수한 조건에서만 수학적으로 성립했다.

**후속 연구:**

Lin, Tegmark, Rolnick(2017)은 물리법칙이 왜 심층 학습으로 잘 근사되는지를 분석했다. 이들의 주장은, 물리법칙이 가진 구조적 특성인 지역성, 대칭성, 다항식 관계, 계층적 구조가 심층 신경망의 구조와 잘 맞기 때문이라는 것이다. RG의 계층적 조대화와 심층 학습의 계층적 특징 추출은 이 구조적 정합의 한 사례로 제시되었다.

Li와 Wang(2018)은 신경망을 RG 변환의 학습에 사용하여, 물리 시스템의 RG 흐름을 신경망이 재발견할 수 있음을 보였다. 이것은 AI가 RG를 수행할 수 있다는 것이지, AI가 RG에서 영감을 받았다는 것과는 다르다. 영향의 방향이 반대다.

**합성곱 신경망(CNN)과의 비교:**

CNN에서 이미지 인식이 진행되는 방식도 교육적 비교 대상이다. 초기 층은 에지와 텍스처 같은 미세 특징을 포착하고, 중간 층은 눈이나 바퀴 같은 부분 형태를, 깊은 층은 "고양이" "자동차" 같은 객체 전체를 인식한다. 풀링(pooling) 연산이 공간 해상도를 절반으로 줄이면서 세부 위치 정보를 제거한다.

이 과정이 RG의 조대화와 구조적으로 닮았다. 둘 다 여러 단계를 거치며 미시적 세부가 사라지고 거시적 특성만 남는다. 하지만 이것이 동일한 수학적 원리의 발현인지, 아니면 "계층적 정보 처리"라는 범용적 구조가 독립적으로 나타난 것인지는 열린 질문으로 남아 있다.

## 한계와 약점

- **직접적 영감이 아닌 사후 관찰**: 심층 신경망의 설계자들은 RG를 참조하지 않았다. CNN의 풀링은 LeCun et al.(1998)의 Neocognitron 계보에서, RBM은 Hinton의 볼츠만 머신 계보에서 발전한 것이다. 물리학자들이 나중에 유사성을 발견한 것이며, 이 구분을 혼동하면 인과 관계를 날조하게 된다
- **좁은 수학적 대응**: Mehta와 Schwab(2014)의 정확한 대응은 1차원 이징 모델 + 특정 RBM 구조에서만 성립한다. 일반적인 CNN, Transformer, 현대 심층 신경망으로의 확장은 엄밀히 입증되지 않았으며, Schwab과 Mehta 자신도 후속 논문에서 한계를 인정했다
- **정보 제거의 다른 성격**: RG에서 조대화는 물리적 대칭성과 보존 법칙의 제약 아래 체계적으로 작동하며, 어떤 정보를 버릴지가 수학적으로 결정된다. 신경망의 특징 추출은 훈련 데이터로부터 학습되며, 물리적 제약이 없다. "정보를 계층적으로 압축한다"는 표면적 유사성 아래의 메커니즘은 근본적으로 다르다
- **공학적 처방 부재**: 이 유사성에서 실제 신경망 설계나 학습 개선으로 이어진 사례가 거의 없다. "RG에서 영감을 받아 만든 더 나은 CNN"은 존재하지 않는다. 지적으로 흥미로운 관찰이지만 실용적 함의는 아직 미미하다

## 용어 정리

재규격화군(renormalization group, RG) - 물리 시스템의 서로 다른 스케일 사이 관계를 체계적으로 분석하는 프레임워크. Kenneth Wilson(1971)이 정립

블록 스핀 변환(block spin transformation) - 인접 스핀을 블록으로 묶어 유효 스핀으로 대체하는 조대화 절차. Kadanoff(1966)가 제안하고 Wilson(1971)이 수학적으로 완성

조대화(coarse-graining) - 미시적 자유도를 제거하고 거시적 유효 변수만 남기는 과정. RG의 핵심 연산

이징 모델(Ising model) - 격자 위의 스핀이 위(+1) 또는 아래(-1)만 취하는 통계역학 모델. 자성 현상의 단순화된 수학 모델

RG 흐름(RG flow) - 조대화를 반복할 때 유효 결합 상수가 파라미터 공간에서 이동하는 궤적

고정점(fixed point) - RG 변환에 의해 변하지 않는 결합 상수 값. 임계점에 대응하며, 보편성 클래스를 정의

임계 지수(critical exponent) - 임계점 근처에서 물리량이 거듭제곱 법칙으로 발산하는 양상을 기술하는 지수. 물질에 무관하고 차원과 대칭성에만 의존

보편성(universality) - 미시적 세부가 다른 시스템들이 동일한 임계 거동을 보이는 현상. 같은 RG 고정점으로 수렴하기 때문에 발생

관련 연산자(relevant operator) - RG 변환을 거듭할수록 증폭되는 방향. 임계 거동을 결정하며, 거시적 물리를 지배

스케일 불변성(scale invariance) - 시스템의 물리적 성질이 관찰 스케일에 무관한 성질. 임계점에서 나타나며 자기유사성의 수학적 표현
---EN---
Renormalization Group - A structural analogy discovered between physics' multi-scale analysis framework and hierarchical feature extraction in deep neural networks (hypothesis stage)

## The Problem Renormalization Group Solved

Heat a magnet, and at some point its magnetic force vanishes. That specific temperature is called the critical temperature. Just below it, something curious happens. Small magnetic domains of a few dozen atoms cluster into domains of hundreds, which in turn cluster into groups of thousands. This pattern repeats identically at every magnification. Like Russian nesting dolls (matryoshka), each large structure contains smaller structures of the same form, which contain still smaller ones. This is self-similarity.

What is even more remarkable: the critical phenomenon where iron loses its magnetization and the critical phenomenon where boiling water loses its liquid-gas distinction follow the same mathematical laws. The atomic species differ, the interaction types differ, yet the macroscopic behavior is identical. This phenomenon is called universality, and until the 1960s no theory could explain it.

The Renormalization Group (RG), formalized by Kenneth Wilson (1971), solved this puzzle. The core idea is that "changing the scale at which you observe the system reveals its essence." Wilson received the 1982 Nobel Prize in Physics for this work.

## Block Spin Transformation: The Core RG Procedure

The block spin transformation most intuitively demonstrates how RG works. Leo Kadanoff (1966) proposed the basic idea and Wilson (1971) completed it mathematically.

1. Start from an Ising model lattice. Each lattice site has a spin pointing up (+1) or down (-1)
2. Group several adjacent spins (say, a 3x3 block) into one cluster
3. Discard individual spin information within the block and replace the entire block with a single effective spin. For instance, if 6 out of 9 spins point up, the block as a whole is "up"
4. Each repetition lowers the lattice resolution. A 100x100 lattice becomes 33x33, then 11x11

To visualize this spatially: it resembles progressively zooming out on a satellite image of a city. Up close you see individual buildings, but from a distance the buildings vanish and only large-scale patterns remain -- "residential areas," "commercial districts." RG's coarse-graining is precisely this zoom-out. It removes microscopic detail and retains macroscopic structure.

The key question is this: each time you zoom out, how do the effective interactions between block spins differ from the originals? What Wilson developed is a systematic method for tracking this change.

## RG Flow and Fixed Points

Expressed mathematically, the block spin transformation is a transformation of coupling constants:

K' = R(K)

Here K is the set of coupling constants at the original scale, K' is the effective coupling constants after coarse-graining, and R is the RG transformation. Applying it once changes K to K', applying it again yields K''. Tracking this trajectory through parameter space is the RG flow.

What is decisive in the RG flow is the existence of fixed points. A fixed point is a coupling constant value satisfying K* = R(K*) -- a point unchanged by the transformation. The critical point corresponds precisely to an RG fixed point.

This is where the explanation of universality emerges. Two completely different starting points (K values) representing iron and water both flow toward the same fixed point K* under repeated coarse-graining. If the fixed point is the same, the mathematical behavior near it is the same, and therefore the macroscopic physics is the same. Like streams from different rivers ultimately reaching the same ocean, different microscopic starting points converge to the same fixed point and produce the same macroscopic laws.

For continuous scale changes, the RG transformation is described by the beta function:

beta(g) = dg/d(ln s)

Here g is the coupling constant and s is the scale factor. Points where beta(g) = 0 are fixed points. Linear analysis of how coupling constants flow near the fixed point determines the critical exponents. For example, magnetization M near the critical temperature T_c behaves as M ~ (T_c - T)^beta, where beta (here a critical exponent, distinct from the beta function) is independent of microscopic details and depends only on spatial dimension and symmetry. This is the mathematical expression of universality.

## The Core Tradeoff: Information Removal and Essence Preservation

Every RG step intentionally discards information. Reducing 9 spins in a 3x3 block to 1 erases eight spins' worth of directional information. This information loss is not a flaw but the heart of RG. "Which information must be discarded to reveal the essence?" is the question RG answers.

A deep tradeoff exists here:

- **Too little coarse-graining**: You remain buried in microscopic details and miss macroscopic patterns. Seeing trees but not the forest
- **Too much coarse-graining**: Meaningful structure is crushed and you reach a trivial fixed point. Once all spins merge into one, no information remains
- **Appropriate coarse-graining**: Irrelevant details are removed while relevant operators that determine critical behavior are preserved. The technical core of RG lies in mathematically controlling this balance

From this perspective, RG is a framework for identifying "what matters simultaneously at all scales."

## Theoretical Depth: Relevant and Irrelevant Operators

Analyzing small perturbations of coupling constants near a fixed point reveals two types of directions.

Relevant operators grow under repeated RG transformations. They determine critical behavior and govern critical exponents. For example, the temperature difference (T - T_c) is a relevant operator. Repeated coarse-graining amplifies this difference, driving the system away from the fixed point.

Irrelevant operators shrink under repeated transformations. They correspond to microscopic details such as specific atomic arrangements or detailed lattice geometry. Because these shrink, different materials can converge to the same fixed point. The mathematical mechanism of universality is precisely the vanishing of irrelevant operators.

The relevant/irrelevant classification is determined by the eigenvalues of the stability matrix -- the linearized RG transformation at the fixed point. Eigenvalues greater than 1 indicate relevant operators; less than 1 indicate irrelevant ones. This classification defines universality classes. Systems in the same universality class share the same number and type of relevant operators.

## Connection to Deep Neural Networks: Structural Similarity

From this point, a critical distinction is needed. The following describes a structural analogy discovered post-hoc, not an inspiration behind deep neural network design. The pioneers of deep learning -- LeCun, Hinton, Bengio -- did not reference RG. This connection is a hypothesis proposed by physicists starting in 2014.

**Mehta and Schwab's (2014) correspondence:**

They demonstrated a mathematical correspondence between Deep Belief Networks (stacked RBMs) and RG transformations. The key mappings are:

- One RG coarse-graining step --> **one RBM layer's learning** (compressing fine-grained visible layer variables into coarse-grained hidden layer variables)
- Discarding intra-block spin information --> **hidden layer discarding input details and preserving only patterns**
- Loss of fine-scale details along the RG flow --> **learning progressively more abstract representations across layers**
- RG fixed point --> **the final state to which learned representations converge** (hypothesis)

However, this exact correspondence was mathematically established only under very specific conditions: the 1D Ising model with a particular RBM structure.

**Follow-up research:**

Lin, Tegmark, and Rolnick (2017) analyzed why physical laws are well-approximated by deep learning. Their argument is that structural properties of physical laws -- locality, symmetry, polynomial relationships, hierarchical structure -- match deep neural network architecture well. RG's hierarchical coarse-graining and deep learning's hierarchical feature extraction were presented as one instance of this structural alignment.

Li and Wang (2018) explicitly used neural networks to learn RG transformations, showing that neural networks can rediscover RG flows in physical systems. This demonstrates that AI can perform RG -- which is different from saying AI was inspired by RG. The direction of influence is reversed.

**Comparison with CNNs:**

How CNNs process images also provides an instructive comparison. Early layers capture fine features like edges and textures, middle layers capture partial shapes like eyes or wheels, and deep layers recognize whole objects like "cat" or "car." Pooling operations halve the spatial resolution, discarding precise positional information.

This process structurally resembles RG's coarse-graining. Both progressively eliminate microscopic details across stages, leaving only macroscopic properties. But whether this reflects the same mathematical principle or whether "hierarchical information processing" is a universal structure that emerged independently remains an open question.

## Limitations and Weaknesses

- **Post-hoc observation, not direct inspiration**: The designers of deep neural networks did not reference RG. CNN pooling descends from LeCun et al.'s (1998) Neocognitron lineage, and RBMs from Hinton's Boltzmann machine lineage. Physicists discovered the similarity afterward. Confusing this distinction fabricates a causal relationship that does not exist
- **Narrow mathematical correspondence**: Mehta and Schwab's (2014) exact correspondence holds only for the 1D Ising model with a specific RBM structure. Extension to general CNNs, Transformers, and modern deep architectures has not been rigorously demonstrated, and Schwab and Mehta themselves acknowledged limitations in follow-up papers
- **Different character of information removal**: In RG, coarse-graining operates systematically under the constraints of physical symmetries and conservation laws, with mathematically determined criteria for what to discard. Neural network feature extraction is learned from training data without physical constraints. Beneath the surface similarity of "hierarchically compressing information," the underlying mechanisms are fundamentally different
- **No engineering prescriptions**: Cases where this analogy has led to actual improvements in neural network design or training are nearly nonexistent. No "better CNN inspired by RG" has been built. It is an intellectually stimulating observation, but practical implications remain minimal

## Glossary

Renormalization group (RG) - a framework for systematically analyzing relationships between different scales in physical systems. Formalized by Kenneth Wilson (1971)

Block spin transformation - a coarse-graining procedure that groups adjacent spins into blocks and replaces them with effective spins. Proposed by Kadanoff (1966) and mathematically completed by Wilson (1971)

Coarse-graining - the process of eliminating microscopic degrees of freedom and retaining only macroscopic effective variables. The core operation of RG

Ising model - a statistical mechanics model where spins on a lattice take only up (+1) or down (-1) values. A simplified mathematical model of magnetism

RG flow - the trajectory of effective coupling constants through parameter space as coarse-graining is iterated

Fixed point - coupling constant values unchanged by the RG transformation. Corresponds to the critical point and defines universality classes

Critical exponent - the power-law exponent describing how physical quantities diverge near the critical point. Independent of material details, depending only on dimension and symmetry

Universality - the phenomenon where systems with different microscopic details exhibit identical critical behavior. Occurs because they converge to the same RG fixed point

Relevant operator - a direction that grows under repeated RG transformations. Determines critical behavior and governs macroscopic physics

Scale invariance - the property that a system's physical properties are independent of the observation scale. Appears at critical points and is the mathematical expression of self-similarity
