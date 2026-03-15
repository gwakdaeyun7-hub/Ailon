---
difficulty: intermediate
connectionType: conceptual_borrowing
keywords: 선택적 주의, 트랜스포머 어텐션, 자기 주의, 필터 이론, 특징 통합, 하향식 주의, 상향식 주의, 인지 병목
keywords_en: selective attention, transformer attention, self-attention, filter theory, feature integration, top-down attention, bottom-up attention, cognitive bottleneck
---
Selective Attention in the Brain - 인지심리학의 주의(attention) 이론이 이름과 개념적 영감을 제공했지만, 수학적 구현은 근본적으로 다른 방향으로 진화한 사례

## 칵테일 파티에서 시작된 문제

1953년, 영국의 인지심리학자 Colin Cherry는 하나의 질문을 던졌다. 시끄러운 칵테일 파티에서 수십 명이 동시에 말하는데, 어떻게 우리는 대화 상대의 목소리만 골라 들을 수 있는가? 그는 양쪽 귀에 서로 다른 메시지를 들려주는 이분 청취(dichotic listening) 실험을 설계했다. 피험자에게 한쪽 귀의 메시지만 따라 말하게 하면, 반대쪽 귀에 들어온 내용은 거의 기억하지 못했다. 언어가 바뀌어도, 말이 역재생되어도 눈치채지 못하는 경우가 많았다. 단, 자기 이름이 불리면 주의가 전환되었다. 이 **칵테일 파티 효과**가 주의(attention) 연구의 출발점이 되었다.

핵심 발견은 이것이다. 뇌는 감각 입력을 전부 동등하게 처리하지 않는다. 어떤 정보는 강화하고 나머지는 억제하는 **선택 메커니즘**이 존재한다. 이 메커니즘이 무엇인지를 둘러싼 60년의 논쟁이, 결국 AI에서 가장 중요한 구조 중 하나에 이름과 개념적 뼈대를 제공하게 된다.

## 뇌는 어떻게 선택하는가: 세 가지 패러다임

주의에 대한 이해는 세 가지 이론을 거치며 정밀해졌다.

**필터 이론** -- Broadbent(1958)는 주의를 정보 처리 초기 단계의 병목 필터(bottleneck filter)로 모델링했다. 감각 입력은 모두 단기 저장소(short-term store)에 들어오지만, 처리 용량의 한계 때문에 물리적 특성(목소리 톤, 방향, 음높이)에 기반하여 하나의 채널만 통과시킨다. 선택되지 않은 채널의 정보는 사실상 차단된다. 비유하자면, 한 번에 하나의 주파수만 수신하는 라디오 튜너와 같다. 이 모델은 당시 Claude Shannon의 정보 이론과 초기 컴퓨터 과학의 정보 처리 은유에 강하게 영향받은 것이다.

**감쇠 이론** -- Treisman(1964)은 Broadbent의 완전 차단 모델이 Cherry의 자기 이름 현상을 설명하지 못한다는 점을 지적했다. 그녀의 수정안에서 비주의 채널의 정보는 완전히 차단되는 것이 아니라 감쇠(attenuation), 즉 볼륨이 낮아진다. 각 단어에는 활성화 역치(activation threshold)가 있어서, 자기 이름이나 "불이야!" 같은 생존 관련 단어는 역치가 낮아 약한 신호로도 의식에 도달한다. 튜너가 아니라, 모든 채널의 볼륨을 차등적으로 조절하는 믹서에 가깝다.

**특징 통합 이론** -- Treisman & Gelade(1980)는 시각적 주의로 무대를 옮겼다. 빨간 X를 초록 O 30개 사이에서 찾는 것은 순식간이지만(색이라는 단일 특징), 빨간 X를 빨간 O와 초록 X 사이에서 찾는 것은 하나하나 살펴봐야 한다(색+모양 결합). 이로부터 시각 처리의 두 단계가 도출되었다. (1) 전주의 단계(pre-attentive stage): 색, 방향, 크기 같은 기본 특징이 시야 전체에서 자동적으로, 병렬적으로 추출된다. (2) 집중적 주의 단계(focused attention stage): 기본 특징들이 특정 공간 위치에서 결합되어 "빨간 X"라는 통합된 객체로 인식된다. 주의는 이 결합(binding)을 가능하게 하는 접착제이며, 주의 없이는 특징들이 잘못 결합되는 착각 결합(illusory conjunction)이 발생한다.

