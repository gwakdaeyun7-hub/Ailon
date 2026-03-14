---
difficulty: advanced
connectionType: structural_analogy
keywords: 재규격화군, 다중 스케일 분석, 블록 스핀 변환, 임계 현상, 스케일 불변성, 보편성, 깊은 신경망, 특징 추출
keywords_en: renormalization group, multi-scale analysis, block spin transformation, critical phenomena, scale invariance, universality, deep neural networks, feature extraction
---
Renormalization Group - 물리학의 다중 스케일 분석 프레임워크와 심층 신경망의 특징 추출 사이에 발견된 구조적 유사성 (가설 단계)

## 재규격화군의 물리적 배경

물리학에서 가장 깊은 개념 중 하나인 재규격화군(Renormalization Group, RG)은 서로 다른 스케일의 물리를 체계적으로 연결하는 프레임워크다. Kenneth Wilson(1971)이 이를 정립하여 1982년 노벨 물리학상을 수상했다.

RG가 해결한 문제는 이것이다. 물을 끓이면 일정 온도(임계 온도)에서 액체와 기체의 구분이 사라지는 임계점(critical point)이 존재한다. 임계점 근처에서 시스템은 기묘한 행동을 보인다. 모든 스케일에서 동일한 패턴이 반복되는 자기유사성(self-similarity)이 나타나고, 물질의 미시적 세부사항과 무관하게 동일한 거시적 거동이 관찰된다. 철의 자화 임계 현상과 물의 기화 임계 현상이 동일한 수학적 법칙을 따르는데, 이것이 보편성(universality)이다.

RG 이전에는 이 보편성을 설명할 방법이 없었다. 미시적 구성 요소(원자의 종류, 상호작용의 세부 형태)가 완전히 다른 시스템들이 왜 동일한 거시적 거동을 보이는지가 물리학의 수수께끼였다.

## 블록 스핀 변환: RG의 핵심 절차

Leo Kadanoff(1966)가 제안하고 Wilson(1971)이 수학적으로 완성한 블록 스핀 변환(block spin transformation)은 RG의 핵심 아이디어를 직관적으로 보여준다.

이징 모델 격자에서 출발한다. 인접한 스핀 몇 개를 하나의 블록으로 묶는다. 블록 내부 스핀들의 세부 정보를 제거하고, 블록 전체를 대표하는 하나의 유효 스핀(effective spin)으로 대체한다. 이 과정을 반복하면 격자의 해상도가 점차 낮아진다.

핵심 질문은 이것이다. 블록 스핀들 사이의 유효 상호작용(effective interaction)은 원래 상호작용과 어떻게 다른가? Wilson은 이 변환을 반복할 때 유효 상호작용이 어떻게 변하는지를 추적하는 체계적 방법을 개발했다. 이것이 RG 흐름(RG flow)이다.

RG 흐름의 수학적 핵심은 결합 상수(coupling constant)의 변환이다.

K' = R(K)

여기서 K는 원래 스케일의 결합 상수 집합, K'는 조대화(coarse-graining) 후의 유효 결합 상수, R은 RG 변환이다. 이 변환을 반복하면 결합 상수가 특정한 고정점(fixed point)으로 흘러간다. 임계점은 바로 이 RG 고정점에 대응하며, 보편성은 서로 다른 출발점(미시적 세부사항)이 동일한 고정점으로 흘러가는 것으로 설명된다.

## 베타 함수와 임계 지수

연속적인 스케일 변화에서 RG 변환은 베타 함수(beta function)로 기술된다.

beta(g) = dg/d(ln s)

g는 결합 상수, s는 스케일 변화 인자다. 베타 함수가 0이 되는 점이 고정점이다. 고정점 근처에서의 선형화가 임계 지수(critical exponent)를 결정한다.

임계 지수는 임계점 근처의 물리량이 온도 차이의 거듭제곱으로 발산하는 양상을 기술한다. 예를 들어 자화 M은 임계 온도 T_c 근처에서 다음과 같이 거동한다.

