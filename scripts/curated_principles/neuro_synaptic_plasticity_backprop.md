---
difficulty: intermediate
connectionType: reverse_inspiration
keywords: 시냅스 가소성, 역전파, 장기 강화, 장기 억압, 스파이크 타이밍 의존 가소성, 가중치 전달 문제, 피드백 정렬, 예측 부호화
keywords_en: synaptic plasticity, backpropagation, long-term potentiation, long-term depression, spike-timing-dependent plasticity, weight transport problem, feedback alignment, predictive coding
---
Synaptic Plasticity and the Backpropagation Debate - 역전파의 생물학적 불가능성에 대한 신경과학의 비판이 피드백 정렬, 예측 부호화, Forward-Forward 등 새로운 AI 학습 알고리즘을 촉발한 사례

## 뇌는 어떻게 학습하는가

1949년, 심리학자 Donald Hebb은 "The Organization of Behavior"에서 학습의 신경학적 메커니즘에 관한 유명한 가설을 제시했다. "뉴런 A의 축삭이 뉴런 B를 흥분시키기에 충분히 가깝고, 반복적으로 또는 지속적으로 B의 발화에 관여한다면, A와 B 사이의 시냅스 효율이 증가한다." 이것은 흔히 "함께 발화하는 뉴런은 함께 연결된다"(Neurons that fire together, wire together)로 요약된다.

Hebb의 가설은 순수한 이론이었다. 실험적 증거는 24년 후에 나왔다. 1973년, Tim Bliss와 Terje Lomo는 토끼 해마(hippocampus)에서 **장기 강화**(Long-Term Potentiation, LTP)를 발견했다. 시냅스 전 뉴런을 고빈도로 자극하면 시냅스 전달 효율이 수 시간에서 수 주까지 지속적으로 증가하는 현상이었다. 이것은 Hebb의 이론적 예측이 실험적으로 확인된 순간이었다.

이후 그 반대 현상인 **장기 억압**(Long-Term Depression, LTD)도 발견되었다. 저빈도 자극이 시냅스 효율을 감소시키는 것이다. LTP와 LTD의 균형이 뇌의 학습과 기억의 기초를 형성한다.

## 스파이크 타이밍의 발견

1997년, Henry Markram은 **스파이크 타이밍 의존 가소성**(Spike-Timing-Dependent Plasticity, STDP)을 발견하여 시냅스 가소성의 이해를 한 차원 높였다. STDP의 규칙은 우아하게 단순하다.

- 시냅스 전 뉴런이 **먼저** 발화하고 시냅스 후 뉴런이 **뒤따라** 발화하면 (dt > 0) --> 시냅스 강화 (LTP)
- 시냅스 후 뉴런이 **먼저** 발화하고 시냅스 전 뉴런이 **뒤따라** 발화하면 (dt < 0) --> 시냅스 약화 (LTD)

수학적으로 가중치 변화량은 다음과 같다.

dt > 0일 때: dw = A+ * exp(-dt / tau+)
dt < 0일 때: dw = -A- * exp(dt / tau-)

여기서 dt = t_post - t_pre (시냅스 후 뉴런 발화 시점 - 시냅스 전 뉴런 발화 시점), A+와 A-는 강화/약화의 최대 크기, tau+와 tau-는 시간 상수(보통 수십 밀리초)다.

STDP가 Hebb 규칙의 정교한 버전인 이유는 명확하다. 시냅스 전 뉴런이 시냅스 후 뉴런의 발화에 **인과적으로 기여**했을 가능성이 높은 경우(전 -> 후 순서)에만 연결을 강화한다. 시간적 순서가 인과 관계의 대리 지표(proxy)로 작동하는 것이다.

## 역전파: AI의 가장 중요한 알고리즘

반면 AI에서 신경망 학습의 표준 알고리즘인 역전파(backpropagation)는 완전히 다른 원리로 작동한다. Rumelhart, Hinton & Williams(1986)가 대중화한 이 알고리즘의 핵심은 연쇄 법칙(chain rule)을 사용한 기울기 계산이다.

역전파의 과정은 다음과 같다.

1. **순전파**(forward pass): 입력이 네트워크를 통과하며 출력을 생성한다
2. **손실 계산**: 출력과 정답의 차이(손실 함수 L)를 계산한다
3. **역전파**: 출력층에서 입력층 방향으로 각 가중치에 대한 손실의 기울기를 연쇄 법칙으로 계산한다
4. **가중치 갱신**: 기울기의 반대 방향으로 가중치를 조정한다