## 두 방향의 주의: 상향식과 하향식

Posner(1980)의 공간 단서(spatial cueing) 실험 이후, 주의는 두 가지 방향으로 구분되었다. 화면의 한쪽에 화살표 단서를 주면 반응 시간이 빨라지고(유효 단서), 반대쪽에 주면 느려진다(무효 단서). 이 비대칭이 주의의 방향성을 실험적으로 증명했다.

- **상향식 주의**(bottom-up, exogenous): 자극 자체의 속성이 자동적으로 주의를 잡아끄는 것. 갑작스러운 움직임, 밝은 색, 큰 소리가 해당한다. 비자발적이고 빠르며(100-120ms), 진화적으로 포식자 감지와 직결된다. 신경과학적으로 시각 피질의 현저성 지도(saliency map)에 대응하는데, Itti & Koch(2000)는 색, 밝기, 방향의 대비를 계산하여 가장 두드러진 위치를 예측하는 계산 모델을 제안했다.
- **하향식 주의**(top-down, endogenous): 목표와 기대에 의해 의도적으로 주의를 배분하는 것. 군중 속에서 빨간 모자를 찾으려 할 때, 빨간색에 대한 시각 피질 뉴런의 감수성이 실제로 증가한다. 느리지만(약 300ms), 복잡한 과제 수행에 필수적이다. 전두엽(prefrontal cortex)에서 감각 영역으로 하향 신호를 보내 관련 뉴런의 활성을 높이는 방식으로 작동한다.

생물학적 주의의 핵심 특성을 정리하면 다음과 같다.

- 용량 제한적이다 -- 동시에 처리할 수 있는 항목이 4-7개로 제한된다(Cowan, 2001)
- 선택적이다 -- 관련 정보를 강화하고 무관 정보를 **적극적으로 억제**한다
- 경쟁적이다 -- 여러 자극이 제한된 처리 자원을 놓고 서로 경쟁한다(편향 경쟁 모델, Desimone & Duncan, 1995)
- 공간적이다 -- 시야의 특정 위치에 초점을 맞출 수 있고, 이 초점은 줌 렌즈처럼 좁히거나 넓힐 수 있다
- 다층적이다 -- 상향식과 하향식이 상호작용하며, 감정, 동기, 피로에 의해 조절된다

## 인지과학에서 AI로: 이름의 이주

이 원리가 AI로 건너간 경로는 SA(simulated annealing)처럼 수식이 직접 이식된 경우와 근본적으로 다르다. 전이된 것은 수학이 아니라 이름과 직관이다.

- "attention"이라는 용어 --> Bahdanau, Cho & Bengio(2015)가 기계 번역 논문에서 **처음 채택**. 인지심리학의 "중요한 것에 집중"이라는 직관을 빌렸으나, 그들의 동기는 seq2seq 모델의 정보 병목이라는 순수 공학 문제였다
- 선택적 처리라는 개념 --> 모든 입력을 동등하게 다루지 않고, **가중치를 차등 부여**한다는 높은 수준의 아이디어가 공유되었다
- 용량 제약에 대한 해법 --> 뇌의 주의는 처리 용량의 한계를, 계산적 주의는 고정 길이 벡터의 정보 병목을 해결한다. 문제의 구조가 유사하다
- 수학적 메커니즘 --> 인지 이론에서 유도된 것이 **아니다**. softmax 가중합은 정보 검색(information retrieval)과 연관 기억(associative memory)의 전통에서 독립적으로 발전했다

핵심은 이것이다. "Attention Is All You Need"(Vaswani et al., 2017)는 인지과학이나 신경과학 문헌을 단 한 편도 인용하지 않는다. 이것은 **이름과 직관의 차용(conceptual borrowing)**이지, SA에서 볼츠만 분포가 수식째 이식된 것 같은 직접적 영감이 아니다.

## Transformer 주의 메커니즘: 실제 수학

Bahdanau(2015)의 원래 문제는 이것이었다. seq2seq 모델에서 인코더가 입력 문장 전체를 하나의 고정 길이 벡터로 압축해야 했는데, 문장이 20단어를 넘으면 성능이 급락했다. 정보가 병목에서 유실되는 것이다. 해결책은 디코더가 출력 단어를 생성할 때마다 입력의 모든 위치를 직접 참조하되, 관련 높은 위치에 더 많은 가중치를 두는 것이었다.