M ~ (T_c - T)^beta

여기서 beta(여기서는 임계 지수, 위의 베타 함수와 다름)는 물질의 미시적 세부에 무관하고 공간 차원과 대칭성에만 의존한다. 이것이 보편성의 수학적 표현이며, RG가 왜 이런 보편성이 나타나는지를 설명한다.

## 심층 신경망과의 구조적 유사성: 가설

여기서부터 매우 중요한 구분이 필요하다. 이하의 내용은 **사후에 발견된 구조적 유사성**(structural analogy)이며, 심층 신경망의 설계가 RG에서 영감을 받은 것은 아니다. 이 연결은 2014년 이후 여러 연구자들이 독립적으로 제안한 가설이다.

Mehta와 Schwab(2014)은 제한 볼츠만 머신(RBM)을 스택으로 쌓은 심층 신뢰 신경망(DBN)과 RG 변환 사이에 정확한 수학적 대응이 존재함을 보였다. 이들의 핵심 주장은 다음과 같다.

- RBM의 한 층은 블록 스핀 변환의 한 단계에 대응한다
- 가시 층(visible layer)의 세밀한 변수를 은닉 층(hidden layer)의 거칠은 변수로 압축하는 것은 조대화와 유사하다
- 여러 층을 거치며 점차 추상적인 표현을 학습하는 것은 RG 흐름에서 미세 스케일의 세부사항이 소실되고 거시적 특성만 남는 것과 닮았다

## 후속 연구와 논쟁

Lin, Tegmark, Rolnick(2017)은 더 넓은 관점에서, 물리법칙이 왜 심층 학습으로 잘 근사되는지를 분석했다. 이들의 주장은 물리법칙이 가진 구조적 특성 -- 지역성(locality), 대칭성(symmetry), 다항식 관계, 계층적 구조 -- 이 심층 신경망의 구조와 잘 맞기 때문이라는 것이다. RG의 계층적 조대화와 심층 학습의 계층적 특징 추출은 이 구조적 정합의 한 사례로 제시되었다.

Li와 Wang(2018)은 신경망을 명시적으로 RG 변환의 학습에 사용하여, 물리 시스템의 RG 흐름을 신경망이 재발견할 수 있음을 보였다. 이것은 AI가 RG를 수행할 수 있다는 것이지, AI가 RG에서 영감을 받았다는 것과는 다르다.

**하지만** 이 유사성에 대한 비판도 상당하다. Schwab과 Mehta 자신도 후속 논문에서 한계를 인정했고, 일부 연구자들은 이 대응이 피상적이라고 주장한다. 구체적 비판점은 다음과 같다.

첫째, RG는 특정한 물리적 대칭성과 보존 법칙 하에서 작동하며, 일반적인 신경망은 이런 제약이 없다. 둘째, RG의 조대화는 정보를 의도적으로 버리는 것이며 이것이 핵심인데, 신경망의 특징 추출이 같은 의미에서 정보를 버리는 것인지는 불분명하다. 셋째, Mehta와 Schwab의 정확한 대응은 매우 특수한 조건(1차원 이징 모델, 특정 RBM 구조)에서만 성립하며, 일반적 심층 신경망으로의 확장은 검증되지 않았다.

## CNN과의 구조적 비교

비록 설계 영감이 아닌 사후 관찰이지만, 합성곱 신경망(CNN)과 RG의 구조적 비교는 교육적 가치가 있다.

CNN에서 이미지는 여러 층을 거치며 처리된다. 초기 층은 에지와 텍스처 같은 미세 특징을, 중간 층은 부분적 형태를, 깊은 층은 객체 전체와 같은 거시적 특징을 포착한다. 풀링(pooling) 연산은 공간 해상도를 낮추며 세부 정보를 제거한다.

