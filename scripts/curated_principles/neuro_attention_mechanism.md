---
difficulty: intermediate
connectionType: conceptual_borrowing
keywords: 선택적 주의, 트랜스포머 어텐션, 자기 주의, 필터 이론, 특징 통합, 하향식 주의, 상향식 주의, 인지 병목
keywords_en: selective attention, transformer attention, self-attention, filter theory, feature integration, top-down attention, bottom-up attention, cognitive bottleneck
---
Selective Attention - 인지심리학의 주의(attention) 이론이 이름과 개념적 영감을 제공했지만, 수학적 구현은 근본적으로 다른 방향으로 진화한 사례

## 칵테일 파티에서 시작된 문제

1953년, 영국의 통신공학자 Colin Cherry는 하나의 질문을 던졌다. 시끄러운 칵테일 파티에서 수십 명이 동시에 말하는데, 어떻게 우리는 대화 상대의 목소리만 골라 들을 수 있는가? 그는 양쪽 귀에 서로 다른 메시지를 들려주는 이분 청취(dichotic listening) 실험을 설계했다. 피험자에게 한쪽 귀의 메시지만 따라 말하게 하면, 반대쪽 귀에 들어온 내용은 거의 기억하지 못했다. Moray(1959)의 후속 연구는 자기 이름이 불리면 주의가 전환됨을 확인했다. 이 **칵테일 파티 효과**가 주의(attention) 연구의 출발점이 되었다.

핵심 발견은 이것이다. 뇌는 감각 입력을 전부 동등하게 처리하지 않는다. 어떤 정보는 강화하고 나머지는 억제하는 **선택 메커니즘**이 존재한다. 이 메커니즘을 둘러싼 60년의 논쟁이, AI에서 가장 중요한 구조 중 하나에 이름과 개념적 뼈대를 제공하게 된다.

## 뇌는 어떻게 선택하는가: 세 가지 패러다임

주의에 대한 이해는 세 가지 이론을 거치며 정밀해졌다.

**필터 이론** -- Broadbent(1958)는 주의를 초기 단계의 병목 필터로 보았다. 물리적 특성(목소리 톤, 방향)에 기반하여 하나의 채널만 통과시킨다.

**감쇠 이론** -- Treisman(1964)은 비주의 채널이 완전 차단이 아닌 약화(감쇠)된다고 수정했다. 자기 이름 같은 생존 관련 신호는 역치가 낮아 약한 신호로도 의식에 도달한다.

**특징 통합 이론** -- Treisman & Gelade(1980)는 시각적 주의에서 두 단계를 도출했다. 기본 특징(색, 방향)은 전주의 단계에서 병렬 추출되지만, 특징의 결합(빨간+X)은 집중적 주의를 통해 특정 공간 위치에서 이루어진다.

## 두 방향의 주의: 상향식과 하향식

Posner(1980)의 공간 단서 실험 이후, 주의는 두 가지 방향으로 구분되었다.

- **상향식 주의**(bottom-up): 자극 자체의 속성이 자동으로 주의를 잡아끄는 것. 비자발적이고 빠르다(100-120ms). Itti & Koch(2000)는 색, 밝기, 방향의 대비에서 현저성 지도(saliency map)를 계산하는 모델을 제안했다.
- **하향식 주의**(top-down): 목표와 기대에 의해 의도적으로 주의를 배분하는 것. 군중 속에서 빨간 모자를 찾을 때, 전두엽이 시각 피질에 하향 신호를 보내 빨간색 뉴런의 감수성을 높인다.

## 인지과학에서 AI로: 이름의 이주

이 원리가 AI로 건너간 경로는 SA(simulated annealing)처럼 수식이 직접 이식된 경우와 근본적으로 다르다. 전이된 것은 수학이 아니라 이름과 직관이다.

- "attention"이라는 용어 --> Bahdanau, Cho & Bengio(2014)가 기계 번역 논문에서 채택하여 대중화했다. 인지심리학의 "중요한 것에 집중"이라는 직관을 빌렸으나, 동기는 seq2seq 모델의 정보 병목이라는 순수 공학 문제였다
- 선택적 처리라는 개념 --> 모든 입력을 동등하게 다루지 않고, **가중치를 차등 부여**한다는 높은 수준의 아이디어가 공유되었다
- 수학적 메커니즘 --> 인지 이론에서 유도된 것이 **아니다**. softmax 가중합은 정보 검색과 연관 기억의 전통에서 독립적으로 발전했다

핵심은 이것이다. "Attention Is All You Need"(Vaswani et al., 2017)는 인지과학이나 신경과학 문헌을 단 한 편도 인용하지 않는다. 이것은 **이름과 직관의 차용(conceptual borrowing)**이지, 수식의 직접적 이식이 아니다.