Vaswani et al.(2017)은 이를 극한까지 밀어붙여 순환 구조를 완전히 제거하고, 자기 주의(self-attention)만으로 전체 아키텍처를 구성한 Transformer를 제안했다. 핵심 수식은 다음과 같다.

Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V

각 요소의 역할을 풀어쓰면 다음과 같다.

1. Q(Query)는 "내가 찾고 있는 것"이다. 현재 처리 중인 토큰이 어떤 정보를 필요로 하는지를 인코딩한다
2. K(Key)는 "내가 가진 것의 레이블"이다. 각 토큰이 제공할 수 있는 정보의 종류를 인코딩한다
3. V(Value)는 "실제 내용"이다. 각 토큰이 전달하는 실제 정보를 담는다
4. Q * K^T는 쿼리와 키의 내적으로 유사도를 계산한다. d_k 차원의 벡터 두 개의 내적이므로, 값의 크기가 d_k에 비례하여 커진다
5. sqrt(d_k)로 나누는 것은 이 스케일 문제를 보정한다. d_k = 64일 때 sqrt(64) = 8로 나눈다. 이 보정이 없으면 내적 값이 지나치게 커져서 softmax가 하나의 토큰에 거의 모든 가중치를 몰아주는 극단적 분포가 된다
6. softmax는 유사도 점수를 확률 분포로 변환한다. 모든 가중치의 합이 1이 되며, 가장 관련 높은 토큰에 높은 가중치가 부여된다

다중 헤드 어텐션(multi-head attention)은 동일한 입력에 서로 다른 선형 변환을 적용하여 여러 관점에서 동시에 관계를 포착한다.

head_i = Attention(Q * W_i^Q, K * W_i^K, V * W_i^V)
MultiHead = Concat(head_1, ..., head_h) * W^O

실제로 8개 헤드를 사용하면, 어떤 헤드는 문법적 관계(주어-동사)를, 다른 헤드는 의미적 관계(대명사-선행사)를, 또 다른 헤드는 위치적 근접성을 학습하는 것이 관찰된다.

## 뇌의 주의와 Transformer 주의: 무엇이 같고 무엇이 다른가

구조적 유사점이 있지만, 근본적 차이가 더 크다.

**보존된 것 (개념 수준):**

- 선택성: 둘 다 일부 정보를 강화하고 나머지에 낮은 비중을 부여한다
- 가중 결합: 둘 다 여러 입력에 차등적 가중치를 부여하여 하나의 출력을 만든다
- 병목 해결: 뇌의 주의는 처리 용량 한계를, 계산적 주의는 고정 길이 벡터 병목을 해결한다

**변형되거나 사라진 것 (메커니즘 수준):**

- 방향성: 뇌의 주의는 상향식(자극 기반) + 하향식(목표 기반)이 상호작용한다. Transformer 주의는 데이터에서 학습된 패턴으로, 명시적 목표 지향성이 없다. 하향식 제어에 해당하는 구조가 부재한다
- 공간성 vs 토큰 관계: 뇌의 시각적 주의는 망막 좌표계의 공간적 위치에 초점을 맞추며, 줌 렌즈처럼 범위를 조절한다. Transformer 주의는 토큰 간 추상적 유사도를 계산하며, 공간 개념 자체가 없다
- 용량 제한: 뇌의 주의는 본질적으로 용량 제한적이다(동시에 4-7개 항목). Transformer 주의는 모든 토큰 쌍을 동시에 계산한다. 뇌와 반대로, 제한이 없는 것이 오히려 O(N^2) 연산 비용이라는 공학적 문제를 만든다
- 억제 방식: 뇌의 주의는 억제성 뉴런(inhibitory neuron)을 통해 무관 정보를 적극적으로 차단한다. softmax는 상대적으로 낮은 가중치를 부여할 뿐, 명시적 억제 메커니즘이 아니다. 0에 가까운 가중치도 완전한 차단이 아니다
- 감정과 동기: 위험 자극에 우선적으로 주의가 가는 것은 편도체(amygdala)의 조절을 받는 생존 메커니즘이다. 계산적 주의에는 이런 차원이 존재하지 않는다

## 현대 AI에서의 확장과 변형

"주의"라는 개념의 AI 내 확장은 인지과학에서 점점 더 멀어지는 방향으로 진행되고 있다.

**원래 직관이 남아있는 영역:**

