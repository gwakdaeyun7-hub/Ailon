---
difficulty: intermediate
connectionType: conceptual_borrowing
keywords: 선택적 주의, 트랜스포머 어텐션, 자기 주의, 필터 이론, 특징 통합, 하향식 주의, 상향식 주의, 인지 병목
keywords_en: selective attention, transformer attention, self-attention, filter theory, feature integration, top-down attention, bottom-up attention, cognitive bottleneck
---
Selective Attention in the Brain - 인지심리학의 주의(attention) 이론이 이름과 개념적 영감을 제공했지만, 수학적 구현은 근본적으로 다른 방향으로 진화한 사례

## 칵테일 파티에서 시작된 문제

시끄러운 칵테일 파티에서 수십 명이 동시에 말하고 있는데도, 우리는 대화 상대의 목소리에 집중할 수 있다. 동시에 누군가가 우리 이름을 부르면 그쪽으로 주의가 전환된다. Colin Cherry(1953)가 처음 체계적으로 기술한 이 **칵테일 파티 효과**는 인지심리학에서 주의(attention) 연구의 출발점이 되었다.

핵심 질문은 이것이다. 뇌는 어떻게 방대한 감각 입력 중 일부만 선택하여 처리하는가? 이 질문에 대한 답이 60년에 걸쳐 발전하면서, 결국 AI에서 가장 중요한 메커니즘 중 하나에 이름과 개념적 영감을 제공하게 된다.

## 인지심리학의 주의 이론: 세 가지 패러다임

주의에 대한 이해는 세 가지 주요 이론을 통해 발전했다.

필터 이론 -- Broadbent(1958): Donald Broadbent는 주의를 정보 처리의 초기 단계에서 작동하는 병목 필터로 모델링했다. 감각 입력은 모두 단기 저장소에 들어오지만, 처리 용량의 한계 때문에 물리적 특성(목소리 톤, 방향)에 기반하여 하나의 채널만 선택된다. 선택되지 않은 정보는 거의 처리되지 않는다. 이것은 컴퓨터 과학의 정보 처리 은유에 강하게 영향받은 초기 인지심리학의 대표적 모델이다.

감쇠 이론 -- Treisman(1964): Anne Treisman은 Broadbent의 완전 차단 모델을 수정하여, 비주의 채널의 정보가 완전히 차단되는 것이 아니라 감쇠(약화)된다고 제안했다. 중요한 정보(자기 이름, 위험 신호)는 낮은 활성화 역치를 가지므로 감쇠된 채널에서도 의식에 도달할 수 있다. 칵테일 파티에서 이름이 들리는 현상을 설명하는 모델이다.

특징 통합 이론 -- Treisman & Gelade(1980): 시각적 주의에 관한 이 이론은 시각 처리가 두 단계로 이루어진다고 제안했다. (1) 전주의 단계(pre-attentive): 색, 방향, 크기 같은 기본 특징이 자동적으로, 병렬적으로 추출된다. (2) 집중적 주의 단계(focused attention): 이 기본 특징들이 특정 위치에서 결합되어 통합된 객체 지각이 형성된다. 주의는 이 결합(binding)의 "접착제"다.

## 두 방향의 주의: 상향식과 하향식

Posner(1980)의 연구 이후, 주의는 두 가지 방향으로 구분되었다.

- 상향식 주의(bottom-up, exogenous): 자극 자체의 속성(갑작스러운 움직임, 밝은 색, 큰 소리)이 자동적으로 주의를 끄는 것. 비자발적이고 빠르다. 진화적으로 위험 감지와 관련된다.
- **하향식 주의**(top-down, endogenous): 목표와 기대에 의해 의도적으로 주의를 배분하는 것. 군중 속에서 빨간 모자를 찾으려 할 때, 빨간색에 대한 감수성이 증가하는 것이 하향식 주의다. 자발적이고 느리지만, 복잡한 과제 수행에 필수적이다.

