---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 헵 학습, 시냅스 가소성, 장기강화, STDP, 비지도 학습, 자기조직화 지도, 주성분 분석
keywords_en: Hebbian learning, synaptic plasticity, long-term potentiation, STDP, unsupervised learning, self-organizing map, principal component analysis
---
Hebbian Learning and Synaptic Plasticity - 신경과학의 시냅스 강화 원리가 AI 학습 규칙의 가장 직접적인 생물학적 기원이 된 사례

## Hebb의 원리: "함께 발화하는 뉴런은 함께 연결된다"

Donald Hebb(1949)는 "행동의 조직"에서 학습의 신경학적 메커니즘을 제안했다. 핵심은 이것이다. 뉴런 A가 뉴런 B를 반복적으로 활성화시키면, A에서 B로의 시냅스 연결이 **강화**된다. 후에 "neurons that fire together, wire together"라는 문구로 요약된 이 원리는, Hebb 본인의 표현보다 단순화된 것이지만, 핵심 직관을 정확히 포착한다.

Hebb가 이 가설을 제안한 1949년에는 이를 실험적으로 검증할 도구가 없었다. 그는 심리학자로서 행동 관찰과 신경해부학적 지식을 결합하여 이론적 추론을 한 것이다. 이 가설이 실험적으로 확인되기까지 24년이 걸렸다.

## 생물학적 검증: LTP에서 STDP까지

Timothy Bliss와 Terje Lomo(1973)는 토끼 해마에서 **장기강화(Long-Term Potentiation, LTP)**를 발견했다. 시냅스 전 뉴런을 고빈도로 자극하면 시냅스 후 뉴런의 반응이 수 시간에서 수 주간 강화되었다. Hebb의 24년 된 가설이 물리적 실체를 얻은 순간이었다.

이후 연구에서 반대 현상도 발견되었다. **장기억제(Long-Term Depression, LTD)**는 저빈도 자극에 의해 시냅스가 약화되는 현상이다. LTP와 LTD의 조합은 시냅스 강도를 양방향으로 조절하여 학습과 망각의 신경적 기반을 제공한다.

Henry Markram(1997)은 더 정교한 메커니즘을 밝혔다. **스파이크 타이밍 의존 가소성(Spike-Timing-Dependent Plasticity, STDP)**에서는 시냅스 전 뉴런이 시냅스 후 뉴런보다 **먼저** 발화하면 시냅스가 강화되고(LTP), **나중에** 발화하면 시냅스가 약화된다(LTD). 밀리초 단위의 시간 순서가 결정적이다. 이는 인과관계를 학습하는 메커니즘으로 해석된다. 원인(시냅스 전)이 결과(시냅스 후)에 선행할 때만 연결이 강화되기 때문이다.

## 수학적 표현: Hebb 규칙에서 BCM까지

기본 Hebb 규칙은 놀랍도록 단순하다.

dw_ij = eta * x_i * x_j

w_ij는 뉴런 i에서 j로의 시냅스 가중치, x_i와 x_j는 각각 시냅스 전후 뉴런의 활동, eta는 학습률이다. 두 뉴런이 동시에 활성화되면(둘 다 양수) 가중치가 증가하고, 하나만 활성화되면 변화가 없다.

그러나 순수 Hebb 규칙에는 치명적 문제가 있다. 가중치가 **무한히 증가**한다. 두 뉴런이 계속 함께 발화하면 가중치가 끝없이 커져서 시스템이 불안정해진다. 이것은 생물학적으로도, 계산적으로도 받아들일 수 없다.

Erkki Oja(1982)는 정규화 항을 추가하여 이 문제를 해결했다.

dw = eta * (x * y - y^2 * w)

여기서 y는 출력 뉴런의 활동이다. y^2 * w 항이 가중치 벡터의 크기를 자동으로 1로 유지한다. 놀라운 사실은, 이 규칙이 수학적으로 **주성분 분석(PCA)**과 동치라는 것이다. Oja의 규칙을 따르면 가중치 벡터가 입력 데이터의 첫 번째 주성분 방향으로 수렴한다. 생물학적 학습 규칙에서 출발하여 통계학의 핵심 기법에 도달한 것이다.

Bienenstock, Cooper, Munro(1982)는 BCM 이론에서 더 정교한 규칙을 제안했다.

dw = eta * phi(y) * x, 여기서 phi(y)는 슬라이딩 임계값 theta_M에서 부호가 바뀐다