RG에서도 반복적 조대화를 통해 미시적 세부가 소실되고 거시적 특성(임계 지수, 보편성 클래스)만 남는다. 두 과정의 구조적 유사성은 주목할 만하지만, 이것이 동일한 수학적 원리의 발현인지, 아니면 계층적 정보 처리라는 범용적 구조의 우연한 일치인지는 열린 질문이다.

## 스케일 불변성과 생성 모델의 연결

RG의 핵심인 스케일 불변성(scale invariance)은 일부 생성 모델에서도 관찰된다. 확산 모델의 노이즈 스케줄은 여러 스케일의 구조를 순차적으로 생성하며, 이것이 RG의 다중 스케일 처리와 유사하다는 관찰이 있다. 하지만 이 연결 역시 사후적 관찰이며, 확산 모델의 설계자들은 RG를 참조하지 않았다.

## 한계와 약점

RG-심층 학습 유사성은 흥미롭지만, 현재로서는 가설 단계에 가깝다.

- **직접적 영감이 아님**: 심층 신경망의 설계자들(LeCun, Hinton, Bengio 등)은 RG에서 영감을 받지 않았다. 이 연결은 사후 분석에서 발견된 것이며, 이 구분을 명확히 해야 한다.
- **좁은 정확한 대응**: Mehta와 Schwab(2014)의 정확한 수학적 대응은 1차원 이징 모델과 특정 RBM 구조에 한정된다. 일반적인 심층 학습으로의 확장은 엄밀히 입증되지 않았다.
- **정보 제거의 다른 의미**: RG에서 정보 제거는 물리적으로 의미 있는 거시 변수를 보존하기 위한 체계적 절차다. 신경망의 특징 추출이 같은 의미에서 "불필요한 정보를 체계적으로 제거"하는 것인지는 논쟁 중이다.
- **실용적 함의 부재**: 이 유사성에서 실제 신경망 설계나 학습의 개선으로 이어진 사례는 극히 드물다. 아름다운 관찰이지만 공학적 처방(prescription)으로는 발전하지 않았다.
- **보편성 주장의 한계**: 물리학에서 보편성은 엄밀하게 정의된 개념이다(동일한 임계 지수). 신경망에서 "보편적 표현 학습"을 RG의 보편성과 동일시하는 것은 개념의 과도한 확장일 수 있다.

이 주제의 가장 정직한 요약은 다음과 같다. RG와 심층 학습 사이에는 주목할 만한 구조적 유사성이 존재하며, 이를 탐구하는 것은 양 분야에 대한 이해를 깊게 한다. 하지만 이것을 "심층 학습이 RG다" 또는 "RG가 심층 학습을 설명한다"로 단정하는 것은 현재의 근거로는 과도하다.

## 용어 정리

재규격화군(renormalization group, RG) - 물리 시스템의 서로 다른 스케일 사이 관계를 체계적으로 분석하는 프레임워크. Wilson(1971)이 정립

블록 스핀 변환(block spin transformation) - 인접 스핀을 블록으로 묶어 유효 스핀으로 대체하는 조대화 절차. Kadanoff(1966)가 제안

조대화(coarse-graining) - 미시적 자유도를 제거하고 거시적 유효 변수만 남기는 과정. RG의 핵심 연산

RG 흐름(RG flow) - 조대화를 반복할 때 유효 결합 상수가 파라미터 공간에서 이동하는 궤적

고정점(fixed point) - RG 변환에 의해 변하지 않는 결합 상수 값. 임계점에 대응

임계 지수(critical exponent) - 임계점 근처에서 물리량의 발산 양상을 기술하는 거듭제곱 지수. 보편성의 수학적 표현

보편성(universality) - 미시적 세부가 다른 시스템들이 동일한 임계 거동을 보이는 현상. RG 고정점으로 설명

스케일 불변성(scale invariance) - 시스템의 물리적 성질이 관찰 스케일에 무관한 성질. 임계점에서 나타남

베타 함수(beta function) - 결합 상수의 스케일 의존성을 기술하는 함수. 고정점에서 0이 됨

