---
difficulty: intermediate
connectionType: structural_analogy
keywords: 재규격화군, 블록 스핀 변환, 조대화, 임계 현상, 스케일 불변성, 보편성, 고정점, 계층적 특징 추출
keywords_en: renormalization group, block spin transformation, coarse-graining, critical phenomena, scale invariance, universality, fixed point, hierarchical feature extraction
---
Renormalization Group - 물리학의 다중 스케일 분석 프레임워크와 심층 신경망의 계층적 특징 추출 사이에서 발견된 구조적 유사성 (가설 단계)

## 재규격화군이 해결한 문제

자석을 가열하면 어느 순간 자기력이 사라진다. 이 특정 온도를 임계 온도(critical temperature)라 부른다. 임계 온도 바로 아래에서 기묘한 일이 벌어진다. 원자 수십 개 규모의 작은 자기 영역이 모여 수백 개짜리 영역을 이루고, 그 영역들이 다시 모여 수천 개짜리 덩어리가 된다. 이 패턴은 어떤 배율로 확대해도 동일하게 반복된다. 이것이 자기유사성(self-similarity)이다.

더 놀라운 사실은 철의 자화가 사라지는 임계 현상과 물이 끓을 때 액체-기체 구분이 사라지는 임계 현상이 동일한 수학적 법칙을 따른다는 것이다. 원자의 종류도, 상호작용의 형태도 완전히 다른데 거시적 거동은 같다. 이 현상을 보편성(universality)이라 부르며, Kenneth Wilson(1971)이 정립한 재규격화군(Renormalization Group, RG)이 이 수수께끼를 풀었다. 핵심 아이디어는 "스케일을 바꿔가며 시스템을 바라보면 본질이 드러난다"는 것이다.

## 블록 스핀 변환: RG의 핵심 절차

RG가 어떻게 작동하는지를 가장 직관적으로 보여주는 것이 블록 스핀 변환이다. Kadanoff(1966)가 기본 아이디어를 제안하고 Wilson(1971)이 수학적으로 완성했다.

이징 모델 격자에서 출발하여, 인접한 스핀 몇 개(예: 3x3 블록)를 하나의 그룹으로 묶는다. 블록 내부의 개별 스핀 정보를 버리고, 블록 전체를 대표하는 하나의 유효 스핀으로 대체한다. 이 과정을 반복할 때마다 격자의 해상도가 낮아진다. 격자점은 급격히 줄어들지만, 전체 시스템의 거시적 행동 -- 예를 들어 자석이 되는 온도 -- 은 보존된다.

공간적으로 상상하면, 위성사진에서 도시를 점차 줌아웃하는 것과 비슷하다. 가까이서 보면 개별 건물이 보이지만, 멀리서 보면 건물은 사라지고 "주거 지역" "상업 지역" 같은 대규모 패턴만 남는다. RG의 조대화(coarse-graining)가 정확히 이 줌아웃이다.

## RG 흐름과 고정점

블록 스핀 변환을 수학적으로 표현하면 결합 상수의 변환이다.

K' = R(K)

K는 원래 스케일의 결합 상수 집합, K'는 조대화 후의 유효 결합 상수, R은 RG 변환이다. 변환을 반복 적용할 때 파라미터 공간에서의 궤적이 RG 흐름(RG flow)이다. 결정적인 것은 고정점(fixed point)의 존재다. K* = R(K*)를 만족하는 값, 즉 변환을 적용해도 변하지 않는 점이다. 임계점은 바로 이 RG 고정점에 대응한다.

보편성의 설명이 여기서 나온다. 철과 물이라는 완전히 다른 출발점이 조대화를 반복하면 동일한 고정점 K*로 흘러간다. 고정점이 같으면 그 근처의 수학적 거동이 같고, 따라서 거시적 물리도 같다. 서로 다른 강에서 출발한 물줄기가 같은 바다에 도달하는 것처럼, 미시적 출발점이 달라도 같은 고정점으로 수렴하면 같은 거시적 법칙이 나타난다.