핵심 수식은 다음과 같다.

dL/dw_{ij} = dL/da_j * da_j/dz_j * dz_j/dw_{ij}

여기서 L은 손실, w_{ij}는 뉴런 i에서 j로의 가중치, a_j는 j의 활성화 값, z_j는 가중합이다. 연쇄 법칙에 의해 각 레이어의 기울기가 다음 레이어의 기울기로부터 계산되면서, 오차 신호가 네트워크를 역방향으로 전파된다.

## 역전파는 왜 생물학적으로 불가능한가

역전파가 뇌에서 일어날 수 없는 이유는 적어도 네 가지다.

**1. 가중치 전달 문제(Weight Transport Problem)**: 역전파에서 오차를 역방향으로 전파하려면, 역방향 경로가 순방향 경로의 가중치를 **정확히 알아야** 한다. 수학적으로, 역전파에 사용되는 행렬은 순방향 가중치 행렬의 전치(transpose)다. 하지만 생물학적 시냅스에서 한 뉴런이 다른 뉴런으로의 연결 강도를, 그 역방향 연결이 "알고 있을" 메커니즘은 없다.

**2. 전역 오차 신호**: 역전파는 네트워크 출력의 전역 오차를 계산한 뒤 모든 레이어에 전파한다. 생물학적 뉴런의 학습은 **지역적**(local)이다. 시냅스의 변화는 그 시냅스 주변의 활동에만 기반한다. 수백만 시냅스 떨어진 출력 오차 정보가 어떻게 특정 시냅스에 도달할 수 있겠는가?

**3. 순전파/역전파의 분리된 단계**: 역전파 알고리즘은 순전파가 완료된 후에야 역전파가 시작되는 분리된 두 단계로 구성된다. 생물학적 뉴런은 연속적으로 활동하며, 이런 분리된 단계 전환이 없다.

**4. 대칭 가중치**: 역전파에서 순방향과 역방향 경로의 가중치가 정확히 대칭(전치 관계)이어야 한다. 생물학적 신경 회로에서 이런 정밀한 대칭은 관찰되지 않는다.

## 생물학적으로 그럴듯한 대안들

역전파의 비생물학성이 만들어낸 긴장은 활발한 연구 프로그램을 촉발했다.

**피드백 정렬 -- Lillicrap et al.(2016)**: 가중치 전달 문제에 대한 가장 놀라운 해법이다. 역방향 경로에 순방향 가중치의 전치 대신 **무작위 고정 행렬**을 사용해도 학습이 작동한다는 것을 보였다. 무작위 피드백으로도 순방향 가중치가 점차 피드백 행렬과 정렬(align)되면서 유용한 기울기 정보를 전달하게 된다. 이 발견은 생물학적 학습이 정확한 가중치 대칭 없이도 가능할 수 있음을 시사한다.

**예측 부호화 -- Rao & Ballard(1999)**: 뇌는 끊임없이 감각 입력을 **예측**하고, 예측과 실제 입력의 **차이**(예측 오차)만을 상위 영역으로 전달한다는 이론이다. 각 레이어가 아래 레이어의 활동을 예측하고 오차를 계산하므로, 학습이 본질적으로 지역적이다. 전역 오차를 역전파할 필요가 없다. Whittington & Bogacz(2017)는 예측 부호화의 수학적 구조가 특정 조건에서 역전파와 동일한 기울기를 산출할 수 있음을 보였다.

**평형 전파 -- Scellier & Bengio(2017)**: 네트워크를 에너지 기반 시스템으로 보고, "자유 단계"(입력만 주어진 상태에서 평형 도달)와 "고정 단계"(출력도 약하게 고정한 상태에서 평형 도달)의 차이로 기울기를 근사한다. 연속 시간, 지역적 학습 규칙, 대칭 가중치 가정을 요구하지만 완전한 가중치 전달은 불필요하다.

**순전파 알고리즘 -- Hinton(2022)**: Geoffrey Hinton이 제안한 Forward-Forward 알고리즘은 역전파를 완전히 제거한다. 각 레이어가 "양성 데이터"(실제 데이터)와 "음성 데이터"(생성된 잘못된 데이터)를 구분하도록 독립적으로 학습한다. 순전파만 두 번 수행하며, 역방향 경로가 전혀 필요 없다. 각 레이어의 학습이 완전히 지역적이다.

## 수렴하지 않는 두 갈래