구조적 유사성(structural analogy) - 두 시스템이 동일한 수학적 구조를 공유하지만, 한쪽이 다른 쪽에 영감을 준 것은 아닌 관계

---EN---
Renormalization Group - A structural analogy discovered between physics' multi-scale analysis framework and deep neural network feature extraction (hypothesis stage)

## Physical Background of the Renormalization Group

The Renormalization Group (RG) is among the deepest concepts in physics -- a framework for systematically connecting physics across different scales. Kenneth Wilson (1971) formalized it, earning the 1982 Nobel Prize in Physics.

The problem RG solved is this: when water boils, a critical point exists at a certain temperature where the distinction between liquid and gas vanishes. Near the critical point, the system exhibits curious behavior. Self-similarity appears, with identical patterns repeating at all scales, and identical macroscopic behavior is observed regardless of the material's microscopic details. The magnetic critical phenomena of iron and the liquid-gas critical phenomena of water follow the same mathematical laws -- this is universality.

Before RG, there was no way to explain this universality. Why systems with completely different microscopic constituents (different atomic types, different interaction details) show identical macroscopic behavior was a puzzle of physics.

## Block Spin Transformation: The Core RG Procedure

The block spin transformation, proposed by Leo Kadanoff (1966) and mathematically perfected by Wilson (1971), intuitively demonstrates RG's core idea.

Start from an Ising model lattice. Group several adjacent spins into one block. Remove the internal spin details and replace the entire block with a single effective spin. Repeating this process progressively lowers the lattice resolution.

The key question is: how do the effective interactions between block spins differ from the original interactions? Wilson developed a systematic method for tracking how effective interactions change as this transformation is iterated. This is the RG flow.

The mathematical core of RG flow is the transformation of coupling constants:

K' = R(K)

Here K is the set of coupling constants at the original scale, K' is the effective coupling constants after coarse-graining, and R is the RG transformation. Iterating this transformation causes coupling constants to flow toward specific fixed points. The critical point corresponds to an RG fixed point, and universality is explained by different starting points (microscopic details) flowing toward the same fixed point.

## Beta Function and Critical Exponents

For continuous scale changes, the RG transformation is described by the beta function:

beta(g) = dg/d(ln s)

Here g is the coupling constant and s is the scale factor. Points where the beta function equals zero are fixed points. Linearization near fixed points determines the critical exponents.

Critical exponents describe how physical quantities diverge as power laws near the critical point. For example, magnetization M near the critical temperature T_c behaves as:

M ~ (T_c - T)^beta

Here beta (a critical exponent, different from the beta function above) is independent of the material's microscopic details and depends only on spatial dimension and symmetry. This is the mathematical expression of universality, and RG explains why such universality emerges.

## Structural Similarity with Deep Neural Networks: A Hypothesis

From this point, a very important distinction is needed. The following content describes a **structural analogy discovered post-hoc**, not an inspiration behind deep neural network design. This connection is a hypothesis proposed independently by several researchers since 2014.

Mehta and Schwab (2014) showed that an exact mathematical correspondence exists between Deep Belief Networks (stacked RBMs) and RG transformations. Their key claims are:

- One RBM layer corresponds to one step of block spin transformation
- Compressing fine-grained variables in the visible layer into coarse-grained variables in the hidden layer resembles coarse-graining
- Learning progressively more abstract representations across layers resembles the RG flow where microscale details are lost and only macroscopic properties remain

## Follow-up Research and Debate

Lin, Tegmark, and Rolnick (2017) analyzed from a broader perspective why physical laws are well-approximated by deep learning. Their argument is that structural properties of physical laws -- locality, symmetry, polynomial relationships, hierarchical structure -- match the structure of deep neural networks well. RG's hierarchical coarse-graining and deep learning's hierarchical feature extraction were presented as one instance of this structural alignment.

