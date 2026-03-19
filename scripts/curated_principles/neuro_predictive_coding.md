---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 예측 코딩, 자유 에너지 원리, 하향식 예측, 예측 오차, 계층적 추론, 능동적 추론
keywords_en: predictive coding, free energy principle, top-down prediction, prediction error, hierarchical inference, active inference
---
Predictive Coding (Rao & Ballard 1999) - 뇌가 감각 입력을 끊임없이 예측하고 예측 오차만을 전달하는 계층적 추론 모델

## 뇌는 수동적 수신기가 아니다

전통적 관점에서 뇌는 감각 데이터를 받아 단계별로 처리하는 입력-출력 시스템이었다. 눈에 빛이 들어오면 V1에서 에지를 추출하고, V2에서 윤곽을 잡고, IT에서 객체를 인식한다. 그런데 이상한 점이 있다. 상위 영역에서 하위 영역으로 내려오는 하향 연결(feedback connection)은 상향 연결만큼이나 풍부하다. 왜 뇌는 이 방대한 하향 배선에 자원을 쓰는가?

예측 코딩(predictive coding)의 답은 이것이다. 뇌는 끊임없이 다음에 올 감각을 **예측**하고, 예측이 틀릴 때만 그 차이를 위로 전달한다. 매일 같은 출근길을 걸을 때 거의 무의식적으로 이동하는 이유는, 뇌가 이미 장면을 정확히 예측하고 있기 때문이다. 갑자기 공사 펜스가 나타나면 비로소 의식이 환기된다. 뇌는 세상을 수동적으로 받아들이는 카메라가 아니라, 끊임없이 모델링하는 예측 기계다.

## Rao & Ballard (1999): 시각 피질에 예측 코딩을 입히다

사상적 뿌리는 19세기까지 거슬러 올라간다. Hermann von Helmholtz(1867)는 지각을 "무의식적 추론"(unconscious inference)이라 불렀다. 감각 데이터에서 외부 세계의 원인을 역추적하는 과정이라는 통찰이었다.

Rajesh Rao와 Dana Ballard(1999)는 이 직관을 시각 피질의 신경 회로에 적용한 계산 모델을 Nature Neuroscience에 발표했다. 시각 피질의 계층 구조에서 **상위 영역이 하위 영역의 활동을 예측**하는 하향식(top-down) 신호를 보낸다. 하위 영역은 실제 감각 입력과 이 예측의 차이, 즉 **예측 오차**(prediction error)만을 상향식(bottom-up)으로 전달한다.

V1(초기 시각 피질)과 V2(고차 시각 피질) 사이의 되먹임 연결을 예로 들자. V2는 "이 장면에는 수직 에지가 있을 것이다"라는 예측 신호를 V1으로 내려보낸다. V1은 실제 망막 입력과 이 예측을 비교하여, 수직 에지가 정말 있으면 거의 신호를 보내지 않고, 예측에 없던 수평 에지가 나타나면 그 차이만을 V2로 올려보낸다. 이 모델은 V1 뉴런의 반복 자극에 대한 반응 감소(repetition suppression)와 예상 밖 자극에 대한 반응 증가(mismatch response)를 설명할 수 있었다.

## 핵심 메커니즘: 예측과 오차의 순환

예측 코딩의 작동을 더 구체적으로 풀어보면 세 요소로 나뉜다.

**생성 모델(generative model)**: 상위 계층이 "세상은 이럴 것이다"라는 내부 모델을 유지한다. 비유하자면, 소설의 다음 문장을 예측하면서 읽는 독자와 같다.

**예측 오차(prediction error)**: 생성 모델의 예측과 실제 감각 입력의 차이다. 이 오차만이 상위 계층으로 전달된다. 예상대로 이야기가 흐르면 빠르게 넘어가지만, 반전이 나오면 주의가 집중되는 것과 같다.

**오차 최소화**: 두 가지 경로가 있다. 첫째, 내부 모델을 업데이트하여 더 나은 예측을 만든다 -- 이것이 **지각**(perception)이다. 둘째, 세상 자체를 바꿔서 예측에 맞게 만든다 -- 눈을 돌리거나 손을 뻗는 것이다. 이것이 **행동**(action)이다.

이 구조에서 뇌는 계층마다 양방향으로 신호를 주고받는 순환 시스템이다. 상위가 예측을 내려보내고, 하위가 오차를 올려보내며, 이 과정이 모든 계층에서 동시에 반복된다. 예측이 정확하면 오차가 0에 가까워져 전달 정보량이 대폭 줄어든다. 실제로 상위 영역이 받는 것은 예측이 빗나간 소수의 놀라운 정보뿐이다.