고정점 근처에서 결합 상수가 어떤 방향으로 흐르는지를 선형 분석하면 임계 지수(critical exponent)가 결정된다. 이 지수는 물질의 미시적 세부에 무관하고 공간 차원과 대칭성에만 의존한다. 이것이 보편성의 수학적 표현이다.

## 핵심 트레이드오프: 정보 제거와 본질 보존

RG의 매 단계는 정보를 의도적으로 버린다. 이 정보 손실은 결함이 아니라 RG의 핵심이다. "어떤 정보를 버려야 본질이 드러나는가"가 RG가 답하는 질문이다.

- **너무 적게 조대화하면**: 미시적 세부에 파묻혀 거시적 패턴을 놓친다
- **너무 많이 조대화하면**: 의미 있는 구조까지 뭉개져 자명한 고정점에 도달한다
- **적절한 조대화**: 무관한 세부는 제거하되 임계 거동을 결정하는 관련 연산자(relevant operator)는 보존한다

이 관점에서 RG는 "모든 스케일에서 동시에 중요한 것은 무엇인가"를 식별하는 프레임워크다.

## 심층 신경망과의 구조적 유사성

여기서부터 매우 중요한 구분이 필요하다. 이하의 내용은 사후에 발견된 구조적 유사성(structural analogy)이며, 심층 신경망 설계가 RG에서 영감을 받은 것이 아니다. LeCun, Hinton, Bengio 등 심층 학습의 개척자들은 RG를 참조하지 않았다. 이 연결은 2014년 이후 물리학자들이 제안한 가설이다.

**Mehta와 Schwab(2014)의 대응 관계**: 이들은 RBM 스택으로 쌓은 DBN과 RG 변환 사이에 수학적 대응이 존재함을 보였다. RG의 한 단계 조대화가 RBM 한 층의 학습과, 블록 내부 스핀 정보 제거가 은닉 층의 세부 제거와 대응한다. 단, 이 정확한 대응은 1차원 이징 모델과 특정 RBM 구조라는 매우 특수한 조건에서만 성립했다.

**후속 연구와 비판**: Lin, Tegmark, Rolnick(2017)은 물리법칙의 구조적 특성(지역성, 대칭성, 계층적 구조)이 심층 신경망의 구조와 정합한다고 분석했다. Li와 Wang(2018)은 신경망으로 물리 시스템의 RG 흐름을 재발견할 수 있음을 보였으나, 이것은 AI가 RG를 수행할 수 있다는 것이지 AI가 RG에서 영감을 받았다는 것과는 다르다. 한편 Koch-Janusz와 Ringel(2018)은 신경망이 학습한 RG 변환이 기존 물리학의 RG 흐름과 정량적으로 일치하는 경우가 제한적임을 보였다.

CNN에서 이미지 인식이 진행되는 방식도 교육적 비교 대상이다. 초기 층은 에지와 텍스처를, 중간 층은 부분 형태를, 깊은 층은 객체 전체를 인식한다. 풀링 연산이 공간 해상도를 줄이면서 세부 정보를 제거하는 과정이 RG의 조대화와 구조적으로 닮았다. 하지만 이것이 동일한 수학적 원리의 발현인지, "계층적 정보 처리"라는 범용적 구조의 독립적 출현인지는 열린 질문이다.

## 한계와 약점

- **직접적 영감이 아닌 사후 관찰**: 심층 신경망의 설계자들은 RG를 참조하지 않았다. CNN의 풀링은 Neocognitron 계보에서, RBM은 볼츠만 머신 계보에서 발전한 것이다. 이 구분을 혼동하면 인과 관계를 날조하게 된다
- **좁은 수학적 대응**: Mehta와 Schwab(2014)의 정확한 대응은 1차원 이징 모델 + 특정 RBM 구조에서만 성립한다. 일반적인 CNN, Transformer로의 확장은 입증되지 않았다
- **정보 제거의 다른 성격**: RG에서 조대화는 물리적 대칭성과 보존 법칙의 제약 아래 체계적으로 작동한다. 신경망의 특징 추출은 훈련 데이터로부터 학습되며 물리적 제약이 없다. 표면적 유사성 아래의 메커니즘은 근본적으로 다르다
- **공학적 처방 부재**: 이 유사성에서 실제 신경망 설계 개선으로 이어진 사례가 거의 없다. "RG에서 영감을 받아 만든 더 나은 CNN"은 존재하지 않는다

