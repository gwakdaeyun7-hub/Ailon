---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 헵 학습, 시냅스 가소성, 장기강화, 스파이크 타이밍 의존 가소성, 비지도 학습, Oja 규칙, 가중치 전달 문제
keywords_en: Hebbian learning, synaptic plasticity, long-term potentiation, spike-timing-dependent plasticity, unsupervised learning, Oja's rule, weight transport problem
---
Hebbian Learning - 신경과학의 시냅스 강화 원리에서 직접 유래한 AI 학습 규칙의 생물학적 기원

## 시냅스 가소성: 경험이 뇌의 배선을 바꾼다

뇌에는 약 100조 개의 시냅스가 있다. 시냅스는 뉴런과 뉴런 사이의 접합부로, 화학 신호를 통해 정보를 전달한다. 핵심은 이 접합부의 전달 효율이 고정되어 있지 않다는 것이다. 자주 사용되는 시냅스는 전달 효율이 올라가고, 사용되지 않는 시냅스는 효율이 떨어진다. 이것이 시냅스 가소성(synaptic plasticity)이다.

비유하자면 이렇다. 숲속에 사람들이 반복해서 지나다니는 길은 점점 넓어지고, 아무도 걷지 않는 길은 풀이 자라 사라진다. 이 단순한 원리가 학습과 기억의 물리적 기반이며, 인공 신경망 학습 규칙의 가장 직접적인 생물학적 출발점이 된다.

Donald Hebb(1949)는 저서 "The Organization of Behavior"에서 이 메커니즘을 이론적으로 정식화했다. 뉴런 A가 뉴런 B를 반복적으로 활성화시키면, A에서 B로의 시냅스 연결이 강화된다. 이것이 헵 학습(Hebbian learning)이다. 후에 "neurons that fire together, wire together"라는 문구로 널리 알려졌는데, Hebb 본인은 단순한 동시 발화가 아니라 뉴런 A가 B의 발화에 "인과적으로 기여"하는 경우를 말했다. 이 차이가 50년 후 STDP 연구에서 다시 중요해진다.

## 생물학적 검증: 가설에서 실험적 사실로

Hebb의 가설이 실험적으로 확인되기까지 24년이 걸렸다. Timothy Bliss와 Terje Lomo(1973)는 토끼 해마(hippocampus)에서 장기강화(Long-Term Potentiation, LTP)를 발견했다. 시냅스 전 뉴런을 고빈도로 자극하면, 시냅스 후 뉴런의 반응이 수 시간에서 수 주간 증가했다. 반복된 자극이 영구적 변화를 만든다는 점이 핵심이다. 이후 반대 현상인 장기억제(Long-Term Depression, LTD)도 발견되었다. LTP가 길을 넓히는 것이라면, LTD는 사용하지 않는 길을 좁히는 것이다. 이 양방향 조절이 있어야 뇌가 새로운 것을 배우면서 동시에 불필요한 것을 잊을 수 있다.

Henry Markram(1997)은 더 정교한 메커니즘을 밝혔다. 스파이크 타이밍 의존 가소성(Spike-Timing-Dependent Plasticity, STDP)에서는 시간 순서가 결정적이다. 시냅스 전 뉴런이 먼저 발화하면 시냅스가 강화되고(LTP), 나중에 발화하면 약화된다(LTD). 그 시간 차이는 밀리초(ms) 단위이며, 50ms 이상 벌어지면 변화량이 급격히 줄어든다. 이것은 인과관계의 학습 메커니즘으로 해석된다. 원인이 결과에 선행할 때만 연결이 강화되기 때문이다.

## 수학적 표현: 단순한 규칙, 치명적 결함, 그리고 해결

기본 Hebb 규칙의 수학적 형태는 놀랍도록 단순하다.

dw_ij = eta * x_i * x_j

w_ij는 시냅스 가중치, x_i와 x_j는 시냅스 전후 뉴런의 활동, eta는 학습률이다. 두 뉴런이 동시에 활성화되면 가중치가 증가한다. 문제는 이 규칙이 양의 되먹임을 일으킨다는 것이다. 가중치가 커지면 시냅스 후 뉴런이 더 쉽게 발화하고, 더 자주 발화하면 가중치가 더 커진다. 가중치가 무한히 증가하여 시스템이 불안정해진다.