## Friston의 자유 에너지 원리: 통합 뇌 이론의 야심

Karl Friston(2006, 2010)은 예측 코딩을 뇌 전체의 작동 원리로 확장했다. 자유 에너지 원리(Free Energy Principle)의 핵심 주장은 이것이다. 뇌의 모든 활동 -- 지각, 학습, 행동, 주의 -- 은 **변분 자유 에너지**(variational free energy)를 최소화하는 단일 과정으로 설명될 수 있다.

변분 자유 에너지는 직관적으로 "놀라움의 상한"(upper bound on surprise)이다. 생명체는 자신의 존재와 양립할 수 없는 감각 상태를 피해야 하므로 놀라움을 최소화해야 한다. 그러나 놀라움 자체는 직접 계산이 어려우므로, 그 상한인 자유 에너지를 대신 줄인다. 이는 통계학의 변분 추론(variational inference)과 동일한 수학적 구조다.

여기서 능동적 추론(active inference)이라는 개념이 나온다. 내부 모델을 바꾸는 것뿐 아니라, 세상을 바꿔 예측에 맞추는 것도 자유 에너지 최소화다. 체온이 떨어지면 뇌는 "37도" 예측과의 오차를 줄이려 근육을 떨게 한다. 지각과 행동이 동일한 원리의 두 측면이 된다.

다만 자유 에너지 원리는 그 포괄성 때문에 비판도 받는다. 모든 것을 설명하는 이론은 아무것도 반증할 수 없다는 반증 가능성(falsifiability) 문제가 지속적으로 제기된다. 예측 코딩이 특정 회로의 계산 모델이라면, 자유 에너지 원리는 훨씬 넓은 이론적 틀이다.

## AI로의 연결: 수학적 구조의 수렴

예측 코딩의 원리가 AI에 미친 영향은 다양한 층위에서 나타난다.

**직접적 영감:**

- **변분 오토인코더(VAE)**: Kingma & Welling(2014)의 VAE는 데이터의 생성 과정을 잠재 변수(latent variable) 모델로 가정하고, 인코더가 관찰에서 잠재 표현을 추론한다. 예측 코딩의 "생성 모델이 예측을 내려보내고, 오차가 추론을 수정한다"는 흐름과 수학적으로 밀접하다. 두 프레임워크 모두 변분 추론을 사용하며, VAE의 ELBO(Evidence Lower Bound)가 자유 에너지의 음수 값에 대응한다. Kingma & Welling은 예측 코딩을 직접 인용하지 않았지만, 후속 연구에서 수학적 동치가 확인되었다(Marino 2022)

- **계층적 예측 모델**: 예측 코딩에서 직접 영감받은 신경망 아키텍처(PredNet, Lotter et al. 2017)는 비디오의 다음 프레임을 계층적으로 예측하고, 예측 오차만을 전파한다. 구조가 Rao & Ballard의 모델을 명시적으로 구현한 것이다

**구조적 유사성 (역사적 영감이 아닌 수렴):**

- **자기지도 학습**: BYOL(Grill et al. 2020)이나 SimCLR(Chen et al. 2020)은 데이터 자체에서 학습 신호를 만들어낸다. 입력의 두 변환을 비교하여 예측 오차를 최소화하는 원리는 예측 코딩과 개념적으로 유사하지만, 개발 과정에서 예측 코딩이 참조되지는 않았다

- **LLM의 다음 토큰 예측**: GPT 계열이 다음 토큰을 예측하고 오차로 학습하는 것은, 예측 코딩과 높은 수준에서 유사하다. 그러나 GPT는 언어 모델링 전통(Shannon 1948)에서 독립적으로 발전했으며, 순방향 네트워크로서 예측 코딩의 핵심인 양방향 순환 구조가 부재하다. 구조적 유사성이지 역사적 영감이 아니다

## 한계와 열린 문제

예측 코딩은 가장 영향력 있는 신경과학 이론 중 하나이지만, 확정된 사실이 아닌 진행 중인 연구 프로그램이다.

- **실험적 증거의 한계**: 예측 오차 신호에 대응하는 신경 활동은 다수 보고되었지만, 뇌가 "예측 코딩을 사용한다"는 것과 "예측 코딩으로도 설명할 수 있는 활동 패턴을 보인다"는 것은 다른 주장이다. 같은 데이터를 설명하는 대안 모델도 존재한다