- **Cross-attention**(인코더-디코더 간): Bahdanau의 원래 설계에 가장 가깝다. 디코더의 쿼리가 인코더의 키-값을 참조하는 구조는 "필요한 정보를 선택적으로 가져온다"는 인지적 직관이 비교적 잘 대응한다
- **시각 주의 모델**: Itti & Koch(2000)의 현저성 지도(saliency map)에서 직접 영감받은 계산 모델은, 인지과학의 상향식 주의 이론과 명확한 지적 계보를 갖는다. 이것은 Transformer 주의와 별개의 연구 흐름이다

**인지적 직관에서 벗어난 독자적 진화:**

- **Self-attention**: 시퀀스 내 모든 토큰이 서로를 참조하는 것은 인지적 주의에 대응물이 없다. 뇌에서 "모든 감각 입력이 다른 모든 감각 입력과의 관련성을 동시에 계산하는" 과정은 일어나지 않는다
- **효율적 주의 연구**: Performer(Choromanski et al., 2021)의 커널 기반 근사, FlashAttention(Dao et al., 2022)의 IO-aware 알고리즘은 순수한 하드웨어 최적화 문제이며, 인지과학과 무관한 공학적 발전이다
- **Sparse attention, Sliding window**: 긴 시퀀스에서 모든 토큰 쌍을 계산하지 않고 일부만 선택하는 것은, 역설적으로 뇌의 용량 제한적 주의에 가까워지는 방향이지만, 동기는 연산 비용 절감이지 생물학적 모방이 아니다

## 한계와 약점

"주의"라는 이름이 주는 오해와 기술적 한계 모두를 인식해야 한다.

- **이름의 오해**: "Transformer가 인간처럼 주의를 기울인다"는 것은 부정확하다. 인간의 주의는 의식, 감정, 목표와 밀접하게 연결된 다층적 인지 과정이다. 계산적 주의는 학습된 가중치에 의한 가중합이며, 그 사이에 메커니즘 수준의 공통점은 거의 없다
- **해석 가능성의 한계**: 어텐션 가중치가 모델의 "집중"을 시각화한다는 해석은 매력적이지만 오해의 소지가 있다. Jain & Wallace(2019)는 어텐션 가중치를 무작위로 교란해도 모델 출력이 크게 바뀌지 않는 경우가 많음을 보였고, Wiegreffe & Pinter(2019)는 이에 대한 반론을 제시했다. 어텐션 가중치와 실제 의사결정의 관계는 여전히 논쟁 중이다
- **O(N^2) 계산 비용**: 시퀀스 길이 N에 대해 이차적으로 증가하는 연산 비용은 긴 문맥 처리의 핵심 병목이다. 이것은 뇌의 주의에는 존재하지 않는 순수한 공학적 문제다. N = 1,000에서 100만 번의 유사도 계산, N = 100,000에서 100억 번으로 폭증한다
- **맥락 길이의 근본적 차이**: 인간의 작업 기억은 4-7개 항목으로 제한되지만 높은 유연성과 추상화 능력을 가진다. Transformer는 수십만 토큰을 처리할 수 있지만, 긴 문맥에서 관련 정보를 효과적으로 추출하는 능력은 위치에 따라 크게 달라진다("lost in the middle" 현상, Liu et al., 2024)

## 용어 정리

선택적 주의(selective attention) - 다수의 감각 입력 중 특정 정보에 처리 자원을 집중하고 나머지를 억제하는 인지 기능. 뇌의 유한한 처리 용량에 대한 적응적 해법

이분 청취(dichotic listening) - Cherry(1953)가 도입한 실험 패러다임. 양쪽 귀에 서로 다른 메시지를 동시에 제시하여 주의의 선택성을 측정

필터 이론(filter theory) - Broadbent(1958)가 제안한 초기 주의 모델. 정보 처리 초기 단계에서 물리적 특성 기반으로 하나의 채널만 통과시키는 병목 구조

감쇠 이론(attenuation theory) - Treisman(1964)의 수정 모델. 비주의 채널 정보가 완전 차단이 아닌 약화되며, 낮은 역치의 중요 정보는 여전히 인식 가능

특징 통합 이론(Feature Integration Theory) - Treisman & Gelade(1980)의 시각적 주의 이론. 기본 특징의 병렬 추출 후 주의에 의한 결합 단계를 거쳐 통합 객체 인식에 도달

