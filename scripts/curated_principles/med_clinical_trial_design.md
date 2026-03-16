---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 무작위 대조 시험, A/B 테스트, 인과 추론, 톰슨 샘플링, 다중 비교 보정, 적응적 시험, 통계적 검정력
keywords_en: randomized controlled trial, A/B testing, causal inference, Thompson sampling, multiple comparison correction, adaptive trial design, statistical power
---
Clinical Trial Design - 의학의 인과 추론 설계가 AI의 실험 방법론과 탐색-활용 알고리즘에 직접 영감을 준 원리

## 무작위 배정이라는 발명

1747년, 영국 해군 군의관 James Lind는 괴혈병에 걸린 선원 12명을 6개 그룹으로 나누어 각각 다른 치료법을 시험했다. 사이다, 황산, 식초, 해수, 오렌지와 레몬, 바크 페이스트. 오렌지와 레몬을 먹은 그룹만 회복했다. 통제 그룹의 존재, 동시 비교, 결과의 체계적 기록이라는 실험 원칙이 이미 이 원시적 시험에 담겨 있었다.

하지만 핵심 도약은 190년 뒤에 일어난다. Ronald A. Fisher(1935)가 "The Design of Experiments"에서 **무작위 배정**(randomization)의 이론적 기반을 확립했다. Fisher의 통찰은 단순하지만 깊다. 연구자가 아는 교란 변수(나이, 성별, 기저질환)는 의도적으로 균형을 맞출 수 있지만, **연구자가 모르는 교란 변수**는 어떤 의도적 설계로도 통제할 수 없다. 무작위 배정만이 알려진 것과 알려지지 않은 것 모두를 확률적으로 균등하게 분포시키는 유일한 방법이다.

## 의학에서 디지털 실험으로

RCT의 구조가 AI와 테크 산업으로 이식된 경로는 두 갈래다.

**경로 1: A/B 테스트 -- RCT의 디지털 복제**

2000년대 초, 구글 엔지니어들이 웹페이지 변경의 효과를 측정하기 위해 RCT 구조를 그대로 차용했다. Ron Kohavi(마이크로소프트)가 이 분야를 체계화했고, Kohavi, Tang, Xu의 "Trustworthy Online Controlled Experiments"(2020)가 표준 참고서가 되었다. 핵심 대응 관계는 다음과 같다.

- 환자 --> **사용자**
- 처치군/대조군 --> **변형(variant) A/B**
- 치료법 --> **UI 변경, 알고리즘 변경, 가격 변경**
- 임상적 결과(생존율, 증상 완화) --> **비즈니스 메트릭(전환율, 클릭률, 체류 시간)**
- 무작위 배정 --> **사용자 해시 기반 그룹 할당**
- 맹검 --> **사용자가 실험 중인지 인지하지 못함**

이 대응에서 통계적 검정 도구(t-검정, 유의수준, 검정력 계산)까지 그대로 이식되었다. Google, Meta, Netflix, Microsoft가 연간 수만 건의 A/B 테스트를 실행한다.

## 핵심 수학적 구조

**1. 평균 처치 효과(Average Treatment Effect)**

ATE = E[Y(1)] - E[Y(0)]

Y(1)은 처치를 받았을 때의 결과, Y(0)은 받지 않았을 때의 결과다. 동일한 개체가 동시에 처치를 받으면서 받지 않을 수는 없다. 이것이 인과 추론의 근본 문제(fundamental problem of causal inference)다. 무작위 배정은 두 그룹의 기대값을 비교 가능하게 만들어 이 문제를 우회한다.

**2. 표본 크기 결정 공식**

n = (z_{alpha/2} + z_beta)^2 * 2 * sigma^2 / delta^2

## 고정 설계 vs 적응적 설계: 핵심 트레이드오프

RCT의 가장 근본적인 트레이드오프는 **내적 타당성과 효율성** 사이에 있다.

고전적 고정 설계 RCT는 시험 시작 전에 표본 크기, 처치군, 종점(endpoint)을 모두 확정하고 끝까지 변경하지 않는다. 엄격하지만 비효율적이다. 시험 도중 한 처치가 명백히 열등하다는 증거가 쌓여도, 프로토콜에 따라 환자를 계속 배정해야 한다.