Erkki Oja(1982)는 정규화 항을 추가하여 이 문제를 해결했다.

dw = eta * (x * y - y^2 * w)

핵심은 빼기 항 y^2 * w다. 가중치가 커질수록 이 항도 커져서 증가를 억제하고, 결과적으로 가중치 벡터의 크기가 자동으로 1에 수렴한다. 놀라운 사실은 이 규칙이 수학적으로 주성분 분석(Principal Component Analysis, PCA)과 동치라는 것이다. Oja의 규칙을 따르면 가중치 벡터가 입력 데이터의 분산이 가장 큰 방향으로 수렴한다. 생물학적 학습 규칙에서 출발하여 통계학의 핵심 차원 축소 기법에 도달한 것이다.

Bienenstock, Cooper, Munro(1982)는 BCM 이론에서 슬라이딩 임계값 theta_M을 도입했다. 뉴런 활동이 임계값보다 높으면 시냅스가 강화되고(LTP), 낮으면 약화된다(LTD). 결정적으로 theta_M 자체가 뉴런의 최근 평균 활동에 따라 움직여서, 뉴런의 활동 수준을 적절한 범위 안에 유지하는 항상성(homeostatic) 메커니즘을 구현한다.

## 핵심 트레이드오프: 국소성 대 최적화 성능

Hebb 학습의 가장 큰 특징은 국소성(locality)이다. 각 시냅스는 자기에게 연결된 두 뉴런의 활동만 보고 가중치를 업데이트한다. 네트워크 전체의 출력이 맞았는지 알 필요가 없다. 이것은 생물학적으로 자연스럽다. 시냅스 하나가 뇌 전체의 상태를 감지할 수 있는 물리적 메커니즘이 없기 때문이다.

그러나 이 국소성은 대가를 치른다. 전체 네트워크의 목표를 모르기 때문에, 각 시냅스는 전역적으로 최적인 방향이 아니라 자기 주변에서 좋아 보이는 방향으로만 변화한다. 이것이 Hebb 학습이 비지도 학습(unsupervised learning)에 머무는 근본 이유다.

역전파(Backpropagation, Rumelhart, Hinton & Williams, 1986)는 정반대의 선택을 했다. 최종 출력의 오차를 역방향으로 전파하여 모든 가중치를 업데이트한다. 생물학적 국소성을 포기하는 대신 압도적인 최적화 성능을 얻었다. 그러나 역전파는 순방향과 역방향에서 정확히 같은 가중치를 요구하는 가중치 전달 문제(weight transport problem)라는 생물학적 난점이 있다. Lillicrap et al.(2016)의 피드백 정렬(feedback alignment)과 Rao & Ballard(1999)의 예측 코딩(predictive coding)은 이 문제를 우회하면서 Hebb의 국소성을 유지하려는 대안적 시도다. 이 트레이드오프 -- 생물학적 그럴듯함과 계산적 효율 사이의 긴장 -- 는 신경과학과 AI의 교차점에서 가장 근본적인 미해결 문제 중 하나다.

## 현대 AI 기법과의 연결

Hebb 학습의 원리는 현대 AI 곳곳에 변형되어 남아 있다. 다만 각 연결의 성격이 다르다.

**Hebb 원리의 직접적 영감을 받은 기법:**