## Transformer 주의 메커니즘: 실제 수학

Bahdanau(2014)의 원래 문제: seq2seq 인코더가 입력 전체를 고정 길이 벡터로 압축해야 해서 긴 문장에서 성능이 급락했다. 해결책은 디코더가 매 출력마다 입력의 모든 위치를 참조하되, 관련 위치에 더 높은 가중치를 두는 것이었다.

Vaswani et al.(2017)은 순환 구조를 완전히 제거하고 자기 주의(self-attention)만으로 Transformer를 구성했다. 핵심 수식:

Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V

Q(Query)는 "찾고 싶은 것", K(Key)는 "각 위치의 이름표", V(Value)는 "실제 내용"이다. sqrt(d_k)로 나누는 이유는 고차원에서 내적이 과대해져 softmax가 극단적 분포로 몰리는 것을 방지하기 위해서다.

## 뇌의 주의와 Transformer 주의: 무엇이 같고 무엇이 다른가

**보존된 것 (개념 수준):**

- 선택성: 둘 다 일부 정보를 강화하고 나머지에 낮은 비중을 부여한다
- 가중 결합: 둘 다 여러 입력에 차등적 가중치를 부여하여 하나의 출력을 만든다
- 병목 해결: 뇌의 주의는 처리 용량 한계를, 계산적 주의는 고정 길이 벡터 병목을 해결한다

**변형되거나 사라진 것 (메커니즘 수준):**

- 직렬 vs 병렬: Posner의 스포트라이트 모델에 따르면 뇌의 주의는 한 초점에 집중하는 직렬 과정이다(분할 주의 연구에서 도전받는 중). Transformer는 모든 위치를 동시에 계산하는 병렬 연산이다
- 억제의 역할: 뇌에서 주의는 비선택 정보를 적극 억제한다(경쟁적 억제). Transformer의 softmax는 확률적 정규화에 의한 간접 경쟁만 수행하며, 별도의 능동 억제 신호는 없다
- 자기 주의의 부재: 뇌에 자기참조 처리(mPFC)나 재귀적 피질 연결은 있지만, self-attention과 메커니즘적으로 대응하지 않는다. 순수한 계산적 발명이다
- QKV 분해: 쿼리-키-값 분리는 정보 검색 비유로 흔히 설명되나 정확한 명명 기원은 불분명하며, 신경과학에 대응물이 없다
- 다중 헤드: 여러 관점에서 동시에 주의를 계산하는 구조는 뇌의 병렬 특징 처리와 표면적으로 유사하지만, 직접적 대응은 없다

## 현대 AI에서의 확장과 변형

**원래 직관이 남아있는 영역:**

- **Cross-attention**: Bahdanau의 원래 설계에 가장 가깝다. 디코더의 쿼리가 인코더의 키-값을 참조하는 구조는 "필요한 정보를 선택적으로 가져온다"는 인지적 직관이 비교적 잘 대응한다
- **시각 주의 모델**: Itti & Koch(2000)의 현저성 지도에서 직접 영감받은 계산 모델은, 인지과학의 상향식 주의 이론과 명확한 지적 계보를 갖는다

**인지적 직관에서 벗어난 독자적 진화:**

- **Sparse/Linear Attention**: Longformer(Beltagy et al., 2020), Performer(Choromanski et al., 2021) 등은 O(N^2) 연산을 근사하여 긴 시퀀스 비용을 줄인다. 인지과학에 대응물이 없는 순수 공학 문제다
- **Flash Attention, GQA**: GPU 메모리 계층 활용(Dao et al., 2022)이나 키-값 헤드 공유(Grouped-Query Attention, Ainslie et al., 2023) 등 하드웨어/추론 효율 최적화가 진행 중이다

## 한계와 약점

- **이름의 오해**: "Transformer가 인간처럼 주의를 기울인다"는 부정확하다. 인간의 주의는 의식, 감정, 목표와 연결된 다층적 인지 과정이며, 계산적 주의와 메커니즘 수준의 공통점은 거의 없다
- **해석 가능성의 한계**: 어텐션 가중치로 모델의 "집중"을 시각화한다는 해석은 매력적이지만, Jain & Wallace(2019)는 가중치를 무작위 교란해도 출력이 크게 바뀌지 않는 경우가 많음을 보였다
- **O(N^2) 계산 비용**: 시퀀스 길이 N에 대해 이차적으로 증가하는 연산 비용은 긴 문맥의 핵심 병목이다
- **맥락 길이의 근본적 차이**: 인간의 작업 기억은 4-7개로 제한되지만 유연하다. Transformer는 수십만 토큰을 처리하지만, 긴 문맥에서 위치에 따라 정보 추출 능력이 달라진다("lost in the middle", Liu et al., 2024)