현저성 지도(saliency map) - 시각 장면에서 각 위치의 주의를 끄는 정도를 수치화한 지형도. Itti & Koch(2000)가 계산 모델로 구현

자기 주의(self-attention) - 시퀀스 내 각 요소가 같은 시퀀스의 모든 다른 요소와의 관련성을 계산하는 메커니즘. Transformer(Vaswani et al., 2017)의 핵심 구조

쿼리-키-값(Query-Key-Value) - Transformer 어텐션의 세 요소. 쿼리가 키와의 내적으로 유사도(가중치)를 결정하고, 이 가중치를 값에 적용하여 가중합을 계산

다중 헤드 어텐션(multi-head attention) - 서로 다른 선형 변환을 통해 여러 관점에서 동시에 주의를 계산하는 구조. 문법적, 의미적, 위치적 관계를 병렬로 포착

인지 병목(cognitive bottleneck) - 정보 처리 용량의 한계로 인해 동시 처리가 제한되는 현상. 주의 메커니즘이 존재하는 근본 이유

---EN---
Selective Attention in the Brain - A case where cognitive psychology's attention theories provided the name and conceptual inspiration, but mathematical implementation evolved in fundamentally different directions

## The Problem That Started at a Cocktail Party

In 1953, British cognitive psychologist Colin Cherry posed a question: at a noisy cocktail party where dozens of people speak simultaneously, how can we pick out just our conversation partner's voice? He designed a dichotic listening experiment, presenting different messages to each ear. When subjects were asked to shadow (repeat aloud) the message in one ear, they recalled almost nothing from the other ear. They often failed to notice even when the language changed or speech was played backwards. However, if their own name was called, attention shifted. This **cocktail party effect** became the starting point of attention research.

The key finding was this: the brain does not process all sensory input equally. A **selection mechanism** exists that enhances some information and suppresses the rest. The 60-year debate over what this mechanism is eventually provided the name and conceptual skeleton for one of AI's most important architectural elements.

## How the Brain Selects: Three Paradigms

Understanding of attention sharpened through three theories.

**Filter theory** -- Broadbent (1958) modeled attention as a bottleneck filter at the early stages of information processing. All sensory input enters a short-term store, but processing capacity limits force selection of only one channel based on physical properties (voice tone, direction, pitch). Information in unselected channels is essentially blocked. Think of a radio tuner that receives only one frequency at a time. This model was strongly influenced by Claude Shannon's information theory and the information-processing metaphor from early computer science.

**Attenuation theory** -- Treisman (1964) pointed out that Broadbent's complete-blocking model could not explain Cherry's own-name phenomenon. In her revised model, unattended channel information is not fully blocked but attenuated -- its volume is turned down. Each word has an activation threshold, and survival-relevant words like one's own name or "Fire!" have low thresholds, allowing them to reach consciousness even through weakened signals. Not a tuner, but closer to a mixer that differentially adjusts the volume of all channels.

**Feature Integration Theory** -- Treisman & Gelade (1980) shifted the stage to visual attention. Finding a red X among 30 green O's is instantaneous (a single feature: color), but finding a red X among red O's and green X's requires serial search (a conjunction of color + shape). This yielded two stages of visual processing: (1) Pre-attentive stage: basic features like color, orientation, and size are extracted automatically and in parallel across the entire visual field. (2) Focused attention stage: basic features are bound at specific spatial locations to form an integrated object percept, such as "a red X." Attention is the glue enabling this binding, and without it, illusory conjunctions -- misbindings of features -- occur.

## Two Directions of Attention: Bottom-Up and Top-Down

Following Posner's (1980) spatial cueing experiments, attention was divided into two directions. When an arrow cue pointed to one side of the screen, response time improved (valid cue); when it pointed the wrong way, response time slowed (invalid cue). This asymmetry experimentally demonstrated the directionality of attention.

- **Bottom-up attention** (exogenous): Stimulus properties themselves automatically capture attention. Sudden movement, bright colors, loud sounds all qualify. Involuntary and fast (100-120ms), it is evolutionarily linked to predator detection. Neuroscientifically, it corresponds to saliency maps in the visual cortex; Itti & Koch (2000) proposed a computational model that predicts the most salient locations by computing contrasts in color, intensity, and orientation.
- **Top-down attention** (endogenous): Intentional allocation of attention driven by goals and expectations. When searching for a red hat in a crowd, the sensitivity of visual cortex neurons to red actually increases. Slower (around 300ms) but essential for complex tasks. It operates by sending top-down signals from the prefrontal cortex to sensory areas, boosting activity in relevant neurons.