현재 상황을 정직하게 요약하면 이렇다. 역전파는 성능에서 압도적이지만 생물학적으로 불가능하고, 생물학적으로 그럴듯한 대안들은 아직 역전파의 성능에 미치지 못한다.

- 피드백 정렬: 단순 과제에서는 작동하지만, 심층 네트워크에서 역전파 대비 성능 격차가 존재한다
- 예측 부호화: 이론적으로 매력적이지만, 대규모 실험적 검증이 부족하다
- 평형 전파: 특정 네트워크 구조에 제한된다
- Forward-Forward: 복잡한 과제에서 역전파 대비 성능이 크게 뒤처진다

이 격차가 의미하는 것은 두 가지 가능성이다. 뇌가 아직 발견되지 않은 더 효율적인 학습 원리를 사용하고 있거나, 또는 뇌의 학습이 역전파와 근본적으로 다른 목표를 추구하고 있거나.

## 한계와 약점

이 분야의 근본적 한계와 열린 질문들을 인식해야 한다.

- **비교의 어려움**: 역전파는 지도 학습(supervised learning)에 최적화되어 있다. 뇌의 학습은 대부분 비지도 또는 자기지도(self-supervised)에 가깝다. 둘을 같은 기준으로 비교하는 것 자체가 적절하지 않을 수 있다.
- **규모의 차이**: 역전파의 성공은 수십억 파라미터 모델에서 가장 두드러진다. 생물학적 대안들은 대부분 소규모 실험에서만 검증되었다. 규모 확장(scaling) 가능성이 미지수다.
- **생물학적 사실주의의 정도**: "생물학적으로 그럴듯한"이란 스펙트럼이지 이분법이 아니다. 피드백 정렬은 가중치 전달 문제를 해결하지만 여전히 분리된 단계를 사용한다. 완전히 생물학적인 학습 규칙은 아직 AI에서 실용적 성능을 보이지 못했다.
- **Hebb 규칙의 한계**: 원래의 Hebb 규칙은 시냅스를 강화만 할 수 있고 약화시킬 수 없어서, 모든 가중치가 무한히 커지는 불안정성이 있다. 실제 뇌는 LTD, 시냅스 스케일링, 메타가소성 같은 안정화 메커니즘을 사용한다.
- **뇌가 최적화를 하는가?**: 역전파는 손실 함수의 최적화를 전제한다. 뇌가 명시적 손실 함수를 최적화하는지, 아니면 완전히 다른 계산 원리를 사용하는지는 열린 질문이다. Karl Friston의 자유 에너지 원리(Free Energy Principle)는 뇌가 감각 입력의 놀라움(surprise)을 최소화한다고 제안하지만, 이것이 역전파와 어떻게 연결되는지는 명확하지 않다.

## 용어 정리

시냅스 가소성(synaptic plasticity) - 경험에 의해 시냅스 연결 강도가 변화하는 뇌의 근본적 성질. 학습과 기억의 신경학적 기초

장기 강화(Long-Term Potentiation, LTP) - 고빈도 자극 후 시냅스 전달 효율이 수 시간~수 주 지속적으로 증가하는 현상. Bliss & Lomo(1973) 발견

장기 억압(Long-Term Depression, LTD) - 저빈도 자극 후 시냅스 전달 효율이 감소하는 현상. LTP의 반대 방향

스파이크 타이밍 의존 가소성(STDP) - 시냅스 전후 뉴런의 발화 시간 차이에 따라 시냅스 강도가 변하는 규칙. Markram(1997) 발견

역전파(backpropagation) - 연쇄 법칙으로 출력 오차에 대한 각 가중치의 기울기를 역방향으로 계산하는 알고리즘. Rumelhart et al.(1986) 대중화

가중치 전달 문제(weight transport problem) - 역전파가 역방향 경로에서 순방향 가중치의 정확한 전치를 요구하는, 생물학적으로 비현실적인 가정

피드백 정렬(feedback alignment) - 역방향 경로에 무작위 고정 행렬을 사용해도 학습이 가능함을 보인 방법. Lillicrap et al.(2016)

예측 부호화(predictive coding) - 뇌가 감각 입력을 예측하고 예측 오차만 전파한다는 이론. 지역적 학습이 가능. Rao & Ballard(1999)

연쇄 법칙(chain rule) - 합성 함수의 미분을 각 구성 함수 미분의 곱으로 분해하는 미적분학 법칙. 역전파의 수학적 기초

순전파 알고리즘(Forward-Forward algorithm) - Hinton(2022)이 제안한, 역방향 경로 없이 양성/음성 데이터 구분으로 각 레이어를 독립 학습시키는 방법