적응적 설계(adaptive design)는 중간 분석(interim analysis)에서 축적된 데이터를 보고 설계를 조정한다. 표본 크기를 늘리거나, 열등한 처치군을 조기 중단하거나, 유망한 하위 집단에 집중할 수 있다. 효율적이지만, 중간에 설계가 변하면 1종 오류 확률(거짓 양성)이 증가할 위험이 있어, 이를 통계적으로 보정하는 복잡한 방법론이 필요하다.

이 트레이드오프는 AI에서도 반복된다. 하이퍼파라미터 고정 후 학습(고정 설계)과, 학습 도중 learning rate나 구조를 조정하는 전략(적응적 설계)이 같은 긴장 관계에 놓여 있다.

## 다중 비교 문제: 의학의 엄격함이 AI에 필요한 이유

임상시험에서 여러 결과 변수나 하위 그룹을 동시에 검정하면 **1종 오류(거짓 양성) 확률이 급격히 증가**한다. 구체적으로 보면, 20개 독립 검정을 유의수준 0.05로 수행하면, 하나 이상에서 거짓 양성이 나올 확률은 1 - (1-0.05)^20 = 64%다. 검정이 100개면 99.4%로 사실상 확실하다.

의학은 이 문제를 수십 년간 다뤄왔다. Bonferroni 보정(유의수준을 검정 횟수로 나눔), Holm-Bonferroni(순위 기반 단계적 보정), Benjamini-Hochberg의 FDR(False Discovery Rate) 제어가 표준 방법이다.

## 현대 AI 기법과의 연결

임상시험 설계가 AI에 미친 영향은 여러 층위에서 나타난다. 다만 각 연결의 성격은 다르다.

**직접적 영감:**

- **A/B 테스트**: RCT의 구조(무작위 배정, 통제군, 가설 검정)를 디지털 환경에 그대로 이식한 가장 직접적인 사례다. 통계적 검정 방법론까지 동일하게 사용된다.
- **Thompson Sampling**: Thompson(1933)이 임상시험의 윤리적 배정 문제를 위해 고안한 알고리즘이 현대 MAB 문제의 핵심 전략으로 직접 부활했다. Chapelle & Li(2011)가 온라인 광고 최적화에 적용하면서 실용적 가치가 재확인되었다. 현대 추천 시스템, 동적 가격 책정, 뉴스 피드 개인화에서 epsilon-greedy, UCB(Upper Confidence Bound)와 함께 핵심 MAB 전략으로 사용된다.
- **다중 비교 보정**: Bonferroni, FDR 등 임상시험의 다중 비교 보정 방법론이 하이퍼파라미터 탐색, 모델 비교, 특징 선택(feature selection)에서 직접 사용된다.

**구조적 유사성 (독립적으로 같은 문제에 수렴한 경우):**

## 한계와 약점

- **윤리적 제약으로 인한 적용 범위 한계**: 모든 인과적 질문을 RCT로 답할 수 있는 것은 아니다. 흡연의 폐암 유발 효과를 RCT로 연구하는 것은 윤리적으로 불가능하다. 테크 A/B 테스트에서도 사용자에게 의도적으로 나쁜 경험을 배정하는 것의 윤리성이 논쟁된다.
- **외적 타당성의 한계**: RCT의 내적 타당성(통제된 환경에서의 인과 관계)은 높지만, 결과가 실제 환경에 일반화되는지는 별개 문제다. 엄격히 통제된 임상시험의 효과가 실제 진료 환경에서 재현되지 않는 경우가 빈번하며, A/B 테스트 결과도 테스트 기간의 신기 효과(novelty effect)로 장기 효과와 괴리될 수 있다.
- **네트워크 효과와 SUTVA 위반**: RCT는 한 참가자의 처치가 다른 참가자에게 영향을 미치지 않는다고 가정한다(SUTVA: Stable Unit Treatment Value Assumption). 소셜 플랫폼의 A/B 테스트에서는 사용자 간 상호작용 때문에 이 가정이 깨지며, 처치 효과가 왜곡된다.
- **p-해킹과 결과 조작**: 유의한 결과가 나올 때까지 분석 방법을 조정하는 p-해킹(p-hacking)은 임상시험과 A/B 테스트 모두의 신뢰성을 위협한다. 사전 등록(pre-registration)이 이를 방지하는 표준 방법이지만, 테크 업계에서는 사전 등록 관행이 아직 정착되지 않았다.