생물학적 주의의 핵심 특성을 정리하면 다음과 같다.

- 용량 제한적이다 (동시에 모든 것을 처리할 수 없다)
- 선택적이다 (관련 정보를 강화하고 무관 정보를 억제한다)
- 목표 지향적이다 (과제에 따라 주의 배분이 바뀐다)
- 공간적이다 (시야의 특정 위치에 초점을 맞출 수 있다)
- 조절 가능하다 (집중 범위를 좁히거나 넓힐 수 있다)

## AI에서의 주의 메커니즘: 이름은 같지만 다른 존재

신경망에서의 주의 메커니즘은 Bahdanau, Cho & Bengio(2015)의 기계 번역 연구에서 탄생했다. 기존 seq2seq 모델은 입력 시퀀스 전체를 하나의 고정 길이 벡터로 압축해야 했는데, 긴 문장에서 정보 손실이 심각했다. Bahdanau의 해결책은 디코더가 각 출력 단어를 생성할 때 입력 시퀀스의 **모든 위치에 가중치를 부여**하고, 관련 높은 위치에 더 많은 가중치를 두는 것이었다.

Vaswani et al.(2017)은 "Attention Is All You Need"에서 이를 극한까지 밀어붙여 자기 주의(self-attention) 메커니즘만으로 전체 아키텍처를 구성한 Transformer를 제안했다. 핵심 수식은 다음과 같다.

Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V

각 요소의 의미를 풀어쓰면 다음과 같다.

- Q (Query) --> "내가 찾고 있는 것" (현재 처리 중인 토큰이 어떤 정보를 필요로 하는가)
- K (Key) --> "내가 가진 것의 레이블" (각 토큰이 제공할 수 있는 정보의 종류)
- V (Value) --> "실제 내용" (각 토큰이 전달하는 실제 정보)
- Q * K^T --> 쿼리와 키의 유사도 계산 (어떤 토큰이 관련 있는가)
- sqrt(d_k) --> 스케일링 팩터 (내적 값이 차원에 따라 커지는 것을 보정)
- softmax --> 유사도를 확률 분포로 변환 (가중치의 합이 1이 되도록)

다중 헤드 어텐션(multi-head attention)은 서로 다른 관점에서 동시에 주의를 기울인다.

head_i = Attention(Q * W_i^Q, K * W_i^K, V * W_i^V)
MultiHead = Concat(head_1, ..., head_h) * W^O

각 헤드가 다른 선형 변환(W_i)을 사용하므로 서로 다른 유형의 관계(문법적, 의미적, 위치적)를 포착할 수 있다.

## 영감의 다리: 무엇이 보존되고 무엇이 달라졌는가

인지적 주의와 계산적 주의 사이에는 중요한 구조적 유사점이 있다.

- 선택성: 둘 다 일부 정보를 강화하고 나머지를 억제한다
- 가중 결합: 둘 다 여러 입력에 차등적 가중치를 부여하여 결합한다
- 용량 제약에 대한 해법: 인지적 주의는 처리 용량의 한계를, 계산적 주의는 고정 길이 벡터의 병목을 해결한다

하지만 근본적 차이가 더 크다.

- 방향성: 뇌의 주의는 하향식(목표 기반) + 상향식(자극 기반)의 두 방향이 상호작용한다. Transformer 주의는 순수하게 데이터로부터 학습된 패턴으로, 명시적 목표 지향성이 없다.
- 공간성 vs 토큰 관계: 뇌의 시각적 주의는 공간적 위치에 초점을 맞춘다. Transformer 주의는 토큰 간 추상적 관계를 계산하며, 공간 개념이 없다.
- 용량 제한: 뇌의 주의는 본질적으로 용량 제한적이다(한 번에 소수의 항목만). Transformer 주의는 모든 토큰 쌍을 동시에 계산한다 -- 오히려 O(N^2) 연산의 비효율이 문제다.
- 억제: 뇌의 주의는 무관 정보를 적극적으로 억제한다. softmax는 상대적으로 낮은 가중치를 부여하지만, 능동적 억제와는 다르다.