## 용어 정리

재규격화군(renormalization group, RG) - 물리 시스템의 서로 다른 스케일 사이 관계를 체계적으로 분석하는 프레임워크. Kenneth Wilson(1971)이 정립

블록 스핀 변환(block spin transformation) - 인접 스핀을 블록으로 묶어 유효 스핀으로 대체하는 조대화 절차. Kadanoff(1966) 제안, Wilson(1971) 완성

조대화(coarse-graining) - 미시적 자유도를 제거하고 거시적 유효 변수만 남기는 과정. RG의 핵심 연산

RG 흐름(RG flow) - 조대화를 반복할 때 유효 결합 상수가 파라미터 공간에서 이동하는 궤적

고정점(fixed point) - RG 변환에 의해 변하지 않는 결합 상수 값. 임계점에 대응하며 보편성 클래스를 정의

보편성(universality) - 미시적 세부가 다른 시스템들이 동일한 임계 거동을 보이는 현상. 같은 RG 고정점으로 수렴하기 때문에 발생

임계 지수(critical exponent) - 임계점 근처에서 물리량이 거듭제곱 법칙으로 발산하는 양상을 기술하는 지수. 물질에 무관하고 차원과 대칭성에만 의존

스케일 불변성(scale invariance) - 시스템의 물리적 성질이 관찰 스케일에 무관한 성질. 임계점에서 나타나며 자기유사성의 수학적 표현

---EN---
Renormalization Group - A structural analogy discovered between physics' multi-scale analysis framework and hierarchical feature extraction in deep neural networks (hypothesis stage)

## The Problem Renormalization Group Solved

Heat a magnet, and at some point its magnetic force vanishes. That specific temperature is the critical temperature. Just below it, small magnetic domains of a few dozen atoms cluster into domains of hundreds, which cluster into groups of thousands. This pattern repeats identically at every magnification -- self-similarity.

What is even more remarkable: the critical phenomenon where iron loses its magnetization and where boiling water loses its liquid-gas distinction follow the same mathematical laws. Atomic species and interaction types differ completely, yet macroscopic behavior is identical. This is universality, and the Renormalization Group (RG) formalized by Kenneth Wilson (1971) solved this puzzle. The core idea: "changing the scale at which you observe the system reveals its essence."

## Block Spin Transformation: The Core RG Procedure

The block spin transformation most intuitively demonstrates how RG works. Kadanoff (1966) proposed the basic idea and Wilson (1971) completed it mathematically.

Starting from an Ising model lattice, group several adjacent spins (say, a 3x3 block) into one cluster. Discard individual spin information and replace the block with a single effective spin. Each repetition lowers the lattice resolution. Lattice points decrease dramatically, yet the system's macroscopic behavior -- for instance, the magnetization temperature -- is preserved.

To visualize: it resembles zooming out on a satellite image of a city. Up close you see buildings, but from a distance only large-scale patterns remain -- "residential areas," "commercial districts." RG's coarse-graining is precisely this zoom-out.

## RG Flow and Fixed Points

Expressed mathematically, the block spin transformation is a transformation of coupling constants:

K' = R(K)

K is the coupling constant set at the original scale, K' after coarse-graining, R the RG transformation. Tracking this trajectory through parameter space is the RG flow. Decisive is the existence of fixed points: K* = R(K*), points unchanged by the transformation. The critical point corresponds to an RG fixed point.

This explains universality. Completely different starting points (iron and water) both flow toward the same fixed point K* under repeated coarse-graining. Same fixed point means same mathematical behavior nearby, therefore same macroscopic physics. Like streams from different rivers reaching the same ocean.