## 용어 정리

무작위 대조 시험(randomized controlled trial, RCT) - 참가자를 처치군과 대조군에 무작위로 배정하여 처치의 인과 효과를 추정하는 실험 설계

평균 처치 효과(average treatment effect, ATE) - 처치를 받았을 때와 받지 않았을 때의 결과 차이의 기대값. E[Y(1)] - E[Y(0)]

교란 변수(confounder) - 처치와 결과 모두에 영향을 미쳐 인과 관계 추정을 왜곡하는 제3의 변수. 무작위 배정의 핵심 목적이 교란 변수의 균등 분포

통계적 검정력(statistical power) - 실제로 효과가 있을 때 이를 탐지할 확률. 1 - beta로 표현되며, 관례적으로 0.8 이상을 요구

맹검(blinding) - 참가자, 연구자, 또는 양쪽 모두가 배정된 그룹을 모르도록 하여 기대 편향을 방지하는 설계 요소. 단일 맹검은 참가자만, 이중 맹검은 양쪽 모두 모름

Thompson Sampling - 각 선택지의 보상 사후 분포에서 샘플을 뽑아 최고값을 가진 선택지를 고르는 MAB 알고리즘. Thompson(1933)이 임상시험 배정을 위해 고안

다중 슬롯머신 문제(multi-armed bandit, MAB) - 여러 선택지 중 어느 것이 최선인지 모를 때, 탐색과 활용을 균형 잡으며 순차적으로 선택하는 문제

Bonferroni 보정(Bonferroni correction) - 다중 검정에서 유의수준을 검정 횟수로 나누어 1종 오류를 보정하는 보수적 방법. 20개 검정이면 유의수준을 0.05/20 = 0.0025로 낮춤
---EN---
Clinical Trial Design - How medicine's causal inference framework directly inspired AI's experimentation methods and exploration-exploitation algorithms

## The Invention of Randomization

In 1747, British naval surgeon James Lind divided 12 sailors with scurvy into 6 groups, testing different treatments: cider, sulfuric acid, vinegar, seawater, oranges and lemons, and bark paste. Only the group given oranges and lemons recovered. The experimental principles of control groups, simultaneous comparison, and systematic recording of results were already embedded in this primitive trial.

But the key leap came 190 years later. Ronald A. Fisher (1935) established the theoretical foundation for **randomization** in "The Design of Experiments." Fisher's insight was simple yet profound. Known confounders (age, sex, pre-existing conditions) can be deliberately balanced, but **unknown confounders** cannot be controlled by any intentional design. Randomization is the only method that probabilistically distributes both the known and the unknown evenly across groups.

## From Medicine to Digital Experimentation

RCT's structure was transplanted into AI and the tech industry along two paths.

**Path 1: A/B Testing -- A Digital Replica of the RCT**

In the early 2000s, Google engineers directly borrowed RCT structure to measure the effects of webpage changes. Ron Kohavi (Microsoft) systematized the field, and Kohavi, Tang, and Xu's "Trustworthy Online Controlled Experiments" (2020) became the standard reference. The key correspondences are:

- Patients --> **Users**
- Treatment/control groups --> **Variants A/B**
- Therapy --> **UI changes, algorithm changes, pricing changes**
- Clinical outcomes (survival, symptom relief) --> **Business metrics (conversion, click-through, engagement)**
- Randomization --> **User hash-based group assignment**
- Blinding --> **Users unaware they are in an experiment**

Even the statistical testing tools (t-tests, significance levels, power calculations) were transplanted identically. Google, Meta, Netflix, and Microsoft run tens of thousands of A/B tests annually.

## Core Mathematical Structures

**1. Average Treatment Effect (ATE)**

ATE = E[Y(1)] - E[Y(0)]

Y(1) is the outcome under treatment, Y(0) the outcome without. The same individual cannot simultaneously receive and not receive treatment. This is the fundamental problem of causal inference. Randomization makes the two groups' expected values comparable, sidestepping this problem.

**2. Sample Size Determination Formula**

n = (z_{alpha/2} + z_beta)^2 * 2 * sigma^2 / delta^2

## Fixed vs. Adaptive Design: The Core Tradeoff

The most fundamental tradeoff in RCTs lies between **internal validity and efficiency**.