Li and Wang (2018) explicitly used neural networks to learn RG transformations, showing that neural networks can rediscover the RG flow of physical systems. This demonstrates that AI can perform RG, which is different from saying AI was inspired by RG.

**However**, criticism of this analogy is substantial. Schwab and Mehta themselves acknowledged limitations in follow-up papers, and some researchers argue the correspondence is superficial. Specific criticisms include:

First, RG operates under specific physical symmetries and conservation laws; general neural networks lack these constraints. Second, RG's coarse-graining intentionally discards information, which is the point, but whether neural network feature extraction discards information in the same sense is unclear. Third, Mehta and Schwab's exact correspondence holds only under very specific conditions (1D Ising model, specific RBM structure) and has not been verified for general deep neural networks.

## Structural Comparison with CNNs

Although a post-hoc observation rather than a design inspiration, the structural comparison between CNNs and RG has educational value.

In CNNs, images are processed through multiple layers. Early layers capture fine features like edges and textures, middle layers capture partial shapes, and deep layers capture macroscopic features like entire objects. Pooling operations reduce spatial resolution while removing detail.

In RG, iterative coarse-graining similarly eliminates microscopic details, leaving only macroscopic properties (critical exponents, universality classes). The structural similarity between the two processes is notable, but whether this reflects the same mathematical principle or is a coincidence of hierarchical information processing as a universal structure remains an open question.

## Scale Invariance and Generative Models

Scale invariance, central to RG, is also observed in some generative models. The noise schedules in diffusion models sequentially generate structures at multiple scales, and the observation has been made that this resembles RG's multi-scale processing. However, this connection is also a post-hoc observation; the designers of diffusion models did not reference RG.

## Limitations and Weaknesses

The RG-deep learning analogy is intriguing but currently closer to a hypothesis than established fact.

- **Not a direct inspiration**: The designers of deep neural networks (LeCun, Hinton, Bengio, etc.) were not inspired by RG. This connection was discovered through post-hoc analysis, and this distinction must be made clear.
- **Narrow exact correspondence**: Mehta and Schwab's (2014) exact mathematical correspondence is limited to the 1D Ising model and specific RBM structures. Extension to general deep learning has not been rigorously demonstrated.
- **Different meanings of information removal**: In RG, information removal is a systematic procedure to preserve physically meaningful macroscopic variables. Whether neural network feature extraction "systematically removes unnecessary information" in the same sense is debated.
- **Absence of practical implications**: Cases where this analogy has led to actual improvements in neural network design or training are extremely rare. It is a beautiful observation but has not developed into engineering prescriptions.
- **Limitations of universality claims**: In physics, universality is a rigorously defined concept (identical critical exponents). Equating "universal representation learning" in neural networks with RG's universality may be an overextension of the concept.

The most honest summary of this topic is as follows: notable structural similarities exist between RG and deep learning, and exploring them deepens understanding of both fields. However, concluding that "deep learning is RG" or "RG explains deep learning" exceeds the current evidence.

## Glossary

Renormalization group (RG) - a framework for systematically analyzing relationships between different scales in physical systems. Formalized by Wilson (1971)

Block spin transformation - a coarse-graining procedure that groups adjacent spins into blocks and replaces them with effective spins. Proposed by Kadanoff (1966)

Coarse-graining - the process of eliminating microscopic degrees of freedom and retaining only macroscopic effective variables. The core operation of RG

RG flow - the trajectory of effective coupling constants through parameter space as coarse-graining is iterated

Fixed point - coupling constant values unchanged by the RG transformation. Corresponds to the critical point

Critical exponent - the power-law exponent describing how physical quantities diverge near the critical point. The mathematical expression of universality

Universality - the phenomenon where systems with different microscopic details exhibit identical critical behavior. Explained by RG fixed points

Scale invariance - the property that a system's physical properties are independent of the observation scale. Appears at critical points

Beta function - a function describing the scale dependence of coupling constants. Equals zero at fixed points

Structural analogy - a relationship where two systems share the same mathematical structure, but neither inspired the other