## 용어 정리

선택적 주의(selective attention) - 다수의 감각 입력 중 특정 정보에 처리 자원을 집중하고 나머지를 억제하는 인지 기능

필터 이론(filter theory) - Broadbent(1958)가 제안한 초기 주의 모델. 물리적 특성 기반으로 하나의 채널만 통과시키는 병목 구조

특징 통합 이론(Feature Integration Theory) - Treisman & Gelade(1980)의 시각적 주의 이론. 기본 특징의 병렬 추출 후 주의에 의한 결합 단계를 거쳐 통합 객체 인식에 도달

현저성 지도(saliency map) - 시각 장면에서 각 위치의 주의를 끄는 정도를 수치화한 지형도. Itti & Koch(2000)가 계산 모델로 구현

자기 주의(self-attention) - 시퀀스 내 각 요소가 같은 시퀀스의 모든 다른 요소와의 관련성을 계산하는 메커니즘. Transformer(Vaswani et al., 2017)의 핵심 구조

쿼리-키-값(Query-Key-Value) - Transformer 어텐션의 세 요소. 쿼리가 키와의 내적으로 유사도를 결정하고, 이 가중치를 값에 적용하여 가중합을 계산

다중 헤드 어텐션(multi-head attention) - 서로 다른 선형 변환을 통해 여러 관점에서 동시에 주의를 계산하는 구조

인지 병목(cognitive bottleneck) - 정보 처리 용량의 한계로 인해 동시 처리가 제한되는 현상. 주의 메커니즘이 존재하는 근본 이유
---EN---
Selective Attention - A case where cognitive psychology's attention theories provided the name and conceptual inspiration, but mathematical implementation evolved in fundamentally different directions

## The Problem That Started at a Cocktail Party

In 1953, British telecommunications engineer Colin Cherry posed a question: at a noisy cocktail party where dozens of people speak simultaneously, how can we pick out just our conversation partner's voice? He designed a dichotic listening experiment, presenting different messages to each ear. When subjects were asked to shadow the message in one ear, they recalled almost nothing from the other ear. Moray's (1959) follow-up research confirmed that hearing one's own name could shift attention even from the unattended channel. This **cocktail party effect** became the starting point of attention research.

The key finding was this: the brain does not process all sensory input equally. A **selection mechanism** exists that enhances some information and suppresses the rest. The 60-year debate over this mechanism eventually provided the name and conceptual skeleton for one of AI's most important architectural elements.

## How the Brain Selects: Three Paradigms

Understanding of attention sharpened through three theories.

**Filter theory** -- Broadbent (1958) modeled attention as an early-stage bottleneck filter, passing only one channel based on physical properties (voice tone, direction).

**Attenuation theory** -- Treisman (1964) revised this: unattended channels are attenuated, not fully blocked. Survival-relevant signals like one's own name have low thresholds and reach consciousness even when weakened.

**Feature Integration Theory** -- Treisman & Gelade (1980) identified two stages in visual attention. Basic features (color, orientation) are extracted in parallel pre-attentively, but feature binding (red + X) requires focused attention at specific spatial locations.

## Two Directions of Attention: Bottom-Up and Top-Down

Following Posner's (1980) spatial cueing experiments, attention was divided into two directions.

- **Bottom-up attention** (exogenous): Stimulus properties automatically capture attention. Involuntary and fast (100-120ms), evolutionarily linked to predator detection. Itti & Koch (2000) proposed a saliency map model predicting the most salient locations by computing contrasts in color, intensity, and orientation.
- **Top-down attention** (endogenous): Intentional allocation driven by goals and expectations. When searching for a red hat in a crowd, visual cortex neurons' sensitivity to red actually increases. It operates via top-down signals from the prefrontal cortex boosting relevant neuron activity.

## From Cognitive Science to AI: Migration of a Name

The path this principle took into AI is fundamentally different from cases like SA, where equations were directly transplanted. What transferred was not mathematics but a name and an intuition.

- The term "attention" --> adopted and popularized by Bahdanau, Cho & Bengio (2014) in their machine translation paper. They borrowed the cognitive intuition of "focusing on what matters," but their motivation was the purely engineering problem of the seq2seq information bottleneck
- The concept of selective processing --> the high-level idea of assigning **differential weights** rather than treating all inputs equally was shared
- Mathematical mechanism --> **not** derived from cognitive theories. The softmax weighted sum developed independently from information retrieval and associative memory traditions