A classical fixed-design RCT locks in sample size, treatment arms, and endpoints before the trial begins and changes nothing until the end. Rigorous but inefficient. Even when evidence accumulates mid-trial that one treatment is clearly inferior, the protocol requires continued patient assignment.

Adaptive design adjusts the design based on accumulated data at interim analyses. Sample sizes can be increased, inferior treatment arms terminated early, or promising subgroups prioritized. Efficient but risky -- mid-trial design changes can inflate the Type I error rate (false positives), requiring sophisticated statistical corrections.

This tradeoff recurs in AI. Training with fixed hyperparameters (fixed design) versus adjusting learning rates or architecture during training (adaptive design) occupies the same tension.

## The Multiple Comparison Problem: Why Medicine's Rigor Is Needed in AI

Simultaneously testing multiple outcome variables or subgroups in clinical trials causes the **Type I error (false positive) rate to increase sharply**. Concretely, performing 20 independent tests at significance level 0.05, the probability of at least one false positive is 1 - (1-0.05)^20 = 64%. With 100 tests, it reaches 99.4% -- virtually certain.

Medicine has grappled with this for decades. Bonferroni correction (dividing significance level by number of tests), Holm-Bonferroni (rank-based stepwise correction), and Benjamini-Hochberg's FDR (False Discovery Rate) control are standard solutions.

## Connections to Modern AI

Clinical trial design's influence on AI manifests at multiple levels. However, the nature of each connection differs.

**Direct inspiration:**

- **A/B Testing**: The most direct case of transplanting RCT structure (randomization, control groups, hypothesis testing) into a digital environment. Even the statistical testing methodology is used identically.
- **Thompson Sampling**: The algorithm Thompson (1933) designed for ethical clinical trial allocation was directly revived as a core strategy for the modern MAB problem. Chapelle & Li (2011) reconfirmed its practical value by applying it to online ad optimization. It is now used alongside epsilon-greedy and UCB (Upper Confidence Bound) as a core MAB strategy in recommendation systems, dynamic pricing, and news feed personalization.
- **Multiple comparison correction**: Clinical trial methods like Bonferroni and FDR correction are directly used in hyperparameter search, model comparison, and feature selection.

**Structural similarity (independent convergence on the same problem):**

## Limitations and Weaknesses

- **Ethical constraints limit applicability**: Not all causal questions can be answered with RCTs. Studying smoking's cancer-causing effect via RCT is ethically impossible. In tech A/B testing, the ethics of deliberately assigning poor experiences to users remains debated.
- **External validity limitations**: RCTs have high internal validity (causal relationships in controlled settings), but whether results generalize to real environments is a separate question. Clinical trial effects frequently fail to replicate in actual practice, and A/B test results can diverge from long-term effects due to novelty effects during the test period.
- **Network effects and SUTVA violation**: RCTs assume that one participant's treatment does not affect another's outcome (SUTVA: Stable Unit Treatment Value Assumption). In social platform A/B tests, user interactions violate this assumption, distorting treatment effects.
- **p-hacking and result manipulation**: The practice of adjusting analysis methods until significant results appear (p-hacking) threatens both clinical trials and A/B tests. Pre-registration is the standard countermeasure, but the practice has not yet taken root in the tech industry.

## Glossary

Randomized controlled trial (RCT) - an experimental design that randomly assigns participants to treatment and control groups to estimate the causal effect of treatment

Average treatment effect (ATE) - the expected difference in outcomes between receiving and not receiving treatment; E[Y(1)] - E[Y(0)]

Confounder - a third variable that influences both treatment and outcome, distorting causal inference; the core purpose of randomization is even distribution of confounders

Statistical power - the probability of detecting an effect when it truly exists; expressed as 1 - beta, conventionally requiring 0.8 or above

Blinding - a design element preventing participants, researchers, or both from knowing group assignments to prevent expectation bias; single-blind affects participants only, double-blind affects both

Thompson Sampling - a MAB algorithm that selects the arm with the highest sample drawn from each arm's reward posterior distribution; designed by Thompson (1933) for clinical trial allocation

Multi-armed bandit (MAB) - the problem of sequentially selecting among multiple options while balancing exploration and exploitation when the best option is unknown

Bonferroni correction - a conservative method for controlling Type I error in multiple testing by dividing the significance level by the number of tests; with 20 tests, the threshold drops from 0.05 to 0.05/20 = 0.0025