- **구현 메커니즘의 불확실성**: 예측 신호와 오차 신호를 전달하는 세포 유형과 회로가 정확히 무엇인지는 아직 논쟁 중이다. 피질의 표층(superficial layer)이 오차를, 심층(deep layer)이 예측을 전달한다는 가설(Bastos et al. 2012)은 유력하지만 확정적이지 않다

- **자유 에너지 원리의 반증 가능성**: "모든 뇌 활동은 자유 에너지 최소화"라는 주장은 매우 넓어서, 어떤 관찰이 이를 반증할 수 있는지가 불분명하다. 과학 이론으로서의 지위에 대한 철학적 논쟁이 계속된다

- **AI 구현의 격차**: 뇌의 예측 코딩이 가진 양방향 순환, 실시간 오차 수정, 행동과의 통합은 대부분의 AI 시스템에 구현되지 않았다. 능동적 추론을 완전히 구현한 AI 시스템은 아직 연구 단계다

## 용어 정리

예측 코딩(predictive coding) - 뇌가 감각 입력을 능동적으로 예측하고, 예측과 실제의 차이(오차)만을 상위 영역으로 전달하는 계층적 추론 프레임워크

예측 오차(prediction error) - 내부 모델이 생성한 예측과 실제 감각 입력 사이의 차이. 이 오차가 학습과 지각을 이끈다

생성 모델(generative model) - 상위 계층이 하위 계층의 감각 패턴을 예측하기 위해 사용하는 내부 세계 모델

하향식 처리(top-down processing) - 상위 뇌 영역에서 하위 영역으로 예측 신호를 보내는 처리 방향. 상향식(bottom-up)은 감각 입력이 하위에서 상위로 올라가는 방향

자유 에너지 원리(Free Energy Principle) - Friston이 제안한 통합 뇌 이론. 모든 뇌 활동은 변분 자유 에너지(놀라움의 상한)를 최소화하는 과정이라는 주장

능동적 추론(active inference) - 예측 오차를 줄이기 위해 내부 모델뿐 아니라 행동을 통해 세상 자체를 바꾸는 과정. 자유 에너지 원리의 행동 측면

무의식적 추론(unconscious inference) - Helmholtz(1867)가 제안한 개념. 지각이 감각 데이터로부터 외부 세계의 원인을 무의식적으로 추론하는 과정이라는 통찰
---EN---
Predictive Coding (Rao & Ballard 1999) - A hierarchical inference model in which the brain continuously predicts sensory input and transmits only prediction errors

## The Brain Is Not a Passive Receiver

The traditional view treated the brain as an input-output system processing sensory data stage by stage. Light enters the eye, V1 extracts edges, V2 builds contours, IT recognizes objects. But something is odd: feedback connections from higher to lower visual areas are as abundant as feedforward ones. Why does the brain invest vast wiring resources in these top-down pathways?

Predictive coding answers: the brain constantly **predicts** upcoming sensory input and forwards only the discrepancies when predictions go wrong. Walking a familiar commute, we navigate almost unconsciously because the brain accurately predicts the scene. When construction barriers suddenly appear, consciousness snaps to attention. The brain is not a passive camera receiving the world, but a prediction engine perpetually modeling it.

## Rao & Ballard (1999): Fitting Predictive Coding to Visual Cortex

The intellectual roots reach back to the 19th century. Hermann von Helmholtz (1867) called perception "unconscious inference" -- inferring external causes by reverse-reasoning from sensory data.

Rajesh Rao and Dana Ballard (1999) published a computational model in Nature Neuroscience applying this intuition to visual cortex circuits. In the visual cortex hierarchy, **higher areas send top-down signals predicting lower-area activity**. Lower areas transmit only the **prediction error** -- the difference between actual sensory input and the prediction -- in a bottom-up direction.

Consider the feedback loop between V1 and V2. V2 sends a prediction signal to V1: "this scene should contain a vertical edge." V1 compares actual retinal input with this prediction. If the vertical edge is indeed present, V1 sends little signal upward. If an unexpected horizontal edge appears, only that discrepancy travels up to V2. This model explained V1 neurons' decreased response to repeated stimuli (repetition suppression) and heightened response to unexpected stimuli (mismatch response).

## Core Mechanism: The Cycle of Prediction and Error

Breaking down predictive coding's operation more concretely reveals three components.

**Generative model**: Higher layers maintain an internal model of "what the world should be like." Think of a reader predicting the next sentence of a novel.

**Prediction error**: The difference between the generative model's prediction and actual sensory input. Only this error propagates upward. If the story flows as expected, one reads quickly; a sudden twist seizes attention.

**Error minimization**: Two paths exist. First, update the internal model for better predictions -- this is **perception**. Second, change the world to match predictions -- moving the eyes or reaching out. This is **action**.