- **자기조직화 지도(Self-Organizing Map, SOM, Kohonen 1982)**: 입력과 가장 유사한 뉴런의 가중치를 강화하고 이웃 뉴런도 조정하는, Hebb의 경쟁적 학습 변형이다. Kohonen은 뇌 피질의 토포그래피 맵에서 직접 영감을 받았다.
- **Oja 규칙과 PCA의 연결(1982)**: Hebb 학습의 정규화된 변형이며, Sanger(1989)의 일반화 Hebbian 알고리즘(GHA)은 이를 다층으로 확장하여 여러 주성분을 순서대로 추출한다. 신경 가소성에서 출발한 학습 규칙이 차원 축소의 표준 도구가 된 사례다.
- **제한 볼츠만 머신(RBM)의 학습**: Smolensky(1986)가 제안하고 Hinton(2006)이 대비 발산 학습으로 실용화한 RBM에서, 가시층과 은닉층의 동시 활성화 통계를 사용해 가중치를 업데이트하는 규칙은 Hebb 원리의 확률적 확장이다.

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **Transformer의 어텐션(Vaswani et al., 2017)**: 쿼리와 키의 유사도가 높은 쌍에 높은 가중치를 부여하는 구조는 Hebb적 직관과 표면적으로 유사하다. 그러나 어텐션 가중치는 매 입력마다 새로 계산되는 일시적 값이지 영구적 시냅스 가중치가 아니므로, 메커니즘이 근본적으로 다르다.
- **대조 학습(Contrastive Learning, SimCLR, MoCo 등)**: 양성 쌍의 표현을 가까이, 음성 쌍을 멀리 밀어내는 학습은 LTP/LTD와 유사하지만, 역전파로 학습되며 정보 이론적 목적 함수(InfoNCE 등)에서 독립적으로 발전했다.

## 한계와 약점

- **국소 규칙의 성능 한계**: 순수 Hebb 학습은 연결된 두 뉴런의 정보만 사용하므로, 역전파처럼 전역 오차를 활용하는 알고리즘보다 최적화 성능이 크게 떨어진다. SOM이나 Hebb 기반 규칙은 현대 대규모 데이터에서 딥러닝만큼의 확장성을 보여주지 못했다.
- **"함께 발화"의 과잉 단순화**: 실제 STDP는 밀리초 단위 시간 차이에 민감하고, 시냅스 유형, 수상돌기 위치, 신경조절물질 상태에 모두 의존한다. "fire together, wire together"는 이 복잡성의 극히 일부만 포착한다.
- **생물학적 그럴듯함이 최적성을 의미하지 않는다**: Hebb 기반 규칙이 생물학적으로 자연스럽다는 것과 그것이 최적의 학습 알고리즘이라는 것은 별개의 주장이다.
- **순수 Hebb 규칙의 불안정성**: Oja 규칙이나 BCM 이론 같은 정규화 메커니즘 없이는 가중치가 무한히 발산한다. 실제 뇌는 LTP/LTD 균형, 시냅스 스케일링 등 다층적 안정화 메커니즘을 가지고 있어, 단순 Hebb 모델로는 포착되지 않는다.

## 용어 정리

헵 학습(Hebbian learning) - Hebb(1949)가 제안한 학습 규칙. 시냅스 전 뉴런이 시냅스 후 뉴런의 발화에 반복적으로 기여하면 연결이 강화된다는 원리

시냅스 가소성(synaptic plasticity) - 시냅스 연결 강도가 경험에 의해 변화하는 뇌의 성질. 학습과 기억의 물리적 기반

장기강화(long-term potentiation, LTP) - 고빈도 자극에 의해 시냅스 전달 효율이 수 시간에서 수 주간 증가하는 현상. Bliss & Lomo(1973)가 토끼 해마에서 발견

장기억제(long-term depression, LTD) - 저빈도 자극에 의해 시냅스 전달 효율이 장기간 감소하는 현상. LTP의 반대 방향으로, 양자의 균형이 학습과 망각을 조절

스파이크 타이밍 의존 가소성(STDP) - 시냅스 전후 뉴런의 발화 시간 순서와 간격에 따라 시냅스 강도가 변하는 메커니즘. Markram(1997) 발견

주성분 분석(principal component analysis, PCA) - 데이터의 분산이 가장 큰 방향을 찾는 통계적 차원 축소 기법. Oja 규칙의 수렴점과 수학적으로 동치

가중치 전달 문제(weight transport problem) - 역전파가 순방향과 역방향에서 동일한 가중치를 요구하는데, 생물학적 뇌에서 이를 구현할 메커니즘이 알려지지 않은 문제