---EN---
Synaptic Plasticity and the Backpropagation Debate - How neuroscience's critique of backpropagation's biological impossibility is driving new AI learning algorithms: feedback alignment, predictive coding, and Forward-Forward

## How Does the Brain Learn?

In 1949, psychologist Donald Hebb proposed a famous hypothesis about the neurological mechanism of learning in "The Organization of Behavior": "When an axon of cell A is near enough to excite cell B and repeatedly or persistently takes part in firing it, the synaptic efficiency increases." This is commonly summarized as "Neurons that fire together, wire together."

Hebb's hypothesis was purely theoretical. Experimental evidence came 24 years later. In 1973, Tim Bliss and Terje Lomo discovered **Long-Term Potentiation (LTP)** in the rabbit hippocampus -- a phenomenon where high-frequency stimulation of presynaptic neurons produced sustained increases in synaptic transmission efficiency lasting hours to weeks. This was the moment Hebb's theoretical prediction was experimentally confirmed.

Subsequently, the opposite phenomenon, **Long-Term Depression (LTD)**, was also discovered -- low-frequency stimulation decreases synaptic efficiency. The balance between LTP and LTD forms the basis of learning and memory in the brain.

## The Discovery of Spike Timing

In 1997, Henry Markram discovered **Spike-Timing-Dependent Plasticity (STDP)**, elevating our understanding of synaptic plasticity. The STDP rule is elegantly simple:

- If the presynaptic neuron fires **first** and the postsynaptic neuron fires **after** (dt > 0) --> synaptic strengthening (LTP)
- If the postsynaptic neuron fires **first** and the presynaptic neuron fires **after** (dt < 0) --> synaptic weakening (LTD)

Mathematically, the weight change is:

When dt > 0: dw = A+ * exp(-dt / tau+)
When dt < 0: dw = -A- * exp(dt / tau-)

Here dt = t_post - t_pre (postsynaptic firing time minus presynaptic firing time), A+ and A- are maximum strengthening/weakening magnitudes, and tau+ and tau- are time constants (typically tens of milliseconds).

Why STDP is a refined version of Hebb's rule is clear: it strengthens connections only when the presynaptic neuron likely **causally contributed** to the postsynaptic neuron's firing (pre-before-post order). Temporal order serves as a proxy for causality.

## Backpropagation: AI's Most Important Algorithm

In contrast, backpropagation -- the standard algorithm for training neural networks in AI -- operates on entirely different principles. Popularized by Rumelhart, Hinton & Williams (1986), its core is gradient computation using the chain rule.

The backpropagation process is:

1. **Forward pass**: Input passes through the network to produce output
2. **Loss computation**: The difference between output and target (loss function L) is calculated
3. **Backward pass**: Gradients of the loss with respect to each weight are computed via the chain rule, from output layer toward input layer
4. **Weight update**: Weights are adjusted in the opposite direction of the gradient

The core formula is:

dL/dw_{ij} = dL/da_j * da_j/dz_j * dz_j/dw_{ij}

Here L is the loss, w_{ij} is the weight from neuron i to j, a_j is j's activation, and z_j is the weighted sum. Through the chain rule, each layer's gradient is computed from the next layer's gradient, propagating the error signal backward through the network.

## Why Backpropagation Is Biologically Impossible

There are at least four reasons backpropagation cannot occur in the brain.

**1. Weight Transport Problem**: To propagate errors backward, the backward pathway must **exactly know** the forward pathway's weights. Mathematically, the matrix used in backpropagation is the transpose of the forward weight matrix. But in biological synapses, there is no mechanism by which a reverse connection could "know" the strength of the forward connection.

**2. Global error signal**: Backpropagation computes a global error at the network output and propagates it to all layers. Biological neuron learning is **local** -- synaptic changes are based only on activity around that synapse. How could output error information millions of synapses away reach a specific synapse?

**3. Separate forward/backward phases**: The backpropagation algorithm consists of two separated phases where the backward pass begins only after the forward pass is complete. Biological neurons operate continuously without such phase transitions.

**4. Symmetric weights**: Backpropagation requires forward and backward pathway weights to be exactly symmetric (transpose relationship). Such precise symmetry is not observed in biological neural circuits.

## Biologically Plausible Alternatives

The tension created by backpropagation's biological implausibility has spawned an active research program.