The critical point: "Attention Is All You Need" (Vaswani et al., 2017) does not cite a single cognitive science or neuroscience paper. This is a **conceptual borrowing** of name and intuition, not a direct transplant of equations.

## The Transformer Attention Mechanism: The Actual Mathematics

Bahdanau's (2014) original problem: in seq2seq models, the encoder compressed the entire input into a single fixed-length vector, and performance collapsed beyond about 20 words. The solution was having the decoder directly reference all input positions, placing higher weights on more relevant ones.

Vaswani et al. (2017) pushed this to its extreme, completely removing recurrent structure and building the Transformer entirely from self-attention. The core formula:

Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V

Q (Query) represents "what I'm looking for," K (Key) is "each position's label," and V (Value) is "the actual content." Division by sqrt(d_k) prevents dot products from growing too large in high dimensions, which would push softmax toward extreme distributions.

## Brain Attention vs. Transformer Attention: What Is Shared and What Differs

**What is preserved (conceptual level):**

- Selectivity: Both enhance some information while assigning lower weight to the rest
- Weighted combination: Both differentially weight multiple inputs to produce a single output
- Bottleneck resolution: Brain attention solves processing capacity limits; computational attention solves the fixed-length vector bottleneck

**What was transformed or lost (mechanism level):**

- Serial vs. parallel: Under Posner's spotlight model, brain attention focuses on one location at a time (though split attention research has challenged this view). Transformer attention computes all positions simultaneously in parallel
- The role of suppression: In the brain, attention actively suppresses unselected information (competitive inhibition). Transformer softmax performs only indirect competition through probabilistic normalization, with no separate active suppression signal
- No self-attention analogue: The brain has self-referential processing (mPFC) and recurrent cortical connections, but none correspond mechanistically to self-attention. It is a purely computational invention
- QKV decomposition: The query-key-value separation is commonly explained via the database retrieval metaphor, though its exact naming origin is unclear. It has no corresponding structure in neuroscience
- Multi-head: Computing attention from multiple perspectives simultaneously superficially resembles the brain's parallel feature processing, but has no direct counterpart

## Extensions and Variations in Modern AI

**Where the original intuition persists:**

- **Cross-attention**: Closest to Bahdanau's original design. The decoder querying encoder key-values maps relatively well to the cognitive intuition of "selectively retrieving needed information"
- **Visual saliency models**: Models directly inspired by Itti & Koch's (2000) saliency map have a clear lineage from cognitive bottom-up attention theory

**Independent evolution beyond cognitive intuition:**

- **Sparse/Linear Attention**: Longformer (Beltagy et al., 2020) and Performer (Choromanski et al., 2021) approximate full attention to reduce O(N^2) cost for long sequences. Pure engineering solutions with no cognitive counterpart
- **Flash Attention, GQA**: GPU memory hierarchy exploitation (Dao et al., 2022) and key-value head sharing (Grouped-Query Attention, Ainslie et al., 2023) optimize hardware and inference efficiency

## Limitations and Weaknesses

- **Naming misconception**: "Transformers attend like humans" is inaccurate. Human attention is a multi-layered cognitive process linked with consciousness, emotion, and goals, sharing almost no mechanism-level commonality with computational attention
- **Interpretability limits**: Jain & Wallace (2019) showed that randomly perturbing attention weights often barely changes output
- **O(N^2) computational cost**: Computation growing quadratically with sequence length N is the core bottleneck for long-context processing
- **Context length difference**: Human working memory is limited to 4-7 items but flexible. Transformers process hundreds of thousands of tokens but extraction quality varies by position ("lost in the middle", Liu et al., 2024)

## Glossary

Selective attention - the cognitive function of concentrating processing resources on specific information while suppressing the rest

Filter theory - an early attention model proposed by Broadbent (1958) with a bottleneck structure passing only one channel based on physical properties

Feature Integration Theory - a visual attention theory by Treisman & Gelade (1980) in which parallel feature extraction is followed by attention-mediated binding for integrated object recognition

Saliency map - a topographic map quantifying how much each location attracts attention. Implemented as a computational model by Itti & Koch (2000)

Self-attention - a mechanism where each element computes its relevance to every other element in the same sequence. The core structure of the Transformer (Vaswani et al., 2017)

Query-Key-Value - the three components of Transformer attention, where queries determine similarity through dot products with keys, and weights are applied to values

Multi-head attention - a structure that simultaneously computes attention from multiple perspectives through different linear transformations

Cognitive bottleneck - the limitation of simultaneous processing due to capacity constraints. The fundamental reason attention mechanisms exist