Linear analysis of coupling constant flow near the fixed point determines critical exponents. These are independent of microscopic details, depending only on spatial dimension and symmetry -- the mathematical expression of universality.

## The Core Tradeoff: Information Removal and Essence Preservation

Every RG step intentionally discards information. This loss is not a flaw but RG's heart. "Which information must be discarded to reveal the essence?" is RG's central question.

- **Too little coarse-graining**: buried in microscopic details, missing macroscopic patterns
- **Too much coarse-graining**: meaningful structure is crushed, reaching a trivial fixed point
- **Appropriate coarse-graining**: irrelevant details removed while relevant operators determining critical behavior are preserved

From this perspective, RG identifies "what matters simultaneously at all scales."

## Connection to Deep Neural Networks: Structural Similarity

A critical distinction is needed here. The following describes a structural analogy discovered post-hoc, not inspiration behind deep neural network design. LeCun, Hinton, and Bengio did not reference RG. This connection is a hypothesis proposed by physicists starting in 2014.

**Mehta and Schwab (2014)**: They demonstrated mathematical correspondence between stacked RBMs (DBN) and RG transformations. One RG coarse-graining step maps to one RBM layer's learning; discarding intra-block spin information maps to hidden layers discarding input details. However, this exact correspondence holds only under very specific conditions: the 1D Ising model with a particular RBM structure.

**Follow-up research and criticism**: Lin, Tegmark, and Rolnick (2017) argued that structural properties of physical laws (locality, symmetry, hierarchy) match deep neural network architecture. Li and Wang (2018) showed neural networks can rediscover RG flows, but this demonstrates AI performing RG, not being inspired by it -- the direction of influence is reversed. Koch-Janusz and Ringel (2018) showed that neural network-learned RG transformations match traditional RG flows quantitatively only in limited cases.

How CNNs process images provides an instructive comparison. Early layers capture edges and textures, middle layers capture partial shapes, deep layers recognize whole objects. Pooling operations reduce spatial resolution, discarding positional detail -- structurally resembling RG's coarse-graining. But whether this reflects the same mathematical principle or an independent emergence of "hierarchical information processing" remains an open question.

## Limitations and Weaknesses

- **Post-hoc observation, not direct inspiration**: Deep neural network designers did not reference RG. CNN pooling descends from the Neocognitron lineage, RBMs from Boltzmann machines. Confusing this distinction fabricates a nonexistent causal relationship
- **Narrow mathematical correspondence**: Mehta and Schwab's (2014) exact correspondence holds only for the 1D Ising model with a specific RBM structure. Extension to general CNNs and Transformers has not been rigorously demonstrated
- **Different character of information removal**: RG coarse-graining operates under physical symmetry and conservation law constraints. Neural network feature extraction is learned from data without physical constraints. The underlying mechanisms are fundamentally different
- **No engineering prescriptions**: Cases where this analogy improved neural network design are nearly nonexistent. No "better CNN inspired by RG" has been built

## Glossary

Renormalization group (RG) - a framework for systematically analyzing relationships between different scales in physical systems. Formalized by Kenneth Wilson (1971)

Block spin transformation - a coarse-graining procedure grouping adjacent spins into blocks and replacing them with effective spins. Proposed by Kadanoff (1966), completed by Wilson (1971)

Coarse-graining - the process of eliminating microscopic degrees of freedom and retaining only macroscopic effective variables. The core operation of RG

RG flow - the trajectory of effective coupling constants through parameter space as coarse-graining is iterated

Fixed point - coupling constant values unchanged by the RG transformation. Corresponds to the critical point and defines universality classes

Universality - the phenomenon where systems with different microscopic details exhibit identical critical behavior. Occurs because they converge to the same RG fixed point

Critical exponent - the power-law exponent describing how physical quantities diverge near the critical point. Independent of material details, depending only on dimension and symmetry

Scale invariance - the property that a system's physical properties are independent of the observation scale. The mathematical expression of self-similarity