y > theta_M이면 phi(y) > 0 (LTP), y < theta_M이면 phi(y) < 0 (LTD)이며, 결정적으로 theta_M 자체가 뉴런의 평균 활동에 따라 변한다. 활동이 많으면 임계값이 올라가 강화가 어려워지고, 활동이 적으면 내려가 강화가 쉬워진다. 이 **항상성(homeostatic)** 메커니즘은 뉴런이 너무 활발하거나 너무 침묵하는 것을 방지한다.

## AI로의 다리: 보존된 것과 변형된 것

Hebb 학습은 AI에서 다양한 형태로 구현되었다.

**자기조직화 지도(Self-Organizing Map, SOM, Kohonen 1982)**: 입력과 유사한 뉴런의 가중치를 강화하고 이웃 뉴런도 함께 조정하는 이 알고리즘은 Hebb 원리의 경쟁적 학습(competitive learning) 변형이다. 뇌 피질의 토포그래피 맵(시각 피질의 방위 선택성 지도 등)과 구조적 유사성이 있다.

**비지도 특징 학습(Unsupervised feature learning)**: Hebb 학습의 핵심인 "입력 데이터의 통계적 구조를 감독 없이 포착한다"는 원리는 제한 볼츠만 머신(RBM, Smolensky 1986, Hinton 2006)의 대비 발산(contrastive divergence) 학습에도 반영된다.

**예측 코딩(Predictive coding)**: Rao & Ballard(1999)가 제안한 이 이론은 뇌가 입력을 예측하고 예측 오차만 전파한다고 본다. Hebb 학습의 현대적 확장으로, 최근 "역전파 없는 학습" 연구의 생물학적 근거로 주목받고 있다.

## 역전파와의 결정적 차이

현대 딥러닝의 핵심인 역전파(Backpropagation, Rumelhart, Hinton & Williams, 1986)는 Hebb 학습과 근본적으로 다르다. 이 차이를 명확히 하는 것이 중요하다.

- **Hebb**: 국소적(local). 각 시냅스는 연결된 두 뉴런의 활동만으로 가중치를 업데이트한다. 전체 네트워크의 출력이나 오차를 알 필요가 없다.
- **역전파**: 전역적(global). 최종 출력의 오차를 역방향으로 전파하여 모든 가중치를 업데이트한다. 각 시냅스가 전체 네트워크의 오차 정보를 필요로 한다.

생물학적 뇌에서 역전파가 그대로 일어난다는 증거는 없다. 역전파에는 **가중치 전달 문제(weight transport problem)**가 있다. 순방향과 역방향에서 동일한 가중치를 사용해야 하는데, 생물학적 시냅스에서 이를 구현할 메커니즘이 알려져 있지 않다. Lillicrap et al.(2016)의 **피드백 정렬(feedback alignment)**은 역방향에 무작위 가중치를 사용해도 학습이 된다는 것을 보여 생물학적 타당성 방향의 연구를 열었다.

## 한계와 약점

Hebb 학습 원리와 그 AI 적용에는 한계가 있다.

- **순수 Hebb 규칙의 불안정성**: 정규화나 항상성 메커니즘 없이는 가중치가 무한히 발산한다. 실제 뇌는 LTP/LTD 균형, 시냅스 스케일링 등 다층적 안정화 메커니즘을 가지고 있어 단순 Hebb 모델보다 훨씬 복잡하다.
- **"함께 발화"의 과잉 단순화**: 실제 STDP는 밀리초 단위 시간 차이에 민감하고, 시냅스 유형(흥분성/억제성), 수상돌기 위치, 신경조절물질 상태 등 다수 요인에 의존한다. "fire together, wire together"는 이 복잡성을 지나치게 압축한다.
- **생물학적 그럴듯함이 최적성을 의미하지 않는다**: Hebb 기반 학습 규칙이 생물학적으로 그럴듯하다고 해서 최적의 학습 알고리즘인 것은 아니다. 역전파가 생물학적으로 비현실적이지만 성능은 압도적으로 우수하다.
- **스케일링 문제**: SOM이나 Hebb 기반 규칙은 현대 대규모 데이터에서 딥러닝만큼의 확장성을 보여주지 못했다.
- **감독 학습 부재**: 순수 Hebb 학습은 레이블 없는 비지도 학습이다. 목표 출력을 지정하는 감독 학습은 Hebb 원리만으로는 자연스럽게 도출되지 않는다.

## 용어 정리

헵 학습(Hebbian learning) - Hebb(1949)가 제안한 학습 규칙. 동시에 활성화되는 뉴런 간 시냅스가 강화된다는 원리