## Vaswani et al.은 신경과학에서 영감받았는가?

이 질문에 대한 정직한 답은 **명확한 증거가 없다**는 것이다. "Attention Is All You Need" 논문은 인지과학이나 신경과학 문헌을 인용하지 않는다. "attention"이라는 용어는 Bahdanau et al.(2015)에서 이미 사용되었고, Bahdanau의 동기는 seq2seq 모델의 정보 병목을 해결하는 공학적 문제였다.

다만, "attention"이라는 이름 자체가 인지심리학에서 차용된 것은 분명하다. 그리고 "중요한 것에 집중한다"는 높은 수준의 직관은 공유된다. 하지만 수학적 메커니즘은 독립적으로 개발되었으며, 인지적 주의 이론에서 직접 유도된 것이 아니다. 이것은 **이름과 직관의 영감이 전이되었지만, 구현은 독립적**인 사례다.

## 한계와 약점

"주의"라는 이름이 주는 오해와 기술적 한계 모두를 인식해야 한다.

- 이름의 오해: "Transformer attention이 인간처럼 주의를 기울인다"는 것은 부정확하다. 메커니즘, 목적, 구현이 모두 다르다. 인간의 주의는 의식과 밀접하게 연결되지만, 계산적 주의는 가중합에 불과하다.
- O(N^2) 계산 비용: 시퀀스 길이에 대한 이차 복잡도가 긴 문맥 처리의 병목이다. 효율적 주의 연구(Performer, FlashAttention, Ring Attention)가 활발하지만, 이것은 생물학적 주의에는 존재하지 않는 공학적 문제다.
- 해석 가능성의 한계: 어텐션 가중치가 모델의 "집중"을 시각화한다는 직관적 해석은 매력적이지만, Jain & Wallace(2019)는 어텐션 가중치와 모델의 실제 의사결정 사이의 대응이 약할 수 있음을 보였다.
- 맥락 길이의 근본적 차이: 인간의 작업 기억은 4-7개 항목으로 제한되지만 매우 유연하다. Transformer는 수십만 토큰을 처리할 수 있지만 진정한 이해와는 다르다.
- 감정과 동기 부재: 인간의 주의 배분은 감정 상태, 동기, 피로에 의해 강하게 영향받는다. 위험 자극에 우선적으로 주의가 가는 것은 생존과 직결된다. 계산적 주의에는 이런 차원이 전혀 없다.

## 용어 정리

선택적 주의(selective attention) - 다수의 감각 입력 중 특정 정보에 처리 자원을 집중하고 나머지를 억제하는 인지 기능

필터 이론(filter theory) - Broadbent(1958)가 제안한 초기 주의 모델. 정보 처리 초기 단계에서 물리적 특성 기반으로 하나의 채널만 선택

특징 통합 이론(Feature Integration Theory) - Treisman & Gelade(1980)가 제안한 시각적 주의 이론. 기본 특징의 병렬 추출 후 주의에 의한 결합 단계를 거침

자기 주의(self-attention) - 시퀀스 내 각 요소가 같은 시퀀스의 모든 다른 요소와의 관련성을 계산하는 메커니즘

쿼리-키-값(Query-Key-Value) - Transformer 어텐션의 세 요소. 쿼리가 키와의 유사도로 가중치를 결정하고, 값에 적용

다중 헤드 어텐션(multi-head attention) - 서로 다른 선형 변환을 사용하여 여러 관점에서 동시에 주의를 계산하는 구조

상향식 주의(bottom-up attention) - 자극의 현저성에 의해 자동적으로 유발되는 비자발적 주의. 진화적 위험 감지와 관련

하향식 주의(top-down attention) - 목표와 기대에 의해 의도적으로 주의를 배분하는 자발적 주의

인지 병목(cognitive bottleneck) - 정보 처리 용량의 한계로 인해 동시 처리가 제한되는 현상. 주의 메커니즘의 존재 이유