항상성(homeostasis) - 시스템이 내부 상태를 안정적 범위 내로 유지하는 자기조절 과정. BCM 이론의 슬라이딩 임계값이 대표 사례
---EN---
Hebbian Learning - The most direct biological origin of AI learning rules, derived from neuroscience's synaptic strengthening principles

## Synaptic Plasticity: Experience Rewires the Brain

The brain contains roughly 100 trillion synapses. A synapse is the junction between two neurons, transmitting information through chemical signals. The critical insight is that these junctions are not fixed in strength. Frequently used synapses become more efficient, while unused ones weaken. This is synaptic plasticity.

Think of it like paths through a forest. Trails that people walk repeatedly grow wider, while abandoned paths disappear under overgrowth. This simple principle is the physical basis of learning and memory, and the most direct biological starting point for artificial neural network learning rules.

Donald Hebb (1949) formally articulated this mechanism in "The Organization of Behavior." When neuron A repeatedly contributes to firing neuron B, the synaptic connection from A to B is strengthened. This is Hebbian learning. It was later popularized as "neurons that fire together, wire together" -- but Hebb himself spoke of neuron A making a "causal contribution" to neuron B's firing, not mere simultaneous activity. This distinction becomes important again 50 years later in STDP research.

## Biological Verification: From Hypothesis to Experimental Fact

It took 24 years for Hebb's hypothesis to be experimentally confirmed. Timothy Bliss and Terje Lomo (1973) discovered Long-Term Potentiation (LTP) in the rabbit hippocampus. High-frequency stimulation of presynaptic neurons increased postsynaptic responses for hours to weeks. Repeated stimulation producing lasting change was the key point. The opposite phenomenon, Long-Term Depression (LTD), was subsequently discovered. If LTP widens a path, LTD narrows an unused one. This bidirectional regulation allows the brain to learn new things while forgetting what is no longer needed.

Henry Markram (1997) revealed a more refined mechanism. In Spike-Timing-Dependent Plasticity (STDP), temporal order is decisive. When the presynaptic neuron fires first, the synapse strengthens (LTP); when it fires after, the synapse weakens (LTD). Time differences are on the order of milliseconds, and beyond roughly 50ms, the effect diminishes sharply. This is interpreted as a causality learning mechanism -- connections strengthen only when causes precede effects.

## Mathematical Formulation: A Simple Rule, A Fatal Flaw, and Its Fix

The basic Hebb rule is remarkably simple:

dw_ij = eta * x_i * x_j

w_ij is the synaptic weight, x_i and x_j are the pre- and postsynaptic neuron activities, and eta is the learning rate. When both neurons are active, the weight increases. The problem is positive feedback: growing weights make the postsynaptic neuron fire more easily, which further increases the weight, leading to unbounded divergence.

Erkki Oja (1982) solved this by adding a normalization term:

dw = eta * (x * y - y^2 * w)

The subtractive term y^2 * w suppresses growth as weight increases, automatically converging the weight vector's magnitude to 1. Remarkably, this rule is mathematically equivalent to Principal Component Analysis (PCA) -- the weight vector converges to the direction of maximum variance in the input data. A biological learning rule leads directly to a core statistical dimensionality reduction technique.

Bienenstock, Cooper, and Munro (1982) went further with BCM theory, introducing a sliding threshold theta_M. When neuronal activity exceeds the threshold, the synapse strengthens (LTP); below it, the synapse weakens (LTD). Crucially, theta_M itself shifts with recent average activity, implementing a homeostatic mechanism that keeps neuronal activity within an appropriate range.

## The Core Tradeoff: Locality vs. Optimization Performance

The defining characteristic of Hebbian learning is locality. Each synapse updates its weight using only the activities of its two connected neurons, needing no knowledge of the network's overall output. This is biologically natural -- no physical mechanism exists for a single synapse to sense the entire brain's state.

But locality comes at a cost. Each synapse changes in a locally good direction rather than the globally optimal one. This is why Hebbian learning remains in the domain of unsupervised learning.