시냅스 가소성(synaptic plasticity) - 시냅스 연결 강도가 경험에 의해 변화하는 뇌의 성질. 학습과 기억의 신경학적 기반

장기강화(long-term potentiation, LTP) - 고빈도 자극에 의해 시냅스 전달 효율이 장기간 증가하는 현상. Bliss & Lomo(1973) 발견

장기억제(long-term depression, LTD) - 저빈도 자극에 의해 시냅스 전달 효율이 장기간 감소하는 현상

스파이크 타이밍 의존 가소성(STDP) - 시냅스 전후 뉴런의 발화 시간 순서에 따라 시냅스 강도가 변하는 메커니즘. Markram(1997) 발견

자기조직화 지도(self-organizing map, SOM) - Kohonen(1982)이 개발한 비지도 학습 알고리즘. 고차원 데이터를 저차원 지도에 위상 보존하며 사상

주성분 분석(principal component analysis, PCA) - 데이터의 분산이 최대인 방향을 찾는 통계 기법. Oja 규칙이 수학적으로 동치

피드백 정렬(feedback alignment) - Lillicrap et al.(2016)이 제안한, 역방향에 고정 무작위 가중치를 사용하는 생물학적으로 그럴듯한 학습 방법

예측 코딩(predictive coding) - 뇌가 감각 입력을 예측하고 예측 오차만 상위 영역에 전달한다는 이론. Rao & Ballard(1999)

항상성(homeostasis) - 시스템이 내부 상태를 안정적 범위 내로 유지하는 자기조절 과정. BCM 이론의 슬라이딩 임계값이 이에 해당

---EN---
Hebbian Learning and Synaptic Plasticity - The most direct biological origin of AI learning rules, rooted in neuroscience's synaptic strengthening principles

## Hebb's Principle: "Neurons That Fire Together Wire Together"

Donald Hebb (1949) proposed a neurological mechanism for learning in "The Organization of Behavior." The core idea is this: when neuron A repeatedly activates neuron B, the synaptic connection from A to B is **strengthened**. Later summarized as "neurons that fire together, wire together" -- a simplification of Hebb's own phrasing, but one that captures the essential intuition precisely.

When Hebb proposed this hypothesis in 1949, no tools existed to verify it experimentally. As a psychologist, he combined behavioral observations with neuroanatomical knowledge to construct theoretical reasoning. It took 24 years for experimental confirmation.

## Biological Verification: From LTP to STDP

Timothy Bliss and Terje Lomo (1973) discovered **Long-Term Potentiation (LTP)** in the rabbit hippocampus. High-frequency stimulation of presynaptic neurons enhanced postsynaptic responses for hours to weeks. Hebb's 24-year-old hypothesis had gained physical reality.

Subsequent research uncovered the opposite phenomenon. **Long-Term Depression (LTD)** is the weakening of synapses through low-frequency stimulation. The combination of LTP and LTD provides bidirectional regulation of synaptic strength, offering the neural basis for learning and forgetting.

Henry Markram (1997) revealed a more refined mechanism. In **Spike-Timing-Dependent Plasticity (STDP)**, when the presynaptic neuron fires **before** the postsynaptic neuron, the synapse strengthens (LTP); when it fires **after**, the synapse weakens (LTD). The temporal order at the millisecond scale is decisive. This is interpreted as a mechanism for learning causality -- connections strengthen only when causes (presynaptic) precede effects (postsynaptic).

## Mathematical Formulation: From Hebb's Rule to BCM

The basic Hebb rule is remarkably simple:

dw_ij = eta * x_i * x_j

w_ij is the synaptic weight from neuron i to j, x_i and x_j are the activities of pre- and postsynaptic neurons respectively, and eta is the learning rate. When both neurons are active simultaneously (both positive), the weight increases; when only one is active, no change occurs.

However, the pure Hebb rule has a fatal flaw: weights grow **without bound**. If two neurons keep firing together, weights increase endlessly, destabilizing the system. This is unacceptable both biologically and computationally.

Erkki Oja (1982) solved this by adding a normalization term:

dw = eta * (x * y - y^2 * w)

Here y is the output neuron's activity. The y^2 * w term automatically maintains the weight vector's magnitude at 1. The remarkable fact is that this rule is mathematically equivalent to **Principal Component Analysis (PCA)**. Following Oja's rule, the weight vector converges to the first principal component direction of the input data. A biological learning rule leads to a core statistical technique.

Bienenstock, Cooper, and Munro (1982) proposed a more sophisticated rule in BCM theory:

dw = eta * phi(y) * x, where phi(y) changes sign at a sliding threshold theta_M

When y > theta_M, phi(y) > 0 (LTP); when y < theta_M, phi(y) < 0 (LTD). Crucially, theta_M itself varies with the neuron's average activity. High activity raises the threshold, making potentiation harder; low activity lowers it, making potentiation easier. This **homeostatic** mechanism prevents neurons from becoming either too active or too silent.

## Bridge to AI: What Was Preserved and What Was Transformed

Hebbian learning has been implemented in various forms in AI.

**Self-Organizing Map (SOM, Kohonen 1982)**: This algorithm strengthens the weights of neurons similar to the input and adjusts neighboring neurons, representing a competitive learning variant of the Hebbian principle. It shares structural similarity with cortical topographic maps (such as orientation selectivity maps in the visual cortex).

**Unsupervised feature learning**: The Hebbian core principle of "capturing statistical structure in input data without supervision" is reflected in contrastive divergence learning of Restricted Boltzmann Machines (RBM, Smolensky 1986, Hinton 2006).

**Predictive coding**: Proposed by Rao & Ballard (1999), this theory posits that the brain predicts inputs and propagates only prediction errors. As a modern extension of Hebbian learning, it has recently attracted attention as a biological basis for "learning without backpropagation" research.

## The Decisive Difference from Backpropagation

Backpropagation (Rumelhart, Hinton & Williams, 1986), the cornerstone of modern deep learning, is fundamentally different from Hebbian learning. Clarifying this difference is essential.

- **Hebbian**: Local. Each synapse updates its weight using only the activities of its two connected neurons. No knowledge of the network's overall output or error is needed.
- **Backpropagation**: Global. Error from the final output is propagated backward to update all weights. Each synapse requires error information from the entire network.

There is no evidence that backpropagation occurs as-is in the biological brain. Backpropagation has the **weight transport problem**: it requires identical weights in forward and backward passes, and no biological mechanism is known to implement this. Lillicrap et al.'s (2016) **feedback alignment** showed that learning works even with random backward weights, opening research toward biological plausibility.

## Limitations and Weaknesses

Hebbian learning principles and their AI applications have limitations.

- **Instability of the pure Hebb rule**: Without normalization or homeostatic mechanisms, weights diverge to infinity. Real brains have multi-layered stabilization mechanisms -- LTP/LTD balance, synaptic scaling -- far more complex than simple Hebbian models.
- **Oversimplification of "fire together"**: Actual STDP is sensitive to millisecond-level timing differences and depends on multiple factors including synapse type (excitatory/inhibitory), dendritic location, and neuromodulatory state. "Fire together, wire together" compresses this complexity excessively.
- **Biological plausibility does not imply optimality**: That a Hebbian learning rule is biologically plausible does not make it an optimal algorithm. Backpropagation is biologically implausible yet overwhelmingly superior in performance.
- **Scaling issues**: SOM and Hebbian-based rules have not demonstrated the scalability of deep learning on modern large-scale data.
- **Absence of supervised learning**: Pure Hebbian learning is unsupervised. Supervised learning with specified target outputs does not naturally emerge from Hebbian principles alone.

## Glossary

Hebbian learning - the learning rule proposed by Hebb (1949) stating that synapses between simultaneously active neurons are strengthened

Synaptic plasticity - the brain's property whereby synaptic connection strength changes with experience; the neurological basis of learning and memory

Long-term potentiation (LTP) - a lasting increase in synaptic transmission efficiency caused by high-frequency stimulation. Discovered by Bliss & Lomo (1973)

Long-term depression (LTD) - a lasting decrease in synaptic transmission efficiency caused by low-frequency stimulation

Spike-timing-dependent plasticity (STDP) - a mechanism where synaptic strength changes based on the temporal order of pre- and postsynaptic neuron firing. Discovered by Markram (1997)

Self-organizing map (SOM) - an unsupervised learning algorithm developed by Kohonen (1982) that maps high-dimensional data to a low-dimensional grid while preserving topology

Principal component analysis (PCA) - a statistical technique finding the direction of maximum variance in data; mathematically equivalent to Oja's rule

Feedback alignment - a biologically plausible learning method proposed by Lillicrap et al. (2016) using fixed random weights for backward passes

Predictive coding - the theory that the brain predicts sensory inputs and transmits only prediction errors to higher areas. Rao & Ballard (1999)

Homeostasis - a self-regulatory process maintaining a system's internal state within a stable range; the sliding threshold in BCM theory exemplifies this