어텐션 가중치(attention weight) - softmax를 통해 계산된, 각 입력 요소에 부여되는 중요도 점수

---EN---
Selective Attention in the Brain - A case where cognitive psychology's attention theories provided the name and conceptual inspiration, but mathematical implementation evolved in fundamentally different directions

## The Problem That Started at a Cocktail Party

At a noisy cocktail party where dozens of people speak simultaneously, we can focus on our conversation partner's voice. At the same time, if someone calls our name, our attention shifts toward them. This **cocktail party effect**, first systematically described by Colin Cherry (1953), became the starting point for attention research in cognitive psychology.

The core question was: how does the brain select and process only a subset of vast sensory input? As answers to this question developed over 60 years, they eventually provided the name and conceptual inspiration for one of AI's most important mechanisms.

## Cognitive Psychology's Attention Theories: Three Paradigms

Understanding of attention evolved through three major theories.

Filter theory -- Broadbent (1958): Donald Broadbent modeled attention as a bottleneck filter operating at early stages of information processing. All sensory input enters a short-term store, but processing capacity limits force selection of only one channel based on physical properties (voice tone, direction). Unselected information receives minimal processing. This was a quintessential early cognitive psychology model strongly influenced by computer science's information processing metaphor.

Attenuation theory -- Treisman (1964): Anne Treisman modified Broadbent's complete-blocking model, proposing that unattended channel information is not fully blocked but attenuated (weakened). Important information (one's own name, danger signals) has a low activation threshold, allowing it to reach consciousness even through attenuated channels. This model explains hearing one's name at a cocktail party.

Feature Integration Theory -- Treisman & Gelade (1980): This theory of visual attention proposed that visual processing occurs in two stages: (1) Pre-attentive stage: Basic features like color, orientation, and size are extracted automatically and in parallel. (2) Focused attention stage: These basic features are bound at specific locations to form integrated object percepts. Attention serves as the "glue" for this binding.

## Two Directions of Attention: Bottom-Up and Top-Down

Following Posner's (1980) research, attention was distinguished along two directions:

- Bottom-up attention (exogenous): Stimulus properties themselves (sudden movement, bright color, loud sound) automatically capture attention. It is involuntary and fast, evolutionarily related to danger detection.
- **Top-down attention** (endogenous): Intentional allocation of attention driven by goals and expectations. When searching for a red hat in a crowd, increased sensitivity to red exemplifies top-down attention. It is voluntary and slower but essential for complex task performance.

Key characteristics of biological attention:

- Capacity-limited (cannot process everything simultaneously)
- Selective (enhances relevant and suppresses irrelevant information)
- Goal-directed (attention allocation changes with the task)
- Spatial (can focus on specific visual field locations)
- Adjustable (can narrow or broaden the focus of attention)

## Attention Mechanisms in AI: Same Name, Different Entity

The attention mechanism in neural networks was born in Bahdanau, Cho & Bengio's (2015) machine translation research. Previous seq2seq models had to compress the entire input sequence into a single fixed-length vector, causing severe information loss for long sentences. Bahdanau's solution was to have the decoder assign weights to all positions in the input sequence when generating each output word, placing higher weights on more relevant positions.

Vaswani et al. (2017) pushed this to its limit in "Attention Is All You Need," proposing the Transformer architecture built entirely from self-attention mechanisms. The core formula is:

Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V

Each element means:

- Q (Query) --> "what I'm looking for" (what information the current token needs)
- K (Key) --> "label of what I have" (the type of information each token can provide)
- V (Value) --> "actual content" (the actual information each token conveys)
- Q * K^T --> similarity computation between queries and keys (which tokens are relevant)
- sqrt(d_k) --> scaling factor (correcting for inner products growing with dimension)
- softmax --> converting similarities to a probability distribution (weights sum to 1)

Multi-head attention attends from different perspectives simultaneously:

head_i = Attention(Q * W_i^Q, K * W_i^K, V * W_i^V)
MultiHead = Concat(head_1, ..., head_h) * W^O

Each head uses different linear transformations (W_i), enabling capture of different types of relationships (syntactic, semantic, positional).

## Bridge of Inspiration: What Was Preserved and What Changed

There are important structural similarities between cognitive and computational attention:

- Selectivity: Both enhance some information while suppressing the rest
- Weighted combination: Both differentially weight and combine multiple inputs
- Solution to capacity constraints: Cognitive attention solves processing capacity limits; computational attention solves the fixed-length vector bottleneck

But the fundamental differences are greater:

- Directionality: Brain attention involves interaction between top-down (goal-based) and bottom-up (stimulus-based) directions. Transformer attention is a purely data-learned pattern with no explicit goal-directedness.
- Spatial vs. token relationships: Visual brain attention focuses on spatial locations. Transformer attention computes abstract relationships between tokens with no spatial concept.
- Capacity limits: Brain attention is inherently capacity-limited (only a few items at a time). Transformer attention computes all token pairs simultaneously -- rather, the O(N^2) computational inefficiency is the problem.
- Inhibition: Brain attention actively suppresses irrelevant information. Softmax assigns relatively low weights, which differs from active suppression.

## Was Vaswani et al. Inspired by Neuroscience?

The honest answer is that **there is no clear evidence**. "Attention Is All You Need" does not cite cognitive science or neuroscience literature. The term "attention" was already used by Bahdanau et al. (2015), and Bahdanau's motivation was the engineering problem of solving the information bottleneck in seq2seq models.

However, the name "attention" was clearly borrowed from cognitive psychology, and the high-level intuition of "focusing on what matters" is shared. But the mathematical mechanism was independently developed and not directly derived from cognitive attention theories. This is a case where **name and intuition were transferred, but implementation was independent**.

## Limitations and Weaknesses

Both the misconceptions created by the name "attention" and technical limitations must be recognized.

- Naming misconception: "Transformer attention attends like humans" is inaccurate. The mechanism, purpose, and implementation all differ. Human attention is intimately linked with consciousness; computational attention is merely a weighted sum.
- O(N^2) computational cost: Quadratic complexity with sequence length is a bottleneck for long-context processing. Efficient attention research (Performer, FlashAttention, Ring Attention) is active, but this is an engineering problem that does not exist in biological attention.
- Interpretability limits: The intuitive interpretation of attention weights as visualizing the model's "focus" is appealing, but Jain & Wallace (2019) showed that the correspondence between attention weights and actual model decisions can be weak.
- Fundamental context length difference: Human working memory is limited to 4-7 items but is highly flexible. Transformers can process hundreds of thousands of tokens but this differs from genuine understanding.
- Absence of emotion and motivation: Human attention allocation is strongly influenced by emotional state, motivation, and fatigue. Prioritizing attention to dangerous stimuli is directly linked to survival. Computational attention entirely lacks this dimension.

## Glossary

Selective attention - the cognitive function of concentrating processing resources on specific information among multiple sensory inputs while suppressing the rest

Filter theory - an early attention model proposed by Broadbent (1958) that selects a single channel based on physical properties at early processing stages

Feature Integration Theory - a visual attention theory by Treisman & Gelade (1980) involving parallel extraction of basic features followed by attention-mediated binding

Self-attention - a mechanism where each element in a sequence computes its relevance to every other element in the same sequence

Query-Key-Value - the three components of Transformer attention, where queries determine weights through similarity with keys, applied to values

Multi-head attention - a structure that simultaneously computes attention from multiple perspectives using different linear transformations

Bottom-up attention - involuntary attention automatically triggered by stimulus salience, related to evolutionary danger detection

Top-down attention - voluntary attention intentionally allocated based on goals and expectations

Cognitive bottleneck - the limitation of simultaneous processing due to information processing capacity constraints, the reason attention mechanisms exist

Attention weight - an importance score assigned to each input element, computed through softmax