In this architecture, the brain is a recurrent system exchanging signals bidirectionally at every level. Higher levels send predictions down, lower levels send errors up, iterating simultaneously across all layers. When predictions are accurate, errors approach zero, drastically reducing transmitted information. Higher areas receive only the handful of surprising signals where predictions went wrong.

## Friston's Free Energy Principle: The Ambition of a Unified Brain Theory

Karl Friston (2006, 2010) expanded predictive coding into an operating principle for the entire brain. The core claim of the Free Energy Principle: all brain activity -- perception, learning, action, attention -- can be explained as a single process of minimizing **variational free energy**.

Variational free energy is intuitively an "upper bound on surprise." Organisms must avoid sensory states incompatible with their existence, so they minimize surprise. But surprise itself is computationally intractable, so the brain minimizes free energy -- its upper bound -- instead. The mathematics is identical to variational inference in statistics.

This yields the concept of active inference. Changing not just the internal model to fit predictions but changing the world to match predictions is also a form of free energy minimization. When body temperature drops, the brain reduces the error from its "37C" prediction by triggering shivering. Perception and action become two faces of the same principle.

However, the Free Energy Principle's very comprehensiveness invites criticism. The persistent concern is falsifiability: a theory that explains everything may be unfalsifiable. Distinguishing predictive coding as a specific computational model for neural circuits from the Free Energy Principle as a far broader theoretical wrapper is important.

## Connections to AI: Convergence of Mathematical Structure

Predictive coding's influence on AI manifests at multiple levels.

**Direct inspiration:**

- **Variational Autoencoder (VAE)**: Kingma & Welling's (2014) VAE assumes a latent variable generative process, with an encoder inferring latent representations. This parallels predictive coding's "generative model sends predictions down, errors correct inference." Both use variational inference, and the VAE's ELBO corresponds to the negative of free energy. Kingma & Welling did not cite predictive coding, but subsequent work confirmed mathematical equivalence (Marino 2022)

- **Hierarchical prediction models**: Neural architectures directly inspired by predictive coding (PredNet, Lotter et al. 2017) hierarchically predict the next video frame and propagate only prediction errors -- an explicit implementation of Rao & Ballard's model

**Structural similarity (convergence, not historical inspiration):**

- **Self-supervised learning**: BYOL (Grill et al. 2020) and SimCLR (Chen et al. 2020) generate learning signals from data itself. Minimizing prediction error between two transformations of input is conceptually similar to predictive coding, but was not developed with reference to it

- **LLM next-token prediction**: GPT-family models predicting the next token and learning from errors show high-level structural similarity. However, GPT evolved independently from the language modeling tradition (Shannon 1948) and is a feedforward network lacking predictive coding's essential bidirectional recurrent structure. Structural similarity, not historical inspiration

## Limitations and Open Questions

Predictive coding is one of the most influential neuroscience theories, but it is an ongoing research program, not established fact.

- **Limits of experimental evidence**: Neural activity corresponding to prediction error signals has been widely reported, but "the brain uses predictive coding" and "the brain shows activity patterns also explainable by predictive coding" are different claims. Alternative models explaining the same data exist

- **Implementation uncertainty**: The exact cell types and circuits carrying prediction versus error signals remain debated. The hypothesis that superficial cortical layers carry errors and deep layers carry predictions (Bastos et al. 2012) is prominent but not definitive

- **Falsifiability of the Free Energy Principle**: The claim that "all brain activity is free energy minimization" is so broad that it is unclear what observation could refute it. Philosophical debate over its status as scientific theory continues

- **Gap in AI implementation**: The bidirectional recurrence, real-time error correction, and integration with action that characterize brain predictive coding are absent from most AI systems. Active inference remains at the research stage

## Glossary

Predictive coding - a hierarchical inference framework in which the brain actively predicts sensory input and transmits only prediction errors upward

Prediction error - the difference between a prediction generated by the internal model and actual sensory input; this error drives learning and perception

Generative model - the internal world model that higher layers use to predict sensory patterns expected at lower layers

Top-down processing - the direction of processing where higher brain areas send prediction signals to lower areas. Bottom-up processing is sensory input traveling from lower to higher areas

Free Energy Principle - a unified brain theory proposed by Friston, claiming all brain activity minimizes variational free energy (an upper bound on surprise)

Active inference - the process of reducing prediction error not only by updating internal models but by acting on the world to make it match predictions

Unconscious inference - a concept proposed by Helmholtz (1867): perception is an unconscious process of inferring external causes from sensory data