Backpropagation (Rumelhart, Hinton & Williams, 1986) made the opposite choice, propagating error backward to update all weights -- sacrificing biological locality for overwhelming optimization performance. However, backpropagation requires identical weights in forward and backward paths (the weight transport problem), which has no known biological implementation. Feedback alignment (Lillicrap et al., 2016) and predictive coding (Rao & Ballard, 1999) are alternative approaches that attempt to maintain Hebbian locality while circumventing this problem. This tradeoff -- between biological plausibility and computational efficiency -- remains one of the most fundamental open problems at the intersection of neuroscience and AI.

## Connections to Modern AI

Hebbian learning principles survive in transformed forms throughout modern AI. However, the nature of each connection differs.

**Techniques directly inspired by Hebbian principles:**

- **Self-Organizing Map (SOM, Kohonen 1982)**: Strengthens the winner neuron's weights and adjusts its neighbors -- a competitive learning variant of Hebb's rule. Kohonen explicitly cited cortical topographic maps as direct inspiration.
- **Oja's rule and PCA (1982)**: A normalized Hebbian variant. Sanger's (1989) Generalized Hebbian Algorithm (GHA) extends it to extract multiple principal components in order. Neural plasticity became a standard tool for dimensionality reduction.
- **Restricted Boltzmann Machine (RBM) learning**: Proposed by Smolensky (1986) and made practical by Hinton (2006) with contrastive divergence, RBMs update weights using co-activation statistics -- a probabilistic extension of the Hebbian principle.

**Structural similarities sharing the same intuition independently:**

- **Transformer attention (Vaswani et al., 2017)**: Assigning higher weights to similar query-key pairs is superficially Hebbian, but attention weights are transient values recomputed per input, not permanent synaptic weights -- fundamentally different in mechanism.
- **Contrastive learning (SimCLR, MoCo, etc.)**: Pushing positive pair representations closer and negative pairs apart resembles LTP/LTD, but it is trained via backpropagation and developed independently from information-theoretic objectives (InfoNCE, etc.).

## Limitations and Weaknesses

- **Performance ceiling of local rules**: Pure Hebbian learning uses only two connected neurons' information, resulting in substantially lower optimization performance than backpropagation. SOM and Hebbian-based rules have not matched deep learning's scalability.
- **Oversimplification of "fire together"**: Actual STDP is sensitive to millisecond-level timing and depends on synapse type, dendritic location, and neuromodulatory state. "Fire together, wire together" captures only a fraction of this complexity.
- **Biological plausibility does not imply optimality**: That a Hebbian rule is biologically natural and that it is an optimal learning algorithm are separate claims.
- **Instability of the pure Hebb rule**: Without normalization mechanisms like Oja's rule or BCM theory, weights diverge to infinity. Real brains possess multi-layered stabilization mechanisms that simple Hebbian models fail to capture.

## Glossary

Hebbian learning - the learning rule proposed by Hebb (1949) stating that when a presynaptic neuron repeatedly contributes to firing a postsynaptic neuron, their connection strengthens

Synaptic plasticity - the brain's property whereby synaptic connection strength changes with experience; the physical basis of learning and memory

Long-term potentiation (LTP) - a lasting increase in synaptic transmission efficiency caused by high-frequency stimulation. Discovered by Bliss & Lomo (1973) in the rabbit hippocampus

Long-term depression (LTD) - a lasting decrease in synaptic transmission efficiency caused by low-frequency stimulation. The counterpart to LTP; their balance regulates learning and forgetting

Spike-timing-dependent plasticity (STDP) - a mechanism where synaptic strength changes based on the temporal order and interval of pre- and postsynaptic firing. Discovered by Markram (1997)

Principal component analysis (PCA) - a statistical dimensionality reduction technique finding the direction of maximum variance in data. Mathematically equivalent to the convergence point of Oja's rule

Weight transport problem - the issue that backpropagation requires identical weights in forward and backward passes, yet no biological mechanism is known to implement this

Homeostasis - a self-regulatory process maintaining a system's internal state within a stable range. The sliding threshold in BCM theory is a representative example