Key characteristics of biological attention:

- Capacity-limited -- only 4-7 items can be processed simultaneously (Cowan, 2001)
- Selective -- enhances relevant information and **actively suppresses** irrelevant information
- Competitive -- multiple stimuli compete for limited processing resources (biased competition model, Desimone & Duncan, 1995)
- Spatial -- can focus on specific visual field locations, with a focus adjustable like a zoom lens
- Multi-layered -- bottom-up and top-down interact, modulated by emotion, motivation, and fatigue

## From Cognitive Science to AI: Migration of a Name

The path this principle took into AI is fundamentally different from cases like SA (simulated annealing), where equations were directly transplanted. What transferred was not mathematics but a name and an intuition.

- The term "attention" --> first adopted by Bahdanau, Cho & Bengio (2015) in their machine translation paper. They borrowed the cognitive intuition of "focusing on what matters," but their motivation was the purely engineering problem of the information bottleneck in seq2seq models
- The concept of selective processing --> the high-level idea of not treating all inputs equally but assigning **differential weights** was shared
- Solution to capacity constraints --> brain attention solves processing capacity limits; computational attention solves the fixed-length vector bottleneck. The problem structures are analogous
- Mathematical mechanism --> it was **not** derived from cognitive theories. The softmax weighted sum developed independently from traditions in information retrieval and associative memory

The critical point is this: "Attention Is All You Need" (Vaswani et al., 2017) does not cite a single cognitive science or neuroscience paper. This is a **conceptual borrowing** of name and intuition, not a direct inspiration where equations were transplanted as with the Boltzmann distribution in SA.

## The Transformer Attention Mechanism: The Actual Mathematics

Bahdanau's (2015) original problem was this: in seq2seq models, the encoder had to compress the entire input sentence into a single fixed-length vector, and performance collapsed for sentences longer than about 20 words. Information was lost at the bottleneck. The solution was to have the decoder directly reference all input positions when generating each output word, placing higher weights on more relevant positions.

Vaswani et al. (2017) pushed this to its extreme, completely removing recurrent structure and proposing the Transformer architecture built entirely from self-attention. The core formula is:

Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V

The role of each element:

1. Q (Query) is "what I'm looking for." It encodes what information the currently processed token needs
2. K (Key) is "the label of what I have." It encodes the type of information each token can provide
3. V (Value) is "the actual content." It carries the actual information each token conveys
4. Q * K^T computes similarity as the dot product of queries and keys. Since these are d_k-dimensional vectors, the magnitude of the dot product grows proportionally with d_k
5. Dividing by sqrt(d_k) corrects this scaling issue. When d_k = 64, we divide by sqrt(64) = 8. Without this correction, dot product values become so large that softmax concentrates nearly all weight on a single token, producing an extreme distribution
6. softmax converts similarity scores into a probability distribution. All weights sum to 1, with the most relevant tokens receiving the highest weights

Multi-head attention applies different linear transformations to the same input to capture relationships from multiple perspectives simultaneously:

head_i = Attention(Q * W_i^Q, K * W_i^K, V * W_i^V)
MultiHead = Concat(head_1, ..., head_h) * W^O

In practice with 8 heads, some heads are observed to learn syntactic relationships (subject-verb), others semantic relationships (pronoun-antecedent), and still others positional proximity.

## Brain Attention vs. Transformer Attention: What Is Shared and What Differs

Structural similarities exist, but fundamental differences are greater.

**What is preserved (conceptual level):**

- Selectivity: Both enhance some information while assigning lower weight to the rest
- Weighted combination: Both differentially weight multiple inputs to produce a single output
- Bottleneck resolution: Brain attention solves processing capacity limits; computational attention solves the fixed-length vector bottleneck

**What was transformed or lost (mechanism level):**

- Directionality: Brain attention involves interaction between bottom-up (stimulus-based) and top-down (goal-based). Transformer attention is a data-learned pattern with no explicit goal-directedness. There is no structure corresponding to top-down control
- Spatial vs. token relationships: Visual brain attention focuses on spatial locations in retinal coordinates, adjustable like a zoom lens. Transformer attention computes abstract similarities between tokens with no spatial concept whatsoever
- Capacity limits: Brain attention is inherently capacity-limited (4-7 items simultaneously). Transformer attention computes all token pairs simultaneously. Opposite to the brain, having no limit is what creates the engineering problem of O(N^2) computational cost
- Suppression mechanism: Brain attention actively blocks irrelevant information through inhibitory neurons. Softmax merely assigns relatively low weights -- not an explicit suppression mechanism. Even near-zero weights are not complete blocking
- Emotion and motivation: Prioritizing attention to dangerous stimuli is a survival mechanism modulated by the amygdala. Computational attention entirely lacks this dimension