**Feedback alignment -- Lillicrap et al. (2016)**: The most surprising solution to the weight transport problem. They showed that learning works even when using **random fixed matrices** instead of the forward weights' transpose for the backward pathway. With random feedback, the forward weights gradually align with the feedback matrix, eventually conveying useful gradient information. This finding suggests biological learning may be possible without precise weight symmetry.

**Predictive coding -- Rao & Ballard (1999)**: The theory that the brain constantly **predicts** sensory input and transmits only the **difference** between prediction and actual input (prediction error) to higher regions. Since each layer predicts and computes errors for the layer below, learning is inherently local -- no need to backpropagate global errors. Whittington & Bogacz (2017) showed that predictive coding's mathematical structure can produce gradients identical to backpropagation under certain conditions.

**Equilibrium propagation -- Scellier & Bengio (2017)**: Viewing the network as an energy-based system, gradients are approximated from the difference between a "free phase" (reaching equilibrium with only input given) and a "clamped phase" (reaching equilibrium with output weakly clamped). It requires continuous time, local learning rules, and symmetric weight assumptions but not full weight transport.

**Forward-Forward algorithm -- Hinton (2022)**: Geoffrey Hinton's Forward-Forward algorithm completely eliminates backpropagation. Each layer independently learns to distinguish "positive data" (real data) from "negative data" (generated incorrect data). It performs forward passes only, twice, requiring no backward pathway at all. Each layer's learning is entirely local.

## Two Paths That Have Not Converged

An honest summary of the current situation: backpropagation is overwhelmingly dominant in performance but biologically impossible, while biologically plausible alternatives have not yet matched backpropagation's performance.

- Feedback alignment: Works on simple tasks but shows performance gaps compared to backpropagation in deep networks
- Predictive coding: Theoretically appealing but lacks large-scale experimental validation
- Equilibrium propagation: Restricted to specific network architectures
- Forward-Forward: Significantly underperforms backpropagation on complex tasks

This gap implies two possibilities: the brain uses a more efficient learning principle not yet discovered, or the brain's learning pursues fundamentally different goals than backpropagation.

## Limitations and Weaknesses

The fundamental limitations and open questions in this field must be recognized.

- **Comparison difficulty**: Backpropagation is optimized for supervised learning. Brain learning is mostly unsupervised or self-supervised. Comparing them by the same criteria may itself be inappropriate.
- **Scale difference**: Backpropagation's success is most pronounced in models with billions of parameters. Biological alternatives have mostly been validated only in small-scale experiments. Scaling potential remains unknown.
- **Degrees of biological realism**: "Biologically plausible" is a spectrum, not a binary. Feedback alignment solves the weight transport problem but still uses separated phases. A fully biological learning rule has not yet achieved practical performance in AI.
- **Limitations of Hebb's rule**: The original Hebb rule can only strengthen synapses, not weaken them, creating instability where all weights grow indefinitely. The actual brain uses stabilization mechanisms like LTD, synaptic scaling, and metaplasticity.
- **Does the brain optimize?**: Backpropagation presumes optimization of a loss function. Whether the brain optimizes an explicit loss function or uses entirely different computational principles is an open question. Karl Friston's Free Energy Principle proposes that the brain minimizes surprise of sensory input, but how this connects to backpropagation remains unclear.

## Glossary

Synaptic plasticity - the fundamental property of the brain where synaptic connection strength changes with experience; the neurological basis of learning and memory

Long-Term Potentiation (LTP) - a phenomenon where synaptic transmission efficiency increases persistently for hours to weeks following high-frequency stimulation; discovered by Bliss & Lomo (1973)

Long-Term Depression (LTD) - a phenomenon where synaptic transmission efficiency decreases following low-frequency stimulation; the opposite direction of LTP

Spike-Timing-Dependent Plasticity (STDP) - a rule where synaptic strength changes based on the timing difference between pre- and postsynaptic neuron firing; discovered by Markram (1997)

Backpropagation - an algorithm that computes gradients of output error with respect to each weight backward through the chain rule; popularized by Rumelhart et al. (1986)

Weight transport problem - the biologically unrealistic assumption that backpropagation requires the exact transpose of forward weights in the backward pathway

Feedback alignment - a method showing that learning works with random fixed matrices in the backward pathway; Lillicrap et al. (2016)

Predictive coding - the theory that the brain predicts sensory input and propagates only prediction errors, enabling local learning; Rao & Ballard (1999)

Chain rule - the calculus rule decomposing the derivative of a composite function into a product of constituent function derivatives; the mathematical foundation of backpropagation

Forward-Forward algorithm - Hinton's (2022) method training each layer independently by distinguishing positive/negative data without any backward pathway