## Extensions and Variations in Modern AI

The concept of "attention" in AI continues to evolve in directions increasingly distant from cognitive science.

**Where the original intuition persists:**

- **Cross-attention** (encoder-decoder): Closest to Bahdanau's original design. The structure where the decoder's query references the encoder's key-value pairs maps relatively well to the cognitive intuition of "selectively retrieving needed information"
- **Visual saliency models**: Computational models directly inspired by Itti & Koch's (2000) saliency map have a clear intellectual lineage from cognitive bottom-up attention theory. This is a separate research stream from Transformer attention

**Independent evolution beyond cognitive intuition:**

- **Self-attention**: Every token in a sequence referencing every other token has no counterpart in cognitive attention. The brain does not perform a process where "every sensory input simultaneously computes its relevance to every other sensory input"
- **Efficient attention research**: Performer's kernel-based approximation (Choromanski et al., 2021) and FlashAttention's IO-aware algorithm (Dao et al., 2022) are pure hardware optimization problems, engineering advances unrelated to cognitive science
- **Sparse attention, sliding window**: Selecting only some token pairs instead of computing all pairs in long sequences paradoxically moves closer to the brain's capacity-limited attention, but the motivation is computational cost reduction, not biological emulation

## Limitations and Weaknesses

Both misconceptions created by the name "attention" and technical limitations must be recognized.

- **Naming misconception**: "Transformers attend like humans" is inaccurate. Human attention is a multi-layered cognitive process intimately linked with consciousness, emotion, and goals. Computational attention is a weighted sum driven by learned weights, with almost no mechanism-level commonality between them
- **Interpretability limits**: The interpretation that attention weights visualize the model's "focus" is appealing but potentially misleading. Jain & Wallace (2019) showed that randomly perturbing attention weights often barely changes model output, and Wiegreffe & Pinter (2019) offered counterarguments. The relationship between attention weights and actual decision-making remains debated
- **O(N^2) computational cost**: Computation growing quadratically with sequence length N is the core bottleneck for long-context processing. This is a purely engineering problem that does not exist in biological attention. At N = 1,000, one million similarity computations; at N = 100,000, it explodes to 10 billion
- **Fundamental context length difference**: Human working memory is limited to 4-7 items but possesses high flexibility and abstraction capability. Transformers can process hundreds of thousands of tokens, but their ability to effectively extract relevant information from long contexts varies dramatically by position (the "lost in the middle" phenomenon, Liu et al., 2024)

## Glossary

Selective attention - the cognitive function of concentrating processing resources on specific information among multiple sensory inputs while suppressing the rest. An adaptive solution to the brain's finite processing capacity

Dichotic listening - an experimental paradigm introduced by Cherry (1953) that presents different messages to each ear simultaneously to measure the selectivity of attention

Filter theory - an early attention model proposed by Broadbent (1958) with a bottleneck structure that passes only one channel based on physical properties at early processing stages

Attenuation theory - Treisman's (1964) revised model where unattended channel information is weakened rather than fully blocked, allowing important information with low thresholds to still be recognized

Feature Integration Theory - a visual attention theory by Treisman & Gelade (1980) in which parallel extraction of basic features is followed by an attention-mediated binding stage to achieve integrated object recognition

Saliency map - a topographic map quantifying how much each location in a visual scene attracts attention. Implemented as a computational model by Itti & Koch (2000)

Self-attention - a mechanism where each element in a sequence computes its relevance to every other element in the same sequence. The core structure of the Transformer (Vaswani et al., 2017)

Query-Key-Value - the three components of Transformer attention, where queries determine similarity (weights) through dot products with keys, and these weights are applied to values to compute a weighted sum

Multi-head attention - a structure that simultaneously computes attention from multiple perspectives through different linear transformations, capturing syntactic, semantic, and positional relationships in parallel

Cognitive bottleneck - the limitation of simultaneous processing due to information processing capacity constraints. The fundamental reason attention mechanisms exist
